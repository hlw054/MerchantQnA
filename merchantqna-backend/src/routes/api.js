/**
 * API路由主文件
 * 整合所有子路由
 */
const express = require('express');
const router = express.Router();

// 导入用户路由
const userRoutes = require('./userRoutes');

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 可以根据需要添加更多模块的路由
router.use('/users', userRoutes);
// router.use('/products', productRoutes);

module.exports = router;
