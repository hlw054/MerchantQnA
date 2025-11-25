/**
 * 认证中间件
 * 用于验证JWT token并保护需要认证的路由
 */
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { User } = require('../models');

/**
 * 验证JWT token并设置用户信息到请求对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const protect = async (req, res, next) => {
  try {
    // 从请求头中提取token
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '未提供认证token'
      });
    }
    
    // 验证token
    const decoded = verifyToken(token);
    
    // 查找并验证用户是否仍然存在
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '用户不存在或已被删除'
      });
    }
    
    // 将用户信息设置到请求对象中
    req.user = {
      id: user.id,
      account: user.account,
      role: user.role,
      email: user.email
    };
    
    // 继续下一个中间件
    next();
  } catch (error) {
    console.error('认证失败:', error);
    
    // 根据不同的错误类型返回不同的响应
    if (error.message === 'token已过期') {
      return res.status(401).json({
        status: 'error',
        message: '认证已过期，请重新登录'
      });
    } else if (error.message === '无效的token') {
      return res.status(401).json({
        status: 'error',
        message: '无效的认证token'
      });
    }
    
    // 其他认证错误
    return res.status(401).json({
      status: 'error',
      message: '认证失败，请重新登录',
      error: error.message
    });
  }
};

/**
 * 角色权限验证中间件
 * @param {Array<string>} roles - 允许访问的角色列表
 * @returns {Function} - Express中间件函数
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // 确保用户已通过认证
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'error',
        message: '未认证'
      });
    }
    
    // 检查用户角色是否在允许的角色列表中
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: '权限不足，无法访问该资源'
      });
    }
    
    // 用户有足够的权限，继续下一个中间件
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};