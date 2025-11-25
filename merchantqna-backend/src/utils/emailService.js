/**
 * 邮件服务工具
 * 用于发送邮件验证码和其他邮件通知
 */
const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * 创建邮件发送器
 * 使用QQ邮箱的SMTP服务
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true, // 使用SSL
    auth: {
      user: process.env.EMAIL_USER || '499253723@qq.com', // 发送者邮箱
      pass: process.env.EMAIL_PASS // QQ邮箱的授权码（不是密码）
    },
    // 增加连接池和重试选项
    pool: true,
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 10
  });
};

/**
 * 发送验证码邮件
 * @param {string} to - 收件人邮箱
 * @param {string} code - 验证码
 * @returns {Promise} - 发送结果
 */
const sendVerificationEmail = async (to, code) => {
  // 检查是否设置了邮箱授权码
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS.trim() === '') {
    throw new Error('邮箱授权码未设置，请在.env文件中配置EMAIL_PASS');
  }
  
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"商家问答系统" <${process.env.EMAIL_USER || '499253723@qq.com'}>`,
    to: to,
    subject: '【商家问答系统】邮箱验证',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">尊敬的用户：</h2>
        <p>您正在注册商家问答系统账号，您的验证码是：</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #1890ff;">${code}</span>
        </div>
        <p>请在5分钟内使用该验证码完成注册。如非本人操作，请忽略此邮件。</p>
        <p>此邮件由系统自动发送，请勿回复。</p>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('邮件发送失败:', error.message || error);
    
    // 根据不同的错误类型提供更具体的错误信息
    if (error.code === 'EAUTH') {
      throw new Error('邮箱认证失败，请检查授权码是否正确');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('邮件发送超时，请稍后重试');
    } else {
      throw new Error(`邮件发送失败: ${error.message || error}`);
    }
  }
};

module.exports = {
  sendVerificationEmail
};