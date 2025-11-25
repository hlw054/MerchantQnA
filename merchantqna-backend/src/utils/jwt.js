/**
 * JWT工具函数
 * 用于生成和验证JWT token
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT密钥（从环境变量获取，没有则使用默认值）
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 生成JWT token
 * @param {Object} payload - 要包含在token中的数据
 * @returns {string} - 生成的token
 */
const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    return token;
  } catch (error) {
    console.error('生成token失败:', error);
    throw new Error('生成token失败');
  }
};

/**
 * 验证JWT token
 * @param {string} token - 要验证的token
 * @returns {Object} - 解析后的token数据
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('token已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('无效的token');
    }
    console.error('验证token失败:', error);
    throw new Error('验证token失败');
  }
};

/**
 * 从Authorization头中提取token
 * @param {Object} req - Express请求对象
 * @returns {string|null} - 提取的token或null
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader
};