/**
 * 知识文档相关路由
 * 定义知识文档的增删改查API端点
 */
const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Knowledge
 *   description: 知识文档管理相关接口
 */

/**
 * @swagger
 * /api/knowledge/list: 
 *   get:
 *     summary: 通过一级标签和二级标签获取knowledge列表（除content）
 *     tags: [Knowledge]
 *     parameters:
 *       - in: query
 *         name: primaryTag
 *         schema:
 *           type: string
 *         description: 一级标签
 *       - in: query
 *         name: secondaryTag
 *         schema:
 *           type: string
 *         description: 二级标签
 *     responses:
 *       200: 
 *         description: 获取知识文档列表成功
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/list', knowledgeController.getKnowledgeListByTags);

/**
 * @swagger
 * /api/knowledge/{id}: 
 *   get:
 *     summary: 通过id获取knowledge实体
 *     tags: [Knowledge]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200: 
 *         description: 获取知识文档详情成功
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/:id', knowledgeController.getKnowledgeById);

/**
 * @swagger
 * /api/knowledge/{id}/views/increment: 
 *   put:
 *     summary: 通过id增加knowledge浏览数
 *     tags: [Knowledge]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200: 
 *         description: 增加浏览数成功
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/:id/views/increment', knowledgeController.incrementKnowledgeViews);

/**
 * @swagger
 * /api/knowledge: 
 *   post:
 *     summary: 通过传递名称、一级标签、二级标签创建新实体（无content）
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - primaryTag
 *               - secondaryTag
 *             properties:
 *               title: 
 *                 type: string
 *                 description: 文档标题
 *               primaryTag: 
 *                 type: string
 *                 description: 一级标签
 *               secondaryTag: 
 *                 type: string
 *                 description: 二级标签
 *     responses:
 *       201: 
 *         description: 创建成功，返回知识文档ID
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/', protect, knowledgeController.createKnowledge);

/**
 * @swagger
 * /api/knowledge/basic-info/{id}: 
 *   put:
 *     summary: 通过id编辑文档名称、一级标签、二级标签、文档状态
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: 
 *                 type: string
 *                 description: 文档标题
 *               primaryTag: 
 *                 type: string
 *                 description: 一级标签
 *               secondaryTag: 
 *                 type: string
 *                 description: 二级标签
 *               status: 
 *                 type: string
 *                 enum: ["生效中", "已失效", "未完成"]
 *                 description: 文档状态
 *     responses:
 *       200: 
 *         description: 更新成功
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/basic-info/:id', protect, knowledgeController.updateKnowledgeBasicInfo);

/**
 * @swagger
 * /api/knowledge/content/{id}: 
 *   put:
 *     summary: 通过id编辑content
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content: 
 *                 type: string
 *                 description: 文档内容
 *     responses:
 *       200: 
 *         description: 更新成功
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/content/:id', protect, knowledgeController.updateKnowledgeContent);

/**
 * @swagger
 * /api/knowledge/{id}: 
 *   delete:
 *     summary: 通过id删除knowledge实体
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200: 
 *         description: 删除成功
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.delete('/:id', protect, knowledgeController.deleteKnowledgeById);

/**
 * @swagger
 * /api/knowledge/{id}/add-to-rag: 
 *   post:
 *     summary: 将知识文档加入RAG向量库
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200: 
 *         description: 成功加入RAG向量库
 *       400: 
 *         description: 请求参数错误或文档状态不符合要求
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/:id/add-to-rag', protect, knowledgeController.addKnowledgeToRAG);

/**
 * @swagger
 * /api/knowledge/{id}/remove-from-rag: 
 *   post:
 *     summary: 将知识文档从RAG向量库中删除
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200: 
 *         description: 成功从RAG向量库中删除
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/:id/remove-from-rag', protect, knowledgeController.removeKnowledgeFromRAG);

/**
 * @swagger
 * /api/knowledge/{id}/rag-chunks: 
 *   get:
 *     summary: 获取指定知识文档的所有RAG切片
 *     tags: [Knowledge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 知识文档ID
 *     responses:
 *       200: 
 *         description: 成功获取所有RAG切片
 *       404: 
 *         description: 知识文档不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/:id/rag-chunks', protect, knowledgeController.getKnowledgeRAGChunks);

module.exports = router;
