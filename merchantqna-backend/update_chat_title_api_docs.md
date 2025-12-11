# 通过chatId修改chatTitle接口文档

## 1. 接口概述

本接口用于通过聊天ID（chatId）修改聊天标题（chatTitle）。

## 2. 接口详情

### 2.1 请求信息

- **URL**: `/api/chat/{chatId}/title`
- **HTTP方法**: `PUT`
- **认证**: 需通过身份验证（根据系统整体认证机制）

### 2.2 请求参数

| 参数名 | 位置 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|------|
| chatId | Path | String | 是 | 聊天ID | 550e8400-e29b-41d4-a716-446655440000 |
| chatTitle | Body | String | 是 | 新的聊天标题 | 如何注册商家账号？ |

### 2.3 请求体示例

```json
{
  "chatTitle": "如何注册商家账号？"
}
```

### 2.4 响应信息

#### 2.4.1 成功响应

- **HTTP状态码**: `200 OK`
- **响应格式**: `application/json`
- **响应体示例**:

```json
{
  "status": "success",
  "data": {
    "chat": {
      "chatId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "chatTitle": "如何注册商家账号？",
      "createdAt": "2023-05-15T10:30:00.000Z",
      "updatedAt": "2023-05-15T11:00:00.000Z"
    }
  }
}
```

#### 2.4.2 失败响应

| HTTP状态码 | 错误码 | 描述 | 示例响应 |
|------------|--------|------|----------|
| 400 Bad Request | - | chatId不能为空 | `{"status":"error","message":"chatId不能为空"}` |
| 400 Bad Request | - | chatTitle不能为空 | `{"status":"error","message":"chatTitle不能为空"}` |
| 404 Not Found | - | Chat不存在或已删除 | `{"status":"error","message":"Chat不存在或已删除"}` |
| 500 Internal Server Error | - | 修改Chat标题失败，请稍后重试 | `{"status":"error","message":"修改Chat标题失败，请稍后重试"}` |

## 3. 业务逻辑

1. 验证chatId参数是否存在且为字符串类型
2. 验证chatTitle参数是否存在、为字符串类型且不为空
3. 尝试更新对应chatId的聊天标题
4. 检查是否成功找到并更新了聊天记录
5. 获取更新后的聊天信息并返回

## 4. 代码实现

### 4.1 控制器实现 (chatController.js)

```javascript
/**
 * 通过chatId修改chatTitle
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const updateChatTitle = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { chatTitle } = req.body;
    
    // 验证参数
    if (!chatId || typeof chatId !== 'string') {
      return next(new AppError(400, 'chatId不能为空'));
    }
    
    if (!chatTitle || typeof chatTitle !== 'string' || chatTitle.trim() === '') {
      return next(new AppError(400, 'chatTitle不能为空'));
    }
    
    // 更新chatTitle
    const result = await Chat.update(
      { chatTitle: chatTitle.trim() },
      { where: { chatId: chatId } }
    );
    
    // 检查是否找到并更新了Chat
    if (result[0] === 0) {
      return next(new AppError(404, 'Chat不存在或已删除'));
    }
    
    // 获取更新后的Chat信息
    const updatedChat = await Chat.findByPk(chatId);
    
    res.status(200).json({
      status: 'success',
      data: {
        chat: updatedChat
      }
    });
  } catch (error) {
    console.error('修改Chat标题失败:', error);
    return next(new AppError(500, '修改Chat标题失败，请稍后重试'));
  }
};
```

### 4.2 路由配置 (chatRoutes.js)

```javascript
/**
 * @swagger
 * /api/chat/{chatId}/title: 
 *   put:
 *     summary: 通过chatId修改chatTitle
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         description: 聊天ID
 *         schema:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatTitle:
 *                 type: string
 *                 description: 新的聊天标题
 *                 example: "如何注册商家账号？"
 *     responses:
 *       200: 
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       type: object
 *                       properties:
 *                         chatId:
 *                           type: string
 *                         chatTitle:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *       400: 
 *         description: 请求参数错误
 *       404: 
 *         description: 聊天不存在
 *       500: 
 *         description: 服务器内部错误
 */
router.put('/:chatId/title', chatController.updateChatTitle);
```

## 5. 错误处理

接口会对以下情况进行错误处理：

1. **chatId为空或类型错误**: 返回400错误，提示"chatId不能为空"
2. **chatTitle为空、类型错误或空白字符串**: 返回400错误，提示"chatTitle不能为空"
3. **未找到对应chatId的聊天记录**: 返回404错误，提示"Chat不存在或已删除"
4. **数据库操作失败**: 返回500错误，提示"修改Chat标题失败，请稍后重试"

## 6. 注意事项

1. 确保请求中的chatId参数格式正确
2. chatTitle不能为空或仅包含空白字符
3. 接口会自动去除chatTitle两端的空白字符
4. 更新成功后会返回完整的聊天信息，包括更新后的标题和更新时间

## 7. 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 1.0 | 2023-05-15 | 初始版本 | 系统开发团队 |
