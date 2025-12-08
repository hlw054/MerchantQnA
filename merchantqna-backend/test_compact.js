// 测试LanceDB的compaction机制
const vectorService = require('./src/services/vectorService');
const fs = require('fs');
const path = require('path');

// 向量数据库目录路径
const VECTOR_DB_PATH = path.resolve(__dirname, 'vector_db');

/**
 * 获取向量数据库目录的大小
 * @param {string} dirPath 目录路径
 * @returns {number} 目录大小（字节）
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error('获取目录大小失败:', error.message);
  }
  
  return totalSize;
}

/**
 * 格式化字节数为可读的字符串
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的字符串
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
}

/**
 * 测试compaction机制
 */
async function testCompaction() {
  try {
    console.log('=== 测试LanceDB Compaction机制 ===\n');
    
    // 1. 初始化向量数据库
    console.log('1. 初始化向量数据库...');
    await vectorService.initVectorDB();
    console.log('   ✓ 向量数据库初始化完成\n');
    
    // 2. 获取compaction前的数据库大小
    console.log('2. 获取compaction前的数据库大小...');
    const sizeBefore = getDirectorySize(VECTOR_DB_PATH);
    console.log(`   ✓ 数据库大小: ${formatBytes(sizeBefore)}\n`);
    
    // 3. 查看数据库文件结构
    console.log('3. 查看数据库文件结构...');
    console.log('   向量数据库目录:', VECTOR_DB_PATH);
    
    // 列出vector_db目录下的文件
    const dbFiles = fs.readdirSync(VECTOR_DB_PATH, { withFileTypes: true });
    for (const file of dbFiles) {
      const filePath = path.join(VECTOR_DB_PATH, file.name);
      const stats = fs.statSync(filePath);
      
      if (file.isDirectory()) {
        console.log(`   📁 ${file.name}/ (${formatBytes(stats.size)})`);
        
        // 列出子目录下的文件
        const subFiles = fs.readdirSync(filePath, { withFileTypes: true });
        for (const subFile of subFiles) {
          const subFilePath = path.join(filePath, subFile.name);
          const subStats = fs.statSync(subFilePath);
          console.log(`      └── ${subFile.name} (${formatBytes(subStats.size)})`);
        }
      } else {
        console.log(`   📄 ${file.name} (${formatBytes(stats.size)})`);
      }
    }
    console.log('');
    
    // 4. 执行compaction操作
    console.log('4. 执行compaction操作...');
    try {
      const success = await vectorService.compactTable();
      
      if (success) {
        console.log('   ✓ Compaction操作执行成功');
      } else {
        console.log('   ⚠️ 当前LanceDB版本不支持compact方法');
        console.log('   注意: 旧版本的LanceDB可能需要升级到最新版本才能支持手动compaction');
      }
    } catch (error) {
      console.log('   ❌ Compaction操作执行失败:', error.message);
    }
    console.log('');
    
    // 5. 获取compaction后的数据库大小
    console.log('5. 获取compaction后的数据库大小...');
    const sizeAfter = getDirectorySize(VECTOR_DB_PATH);
    console.log(`   ✓ 数据库大小: ${formatBytes(sizeAfter)}`);
    
    // 计算大小变化
    const sizeDiff = sizeBefore - sizeAfter;
    if (sizeDiff > 0) {
      console.log(`   ✓ 数据库大小减少了: ${formatBytes(sizeDiff)}`);
    } else if (sizeDiff < 0) {
      console.log(`   ⚠️ 数据库大小增加了: ${formatBytes(Math.abs(sizeDiff))}`);
    } else {
      console.log('   ⚠️ 数据库大小没有变化');
    }
    console.log('');
    
    // 6. 查看compaction后的文件结构
    console.log('6. 查看compaction后的文件结构...');
    
    // 列出vector_db目录下的文件
    const dbFilesAfter = fs.readdirSync(VECTOR_DB_PATH, { withFileTypes: true });
    for (const file of dbFilesAfter) {
      const filePath = path.join(VECTOR_DB_PATH, file.name);
      const stats = fs.statSync(filePath);
      
      if (file.isDirectory()) {
        console.log(`   📁 ${file.name}/ (${formatBytes(stats.size)})`);
        
        // 列出子目录下的文件
        const subFiles = fs.readdirSync(filePath, { withFileTypes: true });
        for (const subFile of subFiles) {
          const subFilePath = path.join(filePath, subFile.name);
          const subStats = fs.statSync(subFilePath);
          console.log(`      └── ${subFile.name} (${formatBytes(subStats.size)})`);
        }
      } else {
        console.log(`   📄 ${file.name} (${formatBytes(stats.size)})`);
      }
    }
    console.log('');
    
    // 7. 总结
    console.log('=== Compaction机制总结 ===');
    console.log('1. LanceDB使用软删除机制，删除的数据不会立即从物理文件中移除');
    console.log('2. 删除操作会在_deletions目录中创建删除标记');
    console.log('3. Query时会根据这些标记过滤掉已删除的数据');
    console.log('4. Compaction操作会合并数据文件并清理软删除的数据');
    console.log('5. 对于旧版本的LanceDB，可能需要升级到支持手动compaction的版本');
    console.log('6. 如果当前版本不支持手动compaction，LanceDB会在后台自动执行');
    console.log('7. 自动compaction的触发条件通常包括：');
    console.log('   - 数据量达到一定阈值');
    console.log('   - 文件数量达到一定阈值');
    console.log('   - 定期执行（时间间隔）');
    console.log('   - 特定操作后（如批量删除）');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  }
}

// 执行测试
if (require.main === module) {
  testCompaction()
    .then(() => {
      console.log('\n测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试失败:', error.message);
      process.exit(1);
    });
}
