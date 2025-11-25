/**
 * 错误处理中间件
 * 统一处理应用中的错误
 */

// 自定义错误类
class AppError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational; // 业务错误标记
    Error.captureStackTrace(this, this.constructor);
  }
}

// 开发环境错误处理
const devErrorHandler = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// 生产环境错误处理
const prodErrorHandler = (err, res) => {
  // 只响应可操作的错误
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  
  // 记录不可操作的错误
  console.error('错误:', err);
  
  // 返回通用错误消息
  res.status(500).json({
    status: 'error',
    message: '服务器发生了一些错误'
  });
};

// 处理不同类型的错误
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    devErrorHandler(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // 复制错误对象，避免修改原始错误
    let error = { ...err };
    error.message = err.message;
    
    // 处理特定类型的错误
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    
    prodErrorHandler(error, res);
  }
};

// 数据库相关错误处理辅助函数
const handleCastErrorDB = (err) => {
  const message = `无效的 ${err.path}: ${err.value}。`;
  return new AppError(400, message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(['"])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `重复字段值 ${value}，请使用另一个值。`;
  return new AppError(400, message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `输入数据无效: ${errors.join('. ')}`;
  return new AppError(400, message);
};

module.exports = {
  globalErrorHandler,
  AppError
};