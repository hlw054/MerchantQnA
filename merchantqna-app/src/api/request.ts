import axios from 'axios';

export const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    timeout: 5000,
    withCredentials: true,
});

// 添加请求拦截器，携带token
request.interceptors.request.use(
    (config) => {
        // 从localStorage获取token
        const token = localStorage.getItem('token');
        if (token) {
            // 设置请求头
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 添加响应拦截器
request.interceptors.response.use(
    (res) => res,
    (err) => {
        // 处理token过期或认证失败的情况（通常是401错误）
        if (err.response && err.response.status === 401) {
            // 清除token和用户信息
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            
            // 显示错误消息
            console.error('认证失败，请重新登录');
            
            // 跳转到登录页面
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);