// 测试查询所有RAG向量的脚本
const vectorService = require('./src/services/vectorService');

async function testQueryAllRagVectors() {
    console.log('开始测试查询所有RAG向量...');
    
    try {
        // 初始化向量数据库连接
        await vectorService.initVectorDB();
        console.log('向量数据库连接成功');
        
        const { getAllDocuments } = vectorService;
        
        // 查询所有文档块
        console.log('正在查询所有文档块...');
        const allDocuments = await getAllDocuments();
        
        // 打印查询结果统计
        console.log(`\n查询完成！`);
        console.log(`总共找到 ${allDocuments.length} 个文档块`);
        
        // 如果有文档块，打印前5个文档块的基本信息
        if (allDocuments.length > 0) {
            console.log('\n前5个文档块的基本信息：');
            allDocuments.slice(0, 5).forEach((doc, index) => {
                console.log(`\n文档块 ${index + 1}:`);
                console.log(`- 完整结构: ${JSON.stringify(Object.keys(doc), null, 2)}`);
                console.log(`- knowledgeId: ${doc.knowledgeId || 'N/A'}`);
                console.log(`- id: ${doc.id || 'N/A'}`);
                console.log(`- 文本长度: ${doc.content ? doc.content.length : 'N/A'} 字符`);
                console.log(`- 元数据: ${JSON.stringify(doc.metadata || 'N/A', null, 2)}`);
                console.log(`- 向量长度: ${doc.vector ? doc.vector.length : 'N/A'}`);
            });
            
            // 统计不同knowledgeId的文档块数量
            const knowledgeIdStats = {};
            allDocuments.forEach(doc => {
                if (doc.knowledgeId) {
                    knowledgeIdStats[doc.knowledgeId] = (knowledgeIdStats[doc.knowledgeId] || 0) + 1;
                }
            });
            
            console.log('\n各knowledgeId的文档块数量统计：');
            Object.entries(knowledgeIdStats).forEach(([knowledgeId, count]) => {
                console.log(`- ${knowledgeId}: ${count} 个文档块`);
            });
        }
        
    } catch (error) {
        console.error('测试过程中发生错误：', error);
    } finally {
        // 注意：vectorService没有提供disconnect函数，所以不需要断开连接
        console.log('\n测试完成');
    }
}

// 运行测试
testQueryAllRagVectors();