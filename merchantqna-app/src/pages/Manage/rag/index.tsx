import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { Message, Input, Select, Modal, Pagination } from '@arco-design/web-react';
import { getDocumentsByTags, uploadToRAG, removeFromRAG, viewDocumentChunks } from '../../../api/knowledgeService';
import { getAllLabels } from '../../../api/labelService';
import { getKnowledgeChunkReferences } from '../../../api/statsService';
import type { Category } from '../../../api/labelService';
import type { Document } from '../../../api/knowledgeService';

const RAGPage: React.FC = () => {
  // 标签列表状态
  const [categories, setCategories] = useState<Category[]>([]);
  // 用于页面导航
  const navigate = useNavigate();
  // 定义组件状态
  const [loadingModalVisible, setLoadingModalVisible] = useState<boolean>(false);
  const [loadingModalContent, setLoadingModalContent] = useState<string>('');
  const [loadingTime, setLoadingTime] = useState<number>(0);
  // 使用useRef管理计时器
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 树状结构展示状态
  const [showChunksTree, setShowChunksTree] = useState<boolean>(false);
  const [currentDocumentName, setCurrentDocumentName] = useState<string>('');
  const [chunksCount, setChunksCount] = useState<number>(0);
  // 加载标签列表
  const fetchLabels = async () => {
    const labels = await getAllLabels();
    setCategories(labels);
  };

  // 组件挂载时获取标签列表
  useEffect(() => {
    fetchLabels();
  }, []);

  // 标签选择状态
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

  // 当标签数据加载完成后，自动选择第一个一级标签和它的第一个二级标签
  useEffect(() => {
    if (categories.length > 0) {
      // 选择第一个一级标签
      const firstCategory = categories[0];
      setSelectedCategoryId(firstCategory.id);

      // 如果有二级标签，选择第一个
      if (firstCategory.subcategories.length > 0) {
        setSelectedSubcategoryId(firstCategory.subcategories[0].id);
      }
    }
  }, [categories]);

  // 选择一级标签
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // 选择新的一级标签时，默认选中其第一个二级标签
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (selectedCategory && selectedCategory.subcategories.length > 0) {
      setSelectedSubcategoryId(selectedCategory.subcategories[0].id);
    } else {
      // 如果没有二级标签，清空二级标签选择
      setSelectedSubcategoryId('');
    }
  };

  // 选择二级标签
  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  // 获取选中分类的二级标签
  const getSelectedSubcategories = () => {
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  // 监听分类变化，确保选中的二级标签在当前分类中存在
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    if (selectedCategory) {
      const hasSelectedSubcategory = selectedCategory.subcategories.some(
        sub => sub.id === selectedSubcategoryId
      );
      if (!hasSelectedSubcategory && selectedCategory.subcategories.length > 0) {
        setSelectedSubcategoryId(selectedCategory.subcategories[0].id);
      }
    }
  }, [categories, selectedCategoryId, selectedSubcategoryId]);

  // 文档相关状态
  const [documents, setDocuments] = useState<Document[]>([]);

  // API调用函数：使用封装的service获取文档列表
  const fetchDocumentsByTags = async (primaryTag?: string, secondaryTag?: string) => {
    const response = await getDocumentsByTags(primaryTag, secondaryTag);
    if (response.status === 'success') {
      // 根据API响应数据结构设置文档列表
      if ('knowledgeList' in response.data) {
        // 只显示生效中的文档
        const effectiveDocuments = response.data.knowledgeList?.filter((doc: Document) => doc.status === '生效中') || [];
        setDocuments(effectiveDocuments);
      } else {
        // 处理可能的不同响应结构
        setDocuments([]);
      }
    }
  };

  // 当标签选择变化时，调用API获取文档列表
  useEffect(() => {
    // 获取当前选中的一级标签名称
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    const primaryTagName = selectedCategory?.name;

    // 获取当前选中的二级标签名称
    const selectedSubcategory = selectedCategory?.subcategories.find(sub => sub.id === selectedSubcategoryId);
    const secondaryTagName = selectedSubcategory?.name;

    if (!primaryTagName || !secondaryTagName) {
      setDocuments([]);
      return;
    }
    // 调用API获取文档列表
    fetchDocumentsByTags(primaryTagName, secondaryTagName);
  }, [selectedCategoryId, selectedSubcategoryId, categories]);

  // 搜索相关状态
  const [tempSearchName, setTempSearchName] = useState<string>('');
  const [tempUploadFilter, setTempUploadFilter] = useState<string>('');

  // 实际搜索状态（用于筛选数据）
  const [searchName, setSearchName] = useState<string>('');
  const [uploadFilter, setUploadFilter] = useState<string>('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(documents);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // 搜索和筛选文档
  useEffect(() => {
    let result = [...documents];

    // 按名称搜索
    if (searchName) {
      result = result.filter(doc => doc.title.includes(searchName));
    }

    // 按上传状态筛选
    if (uploadFilter === 'uploaded') {
      result = result.filter(doc => doc.isAddedToRAG);
    } else if (uploadFilter === 'notUploaded') {
      result = result.filter(doc => !doc.isAddedToRAG);
    }

    setFilteredDocuments(result);
    // 筛选条件变化时，重置到第一页
    setCurrentPage(1);
  }, [documents, searchName, uploadFilter]);

  // 计算当前页显示的文档
  const getCurrentPageDocuments = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDocuments.slice(startIndex, endIndex);
  };

  // 执行搜索
  const handleSearch = () => {
    setSearchName(tempSearchName);
    setUploadFilter(tempUploadFilter);
  };

  // 重置搜索条件
  const handleResetSearch = () => {
    setTempSearchName('');
    setTempUploadFilter('');
    setSearchName('');
    setUploadFilter('');
  };

  // 上传文档到RAG
  const handleUploadToRAG = (docId: string) => {
    // 使用arco-design默认的确认弹窗样式
    Modal.confirm({
      title: '确认上传',
      content: '确定要将该文档上传到RAG吗？',
      // 使用非异步onOk回调确保弹窗立即关闭
      onOk: () => {
        // 确认弹窗会立即关闭
        
        // 创建异步函数处理后续逻辑
        const processUpload = async () => {
          try {
            // 显示加载弹窗
            setLoadingModalContent('正在上传文档到RAG...');
            setLoadingModalVisible(true);
            setLoadingTime(0);
            
            // 启动计时
            timerRef.current = setInterval(() => {
              setLoadingTime(prev => prev + 1);
            }, 1000);
            
            await uploadToRAG(docId);
            
            // 清除计时器
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // 更新文档列表
            setDocuments(prev => prev.map(doc => 
              doc.id === docId ? { ...doc, isAddedToRAG: true } : doc
            ));
            Message.success('上传成功');
          } catch (error) {
            console.error('上传失败:', error);
            Message.error('上传失败，请重试');
          } finally {
            // 清除计时器
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // 关闭加载弹窗
            setLoadingModalVisible(false);
          }
        };
        
        // 调用异步处理函数
        processUpload();
      }
    });
  };

  // 从RAG移除文档
  const handleRemoveFromRAG = (docId: string) => {
    // 使用arco-design默认的确认弹窗样式
    Modal.confirm({
      title: '确认移除',
      content: '确定要将该文档从RAG中移除吗？',
      // 使用非异步onOk回调确保弹窗立即关闭
      onOk: () => {
        // 确认弹窗会立即关闭
        
        // 创建异步函数处理后续逻辑
        const processRemove = async () => {
          try {
            // 显示加载弹窗
            setLoadingModalContent('正在从RAG移除文档...');
            setLoadingModalVisible(true);
            setLoadingTime(0);
            
            // 启动计时
            timerRef.current = setInterval(() => {
              setLoadingTime(prev => prev + 1);
            }, 1000);
            
            await removeFromRAG(docId);
            
            // 清除计时器
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // 更新文档列表
            setDocuments(prev => prev.map(doc => 
              doc.id === docId ? { ...doc, isAddedToRAG: false } : doc
            ));
            Message.success('移除成功');
          } catch (error) {
            console.error('移除失败:', error);
            Message.error('移除失败，请重试');
          } finally {
            // 清除计时器
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // 关闭加载弹窗
            setLoadingModalVisible(false);
          }
        };
        
        // 调用异步处理函数
        processRemove();
      }
    });
  };

  // 查看文档分块
  const handleViewChunks = async (docId: string, docName: string) => {
    try {
      setShowChunksTree(false); // 先隐藏树状结构
      // 获取文档分块数据
      const chunksResponse = await viewDocumentChunks(docId);
      const { chunks } = chunksResponse.data;
      
      // 获取分块引用量数据
      const referencesData = await getKnowledgeChunkReferences(docId);
      
      // 将引用量数据与分块数据关联
      const chunksWithReferences = chunks.map((chunk: any) => {
        const referenceInfo = referencesData.find(ref => ref.chunkId === chunk.id);
        return {
          ...chunk,
          referenceCount: referenceInfo ? referenceInfo.referenceCount : 0
        };
      });
      
      // 更新状态
      setCurrentDocumentName(docName);
      setChunksCount(chunks.length); // 设置分块数量
      setShowChunksTree(true); // 显示树状结构
      
      // 延迟执行以确保DOM已渲染
      setTimeout(() => {
        renderChunksTree(chunksWithReferences, docId);
      }, 100);
    } catch (error) {
      console.error('查看分块失败:', error);
      Message.error('查看分块失败，请稍后重试');
    }
  };
  
  // 使用ECharts渲染分块树状结构
  const renderChunksTree = async (chunks: any[], docId: string) => {
    try {
      // 导入ECharts
      const echarts = await import('echarts');
      
      // 初始化图表实例
      const chartDom = document.getElementById('chunksTree');
      if (!chartDom) return;
      
      const myChart = echarts.init(chartDom);
    
      // 构建树状数据结构
      const treeData = buildTreeData(chunks);
      console.log(treeData)
      
      // 计算树的深度
      const calculateTreeDepth = (node: any): number => {
        if (!node.children || node.children.length === 0) {
          return 1;
        }
        return 1 + Math.max(...node.children.map((child: any) => calculateTreeDepth(child)));
      };
      
      const treeDepth = calculateTreeDepth(treeData);
      // 初始打开到倒数第二层
      const initialDepth = Math.max(1, treeDepth - 2);
      
      // 图表配置
      const option = {
        legend: {
          orient: 'vertical',
          left: '5%',
          top: 'center',
          data: [
            { name: '≥ 50 次引用', itemStyle: { color: '#ff4d4f' } },
            { name: '20 - 49 次引用', itemStyle: { color: '#fa8c16' } },
            { name: '10 - 19 次引用', itemStyle: { color: '#faad14' } },
            { name: '1 - 9 次引用', itemStyle: { color: '#52c41a' } },
            { name: '0 次引用', itemStyle: { color: '#d9d9d9' } }
          ],
          textStyle: {
            fontSize: 12,
            color: '#333'
          },
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 15
        },
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          formatter: (params: any) => {
            // 构建tooltip内容
            let tooltipContent = `<div style="padding: 12px; max-width: 600px; border-radius: 8px;">`;
            
            // 显示节点名称
            tooltipContent += `<div style="margin-bottom: 8px; padding: 8px; background-color: #f0f9ff; border-radius: 4px;">`;
            tooltipContent += `<span style="color: #1890ff; font-weight: bold; font-size: 12px;">名称:</span> `;
            tooltipContent += `<span style="color: #333; font-size: 12px; line-height: 1.4;margin-left: 10px;">${params.data.name}</span>`;
            tooltipContent += `</div>`;
            
            // 显示路径信息
            if (params.data.path) {
              tooltipContent += `<div style="margin-bottom: 8px; padding: 8px; background-color: #f0f9ff; border-radius: 4px;">`;
              tooltipContent += `<span style="color: #1890ff; font-weight: bold; font-size: 12px;">路径:</span> `;
              tooltipContent += `<span style="color: #333; font-size: 12px; line-height: 1.4;margin-left: 10px;">${params.data.path}</span>`;
              tooltipContent += `</div>`;
            }
            
            // 显示引用量 - 所有节点都显示
            tooltipContent += `<div style="margin-top: 8px; padding: 8px; background-color: #fff2e8; border-radius: 4px;">`;
            tooltipContent += `<span style="color: #fa8c16; font-weight: bold; font-size: 12px;">引用量:</span> `;
            tooltipContent += `<span style="color: #333; font-size: 12px; margin-left: 10px;line-height: 1.4">${params.data.referenceCount || 0} 次</span>`;
            tooltipContent += `</div>`;
            
            // 显示内容（如果有）
            if (params.data.value) {
              // 显示内容的前100个字符，支持换行
              const content = params.data.value.length > 100 
                ? params.data.value.substring(0, 100) + '...' 
                : params.data.value;
              // 替换换行符为<br/>以支持换行显示
              const formattedContent = content.replace(/\n/g, '<br/>');
              
              tooltipContent += `<div style="margin-top: 8px;display: flex;padding:  8px;align-items: flex-start;">`;
              tooltipContent += `<div style="color: #1890ff; font-weight: bold; font-size: 12px;margin-top: 8px;">内容:</div>`;
              tooltipContent += `<div style="font-size: 13px; line-height: 1.5; color: #555; white-space: pre-wrap; word-break: break-word;margin-left: 10px;">${formattedContent}</div>`;
              tooltipContent += `</div>`;
            }
            
            tooltipContent += `</div>`;
            
            return tooltipContent;
          },
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderColor: '#e6f7ff',
          borderWidth: 2,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)',
          textStyle: {
            color: '#333',
            fontSize: 13,
            lineHeight: 1.5
          },
          padding: 10
        },
        series: [
            {
              type: 'tree',
            data: [treeData],
            top: '10%',
            left: '20%',
            bottom: '10%',
            right: '20%',
              symbolSize: (_value: any, params: any) => {
                // 根据节点类型设置不同的大小
                if (params.data.name === '内容') {
                  return 8;
                }
                if (params.data.name === '文档结构') {
                  return 14;
                }
                return 10;
              },
              symbol: (_value: any, params: any) => {
                // 根据节点类型设置不同的图标
                if (params.data.name === '内容') {
                  return 'rect';
                }
                return 'circle';
              },
              label: {
                position: 'left',
                verticalAlign: 'middle',
                align: 'right',
                fontSize: 14,
                fontWeight: 'normal',
                color: '#333',
                formatter: (params: any) => {
                  // 不显示content节点的完整内容，只显示名称
                  if (params.data.name === 'content') {
                    return '内容';
                  }
                  return params.data.name;
                },
                padding: [0, 10, 0, 0],
                rich: {
                  name: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#1890ff'
                  }
                }
              },
              leaves: {
                label: {
                  position: 'right',
                  verticalAlign: 'middle',
                  align: 'left',
                  fontSize: 13,
                  color: '#666',
                  formatter: (params: any) => {
                    // 只显示ID，不显示内容
                    return params.data.name;
                  },
                  padding: [0, 0, 0, 10]
                }
              },
              emphasis: {
                focus: 'descendant',
                itemStyle: {
                  shadowBlur: 15,
                  shadowOffsetX: 0,
                  shadowOffsetY: 2,
                  shadowColor: 'rgba(24, 144, 255, 0.4)'
                },
                label: {
                  color: '#1890ff',
                  fontWeight: 'bold',
                  fontSize: 15,
                  textShadowBlur: 2,
                  textShadowColor: 'rgba(24, 144, 255, 0.5)'
                }
              },
              expandAndCollapse: true,
              lineStyle: {
                width: 2.5,
                type: 'curve',
                color: '#e0e0e0',
                curveness: 0.5
              },
              animationDuration: 700,
              animationDurationUpdate: 900,
              animationEasing: 'cubicOut',
              animationEasingUpdate: 'cubicOut',
              initialTreeDepth: initialDepth,
              roam: true, // 启用缩放和平移
              zoom: 1 // 初始缩放比例
            }
          ]
      };
      
      // 设置图表配置
      myChart.setOption(option);
      
      // 添加点击事件处理
      myChart.on('click', (params: any) => {
        // 检查是否是content节点
        if (params.data && params.data.id && params.data.path) {
          // 调整path格式：删除第一个节点，将连接符号改为"-"
          const adjustedPath = params.data.path
            .split(' > ') // 按当前连接符号分割
            .slice(1) // 删除第一个节点
            .join('-'); // 使用"-"连接
          
          // 跳转到详情页面，传递文档ID和调整后的路径参数
          navigate(`/rules/${docId}?path=${encodeURIComponent(adjustedPath)}`);
        }
      });
      
      // 监听窗口大小变化，自适应图表
      window.addEventListener('resize', () => {
        myChart.resize();
      });
    } catch (error) {
      console.error('渲染分块树状结构失败:', error);
    }
  };
  
  // 构建树状数据结构
  const buildTreeData = (chunks: any[]) => {
    // 如果没有分块数据，返回空数组
    if (chunks.length === 0) {
      return [];
    }
    
    // 根据引用量获取颜色的函数
    const getColorByReferenceCount = (count: number) => {
      if (count >= 50) return '#ff4d4f'; // 高引用量 - 红色
      if (count >= 20) return '#fa8c16'; // 中高引用量 - 橙色
      if (count >= 10) return '#faad14'; // 中引用量 - 黄色
      if (count >= 1) return '#52c41a'; // 低引用量 - 绿色
      return '#d9d9d9'; // 无引用 - 灰色
    };
    
    // 递归计算节点的引用次数总和
    const calculateReferenceCount = (node: any) => {
      if (!node.children || node.children.length === 0) {
        return node.referenceCount || 0;
      }
      
      let totalCount = 0;
      for (const child of node.children) {
        totalCount += calculateReferenceCount(child);
      }
      
      node.referenceCount = totalCount;
      return totalCount;
    };
    
    // 创建一个临时根节点，用于构建树结构
    const tempRoot: any = {
      name: 'tempRoot', // 临时名称，后面会被移除
      children: [],
      referenceCount: 0, // 根节点引用次数初始化为0
      itemStyle: {
        color: '#1890ff'
      },
      label: {
        color: '#1890ff',
        fontWeight: 'bold',
        fontSize: 14
      }
    };
    
    // 创建路径映射，用于快速查找父节点
    const pathMap: any = { '': tempRoot };
    
    chunks.forEach((chunk, index) => {
      const { metadata, id, content } = chunk;
      
      // 获取当前分块的引用量
      const referenceCount = chunk.referenceCount || 0;
      const nodeColor = getColorByReferenceCount(referenceCount);
      
      // 确保path属性存在，避免TypeError
      if (!metadata.path) {
        // 如果没有path属性，直接作为根节点的子节点
        const leafNode = {
          name: `分块 ${id || index + 1}`,
          value: content || '无内容',
          referenceCount: referenceCount,
          itemStyle: {
            color: nodeColor
          },
          label: {
            color: nodeColor
          }
        };
        tempRoot.children.push(leafNode);
        return;
      }
      
      const pathParts = metadata.path.split('-');
      
      // 构建当前节点的完整路径
      let currentPath = '';
      
      pathParts.forEach((part: string, partIndex: number) => {
        // 构建当前层级的路径
        currentPath += (currentPath ? '-' : '') + part;
        
        // 如果当前路径不存在，创建新节点
        if (!pathMap[currentPath]) {
          // 找到父节点路径
          const parentPath = pathParts.slice(0, partIndex).join('-');
          const parentNode = pathMap[parentPath];
          
          // 生成更友好的节点名称
          let nodeName = part;
          if (part.match(/^\d+$/)) {
            nodeName = `层级 ${part}`;
          } else if (part.toLowerCase().startsWith('section')) {
            nodeName = `章节 ${part.substring(7)}`;
          } else if (part.toLowerCase().startsWith('paragraph')) {
            nodeName = `段落 ${part.substring(10)}`;
          } else if (part.toLowerCase().startsWith('sentence')) {
            nodeName = `句子 ${part.substring(8)}`;
          }
          
          // 创建新节点
          const newNode = {
            name: nodeName,
            children: [],
            referenceCount: 0, // 初始化引用次数为0
            itemStyle: {
              color: '#fa8c16'
            },
            label: {
              color: '#fa8c16'
            }
          };
          
          // 添加到父节点的children中
          parentNode.children.push(newNode);
          
          // 保存到路径映射中
          pathMap[currentPath] = newNode;
        }
      });
      
      // 在当前路径下添加content节点
      const currentNode = pathMap[currentPath];
      
      // 构建友好的路径显示名称
      let displayPath = '';
      pathParts.forEach((part: string, idx: number) => {
        let partName = part;
        if (part.match(/^\d+$/)) {
          partName = `层级 ${part}`;
        } else if (part.toLowerCase().startsWith('section')) {
          partName = `章节 ${part.substring(7)}`;
        } else if (part.toLowerCase().startsWith('paragraph')) {
          partName = `段落 ${part.substring(10)}`;
        } else if (part.toLowerCase().startsWith('sentence')) {
          partName = `句子 ${part.substring(8)}`;
        }
        displayPath += (idx > 0 ? ' > ' : '') + partName;
      });
      
      // 创建当前文档分块节点并添加到父节点的子节点列表中
      const leafNode = {
        name: `${id}`,
        value: content,
        id: id,
        path: displayPath,
        referenceCount: referenceCount,
        itemStyle: {
          color: nodeColor
        },
        label: {
          color: nodeColor
        }
      };
      currentNode.children.push(leafNode);
    });
    
    // 计算所有父节点的引用次数总和
    calculateReferenceCount(tempRoot);
    
    // 为所有节点设置颜色
    const setNodeColors = (node: any) => {
      const nodeColor = getColorByReferenceCount(node.referenceCount);
      node.itemStyle = { color: nodeColor };
      node.label = { color: nodeColor };
      
      if (node.children) {
        for (const child of node.children) {
          setNodeColors(child);
        }
      }
    };
    
    setNodeColors(tempRoot);
    
    // 移除临时根节点，直接返回其子节点
    // 如果只有一个子节点，则直接返回该子节点作为树的根节点
    if (tempRoot.children.length === 1) {
      return tempRoot.children[0];
    } else {
      // 如果有多个子节点，返回一个包含所有子节点的节点
      return {
        name: '文档结构',
        children: tempRoot.children,
        referenceCount: tempRoot.referenceCount,
        itemStyle: {
          color: getColorByReferenceCount(tempRoot.referenceCount)
        },
        label: {
          color: getColorByReferenceCount(tempRoot.referenceCount),
          fontWeight: 'bold',
          fontSize: 16
        }
      };
    }
  };

  return (
    <div className={styles.manageContainer}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>RAG上传</h2>
        <div className={styles.contentWrapper}>
          {/* 搜索区域 */}
          <div className={styles.searchContainer}>
            <div className={styles.searchForm}>
              {/* 一级标签 */}
              <div className={styles.searchItem}>
                <label>一级标签：</label>
                <Select
                  value={selectedCategoryId}
                  onChange={(value) => handleCategorySelect(value)}
                  options={categories.map(category => ({
                    label: category.name,
                    value: category.id
                  }))}
                  style={{ width: 150 }}
                />
              </div>
              
              {/* 二级标签 */}
              <div className={styles.searchItem}>
                <label>二级标签：</label>
                <Select
                  value={selectedSubcategoryId}
                  onChange={(value) => handleSubcategorySelect(value)}
                  options={getSelectedSubcategories().map(subcategory => ({
                    label: subcategory.name,
                    value: subcategory.id
                  }))}
                  style={{ width: 150 }}
                  disabled={!selectedCategoryId}
                />
              </div>
              
              {/* 文档名称 */}
              <div className={styles.searchItem}>
                <label htmlFor="searchName">文档名称：</label>
                <Input
                  id="searchName"
                  className={styles.searchInput}
                  value={tempSearchName}
                  onChange={(e) => setTempSearchName(e)}
                  placeholder="请输入文档名称"
                  style={{ width: 200 }}
                />
              </div>
              
              {/* 是否上传 */}
              <div className={styles.searchItem}>
                <label htmlFor="uploadFilter">是否上传：</label>
                <Select
                  id="uploadFilter"
                  value={tempUploadFilter}
                  onChange={(value) => setTempUploadFilter(value)}
                  options={[
                    { label: '全部', value: '' },
                    { label: '已上传', value: 'uploaded' },
                    { label: '未上传', value: 'notUploaded' }
                  ]}
                  style={{ width: 120 }}
                />
              </div>
              
              {/* 搜索和重置按钮 */}
              <div className={styles.searchButtons}>
                <button className={styles.searchButton} onClick={handleSearch}>
                  搜索
                </button>
                <button className={styles.resetButton} onClick={handleResetSearch}>
                  重置
                </button>
              </div>
            </div>
          </div>

          {/* 主体表格 */}
          <div className={styles.tableContainer}>
            <table className={styles.documentTable}>
              <thead>
                <tr>
                  <th>文档名称</th>
                  <th>发布时间</th>
                  <th>是否上传</th>
                  <th style={{textAlign: 'center'}}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length > 0 ? (
                  getCurrentPageDocuments().map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.title}</td>
                      <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <span className={doc.isAddedToRAG ? styles.statusUploaded : styles.statusNotUploaded}>
                          {doc.isAddedToRAG ? '已上传' : '未上传'}
                        </span>
                      </td>
                      <td className={styles.actionCells}>
                        {doc.isAddedToRAG ? (
                          <>
                            <button 
                              className={`${styles.actionIcon} ${styles.view}`} 
                              onClick={() => handleViewChunks(doc.id, doc.title)}
                              title="查看分块"
                            >
                              查看分块
                            </button>
                            <button 
                              className={`${styles.actionIcon} ${styles.remove}`} 
                              onClick={() => handleRemoveFromRAG(doc.id)}
                              title="移除"
                            >
                              移除
                            </button>
                          </>
                        ) : (
                          <button 
                            className={`${styles.actionIcon} ${styles.upload}`} 
                            onClick={() => handleUploadToRAG(doc.id)}
                            title="上传"
                          >
                            上传
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 - 使用arco-design组件 */}
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>共{filteredDocuments.length}条数据</div>
            <Pagination
              total={filteredDocuments.length}
              current={currentPage}
              pageSize={pageSize}
              sizeCanChange
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>
          
        </div>
      </div>
    
    {/* 树状结构全屏弹窗 */}
    {showChunksTree && (
      <div className={styles.chunksTreeOverlay}>
        <div className={styles.chunksTreeModal}>
          <div className={styles.chunksTreeHeader}>
            <h3 className={styles.chunksTreeTitle}>
              文档分块 - {currentDocumentName}
            </h3>
            <button 
              className={styles.closeChunksTreeButton}
              onClick={() => setShowChunksTree(false)}
              title="关闭"
            >
              ×
            </button>
          </div>
          <div className={styles.chunksTreeContent}>
            <div id="chunksTree" className={styles.chunksTreeChart}></div>
            <div className={styles.chunksTreeDataCount}>
              共 {chunksCount} 条分块数据
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#ff4d4f', display: 'inline-block', marginRight: '8px' }}></span>
                  <span>红色：≥ 50 次引用</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#fa8c16', display: 'inline-block', marginRight: '8px' }}></span>
                  <span>橙色：20 - 49 次引用</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#faad14', display: 'inline-block', marginRight: '8px' }}></span>
                  <span>黄色：10 - 19 次引用</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#52c41a', display: 'inline-block', marginRight: '8px' }}></span>
                  <span>绿色：1 - 9 次引用</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#d9d9d9', display: 'inline-block', marginRight: '8px' }}></span>
                  <span>灰色：0 次引用</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* 加载弹窗 - 移除了className，使用默认样式 */}
    <Modal
      title="处理中"
      visible={loadingModalVisible}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingContent}>
          <div className={styles.loadingText}>{loadingModalContent}</div>
          <div className={styles.loadingTimer}>等待中... {loadingTime}s</div>
        </div>
      </div>
    </Modal>
    
    </div>
  );
};

export default RAGPage;