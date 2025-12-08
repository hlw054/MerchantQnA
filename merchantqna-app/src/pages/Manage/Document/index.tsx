import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { Message, Input, DatePicker, Select, Modal, Pagination } from '@arco-design/web-react';
import { IconCloseCircle } from '@arco-design/web-react/icon';
import { getDocumentsByTags, createDocument, deleteDocument } from '../../../api/knowledgeService';
import { getAllLabels, createPrimaryLabel, createSecondaryLabel, deletePrimaryLabel, deleteSecondaryLabel } from '../../../api/labelService';
import type { Category } from '../../../api/labelService';
import type { Document } from '../../../api/knowledgeService';

// Document接口已从knowledgeService导入

const Manage: React.FC = () => {
  // 用于页面导航
  const navigate = useNavigate();
  
  // API调用函数：使用封装的service获取文档列表
  const fetchDocumentsByTags = async (primaryTag?: string, secondaryTag?: string) => {
    const response = await getDocumentsByTags(primaryTag, secondaryTag);
    if (response.status === 'success') {
      // 根据API响应数据结构设置文档列表
      if ('knowledgeList' in response.data) {
        console.log('knowledgeList:', response.data.knowledgeList);
        setDocuments(response.data.knowledgeList || []);
      } else {
        // 处理可能的不同响应结构
        setDocuments([]);
      }
    }
  };
  // 标签列表状态
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 加载标签列表
  const fetchLabels = async () => {
    const labels = await getAllLabels();
    setCategories(labels);
  };
  
  // 组件挂载时获取标签列表
  useEffect(() => {
    fetchLabels();
  }, []);

  // 弹窗相关状态
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState<boolean>(false);
  const [showCreateDocumentModal, setShowCreateDocumentModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [newSubcategoryName, setNewSubcategoryName] = useState<string>('');
  
  // 创建新文档相关状态
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentPrimaryTag, setDocumentPrimaryTag] = useState<string>('');
  const [documentSecondaryTag, setDocumentSecondaryTag] = useState<string>('');
  // 标签选择状态，初始值为空字符串
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

  // 打开添加一级标签弹窗
  const openCategoryModal = () => {
    setNewCategoryName('');
    setShowCategoryModal(true);
  };

  // 打开添加二级标签弹窗
  const openSubcategoryModal = () => {
    setSelectedParentCategory('');
    setNewSubcategoryName('');
    setShowSubcategoryModal(true);
  };

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
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  // 临时搜索状态（用于用户输入，点击搜索按钮才生效）
  const [tempSearchName, setTempSearchName] = useState<string>('');
  const [tempDateRange, setTempDateRange] = useState<string[]>([]);
  const [tempStatusFilter, setTempStatusFilter] = useState<string>('');
  
  // 实际搜索状态（用于筛选数据）
  const [searchName, setSearchName] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
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
    
    // 按时间范围筛选
    if (dateRange && dateRange[0]) {
      result = result.filter(doc => doc.updatedAt >= dateRange[0]);
    }
    if (dateRange && dateRange[1]) {
      result = result.filter(doc => doc.updatedAt <= dateRange[1]);
    }
    
    // 按状态筛选
    if (statusFilter) {
      result = result.filter(doc => doc.status === statusFilter);
    }
    
    setFilteredDocuments(result);
    // 筛选条件变化时，重置到第一页
    setCurrentPage(1);
  }, [documents, searchName, dateRange, statusFilter]);
  
  // 计算当前页显示的文档
  const getCurrentPageDocuments = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDocuments.slice(startIndex, endIndex);
  };
  
  // 执行搜索
  const handleSearch = () => {
    setSearchName(tempSearchName);
    setDateRange(tempDateRange.length === 2 ? [tempDateRange[0], tempDateRange[1]] : null);
    setStatusFilter(tempStatusFilter);
  };
  
  // 切换文档选择状态
  const toggleDocumentSelect = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  // 创建新文档
  const handleCreateDocument = () => {
    // 重置表单数据
    setDocumentTitle('');
    setDocumentPrimaryTag('');
    setDocumentSecondaryTag('');
    // 打开模态框
    setShowCreateDocumentModal(true);
  };
  
  // 处理二级标签变化（根据选择的一级标签更新可用的二级标签）
  const handleDocumentPrimaryTagChange = (value: string) => {
    setDocumentPrimaryTag(value);
    // 重置二级标签选择
    setDocumentSecondaryTag('');
  };
  
  // 提交创建文档表单
  const handleCreateDocumentSubmit = async () => {
    if (!documentTitle.trim()) {
      Message.warning('请输入文档名称');
      return;
    }
    if (!documentPrimaryTag) {
      Message.warning('请选择一级标签');
      return;
    }
    if (!documentSecondaryTag) {
      Message.warning('请选择二级标签');
      return;
    }
    
    try {
      // 调用创建文档API
      const response = await createDocument(documentTitle, documentPrimaryTag, documentSecondaryTag);
      
      // 关闭模态框
      setShowCreateDocumentModal(false);
      console.log('创建文档API响应:', response);
      
      // 检查API调用是否成功，AxiosResponse.status是HTTP状态码（数字类型）
      if (response) {
        // 假设API返回的文档ID在response.data.id中
        const documentId = response.data?.id;
        
        if (documentId) {
          Message.success('文档创建成功，正在跳转到编辑页面');
          // 跳转到编辑页面
          navigate(`/manage/edit/${documentId}`);
        } else {
          // 如果没有返回文档ID，显示提示消息
          Message.success('文档创建成功，但获取文档ID失败，请手动进入编辑页面');
        }
      }
    } catch (error) {
      console.error('创建文档失败:', error);
      Message.error('创建文档失败，请稍后重试');
    }
  };

  // 批量删除文档
  const handleBatchDelete = async () => {
    if (selectedDocuments.length === 0) {
      Message.warning('请选择要删除的文档');
      return;
    }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedDocuments.length} 个文档吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 逐个删除文档
          let deletedCount = 0;
          for (const docId of selectedDocuments) {
            await deleteDocument(docId);
            deletedCount++;
          }
          
          // 更新前端状态
          setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
          setSelectedDocuments([]);
          
          // 显示成功消息
          Message.success(`成功删除${deletedCount}个文档`);
        } catch (error) {
          console.error('批量删除文档失败:', error);
          Message.error('删除文档失败，请稍后重试');
        }
      }
    });
  };

  // 单个文档操作
  const handleDocumentAction = (action: 'view' | 'edit' | 'delete', docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    switch (action) {
      case 'view':
        // 跳转到详情页面
        navigate(`/rules/${docId}`);
        break;
      case 'edit':
        // 跳转到编辑页面
        navigate(`/manage/edit/${docId}`);
        break;
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除文档「${doc.title}」吗？`,
          okText: '确认',
          cancelText: '取消',
          onOk: async () => {
            try {
              // 调用后端API删除文档
              await deleteDocument(docId);
              
              // 更新前端状态
              setDocuments(prev => prev.filter(d => d.id !== docId));
              setSelectedDocuments(prev => prev.filter(id => id !== docId));
              
              Message.success('文档删除成功');
            } catch (error) {
              console.error('删除文档失败:', error);
              Message.error('删除文档失败，请稍后重试');
            }
          }
        });
        break;
    }
  };



  // 重置搜索条件
  const handleResetSearch = () => {
    setTempSearchName('');
    setTempDateRange([]);
    setTempStatusFilter('');
    setSearchName('');
    setDateRange(null);
    setStatusFilter('');
  };

  // 获取状态显示文本（直接返回API中的状态值）
  const getStatusText = (status: string) => {
    return status; // API已返回中文状态，如"生效中"、"已失效"、"未完成"
  };

  // 获取状态样式类名
  const getStatusClass = (status: string) => {
    if (status === '生效中') return styles.statusEffective;
    if (status === '已失效') return styles.statusInvalid;
    return styles.statusPending;
  };

  // 添加一级标签
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Message.warning('请输入一级标签名称');
      return;
    }

    // 检查是否已存在同名标签
    if (categories.some(cat => cat.name === newCategoryName.trim())) {
      Message.warning('该一级标签已存在');
      return;
    }

    // 调用API创建一级标签
    const newLabel = await createPrimaryLabel(newCategoryName.trim());
    if (newLabel) {
      // 刷新标签列表
      await fetchLabels();
      setShowCategoryModal(false);
      setNewCategoryName('');
    }
  };

  // 添加二级标签
  const handleAddSubcategory = async () => {
    if (!selectedParentCategory) {
      Message.warning('请选择所属一级标签');
      return;
    }
    
    if (!newSubcategoryName.trim()) {
      Message.warning('请输入二级标签名称');
      return;
    }

    // 检查是否已存在同名二级标签
    const parentCategory = categories.find(category => category.id === selectedParentCategory);
    if (parentCategory && parentCategory.subcategories.some(sub => sub.name === newSubcategoryName.trim())) {
      Message.warning('该二级标签已存在');
      return;
    }

    // 调用API创建二级标签
    const newLabel = await createSecondaryLabel(newSubcategoryName.trim(), selectedParentCategory);
    if (newLabel) {
      // 刷新标签列表
      await fetchLabels();
      setShowSubcategoryModal(false);
      setSelectedParentCategory('');
      setNewSubcategoryName('');
    }
  };

  // 删除一级标签
  const handleDeletePrimaryLabel = (categoryId: string, categoryName: string) => {
    Modal.confirm({
      title: '确认删除一级标签',
      content: `确定要删除一级标签「${categoryName}」吗？此操作将同时删除该标签下的所有二级标签和相关文档。`,
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePrimaryLabel(categoryId);
          await fetchLabels();
          // 如果删除的是当前选中的标签，重置选中状态
          if (selectedCategoryId === categoryId) {
            setSelectedCategoryId('');
            setSelectedSubcategoryId('');
          }
          Message.success('一级标签删除成功');
        } catch (error) {
          console.error('删除一级标签失败:', error);
          Message.error('删除一级标签失败，请稍后重试');
        }
      }
    });
  };

  // 删除二级标签
  const handleDeleteSecondaryLabel = (subcategoryId: string, subcategoryName: string) => {
    Modal.confirm({
      title: '确认删除二级标签',
      content: `确定要删除二级标签「${subcategoryName}」吗？此操作将同时删除该标签下的相关文档。`,
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSecondaryLabel(subcategoryId);
          await fetchLabels();
          // 如果删除的是当前选中的标签，重置选中状态
          if (selectedSubcategoryId === subcategoryId) {
            setSelectedSubcategoryId('');
          }
          Message.success('二级标签删除成功');
        } catch (error) {
          console.error('删除二级标签失败:', error);
          Message.error('删除二级标签失败，请稍后重试');
        }
      }
    });
  };

  return (
    <div className={styles.manageContainer}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>知识库上传</h2>
        <div className={styles.contentWrapper}>
          {/* 操作按钮区域 */}
          <div className={styles.actionButtons}>
            <button className={styles.actionButton} onClick={openCategoryModal}>
              增添一级标签
            </button>
            <button className={styles.actionButton} onClick={openSubcategoryModal}>
              增添二级标签
            </button>
          </div>

          {/* 一级标签水平显示 */}
            <div className={styles.mainCategoryContainer}>
              <span className={styles.sectionLabel}>一级标签</span>
              <div className={styles.mainCategories}>
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className={`${styles.mainCategoryButton} ${selectedCategoryId === category.id ? styles.selectedMainCategory : ''}`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.name}
                    <IconCloseCircle
                      className={styles.labelDeleteIcon}
                      onClick={(e: React.MouseEvent<SVGElement>) => {
                        e.stopPropagation();
                        handleDeletePrimaryLabel(category.id, category.name);
                      }}
                    />
                  </span>
                ))}
              </div>
            </div>
          
          {/* 二级标签显示 */}
            <div className={styles.subCategoryContainer}>
              <span className={styles.sectionLabel}>二级标签</span>
              <div className={styles.subCategories}>
                {getSelectedSubcategories().map((subcategory) => (
                  <span 
                    key={subcategory.id} 
                    className={`${styles.mainCategoryButton} ${selectedSubcategoryId === subcategory.id ? styles.selectedMainCategory : ''}`}
                    onClick={() => handleSubcategorySelect(subcategory.id)}
                  >
                    {subcategory.name}
                    <IconCloseCircle
                      className={styles.labelDeleteIcon}
                      onClick={(e: React.MouseEvent<SVGElement>) => {
                        e.stopPropagation();
                        handleDeleteSecondaryLabel(subcategory.id, subcategory.name);
                      }}
                    />
                  </span>
                ))}
              </div>
            </div>
        </div>
      </div>

      {/* 新增部分容器 */}
      <div className={styles.documentManagementSection}>
          {/* 搜索区域 */}
        <div className={styles.searchContainer}>
          <div className={styles.searchForm}>
            <div className={styles.searchItem}>
              <label htmlFor="searchName">名称搜索：</label>
              <Input
                id="searchName"
                className={styles.searchInput}
                value={tempSearchName}
                onChange={(e) => setTempSearchName(e)}
                placeholder="请输入文档名称"
              />
            </div>
            <div className={styles.searchItem}>
              <label>时间范围：</label>
                <DatePicker.RangePicker
                  className={styles.dateRangeInput}
                  value={tempDateRange}
                  onChange={(value) => setTempDateRange(value || [])}
                  style={{ width: 300 }}
                />
            </div>
            <div className={styles.searchItem}>
              <label htmlFor="statusFilter">文档状态：</label>
              <Select
                id="statusFilter"
                value={tempStatusFilter}
                onChange={(value) => setTempStatusFilter(value)}
                options={[
                  { label: '全部', value: '' },
                  { label: '生效中', value: '生效中' },
                  { label: '已失效', value: '已失效' },
                  { label: '未完成', value: '未完成' }
                ]}
                style={{ width: 120 }}
              />
            </div>
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

        {/* 文档操作按钮 */}
        <div className={styles.documentActions}>
          <button className={styles.createButton} onClick={handleCreateDocument}>
            创建新文档
          </button>
          <button 
            className={styles.batchDeleteButton} 
            onClick={handleBatchDelete}
            disabled={selectedDocuments.length === 0}
          >
            批量删除
          </button>
        </div>

        {/* 表格部分 */}
        <div className={styles.tableContainer}>
          <table className={styles.documentTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length > 0 && selectedDocuments.length === filteredDocuments.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>文档名称</th>
                <th>发布时间</th>
                <th>文档状态</th>
                <th style={{textAlign: 'center'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                getCurrentPageDocuments().map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelect(doc.id)}
                      />
                    </td>
                    <td>{doc.title}</td>
                    <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={getStatusClass(doc.status)}>
                        {getStatusText(doc.status)}
                      </span>
                    </td>
                    <td className={styles.actionCells}>
                      <button 
                        className={styles.actionIcon} 
                        onClick={() => handleDocumentAction('view', doc.id)}
                        title="详情"
                      >
                        详情
                      </button>
                      <button 
                        className={styles.actionIcon} 
                        onClick={() => handleDocumentAction('edit', doc.id)}
                        title="编辑"
                      >
                        编辑
                      </button>
                      <button 
                        className={`${styles.actionIcon} ${styles.delete}`} 
                        onClick={() => handleDocumentAction('delete', doc.id)}
                        title="删除"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
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
      
      </div> {/* 新增部分容器结束 */}

      
      {/* 添加一级标签弹窗 */}
      {showCategoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>添加一级标签</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCategoryModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <input 
                type="text" 
                placeholder="请输入一级标签名称" 
                className={styles.modalInput}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCategoryModal(false)}
              >
                取消
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleAddCategory}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 添加二级标签弹窗 */}
      {showSubcategoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>添加二级标签</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSubcategoryModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalFormGroup}>
                <label>选择所属一级标签</label>
                <select 
                  className={styles.modalSelect}
                  value={selectedParentCategory}
                  onChange={(e) => setSelectedParentCategory(e.target.value)}
                >
                  <option value="">请选择</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label>二级标签名称</label>
                <input 
                  type="text" 
                  placeholder="请输入二级标签名称" 
                  className={styles.modalInput}
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowSubcategoryModal(false)}
              >
                取消
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleAddSubcategory}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 创建新文档弹窗 */}
      {showCreateDocumentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>创建新文档</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateDocumentModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalFormGroup}>
                <label>文档名称</label>
                <input 
                  type="text" 
                  placeholder="请输入文档名称" 
                  className={styles.modalInput}
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>一级标签</label>
                <select 
                  className={styles.modalSelect}
                  value={documentPrimaryTag}
                  onChange={(e) => handleDocumentPrimaryTagChange(e.target.value)}
                >
                  <option value="">请选择</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label>二级标签</label>
                <select 
                  className={styles.modalSelect}
                  value={documentSecondaryTag}
                  onChange={(e) => setDocumentSecondaryTag(e.target.value)}
                  disabled={!documentPrimaryTag}
                >
                  <option value="">请选择</option>
                  {documentPrimaryTag && (
                    categories
                      .find(cat => cat.name === documentPrimaryTag)
                      ?.subcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.name}>
                          {subcat.name}
                        </option>
                      ))
                  )}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCreateDocumentModal(false)}
              >
                取消
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleCreateDocumentSubmit}
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manage;