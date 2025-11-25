import React from 'react';
import type { ReactNode } from 'react';
import { Layout as ArcoLayout } from '@arco-design/web-react';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ArcoLayout className="app-layout">
      <Header />
      <Main>{children}</Main>
      <Footer />
    </ArcoLayout>
  );
};

export default Layout;