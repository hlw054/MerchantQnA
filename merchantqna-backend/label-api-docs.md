# 标签API文档

## 1. 新增一级标签

### API路径
`POST /api/label/primary`

### 请求参数
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | 是 | 标签名称 |

### 请求示例
```json
{
  "name": "商家入驻"
}
```

### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "d1c3d5e7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
    "name": "商家入驻",
    "parentId": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "一级标签创建成功"
}
```

## 2. 新增二级标签

### API路径
`POST /api/label/secondary`

### 请求参数
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | 是 | 标签名称 |
| parentId | string | 是 | 一级标签ID |

### 请求示例
```json
{
  "name": "入驻与退出",
  "parentId": "d1c3d5e7-1a2b-3c4d-5e6f-7g8h9i0j1k2l"
}
```

### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    "name": "入驻与退出",
    "parentId": "d1c3d5e7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "二级标签创建成功"
}
```

## 3. 获取所有标签

### API路径
`GET /api/label`

### 请求参数
无

### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "id": "d1c3d5e7-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
      "name": "商家入驻",
      "subcategories": [
        {
          "id": "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
          "name": "入驻与退出"
        },
        {
          "id": "b2c3d4e5-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
          "name": "保险金管理"
        }
      ]
    },
    {
      "id": "e3f4g5h6-7i8j-9k0l-1m2n-3o4p5q6r7s8t",
      "name": "商品管理",
      "subcategories": [
        {
          "id": "c3d4e5f6-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
          "name": "商品发布"
        },
        {
          "id": "d4e5f6g7-8h9i-0j1k-2l3m-4n5o6p7q8r9s",
          "name": "商品列表"
        }
      ]
    }
  ],
  "message": "获取标签列表成功"
}
```

## 4. 删除一级标签

### API路径
`DELETE /api/label/primary/{id}`

### 请求参数
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 一级标签ID（路径参数） |

### 响应示例
```json
{
  "success": true,
  "message": "一级标签及对应的二级标签删除成功"
}
```

## 5. 删除二级标签

### API路径
`DELETE /api/label/secondary/{id}`

### 请求参数
| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string | 是 | 二级标签ID（路径参数） |

### 响应示例
```json
{
  "success": true,
  "message": "二级标签删除成功"
}
```

## 通用响应格式
所有API响应都遵循以下格式：

```json
{
  "success": true/false,  // 操作是否成功
  "data": object/array,   // 返回的数据（可选）
  "message": "描述信息"   // 操作结果描述
}
```