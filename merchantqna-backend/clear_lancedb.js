const lancedb = require('@lancedb/lancedb');
const path = require('path');
const fs = require('fs');

// 向量数据库配置
const VECTOR_DB_PATH = path.resolve(__dirname, 'vector_db');
const TABLE_NAME = 'merchant_knowledge';

/**
 * 清空LanceDB数据库中的所有数据
 */
async function clearLanceDB() {
  try {
    console.log('开始清空LanceDB数据库...');
    
    // 检查向量数据库目录是否存在
    if (!fs.existsSync(VECTOR_DB_PATH)) {
      console.log('向量数据库目录不存在，无需清空');
      return;
    }
    
    // 连接到LanceDB
    const conn = await lancedb.connect(VECTOR_DB_PATH);
    console.log(`成功连接到LanceDB: ${VECTOR_DB_PATH}`);
    
    // 检查表是否存在
    const tables = await conn.tableNames();
    console.log(`数据库中的表: ${tables.join(', ')}`);
    
    if (tables.includes(TABLE_NAME)) {
      // 打开现有表
      const table = await conn.openTable(TABLE_NAME);
      console.log(`成功打开表: ${TABLE_NAME}`);
      
      // 获取表中的所有数据
      const allData = await table.toArray();
      const rowCount = allData.length;
      console.log(`表中现有数据行数: ${rowCount}`);
      
      if (rowCount > 0) {
        // 使用delete方法删除所有数据
        // 对于LanceDB，可以使用where条件来匹配所有行
        await table.delete('true'); // 'true'条件匹配所有行
        console.log(`成功清空表 ${TABLE_NAME} 中的所有数据`);
        
        // 验证清空结果
        const afterDeleteData = await table.toArray();
        console.log(`清空后表中的数据行数: ${afterDeleteData.length}`);
      } else {
        console.log(`表 ${TABLE_NAME} 已经为空，无需清空`);
      }
    } else {
      console.log(`表 ${TABLE_NAME} 不存在，无需清空`);
    }
    
    console.log('LanceDB数据库清空完成');
  } catch (error) {
    console.error('清空LanceDB数据库失败:', error);
    // 如果删除数据失败，尝试删除整个表并重新创建
    try {
      console.log('尝试通过删除并重新创建表来清空数据库...');
      const conn = await lancedb.connect(VECTOR_DB_PATH);
      
      // 删除表
      if ((await conn.tableNames()).includes(TABLE_NAME)) {
        await conn.dropTable(TABLE_NAME);
        console.log(`成功删除表: ${TABLE_NAME}`);
      }
      
      // 重新创建表
      const sampleData = [
        {
          id: 'sample',
          content: 'sample content',
          metadata: { 
            path: 'sample/path',
            position: 0,
            createdAt: new Date().toISOString(),
            contentLength: 14,
          },
          vector: Array(2048).fill(0),
          knowledgeId: 'sample-knowledge'
        }
      ];
      
      await conn.createTable(TABLE_NAME, sampleData);
      console.log(`成功重新创建表: ${TABLE_NAME}`);
      
      // 删除示例数据
      const table = await conn.openTable(TABLE_NAME);
      await table.delete("id = 'sample'");
      console.log('成功删除示例数据');
      
      console.log('通过重新创建表的方式清空数据库完成');
    } catch (recreateError) {
      console.error('通过重新创建表清空数据库失败:', recreateError);
      // 如果所有方法都失败，尝试直接删除数据库文件
      try {
        console.log('尝试通过删除数据库文件来清空数据库...');
        if (fs.existsSync(VECTOR_DB_PATH)) {
          // 删除vector_db目录下的所有文件
          fs.rmSync(VECTOR_DB_PATH, { recursive: true, force: true });
          console.log(`成功删除数据库目录: ${VECTOR_DB_PATH}`);
          console.log('通过删除数据库文件的方式清空数据库完成');
        }
      } catch (deleteError) {
        console.error('通过删除数据库文件清空数据库失败:', deleteError);
        throw new Error('清空LanceDB数据库失败，请手动检查并清理');
      }
    }
  }
}

// 执行清空操作
if (require.main === module) {
  clearLanceDB()
    .then(() => {
      console.log('清空操作完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('清空操作失败:', error);
      process.exit(1);
    });
}

module.exports = { clearLanceDB };