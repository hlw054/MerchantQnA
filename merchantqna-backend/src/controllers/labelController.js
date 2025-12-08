/**
 * 标签控制器
 * 实现标签的增删改查功能
 */
const { Label } = require('../models');
const { Op } = require('sequelize');

/**
 * 新增一级标签
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<Object>} - 新增的一级标签
 */
async function addPrimaryLabel(req, res) {
  try {
    const { name } = req.body;
    
    // 验证参数
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '标签名称不能为空'
      });
    }
    
    // 创建一级标签（parentId为null）
    const label = await Label.create({
      name: name.trim(),
      parentId: null
    });
    
    return res.status(201).json({
      success: true,
      data: label,
      message: '一级标签创建成功'
    });
  } catch (error) {
    console.error('新增一级标签失败:', error);
    return res.status(500).json({
      success: false,
      message: '新增一级标签失败: ' + error.message
    });
  }
}

/**
 * 新增二级标签
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<Object>} - 新增的二级标签
 */
async function addSecondaryLabel(req, res) {
  try {
    const { name, parentId } = req.body;
    
    // 验证参数
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '标签名称不能为空'
      });
    }
    
    if (!parentId || typeof parentId !== 'string') {
      return res.status(400).json({
        success: false,
        message: '父标签ID不能为空且必须为字符串'
      });
    }
    
    // 验证父标签是否存在且为一级标签
    const parentLabel = await Label.findOne({
      where: {
        id: parentId,
        parentId: null
      }
    });
    
    if (!parentLabel) {
      return res.status(400).json({
        success: false,
        message: '指定的父标签不存在或不是一级标签'
      });
    }
    
    // 创建二级标签
    const label = await Label.create({
      name: name.trim(),
      parentId: parentId
    });
    
    return res.status(201).json({
      success: true,
      data: label,
      message: '二级标签创建成功'
    });
  } catch (error) {
    console.error('新增二级标签失败:', error);
    return res.status(500).json({
      success: false,
      message: '新增二级标签失败: ' + error.message
    });
  }
}

/**
 * 返回所有标签，包括一级标签和对应的二级标签
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<Object>} - 所有标签列表
 */
async function getAllLabels(req, res) {
  try {
    // 查询所有一级标签，并包含它们的二级标签
    const labels = await Label.findAll({
      where: {
        parentId: null
      },
      include: [
        {
          model: Label,
          as: 'subcategories',
          attributes: ['id', 'name'],
          order: [['name', 'ASC']]
        }
      ],
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      data: labels,
      message: '获取标签列表成功'
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取标签列表失败: ' + error.message
    });
  }
}

/**
 * 删除一级标签（同步删除对应的二级标签）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<Object>} - 删除结果
 */
async function deletePrimaryLabel(req, res) {
  try {
    const { id } = req.params;
    
    // 验证参数
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '标签ID不能为空且必须为字符串'
      });
    }
    
    // 验证标签是否存在且为一级标签
    const label = await Label.findOne({
      where: {
        id: id,
        parentId: null
      }
    });
    
    if (!label) {
      return res.status(400).json({
        success: false,
        message: '指定的一级标签不存在'
      });
    }
    
    // 删除一级标签（由于设置了onDelete: 'CASCADE'，会自动删除关联的二级标签）
    await Label.destroy({
      where: {
        id: id
      }
    });
    
    return res.status(200).json({
      success: true,
      message: '一级标签及对应的二级标签删除成功'
    });
  } catch (error) {
    console.error('删除一级标签失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除一级标签失败: ' + error.message
    });
  }
}

/**
 * 删除二级标签
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<Object>} - 删除结果
 */
async function deleteSecondaryLabel(req, res) {
  try {
    const { id } = req.params;
    
    // 验证参数
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '标签ID不能为空且必须为字符串'
      });
    }
    
    // 验证标签是否存在且为二级标签
    const label = await Label.findOne({
      where: {
        id: id,
        parentId: { [Op.not]: null }
      }
    });
    
    if (!label) {
      return res.status(400).json({
        success: false,
        message: '指定的二级标签不存在'
      });
    }
    
    // 删除二级标签
    await Label.destroy({
      where: {
        id: id
      }
    });
    
    return res.status(200).json({
      success: true,
      message: '二级标签删除成功'
    });
  } catch (error) {
    console.error('删除二级标签失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除二级标签失败: ' + error.message
    });
  }
}

module.exports = {
  addPrimaryLabel,
  addSecondaryLabel,
  getAllLabels,
  deletePrimaryLabel,
  deleteSecondaryLabel
};