import React from 'react';
import { Layout, Typography, Avatar } from '@arco-design/web-react';
import { Link } from 'react-router-dom';

const { Header: ArcoHeader } = Layout;
const { Title } = Typography;

const Header: React.FC = () => {
  // 从localStorage获取用户信息和角色
  const getUserInfo = () => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
    return null;
  };

  const hasToken = localStorage.getItem('token');
  const userInfo = hasToken ? getUserInfo() : null;
  const isRoot = userInfo?.role === 'root';
  
  // 获取显示名称：优先使用用户名，若无则使用账号名
  const displayName = userInfo?.username || userInfo?.account || '';

  // 导航菜单项
  const navItems = [
    { key: 'home', label: '首页', path: '/' },
    { key: 'rules', label: '规则中心', path: '/rules' },
    { key: 'qa', label: '智能问答', path: '/qa' },
    { key: 'manage', label: '规则管理', path: '/manage', show: isRoot },
    { key: 'dashboard', label: '智慧大屏', path: '/dashboard', show: isRoot },
  ];

  return (
    <ArcoHeader style={{ backgroundColor: '#fff', padding: '0 15%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        {/* 左侧Logo和标题 */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          {/* 简单的Logo图标，实际项目中可以替换为SVG图标 */}
          <div style={{ 
            width: 32, 
            height: 32, 
            backgroundColor: '#1890ff', 
            borderRadius: '4px', 
            marginRight: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            智
          </div>
          <Title heading={4} style={{ color: '#1890ff', margin: 0 }}>
            商家知识平台
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
              & 智能问答机器人
            </span>
          </Title>
        </Link>

        {/* 中间导航菜单 */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {navItems
            .filter(item => item.show !== false)
            .map(item => (
              <Link
                key={item.key}
                to={item.path}
                style={{
                  color: '#333',
                  textDecoration: 'none',
                  fontSize: '14px',
                  padding: '8px 0',
                  position: 'relative'
                }}
                className="nav-link"
              >
                {item.label}
              </Link>
            ))}
        </div>

        {/* 右侧登录状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasToken && userInfo ? (
            // 已登录状态
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar 
                style={{ backgroundColor: '#1890ff', width: 32, height: 32 }} 
                size={32}
              >
                {displayName.charAt(0)?.toUpperCase() || '用'}
              </Avatar>
              <span style={{ color: '#333', fontSize: '14px' }}>{displayName}</span>
            </div>
          ) : (
            // 未登录状态
            <Link to="/login" style={{ color: '#1890ff', textDecoration: 'none', fontSize: '14px' }}>
              立即登录
            </Link>
          )}
        </div>
      </div>
    </ArcoHeader>
  );
};

export default Header;