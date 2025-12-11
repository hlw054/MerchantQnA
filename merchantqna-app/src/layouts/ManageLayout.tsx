import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './manageLayout.module.css';
import { IconHome, IconBook, IconUser, IconSettings, IconTiktokColor, IconMenuFold, IconMenuUnfold, IconDown, IconFile, IconFolder, IconRotateLeft } from '@arco-design/web-react/icon';

interface ManageLayoutProps {
  children: React.ReactNode;
}

const ManageLayout: React.FC<ManageLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
    // 折叠时关闭所有展开的子菜单
    if (!collapsed) {
      setExpandedItems([]);
    }
  };
  
  // 切换子菜单展开/关闭状态
  const toggleSubNav = (itemKey: string) => {
    // 如果侧边栏处于折叠状态，先展开侧边栏
    if (collapsed) {
      setCollapsed(false);
      // 展开侧边栏后添加子菜单到展开列表
      setExpandedItems(prev => [...prev, itemKey]);
    } else {
      // 侧边栏已展开，直接切换子菜单状态
      setExpandedItems(prev => {
        if (prev.includes(itemKey)) {
          return prev.filter(key => key !== itemKey);
        } else {
          return [...prev, itemKey];
        }
      });
    }
  };
  
  // 获取当前路径
  const getCurrentPath = () => {
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const path = ['管理端'];
    
    if (parts.length > 1) {
      if (parts[1] === 'overview') {
        path.push('概览');
      } else if (parts[1] === 'document') {
        path.push('知识库', '知识库上传');
      } else if (parts[1] === 'edit') {
        path.push('知识库', '编辑文档');
      } else if (parts[1] === 'users') {
        path.push('用户管理');
      } else if (parts[1] === 'data') {
        path.push('数据中心');
      } else if (parts[1] === 'rag') {
        path.push('知识库', 'RAG上传');
      }
    }
    
    return path;
  };
  
  const currentPath = getCurrentPath();
  
  // 模拟用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  return (
    <div className={`${styles.manageLayout} ${collapsed ? styles.collapsed : ''}`}>
      {/* 左侧侧边栏 */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        {/* 侧边栏顶部 */}
        <div className={styles.sidebarHeader}>
          <IconTiktokColor className={styles.logoIcon} />
          {!collapsed && <span className={styles.sidebarTitle}>管理端</span>}
          <button 
            className={styles.collapseButton}
            onClick={toggleCollapsed}
            aria-label={collapsed ? '展开' : '收起'}
          >
            {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          </button>
        </div>
        
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={`${styles.navItem} ${location.pathname.startsWith('/manage/overview') ? styles.active : ''}`}>
              <Link 
                to="/manage/overview" 
                className={`${styles.navLink} ${location.pathname.startsWith('/manage/overview') ? styles.active : ''}`}
              >
                <IconHome className={styles.navIcon} />
                {!collapsed && <span>概览</span>}
              </Link>
            </li>
            <li className={`${styles.navItem} ${expandedItems.includes('knowledge') ? styles.expanded : ''}`}>
                <div 
                  className={styles.navLink}
                  onClick={() => toggleSubNav('knowledge')}
                >
                  <IconBook className={styles.navIcon} />
                  {!collapsed && <span>知识库</span>}
                  <IconDown 
                    className={`${styles.expandIcon} ${expandedItems.includes('knowledge') ? styles.rotated : ''}`} 
                  />
                </div>
                <ul className={`${styles.subNavList} ${expandedItems.includes('knowledge') ? 'expanded' : ''}`}>
                  <li className={`${styles.subNavItem} ${location.pathname.startsWith('/manage/document') ? styles.active : ''}`}>
                    <Link to="/manage/document" className={`${styles.subNavLink} ${location.pathname.startsWith('/manage/document') ? styles.active : ''}`}>
                      <IconFile className={styles.subNavIcon} />
                      知识库上传
                    </Link>
                  </li>
                  <li className={`${styles.subNavItem} ${location.pathname.startsWith('/manage/rag') ? styles.active : ''}`}>
                    <Link to="/manage/rag" className={`${styles.subNavLink} ${location.pathname.startsWith('/manage/rag') ? styles.active : ''}`}>
                      <IconFolder className={styles.subNavIcon} />
                      RAG上传
                    </Link>
                  </li>
                </ul>
            </li>
            <li className={`${styles.navItem} ${location.pathname.startsWith('/manage/users') ? styles.active : ''}`}>
              <Link to="/manage/users" className={`${styles.navLink} ${location.pathname.startsWith('/manage/users') ? styles.active : ''}`}>
                <IconUser className={styles.navIcon} />
                {!collapsed && <span>用户管理</span>}
              </Link>
            </li>
            {/* <li className={`${styles.navItem} ${location.pathname.startsWith('/manage/data') ? styles.active : ''}`}>
              <Link to="/manage/data" className={`${styles.navLink} ${location.pathname.startsWith('/manage/data') ? styles.active : ''}`}>
                <IconSettings className={styles.navIcon} />
                {!collapsed && <span>数据中心</span>}
              </Link>
            </li> */}
          </ul>
        </nav>
        
        {/* 登录用户信息 - 固定在底部 */}
        <div className={styles.userProfileContainer}>
          <div className={`${styles.userProfile} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.avatar}>
              {userInfo.username?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <span className={styles.username}>
                {userInfo.username || '管理员'}
              </span>
            )}
          </div>
        </div>
      </aside>
      
      {/* 右侧主内容区 */}
      <main className={`${styles.mainContent} ${collapsed ? styles.collapsed : ''}`}>
        {/* 路径显示 */}
        <div className={styles.pathName}>
          <div className={styles.path}>
            {currentPath.map((item, index) => (
              <React.Fragment key={index}> 
                <span className={styles.pathItem}>{item}</span>
                {index < currentPath.length - 1 && <span className={styles.pathSeparator}> &gt; </span>}
              </React.Fragment>
            ))}
          </div>
          <button 
            className={styles.backToUserButton}
            onClick={() => window.location.href = '/'} // 假设用户端主页是根路径
            aria-label="返回用户端"
          >
            <IconRotateLeft className={styles.backIcon} />
            返回用户端
          </button>
        </div>
        
        {/* 页面内容 */}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default ManageLayout;