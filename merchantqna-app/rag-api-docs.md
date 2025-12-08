# RAG 向量库管理接口文档

## 1. 将知识文档加入RAG向量库

### 接口描述
将指定的知识文档加入RAG向量库，使其可以被用于问答系统的上下文检索。

### 请求URL
`POST /api/knowledge/{id}/add-to-rag`

### 请求方法
`POST`

### 认证方式
Bearer Token (JWT)

### 请求参数

#### 路径参数
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| id | string | 是 | 知识文档ID |

#### 请求体
无

### 返回结果

#### 成功响应
```json
{
  "status": "success",
  "message": "知识文档成功加入RAG向量库"
}
```

#### 已存在响应
```json
{
  "status": "success",
  "message": "该文档已加入RAG向量库"
}
```

#### 错误响应
```json
{
  "status": "error",
  "message": "错误信息"
}
```

### 错误码说明
| 状态码 | 错误信息 | 描述 |
| ------ | ------- | ---- |
| 400 | 只有状态为"生效中"的文档才能加入RAG向量库 | 文档状态不符合要求 |
| 404 | 知识文档不存在 | 找不到指定ID的文档 |
| 500 | 将知识文档加入RAG向量库失败，请稍后重试 | 服务器内部错误 |

### 功能说明
1. 验证文档是否存在
2. 验证文档状态是否为"生效中"
3. 检查文档是否已加入RAG向量库
4. 先删除该文档的旧向量（如果存在）
5. 将文档内容分块并生成向量，导入到向量库
6. 更新文档的isAddedToRAG状态为true

## 2. 将知识文档从RAG向量库中删除

### 接口描述
将指定的知识文档从RAG向量库中删除，使其不再被用于问答系统的上下文检索。

### 请求URL
`POST /api/knowledge/{id}/remove-from-rag`

### 请求方法
`POST`

### 认证方式
Bearer Token (JWT)

### 请求参数

#### 路径参数
| 参数名 | 类型 | 必填 | 描述 |
| ------ | ---- | ---- | ---- |
| id | string | 是 | 知识文档ID |

#### 请求体
无

### 返回结果

#### 成功响应
```json
{
  "status": "success",
  "message": "知识文档成功从RAG向量库中删除"
}
```

#### 未存在响应
```json
{
  "status": "success",
  "message": "该文档未加入RAG向量库"
}
```

#### 错误响应
```json
{
  "status": "error",
  "message": "错误信息"
}
```

### 错误码说明
| 状态码 | 错误信息 | 描述 |
| ------ | ------- | ---- |
| 404 | 知识文档不存在 | 找不到指定ID的文档 |
| 500 | 将知识文档从RAG向量库中删除失败，请稍后重试 | 服务器内部错误 |

### 功能说明
1. 验证文档是否存在
2. 检查文档是否已加入RAG向量库
3. 从向量库中删除该文档的所有向量数据
4. 更新文档的isAddedToRAG状态为false

## 3. 接口调用示例

### 加入RAG向量库示例

```bash
curl -X POST "http://localhost:3000/api/knowledge/12345/add-to-rag" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

### 从RAG向量库中删除示例

```bash
curl -X POST "http://localhost:3000/api/knowledge/12345/remove-from-rag" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. 注意事项

1. 只有状态为"生效中"的文档才能加入RAG向量库
2. 文档加入RAG向量库前会先删除该文档的旧向量，避免数据重复
3. 文档从RAG向量库中删除后，不会从数据库中删除原文档
4. 接口需要身份认证，请确保请求头中包含有效的Bearer Token
5. 操作成功后，文档的isAddedToRAG字段会相应更新