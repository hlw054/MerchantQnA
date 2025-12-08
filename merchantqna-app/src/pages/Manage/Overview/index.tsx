import React from 'react';
import styles from './styles.module.css';

const OverviewPage: React.FC = () => {
  return (
    <div className={styles.overviewPage}>
      <h1>管理端概览</h1>
      <p>欢迎使用MerchantQnA管理平台</p>
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>知识库数量</h3>
          <p className={styles.statValue}>15</p>
        </div>
        <div className={styles.statCard}>
          <h3>用户数量</h3>
          <p className={styles.statValue}>234</p>
        </div>
        <div className={styles.statCard}>
          <h3>问答总量</h3>
          <p className={styles.statValue}>1,245</p>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;