import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import styles from './chartStyles.module.css';
import { getSecondaryTagReferences } from '../../../../api/statsService';
import type { SecondaryTagReference } from '../../../../api/statsService';



const ReferencePieChart: React.FC = () => {
  // 从API获取的原始数据
  const [apiData, setApiData] = useState<SecondaryTagReference[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  
  // 获取API数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 直接调用getSecondaryTagReferences获取所有二级标签的引用统计
        const data = await getSecondaryTagReferences();
        // 格式化数据，确保totalReferences为数字类型
        const formattedResult = data.map(item => ({
          primaryTag: item.primaryTag,
          secondaryTag: item.secondaryTag,
          totalReferences: parseInt(item.totalReferences.toString()) || 0
        }));
        setApiData(formattedResult);
      } catch (error) {
        console.error('获取二级标签引用统计失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  // 转换API数据为图表所需格式
  const getChartData = (): { name: string; value: number }[] => {
    if (loading || apiData.length === 0) {
      return [];
    }
    
    // 转换为图表所需格式，按引用次数排序
    return apiData
      .sort((a, b) => b.totalReferences - a.totalReferences)
      .map(item => ({
        name: `${item.primaryTag}-${item.secondaryTag}`,
        value: item.totalReferences
      }));
  };
  
  const getOption = () => {
    const chartData = getChartData();
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#1890ff',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 13
        },
        padding: 10,
        borderRadius: 6
      },
      // 移除左下角目录栏
      legend: {
        show: false
      },
      series: [
        {
          name: '引用次数',
          type: 'pie',
          radius: ['30%', '65%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 12,
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}次 ({d}%)',
            fontSize: 11,
            fontWeight: '500',
            color: '#333',
            lineHeight: 16,
            rich: {
              b: {
                color: '#1a1a1a',
                fontSize: 12,
                fontWeight: 'bold'
              },
              c: {
                color: '#1890ff',
                fontSize: 11,
                fontWeight: 'normal'
              },
              d: {
                color: '#666',
                fontSize: 11,
                fontWeight: 'normal'
              }
            }
          },
          labelLine: {
            show: true,
            length: 20,
            length2: 30,
            lineStyle: {
              color: '#999',
              width: 1
            },
            smooth: true
          },
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: chartData
        }
      ]
    };
  };
  
  // 获取总引用次数
  const getTotalReferences = (): number => {
    if (loading || apiData.length === 0) {
      return 0;
    }
    return apiData.reduce((total, item) => total + item.totalReferences, 0);
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>引用分类占比</div>
        <div className={styles.totalReferences}>
          总引用次数：{getTotalReferences()}
        </div>
      </div>
      <ReactECharts 
        option={getOption()} 
        style={{ height: '400px', width: '100%' }} 
        loadingOption={{ text: '加载中...' }}
        showLoading={loading}
      />
    </div>
  );
};

export default ReferencePieChart;