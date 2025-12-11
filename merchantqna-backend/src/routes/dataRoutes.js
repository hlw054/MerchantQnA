/**
 * 数据相关路由
 * 定义与数据相关的API端点
 */
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Data
 *   description: 数据管理相关接口
 */

/**
 * @swagger
 * /api/data/statistics:
 *   get:
 *     summary: 获取系统统计数据
 *     tags: [Data]
 *     description: 获取用户数量、知识文档总数、问答总数、浏览数总数、引用总数
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                       description: 用户数量
 *                     knowledgeCount:
 *                       type: integer
 *                       description: 知识文档总数
 *                     messageCount:
 *                       type: integer
 *                       description: 问答总数
 *                     totalViews:
 *                       type: integer
 *                       description: 浏览数总数
 *                     totalReferences:
 *                       type: integer
 *                       description: 引用总数
 *       500:
 *         description: 服务器内部错误
 */
router.get('/statistics', protect, dataController.getSystemStatistics);

/**
 * @swagger
 * /api/data/chunk-references:
 *   get:
 *     summary: 获取指定分类的引用次数列表
 *     tags: [Data]
 *     description: 根据一级标签和二级标签获取对应分类的引用次数列表，从高到低排列
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: primaryTag
 *         schema:
 *           type: string
 *         required: true
 *         description: 一级标签
 *       - in: query
 *         name: secondaryTag
 *         schema:
 *           type: string
 *         required: true
 *         description: 二级标签
 *     responses:
 *       200:
 *         description: 成功获取引用次数列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       chunkId:
 *                         type: string
 *                         description: 分块ID
 *                       knowledgeId:
 *                         type: string
 *                         description: 知识文档ID
 *                       title:
 *                         type: string
 *                         description: 知识文档标题
 *                       path:
 *                         type: string
 *                         description: 分块路径
 *                       referenceCount:
 *                         type: integer
 *                         description: 引用次数
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.get('/chunk-references', protect, dataController.getChunkReferencesByTags);

/**
 * @swagger
 * /api/data/secondary-tag-references:
 *   get:
 *     summary: 获取每一个二级分类的总引用次数
 *     tags: [Data]
 *     description: 获取每一个二级分类的总引用次数
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取二级分类总引用次数
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       primaryTag:
 *                         type: string
 *                         description: 一级标签
 *                       secondaryTag:
 *                         type: string
 *                         description: 二级标签
 *                       totalReferences:
 *                         type: integer
 *                         description: 总引用次数
 *       500:
 *         description: 服务器内部错误
 */
router.get('/secondary-tag-references', protect, dataController.getSecondaryTagTotalReferences);

/**
 * @swagger
 * /api/data/chunk-references/knowledge: 
 *   get:
 *     summary: 通过knowledgeId获取所有切片的引入数列表
 *     tags: [Data]
 *     description: 根据knowledgeId获取该知识文档所有切片的引用次数列表，从高到低排列
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: knowledgeId
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200:
 *         description: 成功获取切片引用数列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       chunkId:
 *                         type: string
 *                         description: 切片ID
 *                       path:
 *                         type: string
 *                         description: 切片路径
 *                       referenceCount:
 *                         type: integer
 *                         description: 引用次数
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.get('/chunk-references/knowledge', protect, dataController.getChunkReferencesByKnowledgeId);

module.exports = router;
