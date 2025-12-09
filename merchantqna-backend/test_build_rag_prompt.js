const { buildRAGPrompt } = require('./src/services/ragChainService');

// 测试数据
const mockSearchResults = [
  {
    knowledgeId: '123456',
    content: '这是测试文档内容，包含了一些重要的信息。',
    metadata: {
      path: 'test/document1.txt'
    },
    relevanceScore: 0.95
  },
  {
    knowledgeId: '789012',
    content: '这是另一个测试文档，提供了额外的参考信息。',
    metadata: {
      path: 'test/document2.txt'
    },
    relevanceScore: 0.85
  }
];

const mockHistory = [
  {
    role: 'user',
    content: '你好，我想了解一下你们的服务。'
  },
  {
    role: 'assistant',
    content: '您好！请问您具体想了解我们哪方面的服务呢？'
  }
];

const mockQuery = '请告诉我关于测试文档的内容。';

try {
  console.log('测试buildRAGPrompt函数...');
  
  const prompt = buildRAGPrompt(mockSearchResults, mockHistory, mockQuery);
  
  console.log('\n生成的提示词：\n');
  console.log(prompt);
  
  // 验证提示词是否包含正确的参考资料格式
  console.log('\n\n验证结果：');
  
  // 检查系统提示词部分
  if (prompt.includes('[参考资料X](Y)')) {
    console.log('✓ 系统提示词包含了正确的参考资料格式要求');
  } else {
    console.log('✗ 系统提示词缺少正确的参考资料格式要求');
  }
  
  // 检查参考资料部分是否包含knowledgeId
  if (prompt.includes('知识ID: 123456') && prompt.includes('知识ID: 789012')) {
    console.log('✓ 参考资料部分包含了正确的knowledgeId信息');
  } else {
    console.log('✗ 参考资料部分缺少knowledgeId信息');
  }
  
  // 检查输出指示是否要求只添加一次引用
  if (prompt.includes('只在回答的最后添加一次参考资料引用')) {
    console.log('✓ 输出指示明确要求只添加一次参考资料引用');
  } else {
    console.log('✗ 输出指示缺少只添加一次引用的要求');
  }
  
  console.log('\n测试完成！');
} catch (error) {
  console.error('测试过程中发生错误：', error);
}