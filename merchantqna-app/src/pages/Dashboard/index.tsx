import React from 'react';
import styles from './styles.module.css';

const Dashboard: React.FC = () => {
  return (
    <div className={styles.dashboardContainer}>
      <h1>智慧大屏</h1>
      <p>数据可视化和运营监控平台</p>
    </div>
  );
};

export default Dashboard;