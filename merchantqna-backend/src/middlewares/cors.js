/**
 * CORS 中间件配置
 * 处理跨域资源共享
 */
const cors = require('cors');

// 配置 CORS 选项
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8080', 'http://47.102.20.117:5173'], // 允许的前端地址
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 允许的HTTP方法
  allowedHeaders: ['Origin', 'Content-Type', 'Authorization', 'X-Requested-With'], // 允许的请求头
  credentials: true, // 允许携带凭证
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// 创建 CORS 中间件
const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;