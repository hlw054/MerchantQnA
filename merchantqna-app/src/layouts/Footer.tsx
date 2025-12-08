import React from 'react';
import { Typography } from '@arco-design/web-react';
import styles from '../styles/layouts.module.css';

const { Text } = Typography;

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles['footer-container']}>
      {/* 官方话术区域 */}
      <div className={styles['footer-text']}>
        <p>
          商家知识平台致力于为企业提供智能化的知识管理解决方案，助力商家提升服务效率与质量
        </p>
        <p>
          智能问答机器人基于先进的人工智能技术，24小时为您解答各类业务咨询，提供精准快速的服务体验
        </p>
        <p>
          我们的愿景：成为商家最信赖的智能化知识管理与服务平台
        </p>
      </div>
      
      {/* 分隔线 */}
      <div className={styles['footer-divider']} />
      
      {/* 版权信息 */}
      <div>
        <Text className={styles['footer-copyright']}>
          商家知识平台 & 智能问答机器人 ©{currentYear} All Rights Reserved
        </Text>
        <p className={styles['footer-icp']}>
          字节跳动科技有限公司 版权所有 | 京ICP备XXXXXXXX号-X
        </p>
      </div>
    </div>
  );
};

export default Footer;