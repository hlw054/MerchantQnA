const { initVectorDB, similaritySearch, keywordSearch } = require('./src/services/vectorService');

// 测试相似度搜索和关键词搜索是否返回正确的knowledgeId
async function testSearchResults() {
  try {
    // 初始化向量数据库
    console.log('初始化向量数据库...');
    await initVectorDB();
    
    // 测试相似度搜索
    console.log('\n测试相似度搜索...');
    const similarityQuery = '抖音电商食品安全管理制度';
    const similarityResults = await similaritySearch(similarityQuery, 5, 0.3);
    
    console.log('相似度搜索结果:');
    similarityResults.forEach((result, index) => {
      console.log(`\n结果 ${index + 1}:`);
      console.log(`ID: ${result.id}`);
      console.log(`内容: ${result.content.substring(0, 100)}...`);
      console.log(`knowledgeId: ${result.knowledgeId}`);
      console.log(`相似度: ${result.score}`);
      console.log(`知识ID是否存在: ${result.knowledgeId !== undefined && result.knowledgeId !== null}`);
    });
    
    // 测试关键词搜索
    console.log('\n\n测试关键词搜索...');
    const keywords = ['食品安全', '职责'];
    const keywordResults = await keywordSearch(keywords, 5);
    
    console.log('关键词搜索结果:');
    keywordResults.forEach((result, index) => {
      console.log(`\n结果 ${index + 1}:`);
      console.log(`ID: ${result.id}`);
      console.log(`内容: ${result.content.substring(0, 100)}...`);
      console.log(`knowledgeId: ${result.knowledgeId}`);
      console.log(`关键词数量: ${result.keywordCount}`);
      console.log(`匹配的关键词: ${result.matchedKeywords}`);
      console.log(`知识ID是否存在: ${result.knowledgeId !== undefined && result.knowledgeId !== null}`);
    });
    
    console.log('\n\n测试完成！');
    
    // 验证结果
    if (similarityResults.length > 0) {
      const hasKnowledgeId = similarityResults.every(result => result.knowledgeId !== undefined && result.knowledgeId !== null);
      console.log(`\n相似度搜索结果中是否都包含knowledgeId: ${hasKnowledgeId}`);
    }
    
    if (keywordResults.length > 0) {
      const hasKnowledgeId = keywordResults.every(result => result.knowledgeId !== undefined && result.knowledgeId !== null);
      console.log(`关键词搜索结果中是否都包含knowledgeId: ${hasKnowledgeId}`);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
testSearchResults();