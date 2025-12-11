import React, { useState, useEffect } from 'react';
import { Pagination, Select, Modal, Message } from '@arco-design/web-react';
import { getUsers, updateUserRole } from '../../../api/userService';
import styles from './styles.module.css';

interface User {
  id: number;
  account: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const UsersPage: React.FC = () => {
  // 用户列表状态
  const [users, setUsers] = useState<User[]>([]);
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 修改角色模态框状态
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  // 获取用户列表
  const fetchUsers = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      const response = await getUsers(page, limit);
      if (response.status === 'success') {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      Message.error('获取用户列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    fetchUsers(page, pageSize);
  };

  // 打开修改角色模态框
  const handleOpenRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalVisible(true);
  };

  // 关闭修改角色模态框
  const handleCloseRoleModal = () => {
    setRoleModalVisible(false);
    setSelectedUser(null);
    setNewRole('');
  };

  // 保存角色修改
  const handleSaveRole = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const response = await updateUserRole(selectedUser.id, newRole);
      if (response.status === 'success') {
        Message.success('用户角色更新成功');
        // 更新本地用户列表
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id ? { ...user, role: newRole } : user
          )
        );
        handleCloseRoleModal();
      }
    } catch (error) {
      console.error('修改用户角色失败:', error);
      Message.error('修改用户角色失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置


  return (
    <div className={styles.manageContainer}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>用户管理</h2>
        
        <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.userTable}>
          <thead>
            <tr>
              <th style={{ width: '360px' }}>用户ID</th>
              <th>用户名</th>
              <th>账号</th>
              <th>邮箱</th>
              <th>角色</th>
              <th style={{textAlign: 'center'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{textAlign: 'center', padding: '20px'}}>加载中...</td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.account}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.role === 'admin' ? styles.statusAdmin : styles.statusUser}>
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className={styles.actionCells}>
                    <button 
                      className={`${styles.actionIcon} ${styles.edit}`} 
                      onClick={() => handleOpenRoleModal(user)}
                      title="修改角色"
                    >
                      修改角色
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{textAlign: 'center', padding: '20px'}}>暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <div className={styles.paginationContainer}>
          <Pagination
            current={pagination.currentPage}
            pageSize={pagination.pageSize}
            total={pagination.totalItems}
            onChange={handlePageChange}
            showTotal={(total) => `共 ${total} 条数据`}
            sizeCanChange
            sizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
      </div>
      
      {/* 修改角色模态框 */}
      <Modal
        title="修改用户角色"
        visible={roleModalVisible}
        onOk={handleSaveRole}
        onCancel={handleCloseRoleModal}
        confirmLoading={loading}
        style={{ width: 400 }}
      >
        {selectedUser && (
          <div className={styles.modalContent}>
            <div className={styles.roleSelectContainer}>
              <label className={styles.roleSelectLabel}>新角色：</label>
              <Select
                value={newRole}
                onChange={(value) => setNewRole(value)}
                style={{ width: '100%' }}
                options={[
                  { label: '管理员', value: 'admin' },
                  { label: '普通用户', value: 'user' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;