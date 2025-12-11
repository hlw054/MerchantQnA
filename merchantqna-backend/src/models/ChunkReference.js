/**
 * 分块引用模型
 * 用于存储分块被引用的次数
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChunkReference = sequelize.define('ChunkReference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  chunkId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    },
    comment: '分块ID'
  },
  knowledgeId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属知识文档ID'
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    },
    comment: '分块路径'
  },
  referenceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '引用次数'
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
  tableName: 'chunk_references'
});

module.exports = ChunkReference;