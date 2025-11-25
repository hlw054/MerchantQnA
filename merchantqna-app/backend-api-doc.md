# MerchantQnA 后端API接口文档

## 项目概述

MerchantQnA是一个商家问答系统的后端服务，提供用户注册、登录、邮箱验证等基础功能。本文档详细描述了所有可用的API接口。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **环境变量**: 通过`.env`文件配置
- **API前缀**: 可通过环境变量`API_PREFIX`配置，默认为`/api`

## 认证方式

系统使用JWT (JSON Web Token) 进行身份认证。

- **认证流程**:
  1. 用户登录成功后获取token
  2. 在需要认证的请求头中添加: `Authorization: Bearer {token}`
  3. 受保护的接口会通过`protect`中间件验证token

## API接口列表

### 1. 系统接口

#### 1.1 根路径接口

- **URL**: `/`
- **方法**: `GET`
- **功能**: 获取系统状态信息
- **认证**: 不需要

**成功响应 (200 OK)**: 
```json
{
  "message": "Welcome to MerchantQnA Backend API",
  "status": "running",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### 1.2 健康检查接口

- **URL**: `/api/health`
- **方法**: `GET`
- **功能**: 检查系统健康状态
- **认证**: 不需要

**成功响应 (200 OK)**: 
```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### 2. 用户相关接口

#### 2.1 用户注册

- **URL**: `/api/users/register`
- **方法**: `POST`
- **功能**: 注册新用户账号
- **认证**: 不需要

**请求参数 (JSON)**: 
```json
{
  "account": "string",          // 账号（必填）
  "username": "string",        // 用户名（必填）
  "password": "string",        // 密码（必填）
  "email": "string",           // 邮箱（必填）
  "verificationCode": "string" // 邮箱验证码（必填）
}
```

**成功响应 (201 Created)**: 
```json
{
  "status": "success",
  "message": "注册成功",
  "data": {
    "user": {
      "id": "number",
      "account": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "createdAt": "datetime"
    }
  }
}
```

**错误响应**:
- `400 Bad Request`: 所有字段都是必填的 / 验证码不存在或已过期 / 验证码不正确 / 账号或邮箱已被注册
- `500 Internal Server Error`: 注册失败，请稍后重试

#### 2.2 用户登录

- **URL**: `/api/users/login`
- **方法**: `POST`
- **功能**: 用户登录获取token
- **认证**: 不需要

**请求参数 (JSON)**: 
```json
{
  "identifier": "string",  // 账号或邮箱（必填）
  "password": "string"     // 密码（必填）
}
```

**成功响应 (200 OK)**: 
```json
{
  "status": "success",
  "message": "登录成功",
  "data": {
    "token": "string",      // JWT token
    "user": {
      "id": "number",
      "account": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "createdAt": "datetime"
    }
  }
}
```

**错误响应**:
- `400 Bad Request`: 账号/邮箱和密码都是必填的
- `401 Unauthorized`: 账号/邮箱或密码错误
- `500 Internal Server Error`: 登录失败，请稍后重试

#### 2.3 发送邮箱验证码

- **URL**: `/api/users/verify-email`
- **方法**: `POST`
- **功能**: 发送邮箱验证码（用于注册）
- **认证**: 不需要

**请求参数 (JSON)**: 
```json
{
  "email": "string"  // 邮箱地址（必填）
}
```

**成功响应 (200 OK)**: 
```json
{
  "status": "success",
  "message": "验证码已发送，请查收邮件",
  "data": {
    "email": "string",
    "expiryInMinutes": 5  // 验证码有效期（分钟）
  }
}
```

**错误响应**:
- `400 Bad Request`: 邮箱地址是必填的 / 该邮箱已被注册
- `500 Internal Server Error`: 发送验证码失败，请稍后重试

#### 2.4 获取当前用户信息

- **URL**: `/api/users/me`
- **方法**: `GET`
- **功能**: 获取当前登录用户的信息
- **认证**: 需要（JWT token）

**请求头**: 
```
Authorization: Bearer {token}
```

**成功响应 (200 OK)**: 
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "number",
      "account": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "createdAt": "datetime"
      // 注意：不返回密码字段
    }
  }
}
```

**错误响应**:
- `401 Unauthorized`: 未提供有效认证信息
- `404 Not Found`: 用户不存在
- `500 Internal Server Error`: 获取用户信息失败，请稍后重试

## 错误码说明

| 状态码 | 描述 | 常见原因 |
|--------|------|----------|
| 400 | 请求参数错误 | 缺少必填字段、验证码错误或过期 |
| 401 | 未授权 | token无效或过期、账号密码错误 |
| 404 | 资源不存在 | 用户不存在、接口路径错误 |
| 500 | 服务器内部错误 | 数据库连接问题、服务异常 |

## 注意事项

1. 所有需要认证的接口必须在请求头中包含有效的JWT token
2. 邮箱验证码有效期为5分钟，过期后需要重新获取
3. 密码在服务器端会自动进行加密处理，确保安全性
4. 接口返回的用户信息中不包含敏感字段（如密码）

---

**文档生成时间**: 2023-01-01 00:00:00
**版本**: 1.0.0