import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import ReferenceBarChart from './components/ReferenceBarChart';
import { getSystemStatistics } from '../../../api/statsService';
import ReferencePieChart from './components/ReferencePieChart';

// 统计数据类型定义
interface StatsData {
  knowledgeBaseCount: number;
  userCount: number;
  qaCount: number;
  viewCount: number;
  referenceCount: number;
}

// 模拟数据（作为后备）
const fallbackData = {
  stats: {
    knowledgeBaseCount: 15,
    userCount: 234,
    qaCount: 1245,
    viewCount: 8923,
    referenceCount: 456
  },
  topQuestions: [
    { id: 1, question: '如何设置商品价格？', count: 156 },
    { id: 2, question: '退款流程是什么？', count: 143 },
    { id: 3, question: '如何处理投诉？', count: 128 },
    { id: 4, question: '物流信息如何查询？', count: 115 },
    { id: 5, question: '会员积分规则是什么？', count: 102 },
    { id: 6, question: '商品库存不足怎么办？', count: 94 },
    { id: 7, question: '如何修改订单信息？', count: 87 },
    { id: 8, question: '发票如何开具？', count: 78 },
    { id: 9, question: '如何联系客服？', count: 72 },
    { id: 10, question: '商品质量问题如何处理？', count: 65 }
  ],
  topKnowledgeBases: [
    { id: 1, name: '商品管理手册', views: 567 },
    { id: 2, name: '售后服务指南', views: 453 },
    { id: 3, name: '会员体系说明', views: 389 },
    { id: 4, name: '物流配送规则', views: 345 },
    { id: 5, name: '退款政策详解', views: 312 },
    { id: 6, name: '商品分类标准', views: 287 },
    { id: 7, name: '促销活动指南', views: 256 },
    { id: 8, name: '发票管理规范', views: 234 },
    { id: 9, name: '客服工作流程', views: 210 },
    { id: 10, name: '库存管理办法', views: 189 }
  ]
};

const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData>(fallbackData.stats);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取系统统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const data = await getSystemStatistics();
        // 转换API数据格式以匹配组件使用的格式
        setStats({
          knowledgeBaseCount: data.knowledgeCount,
          userCount: data.userCount,
          qaCount: data.messageCount,
          viewCount: data.totalViews,
          referenceCount: data.totalReferences
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);
  return (
    <div className={styles.overviewPage}>  
      <h1>概览</h1>
      {/* 统计指标卡片 */}
      <div className={styles.statsContainer} style={{ marginTop: '20px' }}>
        <div className={styles.blueStatsWrapper}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>
              {loading ? '加载中...' : stats.knowledgeBaseCount}
            </p>
            <h3>知识库数量</h3>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>
              {loading ? '加载中...' : stats.userCount}
            </p>
            <h3>用户数量</h3>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>
              {loading ? '加载中...' : stats.qaCount.toLocaleString()}
            </p>
            <h3>问答总量</h3>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>
              {loading ? '加载中...' : stats.viewCount.toLocaleString()}
            </p>
            <h3>浏览总量</h3>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>
              {loading ? '加载中...' : stats.referenceCount.toLocaleString()}
            </p>
            <h3>被引用总量</h3>
          </div>
        </div>
      </div>
      
      {/* 图表展示 */}
      <div className={styles.chartsContainer}>
        <div className={styles.chartWrapperLeft}>
          <ReferenceBarChart />
        </div>
        <div className={styles.chartWrapperRight}>
          <ReferencePieChart />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;