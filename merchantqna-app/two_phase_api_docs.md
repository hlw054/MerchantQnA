# 两阶段聊天查询API文档

## 1. 第一阶段：执行检索接口

### 接口路径
`POST /api/chat/query/phase1`

### 功能描述
执行聊天查询的第一阶段，完成关键词提取、查询优化和向量检索，返回合并后的检索结果。

### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 | 示例 |
|-------|------|---------|------|------|
| query | string | 是 | 用户原始查询内容 | "如何注册商家账号？" |
| chatId | string | 是 | 聊天会话ID | "550e8400-e29b-41d4-a716-446655440000" |

### 响应格式
```json
{
  "status": "success",
  "data": {
    "optimizedQuery": "商家账号注册流程及要求",
    "mergedResults": [
      {
        "knowledgeId": "123456",
        "content": "商家账号注册需要提供营业执照、身份证等资料...",
        "metadata": {
          "path": "documents/registration.md"
        },
        "relevanceScore": 0.95,
        "source": "similarity"
      },
      // 更多检索结果...
    ],
    "sources": [
      {
        "knowledgeId": "123456",
        "title": "商家注册指南",
        "path": "documents/registration.md"
      }
    ]
  }
}
```

## 2. 第二阶段：生成回答接口

### 接口路径
`POST /api/chat/query/phase2`

### 功能描述
执行聊天查询的第二阶段，基于第一阶段返回的检索结果构建RAG提示词，并通过流式输出返回LLM生成的回答。

### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 | 示例 |
|-------|------|---------|------|------|
| query | string | 是 | 用户原始查询内容 | "如何注册商家账号？" |
| history | array | 否 | 对话历史 | `[{"role":"user","content":"你好"}, {"role":"assistant","content":"您好！"}]` |
| chatId | string | 是 | 聊天会话ID | "550e8400-e29b-41d4-a716-446655440000" |
| optimizedQuery | string | 是 | 第一阶段返回的优化查询语句 | "商家账号注册流程及要求" |
| mergedResults | array | 是 | 第一阶段返回的合并检索结果 | 见第一阶段响应示例 |

### 响应格式
采用SSE（Server-Sent Events）流式响应格式，每个数据块为JSON格式：

#### 数据块响应
```
data: {"type":"chunk","content":"商家账号注册需要准备以下资料"}

```

#### 完成响应
```
data: {"type":"complete","success":true,"content":"商家账号注册需要准备营业执照、身份证等资料...","sources":[{"knowledgeId":"123456","title":"商家注册指南","path":"documents/registration.md"}]}

```

#### 错误响应
```
data: {"type":"error","content":"处理查询时发生错误"}

```

## 调用示例流程

### 第一步：调用第一阶段接口获取检索结果
```bash
curl -X POST http://localhost:3000/api/chat/query/phase1 \
  -H "Content-Type: application/json" \
  -d '{"query":"如何注册商家账号？","chatId":"test-chat-123"}'
```

### 第二步：使用第一阶段结果调用第二阶段接口
```bash
curl -X POST http://localhost:3000/api/chat/query/phase2 \
  -H "Content-Type: application/json" \
  -d '{"query":"如何注册商家账号？","chatId":"test-chat-123","history":[],"optimizedQuery":"商家账号注册流程及要求","mergedResults":[...]}'
```

## 注意事项

1. 两个接口必须按顺序调用，第二阶段接口依赖第一阶段的返回结果
2. 第二阶段接口采用流式响应，客户端需要支持SSE协议
3. 每次调用需要使用相同的chatId以保持会话一致性
4. 第一阶段的检索结果有一定的时效性，建议在获取后立即调用第二阶段接口