/**
 * 聊天相关路由
 * 定义聊天查询的API端点
 */
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: 聊天查询相关接口
 */

/**
 * @swagger
 * /api/chat/query: 
 *   post:
 *     summary: 处理聊天查询，返回流式响应（完整流程）
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: 用户查询内容
 *                 example: "如何注册商家账号？"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *                 description: 对话历史
 *               chatId:
 *                 type: string
 *                 description: 聊天ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200: 
 *         description: 流式响应
 *         content:
 *           text/event-stream: 
 *             schema:
 *               type: string
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/query', chatController.handleChatQuery);

/**
 * @swagger
 * /api/chat/query/phase1: 
 *   post:
 *     summary: 处理聊天查询第一阶段，执行检索并返回结果
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: 用户查询内容
 *                 example: "如何注册商家账号？"
 *               chatId:
 *                 type: string
 *                 description: 聊天ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200: 
 *         description: 检索结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     optimizedQuery:
 *                       type: string
 *                       description: 优化后的查询语句
 *                     mergedResults:
 *                       type: array
 *                       description: 合并后的检索结果
 *                     sources:
 *                       type: array
 *                       description: 引用的资料源
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/query/phase1', chatController.handleChatQueryPhase1);

/**
 * @swagger
 * /api/chat/query/phase2: 
 *   post:
 *     summary: 处理聊天查询第二阶段，基于第一阶段的检索结果生成回答
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: 用户查询内容
 *                 example: "如何注册商家账号？"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *                 description: 对话历史
 *               chatId:
 *                 type: string
 *                 description: 聊天ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               optimizedQuery:
 *                 type: string
 *                 description: 第一阶段返回的优化查询语句
 *               mergedResults:
 *                 type: array
 *                 description: 第一阶段返回的合并检索结果
 *     responses:
 *       200: 
 *         description: 流式响应
 *         content:
 *           text/event-stream: 
 *             schema:
 *               type: string
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/query/phase2', chatController.handleChatQueryPhase2);

/**
 * @swagger
 * /api/chat/{userId}/list: 
 *   get:
 *     summary: 通过userId获取Chat列表
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         type: string
 *         required: true
 *         description: 用户ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200: 
 *         description: 聊天列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chatId:
 *                             type: string
 *                           chatTitle:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/:userId/list', chatController.getChatListByUserId);

/**
 * @swagger
 * /api/chat/messages/{chatId}: 
 *   get:
 *     summary: 通过ChatId获取Message列表
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         type: string
 *         required: true
 *         description: 聊天ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200: 
 *         description: 消息列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           messageId:
 *                             type: string
 *                           chatId:
 *                             type: string
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *                           sendTime:
 *                             type: string
 *                             format: date-time
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/messages/:chatId', chatController.getMessagesByChatId);

/**
 * @swagger
 * /api/chat/create: 
 *   post:
 *     summary: 通过用户查询生成标题并创建Chat
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: 用户查询内容
 *                 example: "如何注册商家账号？"
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201: 
 *         description: Chat创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       type: object
 *                       properties:
 *                         chatId:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         chatTitle:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/create', chatController.createChatWithTitle);

/**
 * @swagger
 * /api/chat/{chatId}: 
 *   delete:
 *     summary: 通过ChatId删除Chat及关联的Message
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         type: string
 *         required: true
 *         description: 聊天ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200: 
 *         description: Chat删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Chat及关联的Message已成功删除"
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: Chat不存在或已删除
 *       500: 
 *         description: 服务器内部错误
 */
router.delete('/:chatId', chatController.deleteChatById);

/**
 * @swagger
 * /api/chat/message/{messageId}: 
 *   delete:
 *     summary: 通过messageId删除消息
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 消息ID
 *     responses:
 *       200: 
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     message:
 *                       type: string
 *                       example: "已成功删除消息"
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 消息不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.delete('/message/:messageId', chatController.deleteMessageById);

/**
 * @swagger
 * /api/chat/{chatId}/title: 
 *   put:
 *     summary: 通过chatId修改chatTitle
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         description: 聊天ID
 *         schema:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatTitle:
 *                 type: string
 *                 description: 新的聊天标题
 *                 example: "如何注册商家账号？"
 *     responses:
 *       200: 
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       type: object
 *                       properties:
 *                         chatId:
 *                           type: string
 *                         chatTitle:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 聊天不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/:chatId/title', chatController.updateChatTitle);

module.exports = router;