import React, { useState } from 'react';
import { Card, Input, Button, Tabs, Typography, Link as ArcoLink, Message } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import loginStyles from '../../styles/login.module.css';
import { loginUser, getCurrentUser } from '../../api/userService';

const { Title } = Typography;
const { TabPane } = Tabs;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 账号密码登录状态
  const [accountLoginForm, setAccountLoginForm] = useState({
    username: '',
    password: ''
  });
  
  // 邮箱密码登录状态
  const [emailLoginForm, setEmailLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // 当前激活的登录方式
  const [activeTab, setActiveTab] = useState('email');

  const handleAccountChange = (field: string, value: string) => {
    setAccountLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (field: string, value: string) => {
    setEmailLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    try {
      let identifier = '';
      let password = '';
      
      if (activeTab === 'account') {
        // 账号密码登录
        if (!accountLoginForm.username || !accountLoginForm.password) {
          Message.error('请填写完整信息');
          return;
        }
        
        // 验证密码长度
        if (accountLoginForm.password.length <= 6) {
          Message.error('密码长度必须大于6个字符');
          return;
        }
        
        identifier = accountLoginForm.username;
        password = accountLoginForm.password;
      } else {
        // 邮箱密码登录
        if (!emailLoginForm.email || !emailLoginForm.password) {
          Message.error('请填写完整信息');
          return;
        }
        
        // 验证密码长度
        if (emailLoginForm.password.length <= 6) {
          Message.error('密码长度必须大于6个字符');
          return;
        }
        
        identifier = emailLoginForm.email;
        password = emailLoginForm.password;
      }
      
      // 调用登录接口
      const response = await loginUser(identifier, password);
      
      // 保存token
      if (response && response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        try {
          // 登录成功后调用getCurrentUser获取用户信息
          const userInfo = await getCurrentUser();
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } catch (error) {
          console.error('获取用户信息失败:', error);
          // 获取用户信息失败不影响登录流程
        }
      }
      
      Message.success('登录成功');
      // 登录成功后跳转到首页
      navigate('/');
    } catch (error: any) {
      // 处理错误响应
      if (error.response) {
        if (error.response.status === 401) {
          Message.error('账号/邮箱或密码错误');
        } else {
          Message.error(error.response.data?.message || '登录失败，请稍后重试');
        }
      } else {
        Message.error('网络错误，请检查网络连接');
      }
    }
  };

  return (
    <div className={loginStyles.container}>
      <Card className={loginStyles.card}>
        <Title heading={4} className={loginStyles.title}>账号登录</Title>
        
        <Tabs className={styles.tabsContainer} activeTab={activeTab} onChange={setActiveTab} defaultActiveTab="email">
          <TabPane key="account" title="账号登录">
            <Input
              placeholder="请输入账号"
              value={accountLoginForm.username}
              onChange={(value) => handleAccountChange('username', value)}
              className={loginStyles.inputField}
            />
            <Input.Password
              placeholder="请输入密码"
              value={accountLoginForm.password}
              onChange={(value) => handleAccountChange('password', value)}
              visibilityToggle
              className={loginStyles.inputField}
            />
          </TabPane>
          
          <TabPane key="email" title="邮箱登录">
            <Input
              placeholder="请输入邮箱"
              value={emailLoginForm.email}
              onChange={(value) => handleEmailChange('email', value)}
              className={loginStyles.inputField}
            />
            <Input.Password
              placeholder="请输入密码"
              value={emailLoginForm.password}
              onChange={(value) => handleEmailChange('password', value)}
              visibilityToggle
              className={loginStyles.inputField}
            />
          </TabPane>
        </Tabs>
        
        <div className={styles.forgotPassword}>
          <ArcoLink onClick={() => navigate('/forgot-password')}>忘记密码</ArcoLink>
        </div>
        
        <Button 
          type="primary" 
          size="large" 
          className={loginStyles.primaryButton}
          onClick={handleLogin}
        >
          登录
        </Button>
        
        <div className={loginStyles.linkContainer}>
          <span>还没有账号？</span>
          <ArcoLink onClick={() => navigate('/register')}>立即注册</ArcoLink>
        </div>
        
        <div className={loginStyles.termsContainer}>
          登录即代表您已同意 
          <ArcoLink>服务协议</ArcoLink> 和 
          <ArcoLink>隐私条款</ArcoLink>
        </div>
      </Card>

    </div>
  );
};

export default LoginPage;