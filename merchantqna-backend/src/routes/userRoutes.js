/**
 * 用户相关路由
 * 定义用户注册、登录、获取用户信息等API端点
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理相关接口
 */

/**
 * @swagger
 * /api/users/register: 
 *   post:
 *     summary: 用户注册
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - password
 *               - email
 *               - verificationCode
 *             properties:
 *               account: 
 *                 type: string
 *                 description: 账号
 *               username: 
 *                 type: string
 *                 description: 用户名
 *               password: 
 *                 type: string
 *                 description: 密码
 *               email: 
 *                 type: string
 *                 description: 邮箱
 *               verificationCode: 
 *                 type: string
 *                 description: 邮箱验证码
 *     responses:
 *       201: 
 *         description: 注册成功
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/users/login: 
 *   post:
 *     summary: 用户登录
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier: 
 *                 type: string
 *                 description: 账号或邮箱
 *               password: 
 *                 type: string
 *                 description: 密码
 *     responses:
 *       200: 
 *         description: 登录成功，返回token
 *       401: 
 *         description: 认证失败
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/users/verify-email: 
 *   post:
 *     summary: 发送邮箱验证码
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email: 
 *                 type: string
 *                 description: 邮箱地址
 *     responses:
 *       200: 
 *         description: 验证码已发送
 *       400: 
 *         description: 请求参数错误
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/verify-email', userController.sendVerificationCode);

/**
 * @swagger
 * /api/users/me: 
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 获取成功
 *       401: 
 *         description: 未认证
 *       404: 
 *         description: 用户不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/me', protect, userController.getCurrentUser);

/**
 * @swagger
 * /api/users/logout: 
 *   post:
 *     summary: 用户登出
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: 
 *         description: 登出成功
 *       401: 
 *         description: 未认证
 *       500: 
 *         description: 服务器内部错误
 */
router.post('/logout', protect, userController.logout);

/**
 * @swagger
 * /api/users: 
 *   get:
 *     summary: 获取用户列表（分页）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 每页数量，默认10，最大100
 *     responses:
 *       200: 
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: 
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           account:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401: 
 *         description: 未认证或权限不足
 *       500: 
 *         description: 服务器内部错误
 */
router.get('/', protect, restrictTo('admin'), userController.getUsers);

/**
 * @swagger
 * /api/users/role: 
 *   patch:
 *     summary: 修改用户角色
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId: 
 *                 type: integer
 *                 description: 用户ID
 *               role: 
 *                 type: string
 *                 description: 新角色 (user, merchant, admin)
 *     responses:
 *       200: 
 *         description: 修改成功
 *       400: 
 *         description: 请求参数错误
 *       401: 
 *         description: 未认证或权限不足
 *       404: 
 *         description: 用户不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.patch('/role', protect, restrictTo('admin'), userController.updateUserRole);

module.exports = router;