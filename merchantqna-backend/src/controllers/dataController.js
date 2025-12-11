/**
 * 数据控制器
 * 处理与数据相关的接口
 */
const { User, Knowledge, Message, ChunkReference, sequelize } = require('../models');
const { AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * 获取系统统计数据
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 * @returns {Promise<void>}
 */
const getSystemStatistics = async (req, res, next) => {
  try {
    // 并行查询所有统计数据
    const [
      userCount,
      knowledgeCount,
      messageCount,
      totalViews,
      totalReferences
    ] = await Promise.all([
      // 获取用户数量
      User.count(),
      // 获取知识文档总数
      Knowledge.count(),
      // 获取问答（message）总数
      Message.count(),
      // 获取浏览数总数（所有知识文档views字段的总和）
      Knowledge.sum('views'),
      // 获取引用总数（所有分块引用referenceCount字段的总和）
      ChunkReference.sum('referenceCount')
    ]);

    // 构造响应数据
    const statistics = {
      userCount,
      knowledgeCount,
      messageCount,
      totalViews: totalViews || 0, // 处理可能的null值
      totalReferences: totalReferences || 0 // 处理可能的null值
    };

    // 返回统计数据
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('获取系统统计数据失败:', error);
    next(new AppError(500, '获取系统统计数据失败'));
  }
};

/**
 * 根据一级标签和二级标签获取文章的总引用次数列表，从高到低排列
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 * @returns {Promise<void>}
 */
const getChunkReferencesByTags = async (req, res, next) => {
  try {
    const { primaryTag, secondaryTag } = req.query;
    
    // 验证请求参数
    if (!primaryTag || typeof primaryTag !== 'string') {
      return next(new AppError(400, '一级标签不能为空'));
    }
    
    if (!secondaryTag || typeof secondaryTag !== 'string') {
      return next(new AppError(400, '二级标签不能为空'));
    }
    
    // 查询符合条件的知识文档及其总引用次数，按引用次数从高到低排序
    const result = await Knowledge.findAll({
      attributes: [
        'id',
        'title',
        [sequelize.fn('SUM', sequelize.col('chunkReferences.referenceCount')), 'totalReferences']
      ],
      where: {
        primaryTag,
        secondaryTag
      },
      include: [
        {
          model: ChunkReference,
          as: 'chunkReferences',
          attributes: [],
          required: false // 允许没有引用记录的文章
        }
      ],
      group: ['Knowledge.id', 'Knowledge.title'],
      order: [[sequelize.fn('SUM', sequelize.col('chunkReferences.referenceCount')), 'DESC']],
      raw: true
    });
    
    // 整理结果格式，确保totalReferences为数字类型
    const formattedResult = result.map(item => ({
      knowledgeId: item.id,
      title: item.title,
      totalReferences: parseInt(item.totalReferences) || 0
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedResult
    });
  } catch (error) {
    console.error('根据标签获取文章引用次数失败:', error);
    next(new AppError(500, '获取文章引用次数失败'));
  }
};

/**
 * 获取每一个二级分类的总引用次数
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 * @returns {Promise<void>}
 */
const getSecondaryTagTotalReferences = async (req, res, next) => {
  try {
    // 查询每个一级标签下的二级标签及其总引用次数
    const result = await Knowledge.findAll({
      attributes: [
        'primaryTag',
        'secondaryTag',
        [sequelize.fn('SUM', sequelize.col('chunkReferences.referenceCount')), 'totalReferences']
      ],
      include: [
        {
          model: ChunkReference,
          as: 'chunkReferences',
          attributes: [],
          required: false // 允许没有引用记录的分类
        }
      ],
      group: ['primaryTag', 'secondaryTag'],
      order: [[sequelize.fn('SUM', sequelize.col('chunkReferences.referenceCount')), 'DESC']],
      raw: true // 返回原始数据，避免默认包含主键id
    });
    
    // 整理结果格式
    const formattedResult = result.map(item => ({
      primaryTag: item.primaryTag,
      secondaryTag: item.secondaryTag,
      totalReferences: parseInt(item.totalReferences) || 0
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedResult
    });
  } catch (error) {
    console.error('获取二级分类总引用次数失败:', error);
    next(new AppError(500, '获取二级分类总引用次数失败'));
  }
};

/**
 * 通过knowledgeId获取所有切片的引入数列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 * @returns {Promise<void>}
 */
const getChunkReferencesByKnowledgeId = async (req, res, next) => {
  try {
    const { knowledgeId } = req.query;
    
    // 验证请求参数
    if (!knowledgeId || typeof knowledgeId !== 'string') {
      return next(new AppError(400, 'knowledgeId不能为空'));
    }
    
    // 查询该知识文档的所有切片引用记录
    const chunkReferences = await ChunkReference.findAll({
      attributes: ['chunkId', 'path', 'referenceCount'],
      where: {
        knowledgeId
      },
      order: [['referenceCount', 'DESC']] // 按引用数从高到低排序
    });
    
    // 整理结果格式
    const formattedResult = chunkReferences.map(chunk => ({
      chunkId: chunk.chunkId,
      path: chunk.path,
      referenceCount: chunk.referenceCount
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedResult
    });
  } catch (error) {
    console.error('根据knowledgeId获取切片引用数失败:', error);
    next(new AppError(500, '获取切片引用数失败'));
  }
};

module.exports = {
  getSystemStatistics,
  getChunkReferencesByTags,
  getSecondaryTagTotalReferences,
  getChunkReferencesByKnowledgeId
};

