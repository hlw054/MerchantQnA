import React from 'react';
import type { ReactNode } from 'react';
import { Layout as ArcoLayout } from '@arco-design/web-react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // 定义不需要显示Footer的路由
  const noFooterRoutes = [
    '/rules/',
    '/qa',
    '/manage',
    '/dashboard',
  ];
  
  // 检查当前路由是否需要隐藏Footer
  const shouldHideFooter = noFooterRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
  return (
    <ArcoLayout>
      <Header />
      {/* 添加等高的占位div，防止内容被固定的Header遮挡 */}
      <div style={{ height: '60px' }} />
      <Main>{children}</Main>
      {!shouldHideFooter && <Footer />}
    </ArcoLayout>
  );
};

export default Layout;