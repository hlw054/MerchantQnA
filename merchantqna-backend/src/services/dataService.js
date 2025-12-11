/**
 * 数据服务
 * 提供各种数据处理和统计功能
 */
const { ChunkReference } = require('../models');
const { sequelize } = require('../config/database');

/**
 * 增加分块引用记录
 * 如果记录已存在，则增加引用次数；如果不存在，则创建新记录
 * @param {string} chunkId - 分块ID
 * @param {string} knowledgeId - 知识文档ID
 * @param {string} path - 分块路径
 * @returns {Promise<Object>} 更新后的分块引用记录
 */
const incrementChunkReference = async (chunkId, knowledgeId, path) => {
  try {
    // 验证参数
    if (!chunkId || !knowledgeId || !path) {
      throw new Error('chunkId、knowledgeId和path是必填参数');
    }

    // 使用事务确保原子性操作
    return await sequelize.transaction(async (t) => {
      // 尝试查找现有记录
      let chunkReference = await ChunkReference.findOne({
        where: { chunkId, knowledgeId, path },
        transaction: t
      });

      if (chunkReference) {
        // 记录已存在，增加引用次数
        await chunkReference.increment('referenceCount', {
          by: 1,
          transaction: t
        });
        // 重新获取更新后的记录
        chunkReference = await ChunkReference.findByPk(chunkReference.id, {
          transaction: t
        });
      } else {
        // 记录不存在，创建新记录
        chunkReference = await ChunkReference.create({
          chunkId,
          knowledgeId,
          path,
          referenceCount: 1
        }, { transaction: t });
      }

      return chunkReference;
    });
  } catch (error) {
    console.error('增加分块引用记录失败:', error);
    throw error;
  }
};

module.exports = {
  incrementChunkReference
};
