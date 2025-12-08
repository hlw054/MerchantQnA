import React from 'react';
import styles from './styles.module.css';

const UsersPage: React.FC = () => {
  return (
    <div className={styles.usersPage}>
      <h1>用户管理页面</h1>
      <p>这里是用户管理功能的实现区域</p>
    </div>
  );
};

export default UsersPage;