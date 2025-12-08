/**
 * 标签路由
 */
const express = require('express');
const router = express.Router();
const labelController = require('../controllers/labelController');

/**
 * @swagger
 * tags:
 *   name: Label
 *   description: 标签管理
 */

/**
 * @swagger
 * /api/label/primary:
 *   post:
 *     summary: 新增一级标签
 *     tags: [Label]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *     responses:
 *       201:
 *         description: 一级标签创建成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/primary', labelController.addPrimaryLabel);

/**
 * @swagger
 * /api/label/secondary:
 *   post:
 *     summary: 新增二级标签
 *     tags: [Label]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *               parentId:
 *                 type: string
 *                 description: 一级标签ID
 *     responses:
 *       201:
 *         description: 二级标签创建成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/secondary', labelController.addSecondaryLabel);

/**
 * @swagger
 * /api/label:
 *   get:
 *     summary: 获取所有标签
 *     tags: [Label]
 *     responses:
 *       200:
 *         description: 获取标签列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   subcategories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *       500:
 *         description: 服务器错误
 */
router.get('/', labelController.getAllLabels);

/**
 * @swagger
 * /api/label/primary/{id}:
 *   delete:
 *     summary: 删除一级标签
 *     tags: [Label]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 一级标签ID
 *     responses:
 *       200:
 *         description: 一级标签删除成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.delete('/primary/:id', labelController.deletePrimaryLabel);

/**
 * @swagger
 * /api/label/secondary/{id}:
 *   delete:
 *     summary: 删除二级标签
 *     tags: [Label]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 二级标签ID
 *     responses:
 *       200:
 *         description: 二级标签删除成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.delete('/secondary/:id', labelController.deleteSecondaryLabel);

module.exports = router;