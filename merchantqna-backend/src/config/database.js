/**
 * 数据库配置文件
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库连接配置
const sequelize = new Sequelize(
  'merchantqna', // 数据库名称
  'postgres', // 用户名
  'HLW3812oo16!', // 密码
  {
    host: '47.102.20.117', // 主机地址
    port: 5432, // 端口
    dialect: 'postgres', // 数据库类型
    dialectOptions: {
      ssl: false // 根据需要配置SSL
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};