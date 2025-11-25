/**
 * 模型管理文件
 * 导入和初始化所有数据库模型
 */
const { sequelize } = require('../config/database');

// 导入所有模型
const User = require('./User');

// 定义模型之间的关联关系
const setupAssociations = () => {
  // 在这里定义模型之间的关系
  // 例如: User.hasMany(Post);
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
  User
};