import React from 'react';
import { Layout, Typography } from '@arco-design/web-react';

const { Footer: ArcoFooter } = Layout;
const { Text } = Typography;

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <ArcoFooter style={{ 
      textAlign: 'center', 
      padding: '40px 15% 20px', 
      backgroundColor: '#333',
      color: '#999',
      fontSize: '14px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 官方话术区域 */}
        <div style={{ marginBottom: '24px', lineHeight: '1.8' }}>
          <p style={{ margin: '8px 0' }}>
            商家知识平台致力于为企业提供智能化的知识管理解决方案，助力商家提升服务效率与质量
          </p>
          <p style={{ margin: '8px 0' }}>
            智能问答机器人基于先进的人工智能技术，24小时为您解答各类业务咨询，提供精准快速的服务体验
          </p>
          <p style={{ margin: '8px 0' }}>
            我们的愿景：成为商家最信赖的智能化知识管理与服务平台
          </p>
        </div>
        
        {/* 分隔线 */}
        <div style={{ 
          height: '1px', 
          backgroundColor: '#555', 
          margin: '20px 0',
          opacity: 0.5
        }} />
        
        {/* 版权信息 */}
        <div>
          <Text style={{ color: '#999' }}>
            商家知识平台 & 智能问答机器人 ©{currentYear} All Rights Reserved
          </Text>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#777' }}>
            字节跳动科技有限公司 版权所有 | 京ICP备XXXXXXXX号-X
          </p>
        </div>
      </div>
    </ArcoFooter>
  );
};

export default Footer;