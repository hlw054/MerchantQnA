/**
 * 聊天控制器
 * 处理用户查询并返回流式响应
 */
const { AppError } = require('../middlewares/errorHandler');
const { ragQuery, generateChatTitle } = require('../services/ragChainService');
const { Chat, Message, sequelize } = require('../models');
const { Op } = require('sequelize');

// 生成唯一请求ID
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 处理用户聊天查询，返回流式响应
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const handleChatQuery = async (req, res, next) => {
  // 生成请求ID用于日志跟踪
  const requestId = generateRequestId();
  console.log(`[${requestId}] 开始处理聊天请求`);
  
  // 初始化事务和消息记录
  let transaction = null;
  let userMessage = null;
  let assistantMessage = null;
  let transactionCommitted = false; // 跟踪事务是否已提交
  
  try {
    const { query, history = [], chatId } = req.body;
    
    // 验证请求参数
    if (!query || typeof query !== 'string') {
      console.warn(`[${requestId}] 参数验证失败: 查询内容为空或格式错误`);
      return next(new AppError(400, '查询内容不能为空'));
    }
    
    // 验证chatId
    if (!chatId || typeof chatId !== 'string') {
      console.warn(`[${requestId}] 参数验证失败: chatId为空或格式错误`);
      return next(new AppError(400, 'chatId不能为空'));
    }
    
    // 开始数据库事务
    transaction = await sequelize.transaction();
    
    // 创建用户消息记录
    userMessage = await Message.create({
      chatId: chatId,
      role: 'user',
      content: query,
      sendTime: new Date()
    }, { transaction });
    
    console.log(`[${requestId}] 创建用户消息记录: ${userMessage.messageId}`);
    
    // 记录请求信息（避免记录过长的query内容）
    const safeQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
    console.log(`[${requestId}] 处理查询: ${safeQuery}`);
    
    // 设置响应头，支持SSE流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 设置请求超时处理
    const timeoutId = setTimeout(() => {
      console.error(`[${requestId}] 请求处理超时`);
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', content: '请求处理超时' })}

`);
        res.end();
      }
      // 超时回滚事务（仅当事务存在且未提交时）
      if (transaction && !transactionCommitted) {
        try {
          transaction.rollback();
          console.log(`[${requestId}] 事务已回滚`);
        } catch (rollbackError) {
          // 忽略已经完成的事务回滚错误
          console.log(`[${requestId}] 事务回滚失败（可能已完成）:`, rollbackError.message);
        }
      }
    }, 60000); // 60秒超时
    
    // 清理函数
    const cleanup = (errorOccurred = false) => {
      clearTimeout(timeoutId);
      // 如果发生错误且事务存在且未提交，回滚事务
      if (errorOccurred && transaction && !transactionCommitted) {
        try {
          transaction.rollback();
          console.log(`[${requestId}] 事务已回滚`);
        } catch (rollbackError) {
          // 忽略已经完成的事务回滚错误
          console.log(`[${requestId}] 事务回滚失败（可能已完成）:`, rollbackError.message);
        }
      }
    };
    
    // 监听连接关闭事件
    res.on('close', () => {
      console.log(`[${requestId}] 客户端连接关闭`);
      // 连接关闭时回滚事务
      cleanup(true);
    });
    
    // 定义流式输出回调函数
    const onChunk = (chunk) => {
      try {
        // 使用SSE格式发送数据
        console.log(`[${requestId}] 发送数据块: ${chunk}`);
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      } catch (writeError) {
        console.error(`[${requestId}] 写入响应数据失败:`, writeError);
      }
    };
    
    // 调用ragQuery函数处理查询
    const result = await ragQuery(query, history, onChunk);
    console.log(`[${requestId}] ragQuery 结果:`, result);
    
    // 创建助手消息记录
    assistantMessage = await Message.create({
      chatId: chatId,
      role: 'assistant',
      content: result.response,
      sendTime: new Date()
    }, { transaction });
    
    console.log(`[${requestId}] 创建助手消息记录: ${assistantMessage.messageId}`);
    
    // 提交事务
    await transaction.commit();
    transactionCommitted = true; // 标记事务已提交
    console.log(`[${requestId}] 事务已提交`);
    
    // 清理超时定时器
    cleanup();
    
    // 发送最终结果
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      success: result.success, 
      content: result.response, 
      sources: result.sources 
    })}`);
    res.end();
    
    console.log(`[${requestId}] 请求处理完成，响应长度: ${result.response?.length || 0}`);
    
  } catch (error) {
    // 清理资源并回滚事务
    cleanup(true);
    
    // 区分错误类型进行日志记录
    console.error(`[${requestId}] 处理聊天查询失败:`, error);
    
    // 检查响应是否已开始
    if (res.headersSent) {
      try {
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          content: process.env.NODE_ENV === 'production' ? '处理查询时发生错误' : error.message 
        })}`);
        res.end();
      } catch (writeError) {
        console.error(`[${requestId}] 错误响应发送失败:`, writeError);
      }
    } else {
      // 根据错误类型返回不同状态码
      if (error.message?.includes('参数') || error.message?.includes('空')) {
        return next(new AppError(400, error.message));
      }
      return next(new AppError(500, '处理查询失败，请稍后重试'));
    }
  }
};



/**
 * 通过用户查询生成标题并创建Chat
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const createChatWithTitle = async (req, res, next) => {
  try {
    const { query, userId } = req.body;
    
    // 验证参数
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return next(new AppError(400, '查询内容不能为空'));
    }
    
    if (!userId || typeof userId !== 'string') {
      return next(new AppError(400, 'userId不能为空'));
    }
    
    // 生成聊天标题
    const title = await generateChatTitle(query);
    
    // 创建Chat实体
    const chat = await Chat.create({
      userId: userId,
      chatTitle: title
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        chat: chat
      }
    });
  } catch (error) {
    console.error('创建Chat失败:', error);
    return next(new AppError(500, '创建Chat失败，请稍后重试'));
  }
};

/**
 * 通过ChatId删除Chat及关联的Message
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const deleteChatById = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    // 验证参数
    if (!chatId || typeof chatId !== 'string') {
      return next(new AppError(400, 'chatId不能为空'));
    }
    
    // 删除Chat（由于级联删除配置，关联的Message会自动删除）
    const result = await Chat.destroy({
      where: { chatId: chatId }
    });
    
    // 检查是否找到并删除了Chat
    if (result === 0) {
      return next(new AppError(404, 'Chat不存在或已删除'));
    }
    
    res.status(200).json({
      data:{
        status: 'success',
        message: '已成功删除'
      }
    });
  } catch (error) {
    console.error('删除Chat失败:', error);
    return next(new AppError(500, '删除Chat失败，请稍后重试'));
  }
};

/**
 * 通过userId获取Chat列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getChatListByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // 验证参数
    if (!userId) {
      return next(new AppError(400, '用户ID不能为空'));
    }
    
    // 查询用户的所有聊天会话
    const chats = await Chat.findAll({
      where: {
        userId: userId
      },
      attributes: ['chatId', 'chatTitle', 'createdAt'],
      order: [['createdAt', 'DESC']] // 按创建时间倒序
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        chats: chats
      }
    });
  } catch (error) {
    console.error('获取聊天列表失败:', error);
    return next(new AppError(500, '获取聊天列表失败，请稍后重试'));
  }
};

/**
 * 通过ChatId获取Message列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getMessagesByChatId = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    // 验证参数
    if (!chatId) {
      return next(new AppError(400, '聊天ID不能为空'));
    }
    
    // 查询聊天会话的所有消息
    const messages = await Message.findAll({
      where: {
        chatId: chatId
      },
      attributes: ['messageId', 'chatId', 'role', 'content', 'sendTime'],
      order: [['sendTime', 'ASC']] // 按发送时间正序
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        messages: messages
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return next(new AppError(500, '获取消息列表失败，请稍后重试'));
  }
};

module.exports = {
  handleChatQuery,
  getChatListByUserId,
  getMessagesByChatId,
  createChatWithTitle,
  deleteChatById
};