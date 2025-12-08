/**
 * PDF转换相关路由
 * 定义PDF文件转换为Markdown的API端点
 */
const express = require('express');
const router = express.Router();
const pdfConversionController = require('../controllers/pdfConversionController');

/**
 * @swagger
 * tags:
 *   name: PDF-Conversion
 *   description: PDF文件转换相关接口
 */

/**
 * @swagger
 * /api/pdf/conversion/to-markdown:
 *   post:
 *     summary: 将PDF文件转换为Markdown格式
 *     tags: [PDF-Conversion]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: pdfFile
 *         type: file
 *         required: true
 *         description: 要转换的PDF文件
 *     responses:
 *       200:
 *         description: 转换成功，返回Markdown内容
 *       400:
 *         description: 请求参数错误，如未上传文件或文件格式不正确
 *       500:
 *         description: 服务器内部错误或转换失败
 */
router.post('/to-markdown', pdfConversionController.convertPdfToMarkdown);

/**
 * @swagger
 * /api/pdf/conversion/info:
 *   post:
 *     summary: 获取PDF文件的基本信息
 *     tags: [PDF-Conversion]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: pdfFile
 *         type: file
 *         required: true
 *         description: 要获取信息的PDF文件
 *     responses:
 *       200:
 *         description: 获取PDF信息成功
 *       400:
 *         description: 请求参数错误，如未上传文件或文件格式不正确
 *       500:
 *         description: 服务器内部错误
 */
router.post('/info', pdfConversionController.getPdfInfo);

module.exports = router;