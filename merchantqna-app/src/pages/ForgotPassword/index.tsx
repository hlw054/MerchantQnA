import React, { useState } from 'react';
import { Card, Input, Button, Typography, Link as ArcoLink, Message } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import loginStyles from '../../styles/login.module.css';

const { Title } = Typography;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [countdown, setCountdown] = useState(0);
  
  // 密码修改表单状态
  const [resetForm, setResetForm] = useState({
    account: '', // 邮箱或手机号
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });

  const handleChange = (field: string, value: string) => {
    setResetForm(prev => ({ ...prev, [field]: value }));
  };

  const sendVerificationCode = () => {
    if (!resetForm.account) {
        Message.error('请输入邮箱或手机号');
        return;
      }
      
      // 这里应该是实际发送验证码的逻辑，暂时使用模拟
      Message.success(`验证码已发送至 ${resetForm.account}`);
    
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
  };

  const handleReset = () => {
    // 验证表单
    if (!resetForm.account || !resetForm.newPassword || !resetForm.confirmPassword || !resetForm.verificationCode) {
        Message.error('请填写完整信息');
        return;
      }
    
    // 验证密码一致性
    if (resetForm.newPassword !== resetForm.confirmPassword) {
        Message.error('两次输入的密码不一致');
        return;
      }
      
      // 这里应该是实际的密码重置逻辑，暂时使用模拟
      Message.success('密码重置成功');
    
    // 密码重置成功后跳转到登录页
    navigate('/login');
  };

  return (
    <div className={loginStyles.container}>
      <Card className={loginStyles.card}>
        <div className={styles.headerContainer}>
          <Title heading={4} className={styles.pageTitle}>修改密码</Title>
        </div>
        
        <Input
          placeholder="请输入邮箱"
          value={resetForm.account}
          onChange={(value) => handleChange('account', value)}
          className={loginStyles.inputField}
        />
        
        <Input.Password
          placeholder="新密码"
          value={resetForm.newPassword}
          onChange={(value) => handleChange('newPassword', value)}
          visibilityToggle
          className={loginStyles.inputField}
        />
        
        <Input.Password
          placeholder="密码确认"
          value={resetForm.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          visibilityToggle
          className={loginStyles.inputField}
        />

        <div  className={styles.verificationCodeContainer}>
          <Input
            placeholder="验证码"
            value={resetForm.verificationCode}
            onChange={(value) => handleChange('verificationCode', value)}
            style={{ flex: 1 }}
            className={loginStyles.inputField}
          />
          <Button
            onClick={sendVerificationCode}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
          </Button>
        </div>

        <div className={styles.backLogin}>
          <ArcoLink onClick={() => navigate('/login')}>返回登录</ArcoLink>
        </div>
        
        <Button 
          type="primary" 
          size="large" 
          className={loginStyles.primaryButton}
          onClick={handleReset}
        >
          重置
        </Button>

        
        <div className={loginStyles.termsContainer}>
          修改密码即代表您已同意 
          <ArcoLink>服务协议</ArcoLink> 和 
          <ArcoLink>隐私条款</ArcoLink>
        </div>
      </Card>

    </div>
  );
};

export default ForgotPassword;