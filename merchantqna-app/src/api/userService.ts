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

// 获取用户列表接口
export const getUsers = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await request.get('/users', {
      params: {
        page,
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
};

// 修改用户角色接口
export const updateUserRole = async (userId: number, role: string) => {
  try {
    const response = await request.patch('/users/role', {
      userId,
      role
    });
    return response.data;
  } catch (error) {
    console.error('修改用户角色失败:', error);
    throw error;
  }
};
