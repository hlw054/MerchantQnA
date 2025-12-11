/**
 * RAG Chain Service
 * 
 * 该服务用于实现检索增强生成（RAG）链的核心功能，包括文档分块、
 * 检索和生成等组件。
 */

// 导入所需的依赖
const { ChatOpenAI } = require("@langchain/openai");

// 导入向量服务以使用addVectors函数
const vectorService = require('./vectorService');

// 从环境变量获取智谱AI的API密钥
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';

// 创建LLM实例（使用glm-4.6模型，支持流式输出，禁用深度思考功能）
const LLM = new ChatOpenAI({
  model: "glm-4.6",
  apiKey: ZHIPU_API_KEY,
  streaming: true,
  temperature: 0.7,
  configuration: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
  },
});

// 创建fastLLM实例（使用glm-4-flash模型，用于快速响应）
const fastLLM = new ChatOpenAI({
  model: "glm-4-flash",
  apiKey: ZHIPU_API_KEY,
  temperature: 0.3,
  configuration: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
  },
});

/**
 * 生成唯一ID
 * @returns {string} 唯一标识符
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Markdown文件分块函数
 * 将Markdown文本按标题分割成适合向量化和检索的小块，如果标题内容过长则继续细分割
 * 为每个块添加路径前缀，并使用标题层级构建路径
 * 
 * @param {string} content - Markdown格式的文本内容
 * @param {string} knowledgeId - 知识文档的唯一标识符
 * @returns {Array<{id: string, content: string, knowledgeId: string, metadata: {path: string, position: number}}>} 
 * 分块结果数组，每个块包含唯一ID、内容、知识ID和元数据（路径和位置）
 */
function chunkMarkdown(content, knowledgeId) {
  const chunks = [];
  const MAX_CHUNK_SIZE = 500; // 每个块的最大字符数
  const CHUNK_OVERLAP = 50;   // 块之间的重叠字符数
  
  // 按标题级别分割内容
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let sections = [];
  let currentSection = { title: '', content: '', level: 0, startPos: 0, titlePath: [] };
  let titleHierarchy = []; // 保存标题层级结构
  
  // 分割文本为行
  const lines = content.split('\n');
  let currentPos = 0;
  
  // 第一遍：按标题分割成大的section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStartPos = currentPos;
    
    const headingMatch = line.match(headingRegex);
    
    if (headingMatch) {
      // 如果当前section已有内容，先保存
      if (currentSection.content.trim()) {
        sections.push({...currentSection});
      }
      
      // 提取标题信息
      const level = line.match(/^(#{1,6})/)[1].length;
      const title = line.replace(/^#{1,6}\s+/, '').trim();
      
      // 更新标题层级
      titleHierarchy = titleHierarchy.slice(0, level - 1);
      titleHierarchy.push(title);
      
      // 构建路径字符串
      const path = titleHierarchy.join('-');
      
      // 开始新的section
      currentSection = { 
        title, 
        content: '', 
        level,
        startPos: lineStartPos,
        titlePath: [...titleHierarchy] // 保存完整的标题路径
      };
    } else {
      // 添加内容到当前section
      currentSection.content += line + '\n';
    }
    
    // 更新当前位置
    currentPos += line.length + 1; // +1 是换行符的长度
  }
  
  // 保存最后一个section
  if (currentSection.content.trim()) {
    sections.push({...currentSection});
  }
  
  // 第二遍：处理每个section，如果内容过长则进一步分割
  sections.forEach(section => {
    const sectionContent = section.content.trim();
    const path = section.titlePath.join('-'); // 使用标题层级构建路径
    
    // 如果section内容较短，直接作为一个块
    if (sectionContent.length <= MAX_CHUNK_SIZE) {
      chunks.push({
        id: generateUniqueId(),
        content: `${path} ${sectionContent}`, // 在内容前加上路径
        knowledgeId: knowledgeId,
        metadata: {
          path: path, // 路径也是标题层级
          position: 0 // 单块的position为0
        }
      });
    } else {
      // 否则按字符数进一步分块，position从0开始递增
      // 增加空内容检查，确保sectionContent有效
      if (!sectionContent || sectionContent.length === 0) {
        return chunks; // 如果内容为空，直接返回当前chunks数组
      }
      
      let start = 0;
      let position = 0;
      let maxIterations = Math.ceil(sectionContent.length / (MAX_CHUNK_SIZE - CHUNK_OVERLAP)) + 10; // 设置最大迭代次数防止无限循环
      let iterations = 0;
      
      while (start < sectionContent.length && iterations < maxIterations) {
        iterations++;
        
        // 确保start在有效范围内
        if (start < 0) start = 0;
        
        const end = Math.min(start + MAX_CHUNK_SIZE, sectionContent.length);
        
        // 尝试在句子边界分割
        let actualEnd = end;
        if (end < sectionContent.length) {
          // 找到最近的句号、问号、感叹号或换行符
          const punctuationPos = sectionContent.lastIndexOf('。', end);
          const questionPos = sectionContent.lastIndexOf('？', end);
          const exclamationPos = sectionContent.lastIndexOf('！', end);
          const newlinePos = sectionContent.lastIndexOf('\n', end);
          
          // 过滤掉-1的情况（未找到）
          const positions = [punctuationPos, questionPos, exclamationPos, newlinePos].filter(pos => pos > -1);
          const lastPos = positions.length > 0 ? Math.max(...positions) : -1;
          
          if (lastPos > start + MAX_CHUNK_SIZE / 2) {
            actualEnd = lastPos + 1;
          }
        }
        
        // 确保actualEnd在有效范围内且大于start
        actualEnd = Math.max(actualEnd, start + 1);
        actualEnd = Math.min(actualEnd, sectionContent.length);
        
        // 提取当前块内容
        const chunkContent = sectionContent.substring(start, actualEnd).trim();
        
        // 只有非空内容才添加到结果中
        if (chunkContent) {
          chunks.push({
            id: generateUniqueId(),
            content: `${path} ${chunkContent}`, // 在内容前加上路径
            knowledgeId: knowledgeId,
            metadata: {
              path: path, // 路径保持一致
              position: position // position是细分割的序号
            }
          });
        }
        
        // 更新position和start
        position++;
        
        // 计算下一个块的起始位置，确保不会重复处理过多内容且不会陷入无限循环
        const nextStart = actualEnd - CHUNK_OVERLAP;
        if (nextStart <= start) {
          // 如果下一个start位置没有前进，强制向前移动一些字符
          start = Math.min(start + MAX_CHUNK_SIZE - CHUNK_OVERLAP, sectionContent.length);
        } else {
          start = nextStart;
        }
      }
    }
  });
  
  return chunks;
}

/**
 * 上传文件并将内容分块添加到向量库
 * 
 * @param {Object} knowledge - 知识文档对象，包含id和content属性
 * @returns {Promise<Object>} - 返回上传和处理结果
 */
async function uploadFile(knowledge) {
  try {
    // 验证输入参数
    if (!knowledge) {
      throw new Error('知识文档对象不能为空');
    }
    
    if (!knowledge.id) {
      throw new Error('知识文档对象必须包含id属性');
    }
    
    if (!knowledge.content || typeof knowledge.content !== 'string') {
      throw new Error('知识文档对象必须包含非空的content字符串');
    }
    
    // 步骤1：调用chunkMarkdown进行内容分块
    console.log('开始对内容进行分块处理...');
    const chunks = chunkMarkdown(knowledge.content, knowledge.id);
    console.log(`分块完成，共生成 ${chunks.length} 个块`);
    
    // 步骤2：调用vectorService.addVectors将分块添加到向量库
    console.log('开始将分块添加到向量库...');
    const vectorResult = await vectorService.addVectors(chunks);
    console.log('向量库添加完成');
    
    // 返回处理结果
    return {
      success: true,
      chunksCount: chunks.length,
      vectorResult: vectorResult
    };
  } catch (error) {
    console.error('上传文件处理过程中发生错误:', error);
    throw new Error(`文件上传失败: ${error.message}`);
  }
}

/**
 * 从用户查询中生成聊天标题
 * @param {string} query - 用户查询文本
 * @returns {Promise<string>} - 生成的标题
 */
async function generateChatTitle(query) {
  try {
    // 验证输入参数
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询文本不能为空');
    }

    // 构建提示词，引导模型生成简洁的聊天标题
    const prompt = `
请从以下用户查询中生成一个简洁明了的聊天标题，用于标识这次对话的主题。
标题要求：
1. 10个字以内，简洁概括核心内容
2. 使用中文
3. 只返回标题，不要添加其他说明文字

用户查询：${query}
聊天标题：
`;

    // 使用fastLLM调用模型
    console.log('开始生成聊天标题...');
    const response = await fastLLM.invoke(prompt);
    
    // 处理模型返回的结果
    let title = response.content;
    
    // 去除可能的首尾空白和标点符号
    title = title.trim();
    // 使用更基本的标点符号匹配方式，避免Unicode属性转义序列的兼容性问题
    title = title.replace(/^[\s\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]+|[\s\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]+$/g, '');
    
    console.log('聊天标题生成完成:', title);
    return title;
  } catch (error) {
    console.error('聊天标题生成过程中发生错误:', error);
    // 如果生成失败，返回默认标题
    return '新的对话';
  }
}

/**
 * 从用户查询中提取关键词
 * @param {string} query - 用户查询文本
 * @returns {Promise<Array<string>>} - 提取的关键词数组
 */
async function extractKeywords(query) {
  try {
    // 验证输入参数
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询文本不能为空');
    }

    // 构建提示词，引导模型提取关键词
    const prompt = `
请从以下查询文本中提取关键概念和术语，仅返回最重要的3-8个关键词。
格式要求：直接返回关键词列表，用逗号分隔，不要添加其他说明文字。

查询文本：${query}
关键词：
`;

    // 使用fastLLM调用模型
    console.log('开始提取关键词...');
    const response = await fastLLM.invoke(prompt);
    
    // 处理模型返回的结果
    let keywordsText = response.content;
    
    // 去除可能的首尾空白
    keywordsText = keywordsText.trim();
    
    // 按逗号分割并清理每个关键词
    const keywords = keywordsText.split(',').map(keyword => {
      // 去除可能的编号、空格和引号
      return keyword.replace(/^\s*\d*\.?\s*["']?|["']?\s*$/g, '').trim();
    }).filter(keyword => keyword.length > 0); // 过滤空关键词
    
    console.log(`关键词提取完成，共提取 ${keywords.length} 个关键词:`, keywords);
    return keywords;
  } catch (error) {
    console.error('关键词提取过程中发生错误:', error);
    throw new Error(`关键词提取失败: ${error.message}`);
  }
}

/**
 * 优化用户查询以提高检索效果
 * @param {string} query - 原始用户查询
 * @returns {Promise<string>} - 优化后的查询文本
 */
async function optimizeQuery(query) {
  try {
    // 验证输入参数
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询文本不能为空');
    }

    // 构建提示词，引导模型优化查询
    const prompt = `
请从以下问题中提取关键词，并生成一个更适合文档检索的查询语句。
只返回优化后的查询语句，不要有其他解释。

原始查询：${query}
优化后的查询：
`;

    // 使用fastLLM调用模型
    console.log('开始优化查询...');
    const response = await fastLLM.invoke(prompt);
    
    // 处理模型返回的结果
    const optimizedQuery = response.content.trim();
    
    console.log('查询优化完成:', optimizedQuery);
    return optimizedQuery;
  } catch (error) {
    console.error('查询优化过程中发生错误:', error);
    throw new Error(`查询优化失败: ${error.message}`);
  }
}

/**
 * 合并并去重两个检索函数的结果
 * @param {Array} keywordResults - 关键词检索结果数组
 * @param {Array} similarityResults - 相似度检索结果数组
 * @returns {Array} 合并去重后的结果数组，按相关性排序
 */
function mergeSearchResults(keywordResults, similarityResults) {
  try {
    // 参数验证
    if (!Array.isArray(keywordResults)) {
      throw new Error('关键词检索结果必须是数组');
    }
    if (!Array.isArray(similarityResults)) {
      throw new Error('相似度检索结果必须是数组');
    }

    console.log(`合并检索结果，关键词结果数: ${keywordResults.length}，相似度结果数: ${similarityResults.length}`);
    
    // 使用Map存储去重后的结果
    const resultsMap = new Map();
    
    // 合并两个结果集并统一评分机制
    [...keywordResults, ...similarityResults].forEach(result => {
      if (!result || typeof result !== 'object' || !result.id) return;
      
      const docId = result.id;
      
      // 统一计算相关性分数
      let relevanceScore = 0;
      
      if (typeof result.score === 'number') {
        // 相似度检索结果已有score
        relevanceScore = result.score;
      } else if (typeof result.keywordCount === 'number') {
        // 关键词检索结果使用关键词数量作为基础计算分数
        relevanceScore = Math.min(result.keywordCount / 10, 1); // 归一化到0-1
      }
      
      // 创建统一格式的结果对象
      const normalizedResult = {
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        knowledgeId: result.knowledgeId,
        relevanceScore,
        source: resultsMap.has(docId) ? 'both' : 
                keywordResults.includes(result) ? 'keyword' : 'similarity'
      };
      
      // 如果文档已存在，保留相关性更高的版本
      if (resultsMap.has(docId)) {
        const existing = resultsMap.get(docId);
        if (relevanceScore > existing.relevanceScore) {
          resultsMap.set(docId, normalizedResult);
        } else {
          existing.source = 'both';
          resultsMap.set(docId, existing);
        }
      } else {
        resultsMap.set(docId, normalizedResult);
      }
    });
    
    // 转换为数组并按相关性分数降序排序，限制返回前5个结果
    const finalResults = Array.from(resultsMap.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    
    console.log(`合并完成，返回 ${finalResults.length} 个去重结果`);
    return finalResults;
  } catch (error) {
    console.error('合并检索结果失败:', error);
    throw new Error(`结果合并失败: ${error.message}`);
  }
}

/**
 * 构建RAG提示词
 * 将检索结果、对话历史和查询文本组合成完整的提示词，用于生成回答
 * 
 * @param {Array} searchResults - 检索结果合并函数返回值
 * @param {Array<{role: string, content: string}>} history - 对话历史，包含role和content
 * @param {string} query - 优化后的查询文本
 * @returns {string} - 构建好的完整提示词
 */
function buildRAGPrompt(searchResults, history, query) {
  try {
    // 参数验证
    if (!Array.isArray(searchResults)) {
      throw new Error('检索结果必须是数组');
    }
    if (!Array.isArray(history)) {
      throw new Error('对话历史必须是数组');
    }
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询文本不能为空');
    }

    console.log('开始构建RAG提示词...');
    
    // 构建提示词模板
    let prompt = '';
    
    // 1. 系统提示词部分（优化版本）
    prompt += `你是一个专业的客户服务助手，负责基于提供的参考资料回答用户问题。`;
    prompt += `请严格遵循以下要求：\n`;
    prompt += `1. 回答必须完全基于参考资料内容，不得添加任何参考资料中未提及的信息。\n`;
    prompt += `2. 若参考资料中没有足够信息回答问题，请明确表示："知识库中暂无相关信息，我无法回答该问题"。\n`;
    prompt += `3. 回答要专业、准确，使用与用户一致的语言。\n`;
    prompt += `4. 回答必须使用Markdown格式，确保结构清晰、易读。\n`;
    prompt += `5. 若回答中需要包含图片，请使用固定图片链接格式：![图片描述](https://example.com/image.jpg)\n`;
    prompt += `6. 回答内容要尽可能详实，对相关概念、流程等进行详细解释，确保用户能够全面理解。\n`;
    prompt += `7. 当参考资料支持你的回答时，在回答的最后添加相应的参考资料链接。\n`;
    prompt += `8. 参考资料链接格式要求：[参考资料X](Y)，其中X是参考资料的序号，Y是对应的knowledgeId。\n`;
    prompt += `9. 参考资料链接应分散添加在相关内容之后，不要集中放在回答末尾。\n`;
    
    // 2. 参考资料部分（优化呈现方式）
    if (searchResults.length > 0) {
      prompt += `## 参考资料\n`;
      searchResults.forEach((result, index) => {
        console.log(result);
        if (result && result.content && result.knowledgeId) {
          // 获取路径信息
          const path = result.metadata && result.metadata.path ? result.metadata.path : '未知路径';
          // 从content中移除path前缀
          let cleanContent = result.content.trim();
          // 检查content是否以path开头，是的话移除前缀
          if (cleanContent.startsWith(path)) {
            cleanContent = cleanContent.substring(path.length).trim();
          }
          // 优化参考资料的呈现方式
          prompt += `### 参考资料${index + 1}\n`;
          prompt += `- 知识ID: ${result.knowledgeId}\n`;
          prompt += `- 相关度: ${result.relevanceScore.toFixed(2)}\n`;
          prompt += `- 标签: ${path}\n`;
          prompt += `- 内容: ${cleanContent}\n\n`;
        }
      });
    } else {
      prompt += `## 参考资料\n没有找到相关参考资料\n\n`;
    }
    
    // 3. 对话历史部分
    if (history.length > 0) {
      prompt += `## 对话历史\n`;
      history.forEach((item) => {
        if (item && item.role && item.content) {
          const roleText = item.role === 'user' ? '用户' : '助手';
          prompt += `${roleText}：${item.content.trim()}\n`;
        }
      });
      prompt += '\n';
    }
    
    // 4. 当前问题部分
    prompt += `## 当前问题\n用户：${query.trim()}\n\n`;
    
    // 5. 输出指示部分（增强版本）
    prompt += `请基于上述参考资料和对话历史，生成专业的回答：\n`;
    prompt += `1. 直接给出回答，无需额外的问候或开场白。\n`;
    prompt += `2. 保持回答的逻辑性和连贯性，使用自然的段落结构。\n`;
    prompt += `3. 必须使用Markdown格式，包括适当的标题、列表、加粗、斜体等格式来增强可读性。\n`;
    prompt += `4. 若需要举例说明，使用清晰的列表或代码块（如果适用）。\n`;
    prompt += `5. 确保参考资料链接格式正确：[参考资料X](knowledgeId)\n`;
    prompt += `6. 回答语言要与用户问题保持一致（用户使用中文则回答中文）。\n`;
    prompt += `7. 回答要尽可能详实，提供全面的信息，避免过于简略。\n`;
    prompt += `8. 若参考资料中包含步骤或流程，使用有序列表清晰呈现。\n\n`;
    prompt += `回答：`;
    
    console.log('RAG提示词构建完成');
    console.log(prompt);

    return prompt;
  } catch (error) {
    console.error('构建RAG提示词失败:', error);
    throw new Error(`提示词构建失败: ${error.message}`);
  }
}

/**
 * RAG查询第一阶段
 * 完成检索增强生成的前半部分流程，包括关键词提取、查询优化、向量检索和结果合并
 * 
 * @param {string} query - 用户原始查询
 * @returns {Promise<Object>} 查询结果，包含优化后的查询和合并后的检索结果
 */
async function ragQueryPhase1(query) {
  try {
    // 参数验证
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询内容不能为空');
    }
    
    // 设置默认检索结果数量限制
    const limit = 5;
    
    console.log('开始RAG查询第一阶段处理:', { query: query.substring(0, 50) + '...' });
    
    // 1. 关键词提取
    console.log('提取查询关键词...');
    const keywords = await extractKeywords(query);
    console.log('提取到关键词:', keywords);
    
    // 2. 查询优化
    console.log('优化查询文本...');
    const optimizedQuery = await optimizeQuery(query);
    console.log('优化后的查询:', optimizedQuery);
    
    // 3. 执行检索
    // 3.1 关键词搜索
    console.log('执行关键词搜索...');
    const keywordResults = await vectorService.keywordSearch(
      keywords,
      limit
    );
    console.log('关键词搜索结果数量:', keywordResults.length);
    
    // 3.2 相似度搜索
    console.log('执行相似度搜索...');
    const similarityResults = await vectorService.similaritySearch(
      optimizedQuery,
      limit
    );
    console.log('相似度搜索结果数量:', similarityResults.length);
    
    // 4. 合并检索结果
    console.log('合并检索结果...');
    const mergedResults = mergeSearchResults(keywordResults, similarityResults);
    
    console.log('✅ RAG查询第一阶段完成');
    
    // 返回第一阶段的结果
    return {
      success: true,
      optimizedQuery,
      mergedResults,
      sources: mergedResults.map(result => ({
        id: result.id,
        path: result.metadata?.path || '未知路径',
        source: result.source,
        relevanceScore: result.relevanceScore
      }))
    };
  } catch (error) {
    console.error('RAG查询第一阶段失败:', error);
    throw new Error(`RAG查询第一阶段处理失败: ${error.message}`);
  }
}

/**
 * RAG查询第二阶段
 * 接收第一阶段的结果，完成检索增强生成的后半部分流程，包括构建RAG提示词和获取流式输出
 * 
 * @param {string} optimizedQuery - 优化后的查询文本
 * @param {Array} mergedResults - 合并后的检索结果
 * @param {Array<{role: string, content: string}>} history - 对话历史
 * @param {Function} onChunk - 流式输出回调函数
 * @returns {Promise<Object>} 查询结果
 */
async function ragQueryPhase2(optimizedQuery, mergedResults, history = [], onChunk = null) {
  try {
    // 参数验证
    if (!optimizedQuery || typeof optimizedQuery !== 'string' || optimizedQuery.trim() === '') {
      throw new Error('优化后的查询内容不能为空');
    }
    if (!Array.isArray(mergedResults)) {
      throw new Error('合并后的检索结果必须是数组格式');
    }
    if (!Array.isArray(history)) {
      throw new Error('对话历史必须是数组格式');
    }
    
    console.log('开始RAG查询第二阶段处理:');
    
    // 5. 构建RAG提示词
    console.log('构建RAG提示词...');
    const prompt = buildRAGPrompt(mergedResults, history, optimizedQuery);
    
    // 6. 流式输出处理
    let fullResponse = '';
    
    try {
      console.log('🤖 调用LLM模型生成回答...');
      // 使用stream方法获取流式响应
      const stream = await LLM.stream(prompt);
      
      // 使用for await循环处理流式输出
      for await (const chunk of stream) {
        if (chunk.content) {
          const content = chunk.content.toString();
          fullResponse += content;
          // 调用用户提供的回调函数
          if (typeof onChunk === 'function') {
            onChunk(content);
          }
        }
      }
      
      console.log('✅ 回答生成完成');
      
      // 返回完整结果
      return {
        success: true,
        response: fullResponse,
        sources: mergedResults.map(result => ({
          id: result.id,
          path: result.metadata?.path || '未知路径',
          source: result.source,
          relevanceScore: result.relevanceScore
        }))
      };
    } catch (error) {
      console.error('LLM生成错误:', error);
      throw new Error(`LLM生成失败: ${error.message}`);
    }
  } catch (error) {
    console.error('RAG查询第二阶段失败:', error);
    throw new Error(`RAG查询第二阶段处理失败: ${error.message}`);
  }
}

/**
 * RAG查询主函数（兼容原有接口）
 * 实现完整的检索增强生成流程，包括关键词提取、查询优化、向量检索、结果合并和流式输出
 * 
 * @param {string} query - 用户原始查询
 * @param {Array<{role: string, content: string}>} history - 对话历史
 * @param {Function} onChunk - 流式输出回调函数
 * @returns {Promise<Object>} 查询结果
 */
async function ragQuery(query, history = [], onChunk = null) {
  try {
    // 参数验证
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询内容不能为空');
    }
    if (!Array.isArray(history)) {
      throw new Error('对话历史必须是数组格式');
    }
    
    console.log('开始完整RAG查询处理:', { query: query.substring(0, 50) + '...' });
    
    // 调用第一阶段获取检索结果
    const phase1Result = await ragQueryPhase1(query);
    
    // 调用第二阶段完成生成
    const phase2Result = await ragQueryPhase2(
      phase1Result.optimizedQuery,
      phase1Result.mergedResults,
      history,
      onChunk
    );
    
    return phase2Result;
  } catch (error) {
    console.error('RAG查询失败:', error);
    throw new Error(`RAG查询处理失败: ${error.message}`);
  }
}

module.exports = {
  // LLM实例
  LLM,
  fastLLM,
  // 核心功能函数
  chunkMarkdown,
  uploadFile,
  extractKeywords,
  optimizeQuery,
  ragQuery,
  ragQueryPhase1,
  ragQueryPhase2,
  generateChatTitle,
  // 结果处理函数
  mergeSearchResults,
  buildRAGPrompt
};