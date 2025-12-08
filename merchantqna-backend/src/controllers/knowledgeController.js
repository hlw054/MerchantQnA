/**
 * 知识文档控制器
 * 处理知识文档的增删改查功能
 */
const { Knowledge } = require('../models');
const { Sequelize, Op } = require('sequelize');
const { AppError } = require('../middlewares/errorHandler');
const vectorService = require('../services/vectorService');
const ragChainService = require('../services/ragChainService');

/**
 * 通过一级标签和二级标签获取knowledge列表（除content）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getKnowledgeListByTags = async (req, res, next) => {
  try {
    const { primaryTag, secondaryTag } = req.query;
    
    // 构建查询条件
    const queryConditions = {};
    if (primaryTag) {
      queryConditions.primaryTag = primaryTag;
    }
    if (secondaryTag) {
      queryConditions.secondaryTag = secondaryTag;
    }
    
    // 查询知识文档列表，排除content字段
    const knowledgeList = await Knowledge.findAll({
      where: queryConditions,
      attributes: {
        exclude: ['content']
      },
      order: [['updatedAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        knowledgeList,
        total: knowledgeList.length
      }
    });
  } catch (error) {
    console.error('获取知识文档列表失败:', error);
    return next(new AppError(500, '获取知识文档列表失败，请稍后重试'));
  }
};

/**
 * 通过id获取knowledge实体
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getKnowledgeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证ID是否存在
    if (!id) {
      return next(new AppError(400, '文档ID是必填的'));
    }
    
    // 查询完整的知识文档
    const knowledge = await Knowledge.findByPk(id);
    
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        knowledge
      }
    });
  } catch (error) {
    console.error('获取知识文档详情失败:', error);
    return next(new AppError(500, '获取知识文档详情失败，请稍后重试'));
  }
};

/**
 * 通过传递名称、一级标签、二级标签创建新实体（无content），并返回id
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const createKnowledge = async (req, res, next) => {
  try {
    const { title, primaryTag, secondaryTag } = req.body;
    
    // 验证必填字段
    if (!title || !primaryTag || !secondaryTag) {
      return next(new AppError(400, '标题、一级标签和二级标签都是必填的'));
    }
    
    // 创建新的知识文档（初始无content，状态为未完成）
    const newKnowledge = await Knowledge.create({
      title,
      primaryTag,
      secondaryTag,
      status: '未完成',
      content: null
    });
    
    res.status(201).json({
      status: 'success',
      message: '知识文档创建成功',
      data: {
        id: newKnowledge.id
      }
    });
  } catch (error) {
    console.error('创建知识文档失败:', error);
    return next(new AppError(500, '创建知识文档失败，请稍后重试'));
  }
};

/**
 * 通过id编辑文档名称、一级标签、二级标签、文档状态
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const updateKnowledgeBasicInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, primaryTag, secondaryTag, status } = req.body;
    
    // 验证ID是否存在
    if (!id) {
      return next(new AppError(400, '文档ID是必填的'));
    }
    
    // 检查至少提供了一个要更新的字段
    if (!title && !primaryTag && !secondaryTag && !status) {
      return next(new AppError(400, '至少需要提供一个要更新的字段'));
    }
    
    // 验证状态值
    if (status && !['生效中', '已失效', '未完成'].includes(status)) {
      return next(new AppError(400, '无效的文档状态，请使用：生效中、已失效或未完成'));
    }
    
    // 查找知识文档
    const knowledge = await Knowledge.findByPk(id);
    
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    // 保存原始状态
    const originalStatus = knowledge.status;
    
    // 更新字段
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (primaryTag !== undefined) updateData.primaryTag = primaryTag;
    if (secondaryTag !== undefined) updateData.secondaryTag = secondaryTag;
    if (status !== undefined) updateData.status = status;
    
    // 更新文档
    await knowledge.update(updateData);
    
    // 如果状态从生效中变为其他状态，则删除向量并更新isAddedToRAG
    if (originalStatus === '生效中' && knowledge.status !== '生效中') {
      try {
        console.log(`文档${id}状态从生效中变更为${knowledge.status}，删除对应的向量...`);
        await vectorService.deleteByKnowledgeId(id);
        // 更新isAddedToRAG为false
        await knowledge.update({ isAddedToRAG: false });
        console.log(`向量删除完成，isAddedToRAG已更新为false`);
      } catch (vectorError) {
        console.error(`删除文档${id}的向量失败:`, vectorError);
        // 向量删除失败不影响基本信息更新，但记录警告
        console.warn(`警告：文档基本信息已更新，但向量删除失败，需要手动处理`);
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: '知识文档基本信息更新成功'
    });
  } catch (error) {
    console.error('更新知识文档基本信息失败:', error);
    return next(new AppError(500, '更新知识文档基本信息失败，请稍后重试'));
  }
};

/**
 * 通过id编辑content
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const updateKnowledgeContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // 验证ID和内容
    if (!id) {
      return next(new AppError(400, '文档ID是必填的'));
    }
    
    if (content === undefined) {
      return next(new AppError(400, '内容是必填的'));
    }
    
    // 查找知识文档
    const knowledge = await Knowledge.findByPk(id);
    
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    // 保存当前状态，用于日志记录
     const originalStatus = knowledge.status;
     
     // 更新内容、状态为未完成，并将isAddedToRAG设置为false
     await knowledge.update({ content, status: '未完成', isAddedToRAG: false });
     console.log(`文档${id}内容已更新，状态从${originalStatus}变更为未完成，isAddedToRAG已设置为false`);
     
     // 删除对应文档id的向量
     try {
        console.log(`删除文档${id}的向量...`);
        await vectorService.deleteByKnowledgeId(id);
        console.log(`向量删除完成`);
     } catch (vectorError) {
       console.error(`删除文档${id}的向量失败:`, vectorError);
       // 向量删除失败不影响内容更新，但记录警告
       console.warn(`警告：文档内容已更新，但向量删除失败，需要手动处理`);
     }
     
     res.status(200).json({
       status: 'success',
       message: '知识文档内容更新成功，文档状态已设置为已失效'
     });
  } catch (error) {
    console.error('更新知识文档内容失败:', error);
    return next(new AppError(500, '更新知识文档内容失败，请稍后重试'));
  }
};

/**
 * 通过id删除knowledge实体
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const deleteKnowledgeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证ID是否存在
    if (!id) {
      return next(new AppError(400, '文档ID是必填的'));
    }
    
    // 查找知识文档
    const knowledge = await Knowledge.findByPk(id);
    
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    // 删除向量库中的对应内容
    await vectorService.deleteByKnowledgeId(id);
    
    // 删除知识文档
    await knowledge.destroy();
    
    res.status(200).json({
      status: 'success',
      message: '知识文档删除成功'
    });
  } catch (error) {
    console.error('删除知识文档失败:', error);
    return next(new AppError(500, '删除知识文档失败，请稍后重试'));
  }
};

/**
 * 将知识文档加入RAG向量库
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 * @returns {Promise<void>}
 */
async function addKnowledgeToRAG(req, res, next) {
  try {
    const { id } = req.params;
    
    // 验证文档是否存在
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    // 验证文档状态是否为生效中
    if (knowledge.status !== '生效中') {
      return next(new AppError(400, '只有状态为"生效中"的文档才能加入RAG向量库'));
    }
    
    // 检查是否已加入RAG
    if (knowledge.isAddedToRAG) {
      return res.status(200).json({
        status: 'success',
        message: '该文档已加入RAG向量库'
      });
    }
    
    // 先删除旧向量（如果存在）
    console.log(`删除文档${id}的旧向量（如果存在）...`);
    await vectorService.deleteByKnowledgeId(id);
    
    // 导入新向量
    console.log(`开始导入文档${id}的新向量...`);
    await ragChainService.uploadFile(knowledge);
    
    // 更新isAddedToRAG状态
    await knowledge.update({ isAddedToRAG: true });
    
    console.log(`文档${id}成功加入RAG向量库`);
    return res.status(200).json({
      status: 'success',
      message: '知识文档成功加入RAG向量库'
    });
  } catch (error) {
    console.error('将知识文档加入RAG向量库失败:', error);
    return next(new AppError(500, '将知识文档加入RAG向量库失败，请稍后重试'));
  }
}

/**
 * 将知识文档从RAG向量库中删除
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 * @returns {Promise<void>}
 */
async function removeKnowledgeFromRAG(req, res, next) {
  try {
    const { id } = req.params;
    
    // 验证文档是否存在
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    // 检查是否已加入RAG
    if (!knowledge.isAddedToRAG) {
      return res.status(200).json({
        status: 'success',
        message: '该文档未加入RAG向量库'
      });
    }
    
    // 从向量库中删除
    console.log(`从RAG向量库中删除文档${id}...`);
    await vectorService.deleteByKnowledgeId(id);
    
    // 更新isAddedToRAG状态
    await knowledge.update({ isAddedToRAG: false });
    
    console.log(`文档${id}成功从RAG向量库中删除`);
    return res.status(200).json({
      status: 'success',
      message: '知识文档成功从RAG向量库中删除'
    });
  } catch (error) {
    console.error('将知识文档从RAG向量库中删除失败:', error);
    return next(new AppError(500, '将知识文档从RAG向量库中删除失败，请稍后重试'));
  }
}

/**
 * 获取指定知识文档的所有RAG切片
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 * @returns {Promise<void>}
 */
async function getKnowledgeRAGChunks(req, res, next) {
  try {
    const { id } = req.params;
    
    // 验证文档是否存在
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) {
      return next(new AppError(404, '知识文档不存在'));
    }
    
    // 获取所有文档块
    const chunks = await vectorService.getDocumentsByKnowledgeId(id);
    
    // 去除vector字段
    const chunksWithoutVector = chunks.map(chunk => {
      const { vector, ...rest } = chunk;
      return rest;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        chunks: chunksWithoutVector,
        total: chunksWithoutVector.length
      }
    });
  } catch (error) {
    console.error('获取RAG切片失败:', error);
    return next(new AppError(500, '获取RAG切片失败，请稍后重试'));
  }
}

module.exports = {
  getKnowledgeListByTags,
  getKnowledgeById,
  createKnowledge,
  updateKnowledgeBasicInfo,
  updateKnowledgeContent,
  deleteKnowledgeById,
  addKnowledgeToRAG,
  removeKnowledgeFromRAG,
  getKnowledgeRAGChunks,
};
