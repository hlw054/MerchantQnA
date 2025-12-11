/**
 * 消息模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  messageId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    field: 'message_id'
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'chat_id',
    references: {
      model: 'chats',
      key: 'chat_id'
    },
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sendTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'send_time'
  },
  mergedResults: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false,
    field: 'merged_results'
  },
  result: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  timestamps: true,
  tableName: 'messages',
  underscored: true
});

module.exports = Message;