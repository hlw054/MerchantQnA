// 首先加载环境变量
require('dotenv').config();

const express = require('express');
const corsMiddleware = require('./middlewares/cors');
const { globalErrorHandler, AppError } = require('./middlewares/errorHandler');
const apiRoutes = require('./routes/api');
const { initializeDatabase } = require('./models');
const { initVectorDB } = require('./services/vectorService');
const fileUpload = require('express-fileupload');

// 创建Express应用实例
const app = express();

// 中间件配置
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 配置文件上传中间件
app.use(fileUpload({
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制文件大小为50MB
  },
  abortOnLimit: true,
  useTempFiles: false, // 直接在内存中处理文件
}));

// 使用路由
const API_PREFIX = process.env.API_PREFIX || '/api';
app.use(API_PREFIX, apiRoutes);

// 根路径路由
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MerchantQnA Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use((req, res, next) => {
  const error = new AppError(404, `Route not found: ${req.originalUrl}`);
  next(error);
});

// 全局错误处理中间件
app.use(globalErrorHandler);

// 获取端口号
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    const dbResult = await initializeDatabase();
    if (!dbResult.success) {
      console.error('Failed to initialize database, shutting down...');
      process.exit(1);
    }
    
    // 初始化向量数据库
    console.log('Initializing vector database...');
    await initVectorDB();
    console.log('Vector database initialization completed');
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`Server running in ${ENV} mode on port ${PORT}`);
      console.log(`Environment: ${ENV}`);
      console.log(`API prefix: ${API_PREFIX}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

// 导出app以便于测试
module.exports = app;
