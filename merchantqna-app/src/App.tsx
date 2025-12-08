
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './layouts/Layout'
import ManageLayout from './layouts/ManageLayout'
import Login from './pages/Login/index'
import Register from './pages/Register/index'
import ForgotPassword from './pages/ForgotPassword/index'
import Home from './pages/Home/index'
import Rules from './pages/Rules/index'
import RuleDetail from './pages/Rules/RuleDetail/[id]'
import QA from './pages/QA/index'
import Manage from './pages/Manage/Document/index'
import Dashboard from './pages/Dashboard/index'
import EditPage from './pages/Manage/Edit/index'
import RAGPage from './pages/Manage/rag/index'
import UsersPage from './pages/Manage/users/index'
import DataPage from './pages/Manage/data/index'
import OverviewPage from './pages/Manage/Overview/index'
import { getCurrentUser } from './api/userService'
import './App.css'

function App() {
  // 检查用户是否已登录并获取用户信息
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      // 已有token但没有用户信息时，调用getCurrentUser获取
      if (token && !localStorage.getItem('userInfo')) {
        try {
          const userInfo = (await getCurrentUser()).data.userInfo;
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

  // 首页组件已导入，不再需要内联组件

  return (
    <Router>
      <Routes>
        {/* 不需要Layout的页面 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/manage/edit/:id" element={<EditPage />} />
        <Route path="/qa" element={<QA />} />
        
        {/* 需要Layout的页面 */}
        <Route path="/" element={
          <Layout>
            <Home />
          </Layout>
        } />
        <Route path="/rules" element={
          <Layout>
            <Rules />
          </Layout>
        } />
        <Route path="/rules/:id" element={
          <Layout>
            <RuleDetail />
          </Layout>
        } />
        <Route path="/manage/overview" element={
          <ManageLayout>
            <OverviewPage />
          </ManageLayout>
        } />
        <Route path="/manage/document" element={
          <ManageLayout>
            <Manage />
          </ManageLayout>
        } />
        <Route path="/manage/rag" element={
          <ManageLayout>
            <RAGPage />
          </ManageLayout>
        } />
        <Route path="/manage/users" element={
          <ManageLayout>
            <UsersPage />
          </ManageLayout>
        } />
        <Route path="/manage/data" element={
          <ManageLayout>
            <DataPage />
          </ManageLayout>
        } />
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        {/* 重定向所有未匹配的路由到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
