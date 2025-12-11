/**
 * 向数据库中添加几个普通用户的脚本
 * 执行命令: node add_sample_users.js
 */

// 导入数据库配置和User模型
const { sequelize, User } = require('./src/models/index');

/**
 * 主函数：添加示例用户
 */
async function addSampleUsers() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 示例用户数据（普通用户，role默认为'user'）
    const sampleUsers = [
      {
        account: 'testuser1',
        username: '测试用户1',
        password: 'password123',
        email: 'testuser1@example.com',
        phone: '13800138001'
      },
      {
        account: 'testuser2',
        username: '测试用户2',
        password: 'password123',
        email: 'testuser2@example.com',
        phone: '13800138002'
      },
      {
        account: 'testuser3',
        username: '测试用户3',
        password: 'password123',
        email: 'testuser3@example.com',
        phone: '13800138003'
      },
      {
        account: 'sampleuser',
        username: '示例用户',
        password: 'sample123',
        email: 'sample@example.com'
      },
      {
        account: 'demoaccount',
        username: '演示账号',
        password: 'demo123',
        email: 'demo@example.com'
      }
    ];

    console.log('开始添加示例用户...');
    let addedCount = 0;

    // 逐个添加用户
    for (const userData of sampleUsers) {
      try {
        // 创建用户（密码会通过模型的beforeCreate钩子自动加密）
        const user = await User.create(userData);
        console.log(`✓ 成功添加用户: ${user.account} (ID: ${user.id})`);
        addedCount++;
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`⚠️  用户 ${userData.account} 已存在，跳过`);
        } else {
          console.log(`✗ 添加用户 ${userData.account} 失败:`, error.message);
        }
      }
    }

    console.log(`\n添加完成！成功添加了 ${addedCount} 个用户`);

    // 显示所有添加的普通用户
    console.log('\n当前数据库中的普通用户列表：');
    const users = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'account', 'username', 'email', 'phone', 'createdAt']
    });

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户信息:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   账号: ${user.account}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   电话: ${user.phone || '未设置'}`);
      console.log(`   创建时间: ${user.createdAt.toLocaleString()}`);
    });

  } catch (error) {
    console.error('添加示例用户失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行脚本
addSampleUsers();