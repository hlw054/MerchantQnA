/**
 * 用户控制器
 * 处理用户注册、登录、获取用户信息等功能
 */
const { User } = require('../models');
const { Sequelize, Op } = require('sequelize');
const { generateToken } = require('../utils/jwt');
const { AppError } = require('../middlewares/errorHandler');
const { sendVerificationEmail } = require('../utils/emailService');

// 模拟验证码存储（实际项目中应使用Redis或数据库）
const verificationCodes = new Map();

/**
 * 生成随机验证码
 * @param {number} length - 验证码长度
 * @returns {string} - 生成的验证码
 */
const generateVerificationCode = (length = 6) => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 注册新用户
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const register = async (req, res, next) => {
  try {
    const { account, username, password, email, verificationCode } = req.body;

    // 验证必填字段
    if (!account || !password || !email || !verificationCode) {
      return next(new AppError(400, '账号、密码、邮箱和验证码都是必填的'));
    }

    // 验证验证码（包含过期时间检查）
    const storedInfo = verificationCodes.get(email);
    if (!storedInfo) {
      return next(new AppError(400, '验证码不存在或已过期'));
    }
    
    // 检查验证码是否过期
    if (Date.now() > storedInfo.expiryTime) {
      verificationCodes.delete(email); // 删除过期的验证码
      return next(new AppError(400, '验证码已过期，请重新获取'));
    }
    
    // 检查验证码是否匹配
    if (storedInfo.code !== verificationCode) {
      return next(new AppError(400, '验证码不正确'));
    }

    // 检查账号和邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ account }, { email }]
      }
    });

    if (existingUser) {
      return next(new AppError(400, '账号或邮箱已被注册'));
    }

    // 创建新用户
    const user = await User.create({
      account,
      username: username || '', // 用户名可选
      password, // 密码会在模型的钩子中自动加密
      email,
      phone: '', // 手机号可选
      role: 'user' // 默认角色为普通用户
    });

    // 清除使用过的验证码
    verificationCodes.delete(email);

    res.status(201).json({
      status: 'success',
      message: '注册成功',
    });
  } catch (error) {
    console.error('注册失败:', error);
    return next(new AppError(500, '注册失败，请稍后重试'));
  }
};

/**
 * 用户登录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // 验证必填字段
    if (!identifier || !password) {
      return next(new AppError(400, '账号/邮箱和密码都是必填的'));
    }

    // 根据标识符查找用户（可以是账号或邮箱）
    const user = await User.findOne({
      where: {
        [Op.or]: [{ account: identifier }, { email: identifier }]
      }
    });

    // 验证用户是否存在且密码正确
    if (!user || !(await user.validatePassword(password))) {
      return next(new AppError(401, '账号/邮箱或密码错误'));
    }

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      account: user.account,
      role: user.role
    });

    res.status(200).json({
      status: 'success',
      message: '登录成功',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    return next(new AppError(500, '登录失败，请稍后重试'));
  }
};

/**
 * 获取当前用户信息
 * @param {Object} req - Express请求对象（包含user对象）
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // 从请求对象中获取用户ID（由认证中间件设置）
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // 排除密码字段
    });

    if (!user) {
      return next(new AppError(404, '用户不存在'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return next(new AppError(500, '获取用户信息失败，请稍后重试'));
  }
};

/**
 * 发送邮箱验证码
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const sendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError(400, '邮箱地址是必填的'));
    }

    // 检查邮箱是否已被注册
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError(400, '该邮箱已被注册'));
    }

    // 生成验证码
    const code = generateVerificationCode();
    
    // 存储验证码和过期时间（5分钟后过期）
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5分钟
    verificationCodes.set(email, { code, expiryTime });
    
    // 发送真实邮件
    await sendVerificationEmail(email, code);
    
    // 不再返回验证码给前端，提高安全性
    res.status(200).json({
      status: 'success',
      message: '验证码已发送，请查收邮件',
      data: {
        email,
        expiryInMinutes: 5
      }
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return next(new AppError(500, '发送验证码失败，请稍后重试'));
  }
};

/**
 * 用户登出
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const logout = async (req, res, next) => {
  try {
    // 在实际项目中，这里可以实现token黑名单机制
    // 例如将token存储到Redis或数据库的黑名单中，设置过期时间与token的过期时间一致
    
    res.status(200).json({
      status: 'success',
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出失败:', error);
    return next(new AppError(500, '登出失败，请稍后重试'));
  }
};

/**
 * 获取用户列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // 验证分页参数
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new AppError(400, '无效的分页参数'));
    }
    
    // 计算偏移量
    const offset = (pageNum - 1) * limitNum;
    
    // 获取用户列表（排除密码字段）
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit: limitNum,
      offset: offset,
      order: [['createdAt', 'DESC']] // 按创建时间倒序排列
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        users: rows,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalItems: count,
          totalPages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return next(new AppError(500, '获取用户列表失败，请稍后重试'));
  }
};

/**
 * 修改用户角色
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    
    // 验证必填字段
    if (!userId || !role) {
      return next(new AppError(400, '用户ID和角色不能为空'));
    }
    
    // 验证角色是否有效
    const validRoles = ['user', 'merchant', 'admin'];
    if (!validRoles.includes(role)) {
      return next(new AppError(400, '无效的角色，支持的角色有：user, merchant, admin'));
    }
    
    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError(404, '用户不存在'));
    }
    
    // 更新用户角色
    await user.update({ role });
    
    res.status(200).json({
      status: 'success',
      message: '用户角色更新成功',
      data: {
        userId: user.id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('修改用户角色失败:', error);
    return next(new AppError(500, '修改用户角色失败，请稍后重试'));
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  sendVerificationCode,
  logout,
  getUsers,
  updateUserRole
};