/**
 * API路由主文件
 * 整合所有子路由
 */
const express = require('express');
const router = express.Router();

// 导入路由模块
const userRoutes = require('./userRoutes');
const knowledgeRoutes = require('./knowledgeRoutes');
const pdfConversionRoutes = require('./pdfConversionRoutes');
const chatRoutes = require('./chatRoutes');
const labelRoutes = require('./labelRoutes');

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 可以根据需要添加更多模块的路由
router.use('/users', userRoutes);
router.use('/knowledge', knowledgeRoutes);
// router.use('/products', productRoutes);
// PDF转换相关路由
router.use('/pdf/conversion', pdfConversionRoutes);

// 聊天相关路由
router.use('/chat', chatRoutes);

// 标签相关路由
router.use('/label', labelRoutes);

module.exports = router;
