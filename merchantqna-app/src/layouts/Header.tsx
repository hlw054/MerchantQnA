import React from 'react';
import { Layout, Avatar } from '@arco-design/web-react';
import { IconTiktokColor, IconUser, IconCloseCircle } from '@arco-design/web-react/icon';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/layouts.module.css';

const { Header: ArcoHeader } = Layout;

const Header: React.FC = () => {
  // 获取当前路由
  const location = useLocation();
  // 注意：已将下拉菜单从点击显示改为hover显示，不再需要状态控制
  // 从localStorage获取用户信息和角色
  const getUserInfo = () => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        console.log('userInfoStr:', userInfoStr);
        return JSON.parse(userInfoStr);
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
    return null;
  };

  const hasToken = localStorage.getItem('token');
  const userInfo = hasToken ? getUserInfo() : null;
  const isRoot = userInfo?.role === 'admin';
  // 获取显示名称：优先使用用户名，若无则使用账号名
  const displayName = userInfo?.account || '';
  
  // 退出登录函数
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    // 刷新页面以更新状态
    window.location.reload();
  };
  
  // 注意：已将下拉菜单从点击显示改为hover显示，不再需要点击事件处理

  // 导航菜单项
  const navItems = [
    { key: 'home', label: '首页', path: '/' },
    { key: 'rules', label: '知识中心', path: '/rules' },
    { key: 'qa', label: '智能问答', path: '/qa' },
    { key: 'manage', label: '进入管理端', path: '/manage/overview', show: isRoot },
  ];

  return (
    <ArcoHeader className={styles.header} style={{ padding: '0' }}>
      <div className={styles['header-container']}>
        {/* 左侧Logo和导航菜单 */}
        <div className={styles['logo-nav-container']}>
          {/* Logo和标题 */}
          <Link to="/" className={styles['logo-link']}>
            {/* TikTok图标 */}
            <div className={styles['logo-icon']}>
              <IconTiktokColor />
            </div>
            <div className={styles['title-container']}>
              <div className={styles['main-title']}>
                商家知识平台
              </div>
            </div>
          </Link>

          {/* 导航菜单 */}
          <div className={styles['nav-container']}>
            {navItems
              .filter(item => item.show !== false)
              .map(item => (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`${styles['nav-link']} ${item.key === 'rules' && location.pathname.startsWith('/rules') ? styles['active'] : location.pathname === item.path ? styles['active'] : ''}`}
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>

        {/* 右侧登录状态 */}
        <div className={styles['login-container']}>
          {hasToken && userInfo ? (
            // 已登录状态 - 带下拉菜单
            <div className={`${styles['user-avatar-container']} user-avatar-container`}>
              <Avatar 
                className={styles['user-avatar']}
                size={32}
              >
                <IconUser style={{ fontSize: '18px' }}/>
              </Avatar>
              <div className={styles['user-name']}>
                {displayName}
              </div>
              <div className={styles['dropdown-menu']}>
                <div className={styles['dropdown-item']} onClick={handleLogout}>
                  <IconCloseCircle  style={{ marginRight: '8px', fontSize: '14px' }}/>
                  退出登录
                </div>
              </div>
            </div>
          ) : (
            //{/* 未登录状态 */}
            <Link to="/login" className={styles['login-link']}>
              <IconUser style={{ marginRight: '8px', fontSize: '18px' }}/>
              立即登录
            </Link>
          )}
        </div>
      </div>
    </ArcoHeader>
  );
};

export default Header;