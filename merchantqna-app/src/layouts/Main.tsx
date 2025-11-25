import React from 'react';
import type { ReactNode } from 'react';
import { Layout } from '@arco-design/web-react';

const { Content } = Layout;

interface MainProps {
  children: ReactNode;
}

const Main: React.FC<MainProps> = ({ children }) => {
  return (
    <Content style={{ 
      minHeight: 'calc(100vh - 136px)',
      backgroundColor: '#fff' 
    }}>
      {children}
    </Content>
  );
};

export default Main;