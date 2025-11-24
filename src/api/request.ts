import axios from 'axios';

export const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    timeout: 5000,
});

// 添加拦截器可选
request.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(err)
);