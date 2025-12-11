/**
 * 将指定账号的用户角色更新为admin的脚本
 * 执行命令: node update_user_role.js
 */

// 导入数据库配置和User模型
const { sequelize, User } = require('./src/models/index');

/**
 * 主函数：更新用户角色
 */
async function updateUserRole() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 定义要更新的账号和目标角色
    const targetAccount = 'jxd123';
    const targetRole = 'admin';

    // 查询账号为jxd123的用户
    const user = await User.findOne({
      where: { account: targetAccount }
    });

    if (!user) {
      console.log(`未找到账号为 ${targetAccount} 的用户`);
      return;
    }

    // 更新用户角色
    await user.update({ role: targetRole });

    console.log(`用户 ${targetAccount} 的角色已成功更新为 ${targetRole}`);
    console.log(`更新后的用户信息：`);
    console.log(`ID: ${user.id}`);
    console.log(`账号: ${user.account}`);
    console.log(`用户名: ${user.username}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`角色: ${user.role}`);

  } catch (error) {
    console.error('更新用户角色失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行脚本
updateUserRole();