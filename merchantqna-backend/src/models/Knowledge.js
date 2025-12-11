/**
 * 知识文档模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Knowledge = sequelize.define('Knowledge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  primaryTag: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  secondaryTag: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  publishTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('生效中', '已失效', '未完成'),
    defaultValue: '未完成',
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isAddedToRAG: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'knowledge'
});

module.exports = Knowledge;
