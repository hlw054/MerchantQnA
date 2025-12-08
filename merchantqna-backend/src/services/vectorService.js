/**
 * 向量数据库服务
 * 使用LanceDB作为向量存储，提供向量的存储、检索和管理功能
 * 
 * @example
 * // 使用示例
 * const vectorService = require('./vectorService');
 * 
 * // 1. 初始化数据库
 * await vectorService.initVectorDB();
 * 
 * // 2. 添加单个向量
 * const vector = [0.1, 0.2, ..., 0.768]; // 768维向量
 * await vectorService.addVector({
 *   id: 'doc1',
 *   content: '商品信息：这是一个示例商品',
 *   vector: vector,
 *   metadata: { category: 'electronics', price: 999 }
 * });
 * 
 * // 3. 搜索相似向量
 * const queryVector = [0.15, 0.25, ..., 0.778]; // 查询向量
 * const results = await vectorService.searchVectors(queryVector, 5);
 * console.log(results); // 返回相似度最高的5个结果
 * 
 * // 注意：批量添加功能已移至内部实现，可通过多次调用addVector实现
 */

const lancedb = require('@lancedb/lancedb');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../middlewares/errorHandler');

// 向量数据库配置
const VECTOR_DB_PATH = path.resolve(__dirname, '../../vector_db');
const TABLE_NAME = 'merchant_knowledge';
const VECTOR_DIMENSION = 2048; // 默认使用2048维向量（可根据实际模型调整）

// 确保向量数据库目录存在
if (!fs.existsSync(VECTOR_DB_PATH)) {
  try {
    fs.mkdirSync(VECTOR_DB_PATH, { recursive: true });
    console.log(`创建向量数据库目录: ${VECTOR_DB_PATH}`);
  } catch (error) {
    console.error(`创建向量数据库目录失败: ${error.message}`);
    throw new Error('数据库初始化失败: ' + error.message);
  }
}

// 自定义向量数据库错误类
class VectorDBError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'VectorDBError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

// 错误代码常量
const ERROR_CODES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  DIRECTORY_CREATION_FAILED: 'DIRECTORY_CREATION_FAILED',
  TABLE_CREATION_FAILED: 'TABLE_CREATION_FAILED',
  VECTOR_DIMENSION_MISMATCH: 'VECTOR_DIMENSION_MISMATCH',
  DATA_INSERTION_FAILED: 'DATA_INSERTION_FAILED',
  SEARCH_FAILED: 'SEARCH_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
  QUERY_FAILED: 'QUERY_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMBEDDING_ERROR: 'EMBEDDING_ERROR'
};

// 直接调用智谱 Embedding API 的私有方法
/**
 * 直接调用智谱 Embedding API
 * 
 * ⚠️ 重要说明：不使用 LangChain 的 OpenAIEmbeddings
 * 
 * 问题原因：
 * LangChain 的 @langchain/openai 包中的 OpenAIEmbeddings 类与智谱 API 不完全兼容。
 * 虽然智谱提供了 OpenAI 兼容的接口，但 LangChain 的实现会导致返回的 embedding 向量全为 0。
 * 
 * 影响：
 * - 所有文档的向量都是零向量
 * - 导致相似度计算失效（所有文档相似度都是 1.000）
 * - 检索功能完全失效，无法区分文档相关性
 * 
 * 解决方案：
 * 直接使用 fetch 调用智谱的 Embedding API，绕过 LangChain 的封装。
 * 智谱 embedding-3 模型返回 2048 维的向量，可以正常工作。
 * 
 * @param {string} text 需要生成 embedding 的文本
 * @returns {Promise<Array<number>>} 2048 维的 embedding 向量
 * @private
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new VectorDBError('无效的文本参数', ERROR_CODES.VALIDATION_ERROR);
  }
  
  try {
    // 从环境变量读取API密钥，不再硬编码
    const apiKey = process.env.ZHIPU_API_KEY;
    
    if (!apiKey) {
      throw new Error('环境变量 ZHIPU_API_KEY 未设置');
    }
    
    const endpoint = 'https://open.bigmodel.cn/api/paas/v4/embeddings';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'embedding-3',
        input: text,
        dimensions: 2048
      })
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('API 返回格式错误');
    }
    
    return data.data[0].embedding;
  } catch (error) {
    console.error('获取 embedding 失败:', error.message);
    throw new VectorDBError(
      `获取文本向量时发生错误: ${error.message}`,
      ERROR_CODES.EMBEDDING_ERROR
    );
  }
}

// 数据库连接实例
let db = null;
let table = null;

/**
 * 初始化向量数据库连接
 * @returns {Promise<void>}
 * @throws {VectorDBError} 当数据库初始化失败时抛出
 */
async function initVectorDB() {
  try {
    console.log('正在初始化LanceDB连接...');
    
    // 连接到LanceDB
    // 新版本API使用不同的连接方式
    const conn = await lancedb.connect(VECTOR_DB_PATH);
    db = conn;
    console.log(`成功连接到LanceDB: ${VECTOR_DB_PATH}`);
    
    // 检查表是否存在
    const tables = await db.tableNames();
    console.log(`数据库中的表: ${tables.join(', ')}`);
    
    if (!tables.includes(TABLE_NAME)) {
      // 创建新表，定义schema
      console.log(`表 ${TABLE_NAME} 不存在，正在创建...`);
      // 为新版本创建表时提供示例数据以推断schema
      // 确保metadata结构与实际生成的数据匹配，包含path字段
      const sampleData = [
        {
          id: 'sample',
          content: 'sample content',
          metadata: { 
            path: 'sample/path',
            position: 0,
            createdAt: new Date().toISOString(),
            contentLength: 14, // 'sample content'的长度
          },
          vector: Array(VECTOR_DIMENSION).fill(0),
          knowledgeId: 'sample-knowledge'
        }
      ];
      
      table = await db.createTable(TABLE_NAME, sampleData);
      console.log(`成功创建表: ${TABLE_NAME}`);
    } else {
      // 打开现有表
      try {
        table = await db.openTable(TABLE_NAME);
        console.log(`成功打开现有表: ${TABLE_NAME}`);
      } catch (openError) {
        console.error(`打开表失败: ${TABLE_NAME}`, { error: openError.message });
        throw new VectorDBError(
          `表访问失败: ${TABLE_NAME}`, 
          ERROR_CODES.TABLE_CREATION_FAILED, 
          openError
        );
      }
    }
  } catch (error) {
    console.error('LanceDB初始化失败:', { error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    // 转换为标准错误
    throw new VectorDBError(
      '向量数据库初始化失败', 
      ERROR_CODES.CONNECTION_FAILED, 
      error
    );
  }
}

// 内部方法：获取数据表
async function getTable() {
  if (!table) {
    await initVectorDB();
  }
  return table;
}

/**
 * 批量添加向量数据
 * 接收chunkMarkdown返回的数组，并为每个chunk生成向量
 * @param {Array<{id: string, content: string, knowledgeId: string, metadata: {path: string, position: number}}>} chunks - chunkMarkdown返回的分块数组
 * @returns {Promise<Object>} 添加结果
 */
async function addVectors(chunks) {
  try {
    // 参数验证
    if (!Array.isArray(chunks)) {
      throw new VectorDBError('chunks参数必须是数组类型', ERROR_CODES.VALIDATION_ERROR);
    }
    
    if (chunks.length === 0) {
      console.warn('接收到空的chunks数组，无需添加向量数据');
      return { 
        success: true, 
        addedCount: 0, 
        message: '未添加任何数据，因为chunks数组为空' 
      };
    }
    
    const vectorTable = await getTable();
    
    // 准备要添加的数据
    const dataToAdd = [];
    let successCount = 0;
    let failedCount = 0;
    const failedChunks = [];
    
    console.log(`准备处理 ${chunks.length} 个分块...`);
    
    // 为每个chunk生成向量并添加到数据数组中
    for (const chunk of chunks) {
      try {
        // 验证chunk数据结构
        if (!chunk || typeof chunk !== 'object') {
          throw new Error('无效的chunk对象');
        }
        
        const { id, content, knowledgeId, metadata = {} } = chunk;
        
        if (!id || typeof id !== 'string') {
          throw new Error('chunk缺少有效id');
        }
        
        if (!content || typeof content !== 'string') {
          throw new Error('chunk缺少有效content');
        }
        
        if (!knowledgeId || typeof knowledgeId !== 'string') {
          throw new Error('chunk缺少有效knowledgeId');
        }
        
        // 使用getEmbedding函数生成向量
        console.log(`正在为chunk ${id} 生成向量...`);
        const vector = await getEmbedding(content);
        
        // 验证向量维度
        if (!Array.isArray(vector) || vector.length !== VECTOR_DIMENSION) {
          throw new VectorDBError(
            `向量维度不匹配: 期望 ${VECTOR_DIMENSION} 维，实际 ${vector.length || 0} 维`,
            ERROR_CODES.VECTOR_DIMENSION_MISMATCH
          );
        }
        
        // 准备数据
        const data = {
          id,
          content,
          vector,
          metadata: { 
            ...metadata, 
            createdAt: new Date().toISOString(),
            contentLength: content.length,
          },
          knowledgeId
        };
        
        dataToAdd.push(data);
        successCount++;
        console.log(`成功为chunk ${id} 生成向量`);
        
      } catch (chunkError) {
        failedCount++;
        const chunkId = chunk?.id || 'unknown';
        console.error(`处理chunk ${chunkId} 失败:`, chunkError.message);
        failedChunks.push({
          id: chunkId,
          error: chunkError.message
        });
      }
    }
    
    // 如果有数据要添加，批量插入
    if (dataToAdd.length > 0) {
      console.log(`准备批量添加 ${dataToAdd.length} 个向量数据...`);
      await vectorTable.add(dataToAdd);
      console.log(`成功批量添加 ${dataToAdd.length} 个向量数据`);
    }
    
    return { 
      success: failedCount === 0, // 只有全部成功才算success为true
      totalChunks: chunks.length,
      addedCount: dataToAdd.length,
      successCount,
      failedCount,
      failedChunks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('批量添加向量数据失败:', error.message);
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    throw new VectorDBError(
      '批量添加向量数据失败', 
      ERROR_CODES.DATA_INSERTION_FAILED, 
      error
    );
  }
}

/**
 * 根据向量进行相似性搜索
 * @param {Array<number>} queryVector - 查询向量
 * @param {number} limit - 返回结果数量限制
 * @param {Object} filter - 过滤条件（可选）
 * @returns {Promise<Array<Object>>} 搜索结果数组
 */
async function searchVectors(queryVector, limit = 5, filter = null) {
  try {
    // 参数验证
    if (!Array.isArray(queryVector)) {
      throw new VectorDBError('查询向量必须是数组类型', ERROR_CODES.VALIDATION_ERROR);
    }
    
    if (typeof limit !== 'number' || limit <= 0 || limit > 100) {
      limit = Math.min(Math.max(1, limit || 5), 100); // 限制在1-100之间
      console.warn('搜索限制参数调整:', { adjustedLimit: limit });
    }
    
    const vectorTable = await getTable();
    
    // 验证向量维度
    if (queryVector.length !== VECTOR_DIMENSION) {
      throw new VectorDBError(
        `查询向量维度不匹配: 期望 ${VECTOR_DIMENSION} 维，实际 ${queryVector.length} 维`,
        ERROR_CODES.VECTOR_DIMENSION_MISMATCH
      );
    }
    
    console.log('开始向量相似性搜索');
    
    // 构建查询
    // 注意：根据LanceDB版本，metric参数可能需要在search方法中指定
    let query = vectorTable.search(queryVector, { metric: 'cosine' })
      .limit(limit);
    
    // 添加过滤条件（如果有）
    if (filter) {
      try {
        query = query.where(filter);
        console.log('应用搜索过滤条件');
      } catch (filterError) {
        console.error('过滤条件应用失败:', { error: filterError.message });
        throw new VectorDBError(
          '搜索过滤条件无效', 
          ERROR_CODES.VALIDATION_ERROR, 
          filterError
        );
      }
    }
    
    // 执行查询
    const results = await query.toArray();
    console.log('向量搜索完成:', { resultCount: results.length });
    
    // 格式化结果
    const formattedResults = results.map((item, index) => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      similarity: item._distance, // LanceDB使用_distance字段存储相似度
      rank: index + 1
    }));
    
    return formattedResults;
  } catch (error) {
    console.error('向量搜索失败:', { error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    throw new VectorDBError(
      '向量搜索失败', 
      ERROR_CODES.SEARCH_FAILED, 
      error
    );
  }
}

/**
 * 删除向量数据
 * @param {string} id - 要删除的数据ID
 * @returns {Promise<Object>} 删除结果
 */
async function deleteVector(id) {
  try {
    // 参数验证
    if (!id || typeof id !== 'string') {
      throw new VectorDBError('无效的ID参数', ERROR_CODES.VALIDATION_ERROR);
    }
    
    const vectorTable = await getTable();
    
    // 查询是否存在
    try {
      const results = await vectorTable.search()
        .where(`id = "${id}"`)
        .toArray();
      
      if (results.length === 0) {
        console.warn('尝试删除不存在的向量数据:', id);
        return { 
          success: true, 
          id, 
          message: '数据不存在，无需删除',
          deleted: false 
        };
      }
    } catch (queryError) {
      console.error('查询数据失败:', { id, error: queryError.message });
    }
    
    console.log('准备删除向量数据:', id);
    
    // 执行删除
    await vectorTable.delete(`id = "${id}"`);
    console.log('成功删除向量数据:', id);
    
    return { 
      success: true, 
      id, 
      deleted: true,
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    console.error('删除向量数据失败:', { id, error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    throw new VectorDBError(
      '删除向量数据失败', 
      ERROR_CODES.DELETE_FAILED, 
      error
    );
  }
}

/**
 * 通过knowledgeId删除相关实体
 * @param {string} knowledgeId - 要删除的知识ID
 * @returns {Promise<Object>} 删除结果
 */
async function deleteByKnowledgeId(knowledgeId) {
  try {
    // 参数验证
    if (!knowledgeId || typeof knowledgeId !== 'string') {
      throw new VectorDBError('无效的knowledgeId参数', ERROR_CODES.VALIDATION_ERROR);
    }

    const vectorTable = await getTable();
    
    console.log(`准备删除与knowledgeId ${knowledgeId} 关联的所有向量数据`);
    
    // 检查knowledgeId列是否存在
    try {
      // 使用LanceDB的schema()方法获取表结构
      const schema = await vectorTable.schema();
      // 检查schema.fields中是否包含knowledgeId字段
      const hasKnowledgeIdColumn = schema.fields.some(field => field.name === 'knowledgeId');
      
      if (!hasKnowledgeIdColumn) {
        throw new VectorDBError(
          '数据表中不存在knowledgeId列，无法执行删除操作',
          ERROR_CODES.SCHEMA_ERROR
        );
      }
      console.log('验证成功：数据表中存在knowledgeId列');
    } catch (schemaError) {
      console.error('检查knowledgeId列存在性时出错:', schemaError);
      // 包装并抛出schema检查错误
      throw new VectorDBError(
        `验证数据表结构失败: ${schemaError.message}`,
        ERROR_CODES.SCHEMA_ERROR
      );
    }
    
    // 使用已有的getAllDocuments函数获取所有文档块
    // 避免使用where条件查询，从而绕过查询错误
    const allDocs = await getAllDocuments();
    
    // 筛选出要删除的文档块
    const docsToDelete = allDocs.filter(doc => doc.knowledgeId === knowledgeId);
    
    const deleteCount = docsToDelete.length;
    
    // 如果没有要删除的文档块，直接返回
    if (deleteCount === 0) {
      console.warn(`没有找到与knowledgeId ${knowledgeId} 关联的向量数据`);
      return { 
        success: true, 
        knowledgeId, 
        message: `没有找到与knowledgeId ${knowledgeId} 关联的向量数据`,
        deleted: false,
        count: 0
      };
    }
    
    // 逐个删除文档块
    let successCount = 0;
    let failedCount = 0;
    
    for (const doc of docsToDelete) {
      try {
        await vectorTable.delete(`id = '${doc.id}'`);
        successCount++;
      } catch (deleteError) {
        console.error(`删除文档块 ${doc.id} 失败:`, deleteError.message);
        failedCount++;
      }
    }
    
    console.log(`成功删除与knowledgeId ${knowledgeId} 关联的向量数据: ${successCount} 个成功, ${failedCount} 个失败`);
    
    return { 
      success: true, 
      knowledgeId, 
      deleted: true,
      message: `已删除与knowledgeId ${knowledgeId} 关联的 ${successCount} 个向量数据`,
      timestamp: new Date().toISOString(),
      total: deleteCount,
      successCount: successCount,
      failedCount: failedCount
    };
  } catch (error) {
    console.error('删除向量数据失败:', { knowledgeId, error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    // 包装其他错误
    throw new VectorDBError(
      `删除与knowledgeId关联的数据时发生错误: ${error.message}`,
      ERROR_CODES.DELETE_ERROR
    );
  }
}



/**
 * 获取所有文档块
 * @param {number} batchSize - 批次大小，默认5000
 * @returns {Promise<Array<Object>>} 所有文档块数据
 */
async function getAllDocuments(batchSize = 5000) {
  try {
    const vectorTable = await getTable();
    console.log('开始获取所有文档块...');
    
    const allDocs = [];
    let offset = 0;
    let hasMore = true;
    
    // 通过分批查询获取所有文档，避免单次查询的限制
    while (hasMore) {
      const batch = await vectorTable.query()
        .limit(batchSize)
        .offset(offset)
        .toArray();
      
      if (batch.length === 0) {
        hasMore = false;
      } else {
        allDocs.push(...batch);
        offset += batch.length;
        
        // 如果当前批次小于请求的batchSize，说明已经是最后一批
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }
    }
    
    console.log(`成功获取文档块数量: ${allDocs.length}`);
    return allDocs;
  } catch (error) {
    console.error('获取所有文档块失败:', error);
    throw new VectorDBError('获取文档块失败', ERROR_CODES.SEARCH_FAILED, error);
  }
}

/**
 * 根据knowledgeId获取所有文档块
 * @param {string} knowledgeId - 知识文档ID
 * @returns {Promise<Array<Object>>} 文档块数据数组
 */
async function getDocumentsByKnowledgeId(knowledgeId) {
  try {
    // 参数验证
    if (!knowledgeId || typeof knowledgeId !== 'string') {
      throw new VectorDBError('无效的knowledgeId参数', ERROR_CODES.VALIDATION_ERROR);
    }
    
    const vectorTable = await getTable();
    console.log(`开始获取knowledgeId为${knowledgeId}的所有文档块...`);
    
    // 检查knowledgeId列是否存在
    try {
      const schema = await vectorTable.schema();
      const hasKnowledgeIdColumn = schema.fields.some(field => field.name === 'knowledgeId');
      
      if (!hasKnowledgeIdColumn) {
        throw new VectorDBError(
          '数据表中不存在knowledgeId列，无法执行查询操作',
          ERROR_CODES.SCHEMA_ERROR
        );
      }
    } catch (schemaError) {
      console.error('检查knowledgeId列存在性时出错:', schemaError);
      throw new VectorDBError(
        `验证数据表结构失败: ${schemaError.message}`,
        ERROR_CODES.SCHEMA_ERROR
      );
    }
    
    // 执行查询，获取所有匹配的文档块
    // 先获取所有文档，然后在内存中过滤
    const allDocuments = await vectorTable.query().toArray();
    const documents = allDocuments.filter(doc => doc.knowledgeId === knowledgeId);
    
    console.log(`成功获取文档块数量: ${documents.length}`);
    return documents;
  } catch (error) {
    console.error('获取文档块失败:', { knowledgeId, error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    throw new VectorDBError(
      '获取文档块失败', 
      ERROR_CODES.SEARCH_FAILED, 
      error
    );
  }
}

/**
 * 关键词检索
 * @param {string[]} keywords - 关键词数组
 * @param {number} topK - 返回结果数量
 * @returns {Promise<Array<Object>>} 检索结果数组，按包含关键词数量排序
 */
async function keywordSearch(keywords, topK = 5) {
  try {
    // 参数验证
    if (!Array.isArray(keywords)) {
      throw new VectorDBError('关键词必须是数组类型', ERROR_CODES.VALIDATION_ERROR);
    }
    
    if (keywords.length === 0) {
      throw new VectorDBError('关键词数组不能为空', ERROR_CODES.VALIDATION_ERROR);
    }
    
    if (typeof topK !== 'number' || topK <= 0 || topK > 100) {
      topK = Math.min(Math.max(1, topK || 5), 100); // 限制在1-100之间
      console.warn('topK参数调整:', { adjustedTopK: topK });
    }
    
    console.log(`开始关键词检索，关键词数量: ${keywords.length}，返回结果数: ${topK}`);
    
    // 使用新的获取所有文档函数
    const allData = await getAllDocuments();
    
    // 计算每个文档包含的关键词数量
    const resultsWithKeywordCount = allData.map(item => {
      // 在content和metadata中查找关键词
      const content = item.content || '';
      const metadataText = JSON.stringify(item.metadata || '') + ' ';
      const fullText = (content + ' ' + metadataText).toLowerCase();
      
      // 计算包含的关键词数量
      let keywordCount = 0;
      const matchedKeywords = [];
      
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase().trim();
        if (keywordLower && fullText.includes(keywordLower)) {
          keywordCount++;
          matchedKeywords.push(keyword);
        }
      });
      
      return {
        ...item,
        keywordCount,
        matchedKeywords
      };
    });
    
    // 过滤出至少包含一个关键词的结果，并按关键词数量降序排序
    const sortedResults = resultsWithKeywordCount
      .filter(item => item.keywordCount > 0)
      .sort((a, b) => b.keywordCount - a.keywordCount)
      .slice(0, topK)
      .map((item, index) => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata,
        knowledgeId: item.knowledgeId,
        keywordCount: item.keywordCount,
        matchedKeywords: item.matchedKeywords,
        rank: index + 1
      }));
    
    console.log('关键词检索完成:', { resultCount: sortedResults.length });
    return sortedResults;
  } catch (error) {
    console.error('关键词检索失败:', { error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    throw new VectorDBError(
      '关键词检索失败', 
      ERROR_CODES.SEARCH_FAILED, 
      error
    );
  }
}

/**
 * 相似度检索
 * @param {string} query - 查询文本
 * @param {number} topK - 返回结果数量
 * @param {number} minScore - 最小相似度分数（0-1之间）
 * @returns {Promise<Array<Object>>} 检索结果数组，按相似度排序
 */
async function similaritySearch(query, topK = 5, minScore = 0.3) {
  try {
    // 参数验证
    if (!query || typeof query !== 'string') {
      throw new VectorDBError('查询文本必须是非空字符串', ERROR_CODES.VALIDATION_ERROR);
    }
    
    if (typeof topK !== 'number' || topK <= 0 || topK > 100) {
      topK = Math.min(Math.max(1, topK || 5), 100); // 限制在1-100之间
      console.warn('topK参数调整:', { adjustedTopK: topK });
    }
    
    if (typeof minScore !== 'number' || minScore < 0 || minScore > 1) {
      minScore = Math.max(0, Math.min(1, minScore || 0)); // 限制在0-1之间
      console.warn('minScore参数调整:', { adjustedMinScore: minScore });
    }
    
    console.log(`开始相似度检索，查询文本长度: ${query.length}，返回结果数: ${topK}，最小分数: ${minScore}`);
    
    // 生成查询向量
    const queryVector = await getEmbedding(query);
    
    // 使用现有的searchVectors函数进行相似性搜索
    const searchResults = await searchVectors(queryVector, topK);
    
    // 转换相似度（LanceDB的_distance是距离，需要转换为相似度）
    // 余弦距离转换为相似度: similarity = 1 - distance
    const resultsWithScore = searchResults.map(item => ({
      ...item,
      score: 1 - item.similarity // 转换为相似度分数
    }));
    
    // 过滤掉低于最小分数的结果
    const filteredResults = resultsWithScore
      .filter(item => item.score >= minScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1 // 重新排序
      }));
    
    console.log('相似度检索完成:', { resultCount: filteredResults.length });
    return filteredResults;
  } catch (error) {
    console.error('相似度检索失败:', { error: error.message });
    
    // 如果已经是VectorDBError，直接抛出
    if (error instanceof VectorDBError) {
      throw error;
    }
    
    throw new VectorDBError(
      '相似度检索失败', 
      ERROR_CODES.SEARCH_FAILED, 
      error
    );
  }
}

/**
 * 手动触发LanceDB的compaction操作
 * 用于合并数据文件并清理软删除的数据
 * 
 * @returns {Promise<boolean>} 操作是否成功
 * @throws {VectorDBError} 当compaction操作失败时抛出
 */
async function compactTable() {
  try {
    console.log('正在执行LanceDB compaction操作...');
    
    // 获取数据库表实例
    const table = await getTable();
    
    // 检查table对象是否存在且有compact方法
    if (!table || typeof table.compact !== 'function') {
      console.warn('当前LanceDB版本不支持compact方法');
      return false;
    }
    
    // 执行compaction操作
    await table.compact();
    console.log('LanceDB compaction操作完成');
    return true;
  } catch (error) {
    console.error('LanceDB compaction操作失败:', { error: error.message });
    
    throw new VectorDBError(
      '数据压缩操作失败', 
      ERROR_CODES.QUERY_FAILED, 
      error
    );
  }
}

module.exports = {
  // 数据库管理
  initVectorDB,
  compactTable,
    
  // 向量操作
  addVectors,
  searchVectors,
  deleteVector,
  deleteByKnowledgeId,
  keywordSearch,
  similaritySearch,
  getAllDocuments,
  getDocumentsByKnowledgeId,
  
  // 配置常量
  VECTOR_DIMENSION,
  TABLE_NAME,
  ERROR_CODES,
  
  // 错误类
  VectorDBError
};
