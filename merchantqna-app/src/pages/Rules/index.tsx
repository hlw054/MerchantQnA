import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { IconSearch } from '@arco-design/web-react/icon';
import { Pagination } from '@arco-design/web-react';
import { getDocumentsByTags } from '../../api/knowledgeService';
import type { Document } from '../../api/knowledgeService';
import { getAllLabels } from '../../api/labelService';
import type { Category } from '../../api/labelService';

const Rules: React.FC = () => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();

  // 根据选中的标签获取文档数据
  const fetchDocuments = async (primaryTag?: string, secondaryTag?: string) => {
    console.log('调用fetchDocuments，参数:', { primaryTag, secondaryTag });
    setLoading(true);
    try {
      const result = await getDocumentsByTags(primaryTag, secondaryTag);
      console.log('获取文档结果:', result);
      // 直接设置documents，getDocumentsByTags函数内部已经处理了数据结构
      if (result && 'knowledgeList' in result.data) {
        // 确保文档数据包含isAddedToRAG属性
        const processedDocuments = result.data.knowledgeList.map((doc: any) => ({
          ...doc,
          isAddedToRAG: doc.isAddedToRAG || false
        }));
        setDocuments(processedDocuments);
        console.log('设置的文档数据:', processedDocuments);
      } else {
        console.error('响应数据结构不正确:', result);
        setDocuments([]);
      }
    } catch (error) {
      console.error('获取文档失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤功能
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  // 在文档数据或搜索关键字变化时应用过滤
  useEffect(() => {
    // 先过滤出状态为生效中的文档
    const activeDocuments = documents.filter(doc => doc.status === '生效中');
    
    if (!searchKeyword.trim()) {
      // 如果搜索关键字为空，只显示生效中的文档
      setFilteredDocuments(activeDocuments);
    } else {
      // 否则，在生效中文档的基础上过滤包含搜索关键字的文档
      const keyword = searchKeyword.toLowerCase().trim();
      const filtered = activeDocuments.filter(doc => 
        doc.title.toLowerCase().includes(keyword)
      );
      setFilteredDocuments(filtered);
    }
    // 重置当前页码到第一页
    setCurrentPage(1);
  }, [documents, searchKeyword]);

  // 分页逻辑
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  const handleTreeSelect = (keys: string[]) => {
    console.log('handleTreeSelect被调用，keys:', keys);
    console.log('当前的categories:', categories);
    
    // 创建URL参数对象
    const params = new URLSearchParams();
    
    // 根据选中的key解析出primaryTag和secondaryTag
    if (keys.length === 2) {
      // 二级标签 - keys直接包含primaryId和secondaryId
      const [primaryId, secondaryId] = keys;
      console.log('解析出的primaryId:', primaryId);
      console.log('解析出的secondaryId:', secondaryId);
      
      const primaryCategory = categories.find(category => category.id === primaryId);
      const secondaryCategory = primaryCategory?.subcategories.find(sub => sub.id === secondaryId);
      console.log('解析出的primaryTag:', primaryCategory?.name);
      console.log('解析出的secondaryTag:', secondaryCategory?.name);
      
      if (primaryCategory && secondaryCategory) {
        // 设置选中状态
        const combinedKey = `${primaryId}__${secondaryId}`; // 使用__作为分隔符
        setSelectedKeys([combinedKey]);
        
        // 设置URL参数
        params.set('primaryTag', primaryCategory.name);
        params.set('secondaryTag', secondaryCategory.name);
        
        fetchDocuments(primaryCategory.name, secondaryCategory.name);
      }
    } else if (keys.length === 1) {
      const selectedKey = keys[0];
      console.log('selectedKey:', selectedKey);
      
      // 检查是否是二级标签的combinedKey
      if (selectedKey.includes('__')) {
        // 从combinedKey中解析出primaryId和secondaryId
        const [primaryId, secondaryId] = selectedKey.split('__', 2);
        const primaryCategory = categories.find(category => category.id === primaryId);
        const secondaryCategory = primaryCategory?.subcategories.find(sub => sub.id === secondaryId);
        
        if (primaryCategory && secondaryCategory) {
          // 设置选中状态
          setSelectedKeys([selectedKey]);
          
          // 设置URL参数
          params.set('primaryTag', primaryCategory.name);
          params.set('secondaryTag', secondaryCategory.name);
          
          fetchDocuments(primaryCategory.name, secondaryCategory.name);
        }
      } else {
        // 一级标签
        const primaryCategory = categories.find(category => category.id === selectedKey);
        
        if (primaryCategory) {
          // 设置选中状态
          setSelectedKeys([selectedKey]);
          
          // 设置URL参数
          params.set('primaryTag', primaryCategory.name);
          
          fetchDocuments(primaryCategory.name);
        }
      }
    } else {
      // 未选中任何标签，获取全部文档
      fetchDocuments();
    }
    
    // 更新浏览器URL，保持路由与选中状态一致
    const queryString = params.toString();
    navigate({ search: queryString ? `?${queryString}` : '' });
  };

  // 获取标签数据
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getAllLabels();
        console.log('获取到的标签数据:', data);
        // 检查标签数据的结构
        if (data && data.length > 0) {
          console.log('第一个分类的结构:', data[0]);
          console.log('第一个分类的ID:', data[0].id);
          if (data[0].subcategories && data[0].subcategories.length > 0) {
            console.log('第一个子分类的结构:', data[0].subcategories[0]);
            console.log('第一个子分类的ID:', data[0].subcategories[0].id);
          }
        }
        setCategories(data);
        
        // 如果有标签数据，设置默认展开和选中状态
        if (data.length > 0) {
          const firstCategory = data[0];
          setExpandedKeys([firstCategory.id]);
          
          // 如果第一个分类有子标签，默认选中第一个子标签
          if (firstCategory.subcategories.length > 0) {
            const firstSubcategory = firstCategory.subcategories[0];
            const defaultSelectedKey = `${firstCategory.id}__${firstSubcategory.id}`; // 使用__作为分隔符
            setSelectedKeys([defaultSelectedKey]);
            // 调用fetchDocuments获取默认标签的文档数据
            fetchDocuments(firstCategory.name, firstSubcategory.name);
          } else {
            // 如果没有子标签，只选中一级标签
            fetchDocuments(firstCategory.name);
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

  // 从URL参数获取标签并选中对应的目录项
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const primaryTag = params.get('primaryTag');
    const secondaryTag = params.get('secondaryTag');
    
    // 根据标签名称查找对应的ID
    let selectedKey = '';
    let expandKey = '';
    let primaryCategory = undefined;
    let secondaryCategory = undefined;
    
    if (primaryTag) {
      // 查找一级标签
      primaryCategory = categories.find(category => category.name === primaryTag);
      if (primaryCategory) {
        expandKey = primaryCategory.id;
        
        if (secondaryTag) {
          // 查找二级标签
          secondaryCategory = primaryCategory.subcategories.find(sub => sub.name === secondaryTag);
          if (secondaryCategory) {
            selectedKey = `${primaryCategory.id}__${secondaryCategory.id}`;
          }
        }
      }
    }
    
    // 设置展开状态
    if (expandKey) {
      setExpandedKeys([expandKey]);
    }
    
    // 设置选中状态并获取数据
    if (selectedKey) {
      setSelectedKeys([selectedKey]);
      fetchDocuments(primaryTag || undefined, secondaryTag || undefined);
    } else if (primaryTag && primaryCategory) {
      // 只有一级标签时
      if (primaryCategory.subcategories.length > 0) {
        // 如果一级标签有子标签，自动选中第一个子标签
        const firstSubcategory = primaryCategory.subcategories[0];
        const combinedKey = `${primaryCategory.id}__${firstSubcategory.id}`;
        setSelectedKeys([combinedKey]);
        fetchDocuments(primaryCategory.name, firstSubcategory.name);
        
        // 更新URL参数，添加secondaryTag
        const params = new URLSearchParams(location.search);
        params.set('secondaryTag', firstSubcategory.name);
        navigate({ search: params.toString() });
      } else {
        // 如果一级标签没有子标签，只选中一级标签
        fetchDocuments(primaryTag);
      }
    } else if (categories.length > 0) {
      // 默认加载第一个分类的第一个子标签（如果有）
      const firstCategory = categories[0];
      setExpandedKeys([firstCategory.id]);
      
      if (firstCategory.subcategories.length > 0) {
        const firstSubcategory = firstCategory.subcategories[0];
        const defaultSelectedKey = `${firstCategory.id}__${firstSubcategory.id}`;
        setSelectedKeys([defaultSelectedKey]);
        fetchDocuments(firstCategory.name, firstSubcategory.name);
      } else {
        // 如果没有子标签，只加载一级标签
        fetchDocuments(firstCategory.name);
      }
    }
  }, [location.search, categories]);

  return (
    <div className={styles.knowledgeContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>知识中心</div>
      </div>
      
      {/* 导航栏 */}

      <div className={styles.navCardBox}>
        <div className={styles.navItems}>
          <div className={styles.navItemActive}>知识库</div>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.customSearchBox}>
            <input 
              type="text" 
              placeholder="请输入搜索关键字" 
              className={styles.customInput}
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className={styles.searchIcon}>
              <IconSearch />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* 左侧目录 - 动态结构 */}
        <div className={styles.leftSidebar}>
          {isLoadingCategories ? (
            <div className={styles.loadingText}>加载标签中...</div>
          ) : categories.length > 0 ? (
            <ul className={styles.treeList}>
              {categories.map((category) => (
                <li key={category.id}>
                  <div 
                    className={`${styles.treeItem} ${expandedKeys.includes(category.id) ? styles.expanded : ''}`}
                    onClick={() => setExpandedKeys(prev => 
                      prev.includes(category.id) 
                        ? prev.filter(key => key !== category.id) 
                        : [...prev, category.id]
                    )}
                    style={{ cursor: isLoadingCategories ? 'not-allowed' : 'pointer', opacity: isLoadingCategories ? 0.6 : 1 }}
                  >
                    <span className={`${styles.expandIcon} ${expandedKeys.includes(category.id) ? styles.expanded : ''}`}>▸</span>
                    <span className={styles.treeTitle}>{category.name}</span>
                  </div>
                  {category.subcategories.length > 0 && expandedKeys.includes(category.id) && (
                    <ul className={styles.treeSubList}>
                      {category.subcategories.map((subcategory) => {
                        const primaryId = category.id;
                        const secondaryId = subcategory.id;
                        const combinedKey = `${primaryId}__${secondaryId}`; // 使用__作为分隔符
                        return (
                          <li key={combinedKey}>
                            <div 
                              className={`${styles.treeItem} ${styles.treeSubItem} ${selectedKeys.includes(combinedKey) ? styles.selected : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // 传递primaryId和secondaryId，而不是combinedKey
                                handleTreeSelect([primaryId, secondaryId]);
                              }}
                              style={{ cursor: isLoadingCategories ? 'not-allowed' : 'pointer', opacity: isLoadingCategories ? 0.6 : 1 }}
                            >
                              <span className={styles.treeTitle}>{subcategory.name}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyText}>暂无标签数据</div>
          )}
        </div>

        {/* 右侧内容列表 - 简化结构 */}
        <div className={styles.rightContent}>
          <div className={styles.knowledgeList}>
            {loading ? (
              <div className={styles.loadingText}>加载中...</div>
            ) : paginatedDocuments.length > 0 ? (
              paginatedDocuments.map((item) => (
                <div 
                  key={item.id} 
                  className={styles.knowledgeItem}
                  onClick={() => navigate(`/rules/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.knowledgeTitle}>{item.title}</div>
                  <div className={styles.knowledgeDate}>
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('zh-CN') : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyText}>
                {searchKeyword ? '没有找到匹配的文档' : '暂无相关文档'}
              </div>
            )}
          </div>
          
          {/* 分页控件 - 使用Arco Design的Pagination组件 */}
          {!loading && filteredDocuments.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Rules;