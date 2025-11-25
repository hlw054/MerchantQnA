import React, { useState } from 'react';
import { Card, Input, Button, Typography, Link as ArcoLink, Message } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import loginStyles from '../../styles/login.module.css';
import { registerUser, sendVerificationCode } from '../../api/userService';

const { Title } = Typography;
// TabPane removed as we only support email registration now

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [countdown, setCountdown] = useState(0);
  
  // 注册表单状态
  const [registerForm, setRegisterForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });

  const handleChange = (field: string, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSendVerificationCode = async () => {
    if (!registerForm.email) {
        Message.error('请输入邮箱地址');
        return;
      }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
        Message.error('请输入有效的邮箱地址');
        return;
      }
      
    try {
      // 调用发送验证码接口
      await sendVerificationCode(registerForm.email);
      Message.success(`验证码已发送至 ${registerForm.email}`);
    
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      if (error.response) {
        Message.error(error.response.data?.message || '发送验证码失败，请稍后重试');
      } else {
        Message.error('网络错误，请检查网络连接');
      }
    }
  };

  const handleRegister = async () => {
    // 验证表单
    if (!registerForm.email || !registerForm.username || !registerForm.password || !registerForm.confirmPassword || !registerForm.verificationCode) {
        Message.error('请填写完整信息');
        return;
      }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
        Message.error('请输入有效的邮箱地址');
        return;
      }
    
    // 验证账号长度
    if (registerForm.username.length <= 3) {
        Message.error('账号长度必须大于3个字符');
        return;
      }
    
    // 验证密码长度
    if (registerForm.password.length <= 6) {
        Message.error('密码长度必须大于6个字符');
        return;
      }
    
    // 验证密码一致性
    if (registerForm.password !== registerForm.confirmPassword) {
        Message.error('两次输入的密码不一致');
        return;
      }
      
    try {
      // 调用注册接口
      await registerUser(
        registerForm.username, // 账号
        registerForm.username, // 用户名
        registerForm.password, 
        registerForm.email, 
        registerForm.verificationCode
      );
      
      Message.success('注册成功！');
      
      // 注册成功后跳转到登录页
      navigate('/login');
    } catch (error: any) {
      if (error.response) {
        Message.error(error.response.data?.message || '注册失败，请稍后重试');
      } else {
        Message.error('网络错误，请检查网络连接');
      }
    }
  };

  return (
    <div className={loginStyles.container}>
      <Card className={loginStyles.card}>
        <Title heading={4} className={loginStyles.title}>账号注册</Title>
        
        {/* 仅支持邮箱注册 */}
            <Input
              placeholder="请输入邮箱"
              value={registerForm.email}
              onChange={(value) => handleChange('email', value)}
              className={loginStyles.inputField}
            />
            
            <Input
              placeholder="账号"
              value={registerForm.username}
              onChange={(value) => handleChange('username', value)}
              className={loginStyles.inputField}
            />
            
            <Input.Password
              placeholder="密码"
              value={registerForm.password}
              onChange={(value) => handleChange('password', value)}
              visibilityToggle
              className={loginStyles.inputField}
            />
            
            <Input.Password
              placeholder="密码确认"
              value={registerForm.confirmPassword}
              onChange={(value) => handleChange('confirmPassword', value)}
              visibilityToggle
              className={loginStyles.inputField}
            />
            
            <div className={styles.verificationCodeContainer}>
              <Input
                placeholder="验证码"
                value={registerForm.verificationCode}
                onChange={(value) => handleChange('verificationCode', value)}
                style={{ flex: 1 }}
              />
              <Button 
                onClick={handleSendVerificationCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </Button>
            </div>

        
        <Button 
          type="primary" 
          size="large" 
          className={loginStyles.primaryButton}
          onClick={handleRegister}
        >
          立即注册
        </Button>
        
        <div className={loginStyles.linkContainer}>
          <span>已有账号？</span>
          <ArcoLink onClick={() => navigate('/login')}>立即登录</ArcoLink>
        </div>
        
        <div className={loginStyles.termsContainer}>
          注册即代表您已同意 
          <ArcoLink>服务协议</ArcoLink> 和 
          <ArcoLink>隐私条款</ArcoLink>
        </div>
      </Card>

    </div>
  );
};

export default RegisterPage;