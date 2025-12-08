/**
 * 标签模型
 * 支持一级标签和二级标签，通过自关联实现
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Label = sequelize.define('Label', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    field: 'id'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'name',
    comment: '标签名称'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_id',
    references: {
      model: 'labels',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: '父标签ID，null表示一级标签'
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
  tableName: 'labels',
  underscored: true,
  indexes: [
    {
      name: 'idx_parent_id',
      fields: ['parent_id']
    }
  ]
});

// 自关联：标签可以有子标签
Label.hasMany(Label, {
  foreignKey: 'parentId',
  as: 'subcategories'
});
Label.belongsTo(Label, {
  foreignKey: 'parentId',
  as: 'parent'
});

module.exports = Label;