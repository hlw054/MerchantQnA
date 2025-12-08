import { request } from './request';

// 用户登录接口
export const loginUser = async (identifier: string, password: string) => {
  try {
    const response = await request.post('/users/login', {
      identifier,
      password
    });
    return response.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 用户注册接口
export const registerUser = async (account: string, username: string, password: string, email: string, verificationCode: string) => {
  try {
    const response = await request.post('/users/register', {
      account,
      username,
      password,
      email,
      verificationCode
    });
    return response.data;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

// 发送邮箱验证码接口
export const sendVerificationCode = async (email: string) => {
  try {
    const response = await request.post('/users/verify-email', {
      email
    });
    return response.data;
  } catch (error) {
    console.error('发送验证码失败:', error);
    throw error;
  }
};

// 获取当前用户信息接口
export const getCurrentUser = async () => {
  try {
    const response = await request.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};
