import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Select } from '@arco-design/web-react';
import styles from './chartStyles.module.css';
import { getChunkReferences } from '../../../../api/statsService';
import type { ChunkReference } from '../../../../api/statsService';
import { getAllLabels } from '../../../../api/labelService';
import type { Category } from '../../../../api/labelService';

const Option = Select.Option;

interface ChartDataItem {
  name: string;
  value: number;
}

const ReferenceBarChart: React.FC = () => {
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState('');
  // 从API获取的原始数据
  const [apiData, setApiData] = useState<ChunkReference[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  // 标签数据
  const [categories, setCategories] = useState<Category[]>([]);
  // 标签加载状态
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  
  // 获取标签数据
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getAllLabels();
        setCategories(data);
        
        if (data.length > 0) {
          const firstCategory = data[0];
          setSelectedPrimary(firstCategory.name.toLowerCase());
          
          if (firstCategory.subcategories.length > 0) {
            setSelectedSecondary(firstCategory.subcategories[0].name.toLowerCase());
          }
        }
      } catch (error) {
        console.error('获取标签数据失败:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // 获取API数据
  useEffect(() => {
    // 只有当两个标签都选中时才获取数据
    if (!selectedPrimary || !selectedSecondary) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 根据选中的标签获取数据
        const primaryTag = categories.find(category => 
          category.name.toLowerCase() === selectedPrimary
        )?.name || '';
        
        const selectedCategory = categories.find(category => 
          category.name.toLowerCase() === selectedPrimary
        );
        
        const secondaryTag = selectedCategory?.subcategories.find(sub => 
          sub.name.toLowerCase() === selectedSecondary
        )?.name || '';
        
        const data = await getChunkReferences(primaryTag, secondaryTag);
        setApiData(data);
      } catch (error) {
        console.error('获取分块引用数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPrimary, selectedSecondary, categories]);
  
  // 处理一级标签变化
  useEffect(() => {
    // 当一级标签变化时，重置二级标签为该分类下的第一个标签
    if (selectedPrimary) {
      const selectedCategory = categories.find(category => 
        category.name.toLowerCase() === selectedPrimary
      );
      
      if (selectedCategory && selectedCategory.subcategories.length > 0) {
        setSelectedSecondary(selectedCategory.subcategories[0].name.toLowerCase());
      } else {
        setSelectedSecondary('');
      }
    }
  }, [selectedPrimary, categories]);

  // 转换API数据为图表所需格式
  const getChartData = (): ChartDataItem[] => {
    if (loading || apiData.length === 0) {
      return [];
    }
    
    // 转换为图表所需格式，按引用次数排序
    return apiData
      .sort((a, b) => b.totalReferences - a.totalReferences)
      .map(item => ({
        name: item.title || `文档${item.knowledgeId}`,
        value: item.totalReferences
      }));
  };
  
  const getOption = () => {
    const data = getChartData();

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c}次'
      },
      grid: {
        left: '6%',
        right: '7%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '引用次数',
        nameLocation: 'middle',
        nameGap: 35
      },
      series: [
        {
          name: '引用次数',
          type: 'bar',
          data: data.map(item => item.value),
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#722ed1' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#40a9ff' },
                { offset: 1, color: '#9254de' }
              ])
            }
          }
        }
      ]
    };
  };

  // 根据API数据动态生成二级标签选项
  const getDynamicSecondaryLabels = (): Array<{ value: string; label: string }> => {
    if (!selectedPrimary || categories.length === 0) {
      return [];
    }
    
    // 查找当前选中的一级标签
    const selectedCategory = categories.find(category => 
      category.name.toLowerCase() === selectedPrimary
    );
    
    if (!selectedCategory) {
      return [];
    }
    
    return selectedCategory.subcategories.map(subcategory => ({ 
      value: subcategory.name.toLowerCase(), 
      label: subcategory.name 
    }));
  };
  
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>引用情况统计</div>
        <div className={styles.selectorsContainer}>
          <div className={styles.selectorGroup}>
            <label>一级标签：</label>
            <Select 
              value={selectedPrimary} 
              onChange={setSelectedPrimary}
              style={{ width: 120 }}
              placeholder="选择一级标签"
              disabled={isLoadingCategories}
            >
              {categories.map(category => (
                <Option key={category.id} value={category.name.toLowerCase()}>{category.name}</Option>
              ))}
            </Select>
          </div>
          <div className={styles.selectorGroup}>
            <label>二级标签：</label>
            <Select 
              value={selectedSecondary} 
              onChange={setSelectedSecondary}
              style={{ width: 120 }}
              placeholder="选择二级标签"
              disabled={!selectedPrimary || isLoadingCategories}
            >
              {getDynamicSecondaryLabels().map(label => (
                <Option key={label.value} value={label.value}>{label.label}</Option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <ReactECharts 
        option={getOption()} 
        style={{ height: '400px', width: '100%' }} 
        loadingOption={{ text: '加载中...' }}
        showLoading={loading || isLoadingCategories}
      />
    </div>
  );
};

export default ReferenceBarChart;