/**
 * 模型管理文件
 * 导入和初始化所有数据库模型
 */
const { sequelize } = require('../config/database');

// 导入所有模型
const User = require('./User');
const Knowledge = require('./Knowledge');
const Chat = require('./Chat');
const Message = require('./Message');
const Label = require('./Label');

// 定义模型之间的关联关系
const setupAssociations = () => {
  // 用户与聊天会话：一对多
  User.hasMany(Chat, {
    foreignKey: 'userId',
    as: 'chats'
  });
  Chat.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // 聊天会话与消息：一对多
  Chat.hasMany(Message, {
    foreignKey: 'chatId',
    as: 'messages'
  });
  Message.belongsTo(Chat, {
    foreignKey: 'chatId',
    as: 'chat'
  });
};

// 初始化数据库
const initializeDatabase = async () => {
  try {
    // 同步模型到数据库
    await sequelize.sync({ alter: true }); // 使用alter而不是force，避免数据丢失
    console.log('数据库同步完成');
    
    // 设置模型关联
    setupAssociations();
    
    return { success: true };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sequelize,
  initializeDatabase,
  // 导出模型
  User,
  Knowledge,
  Chat,
  Message,
  Label
};