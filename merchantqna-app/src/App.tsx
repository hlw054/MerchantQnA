
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './layouts/Layout'
import Login from './pages/Login/index'
import Register from './pages/Register/index'
import ForgotPassword from './pages/ForgotPassword/index'
import { getCurrentUser } from './api/userService'
import './App.css'

function App() {
  // 检查用户是否已登录并获取用户信息
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      // 已有token但没有用户信息时，调用getCurrentUser获取
      if (token) {
        try {
          const userInfo = await getCurrentUser();
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } catch (error) {
          console.error('验证登录状态失败:', error);
          // 处理token过期情况，清除存储的token信息
          // 注意：响应拦截器已经处理了跳转逻辑，这里只做额外清理
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
        }
      }
    };
    
    checkLoginStatus();
  }, []);

  // 首页内容（暂时作为占位）
  const HomePage = () => {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <h2>商家知识管理系统</h2>
        <p style={{ marginTop: '16px', color: '#666' }}>请先登录或注册以使用系统功能</p>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* 不需要Layout的页面 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* 需要Layout的页面 */}
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        
        {/* 重定向所有未匹配的路由到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
