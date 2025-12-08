// 测试通过knowledgeId删除向量的脚本
const vectorService = require('./src/services/vectorService');

async function testDeleteByKnowledgeId() {
    console.log('开始测试通过knowledgeId删除向量...');
    
    try {
        // 初始化向量数据库连接
        await vectorService.initVectorDB();
        console.log('向量数据库连接成功');
        
        const { getAllDocuments, deleteByKnowledgeId } = vectorService;
        
        // 测试用的knowledgeId
        const testKnowledgeId = '4d8d2136-4e4f-4e34-bf2f-a7ff0333913a';
        
        // 查询删除前的文档块数量
        console.log('\n1. 查询删除前的所有文档块...');
        const allDocsBefore = await getAllDocuments();
        console.log(`删除前总共有 ${allDocsBefore.length} 个文档块`);
        
        // 查询指定knowledgeId的文档块数量
        const docsWithKnowledgeId = allDocsBefore.filter(doc => doc.knowledgeId === testKnowledgeId);
        console.log(`删除前knowledgeId为 ${testKnowledgeId} 的文档块数量: ${docsWithKnowledgeId.length} 个`);
        
        // 执行删除操作
        console.log('\n2. 执行删除操作...');
        const deleteResult = await deleteByKnowledgeId(testKnowledgeId);
        console.log('删除结果:', deleteResult);
        
        // 查询删除后的文档块数量
        console.log('\n3. 查询删除后的所有文档块...');
        const allDocsAfter = await getAllDocuments();
        console.log(`删除后总共有 ${allDocsAfter.length} 个文档块`);
        
        // 查询指定knowledgeId的文档块数量
        const docsWithKnowledgeIdAfter = allDocsAfter.filter(doc => doc.knowledgeId === testKnowledgeId);
        console.log(`删除后knowledgeId为 ${testKnowledgeId} 的文档块数量: ${docsWithKnowledgeIdAfter.length} 个`);
        
        // 计算删除的数量
        const deletedCount = docsWithKnowledgeId.length - docsWithKnowledgeIdAfter.length;
        console.log('\n4. 验证删除结果:');
        console.log(`- 预期删除数量: ${docsWithKnowledgeId.length} 个`);
        console.log(`- 实际删除数量: ${deletedCount} 个`);
        console.log(`- 删除前总数: ${allDocsBefore.length} 个`);
        console.log(`- 删除后总数: ${allDocsAfter.length} 个`);
        console.log(`- 总数变化: ${allDocsBefore.length - allDocsAfter.length} 个`);
        
        // 验证删除是否成功
        if (docsWithKnowledgeIdAfter.length === 0) {
            console.log('✅ 删除成功：与指定knowledgeId关联的所有文档块已被删除');
        } else {
            console.log(`❌ 删除失败：还有 ${docsWithKnowledgeIdAfter.length} 个文档块未被删除`);
        }
        
    } catch (error) {
        console.error('测试过程中发生错误：', error);
    } finally {
        console.log('\n测试完成');
    }
}

// 运行测试
testDeleteByKnowledgeId();