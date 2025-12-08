import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Message, Modal, Form, Input, Select } from '@arco-design/web-react';
import { IconLeft } from '@arco-design/web-react/icon';
import { Button } from '@arco-design/web-react';
import MDEditor from '@uiw/react-md-editor';
import { getDocumentDetail, updateDocumentContent, updateDocumentBasicInfo, convertPdfToMarkdown } from '../../../api/knowledgeService';
import styles from './styles.module.css';

const EditPage: React.FC = () => {
  // 使用useParams获取URL参数
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 文章信息状态
  const [articleInfo, setArticleInfo] = useState({
    title: id ? `文章${id}` : '新文章',
    category: '商家入驻',
    subcategory: '入驻与退出',
    status: '未完成'
  });
  
  // Markdown内容状态
  const [markdownContent, setMarkdownContent] = useState<string>("");

  // 当ID变化时获取对应的数据
  useEffect(() => {
    const fetchDocumentDetail = async () => {
      if (id) {
        try {
          console.log(`正在获取ID为 ${id} 的文档详情`);
          // 调用knowledgeService中的getDocumentDetail函数获取文档详情
          const response = await getDocumentDetail(id);
          
          // 检查API响应是否成功
          if (response) {
            const documentData = response.data.knowledge;
            console.log('文档详情数据:', documentData);
            
            // 更新文章信息状态
            setArticleInfo({
              title: documentData.title || `文章${id}`,
              category: documentData.primaryTag || '未分类',
              subcategory: documentData.secondaryTag || '未分类',
              status: documentData.status || '草稿'
            });
            
            // 更新Markdown内容，如果API返回了content字段则使用它
            setMarkdownContent(documentData.content || '# ' + documentData.title);
          } else {
            Message.warning('获取文档详情失败，使用默认内容');
          }
        } catch (error) {
          console.error('获取文档详情出错:', error);
          Message.error('获取文档详情失败，请稍后重试');
          // 出错时使用默认模板
        }
      }
    };
    
    fetchDocumentDetail();
  }, [id]);
  
  // 返回manage页面
  const handleBack = () => {
    navigate('/manage/document');
  };
  
  // 保存草稿
  const handleSaveDraft = async () => {
    if (!id) {
      Message.warning('文档ID不存在，无法保存草稿');
      return;
    }
    
    try {
      console.log('正在保存草稿...');
      // 调用API保存文章内容
      const response = await updateDocumentContent(id, markdownContent);
      
      if (response) {
        // 将文章状态更新为"未完成"
        const statusResponse = await updateDocumentBasicInfo(id, { status: '未完成' });
        
        if (statusResponse) {
          // 更新本地文章状态为"未完成"
          setArticleInfo(prev => ({ ...prev, status: '未完成' }));
          console.log('草稿保存成功并更新状态为未完成:', { ...articleInfo, content: markdownContent, status: '未完成' });
          Message.success('草稿已保存');
        } else {
          console.log('草稿内容保存成功，但状态更新失败');
          Message.success('草稿已保存');
        }
      } else {
        Message.warning('草稿保存失败');
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      Message.error('保存草稿失败，请稍后重试');
    }
  };
  
  // 修改信息模态框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    primaryTag: '',
    secondaryTag: '',
    status: '未完成'
  });
  
  // 创建表单实例
  const [form] = Form.useForm();

  // 标签选项
  const primaryTags = ['商家入驻', '商品管理'];
  const secondaryTagsMap: Record<string, string[]> = {
    '商家入驻': ['入驻与退出', '保险金管理'],
    '商品管理': ['商品发布', '商品列表']
  };
  const statusOptions = ['生效中', '已失效', '未完成'];
  
  // 获取状态样式类名
  const getStatusClass = (status: string) => {
    if (status === '生效中') return styles.statusEffective;
    if (status === '已失效') return styles.statusInvalid;
    return styles.statusPending;
  };


  // 打开修改信息模态框
  const handleOpenEditModal = () => {
    // 设置表单初始值为当前文章信息
    setEditFormData({
      title: articleInfo.title,
      primaryTag: articleInfo.category,
      secondaryTag: articleInfo.subcategory,
      status: articleInfo.status
    });
    setEditModalVisible(true);
  };

  // 关闭修改信息模态框
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
  };

  // 处理表单值变化
  const handleFormChange = (changedValues: any) => {
    setEditFormData(prev => {
      // 如果修改了一级标签，自动将二级标签设置为新一级标签对应的第一个选项
      if (changedValues.primaryTag && changedValues.primaryTag !== prev.primaryTag) {
        const firstSecondaryTag = secondaryTagsMap[changedValues.primaryTag]?.[0] || '';
        // 使用表单实例更新二级标签的值
        form.setFieldValue('secondaryTag', firstSecondaryTag);
        return { ...prev, ...changedValues, secondaryTag: firstSecondaryTag };
      }
      return { ...prev, ...changedValues };
    });
  };

  // 提交修改信息
  const handleSubmitEdit = async () => {
    if (!id) {
      Message.warning('文档ID不存在，无法修改信息');
      return;
    }

    try {
      console.log('正在更新文档基本信息...', editFormData);
      // 调用updateDocumentBasicInfo API更新文档基本信息
      const response = await updateDocumentBasicInfo(id, {
        title: editFormData.title,
        primaryTag: editFormData.primaryTag,
        secondaryTag: editFormData.secondaryTag,
        status: editFormData.status
      });

      if (response) {
        // 更新页面显示的文章信息
        setArticleInfo({
          title: editFormData.title,
          category: editFormData.primaryTag,
          subcategory: editFormData.secondaryTag,
          status: editFormData.status
        });
        
        console.log('文档基本信息更新成功');
        Message.success('文档信息已更新');
        setEditModalVisible(false);
      } else {
        Message.warning('文档信息更新失败');
      }
    } catch (error) {
      console.error('更新文档信息失败:', error);
      Message.error('更新文档信息失败，请稍后重试');
    }
  };

  // PDF导入相关状态
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [aiConverting, setAiConverting] = useState(false);
  const [conversionTime, setConversionTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [aiConversionResult, setAiConversionResult] = useState<string>('');
  const [aiParsedWordCount, setAiParsedWordCount] = useState(0); // 已解析字数

  // 打开PDF导入模态框
  const handleOpenPdfModal = () => {
    setSelectedPdfFile(null);
    setPdfModalVisible(true);
  };

  // 关闭PDF导入模态框
  const handleClosePdfModal = () => {
    setPdfModalVisible(false);
    setSelectedPdfFile(null);
    // 清除计时器
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setConversionTime(0);
    setConverting(false);
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.name.endsWith('.pdf')) {
        Message.warning('请上传PDF格式的文件');
        return;
      }
      setSelectedPdfFile(file);
    }
  };

  // 处理PDF转换（普通导入）
  const handlePdfConvert = async () => {
    if (!selectedPdfFile) {
      return;
    }

    try {
      // 设置转换状态为开始
      setConverting(true);
      setConversionTime(0);
      
      // 启动计时器
      const interval = setInterval(() => {
        setConversionTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      // 调用API转换PDF
      const result = await convertPdfToMarkdown(selectedPdfFile);
      
      console.log('PDF转换结果:', result);
      // 直接使用返回的结果
      setMarkdownContent(prev => prev + result.data.markdownContent);
      Message.success(`PDF转换成功！已将"${result.data.originalFileName}"转换为Markdown，共${result.data.markdownContent.length}字`);
      
      // 关闭模态框
      handleClosePdfModal();
    } catch (error) {
      console.error('PDF转换错误:', error);
      Message.error('PDF转换失败：' + ((error as any)?.message || '未知错误'));
      // 错误已在service中处理，这里只需要重置状态
    } finally {
      // 清除计时器并重置状态
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setConverting(false);
    }
  };

  // 辅助函数：准确统计字数（中文按字，英文按词）
  const countWords = (text: string): number => {
    if (!text) return 0;
    // 匹配中文字符、中文标点、英文单词
    const chineseChars = text.match(/[\u4e00-\u9fa5\u3000-\u303f]/g)?.length || 0;
    const englishWords = text.match(/[a-zA-Z]+/g)?.length || 0;
    return chineseChars + englishWords;
  };

  // 处理AI导入
  const handleAiImport = async () => {
    if (!selectedPdfFile) {
      return;
    }

    try {
      setAiConverting(true);
      setAiConversionResult('正在创建解析任务...');
      setConversionTime(0); // 重置计时
      setAiParsedWordCount(0); // 重置字数统计
      
      // 启动计时器
      const interval = setInterval(() => {
        setConversionTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      
      // 构建FormData
      const form = new FormData();
      form.append('file', selectedPdfFile);
      form.append('tool_type', 'expert');
      form.append('file_type', 'PDF');
      
      // 设置请求头和选项
      const createOptions = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: form
      };
      
      // 1. 创建解析任务
      const createResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/files/parser/create', createOptions);
      
      if (!createResponse.ok) {
        throw new Error(`创建任务失败: ${createResponse.status}`);
      }
      
      const createResult = await createResponse.json();
      console.log('创建解析任务结果:', createResult);
      
      if (!createResult.message || !createResult.task_id) {
        throw new Error('创建任务失败: ' + (createResult.message || '未知错误'));
      }
      
      const taskId = createResult.task_id;
      setAiConversionResult(`任务创建成功，正在轮询解析结果...`);
      
      // 2. 轮询查询解析结果
      const pollInterval = 3000; // 轮询间隔3秒
      const maxAttempts = 20; // 最大尝试次数
      let attempts = 0;
      let parsingComplete = false;
      let parsingResult = null;
      let accumulatedContent = ''; // 累积已解析内容
      
      while (attempts < maxAttempts && !parsingComplete) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
        
        setAiConversionResult(`正在查询解析结果... (第${attempts}/${maxAttempts}次尝试)`);
        
        const pollOptions = {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`
          }
        };
        
        const pollResponse = await fetch(
          `https://open.bigmodel.cn/api/paas/v4/files/parser/result/${taskId}/text`,
          pollOptions
        );
        
        if (!pollResponse.ok) {
          // 如果是404等错误，继续轮询
          if (pollResponse.status !== 404) {
            throw new Error(`查询结果失败: ${pollResponse.status}`);
          }
          continue;
        }
        
        parsingResult = await pollResponse.json();
        console.log('查询解析结果:', parsingResult);
        
        if (parsingResult.content && parsingResult.content !== accumulatedContent) {
          // 计算新增内容
          const newContent = parsingResult.content.substring(accumulatedContent.length);
          // 实时更新文本内容
          setMarkdownContent(prev => prev + newContent);
          // 更新已累积内容
          accumulatedContent = parsingResult.content;
          // 计算并更新已解析字数（使用更准确的字数统计）
          const wordCount = countWords(parsingResult.content);
          setAiParsedWordCount(wordCount);
        }
        
        if (parsingResult.status === 'succeeded') {
          parsingComplete = true;
        } else if (parsingResult.status === 'failed') {
          throw new Error('解析失败: ' + (parsingResult.message || '未知错误'));
        }
      }
      
      if (!parsingComplete) {
        throw new Error('解析超时，请稍后重试');
      }
      
      if (!parsingResult || !parsingResult.content) {
        throw new Error('解析结果为空');
      }
      
      // 使用实际解析结果的字数，避免异步状态问题
      const finalWordCount = countWords(parsingResult.content);
      Message.success(`AI导入成功！已将"${selectedPdfFile.name}"的内容导入，共${finalWordCount}字`);
      
      // 关闭模态框
      handleClosePdfModal();
    } catch (error) {
      console.error('AI导入错误:', error);
      Message.error('AI导入失败：' + ((error as any)?.message || '未知错误'));
    } finally {
      setAiConverting(false);
      setAiConversionResult('');
      // 清除计时器
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  // 发布文章
  const handlePublish = async () => {
    if (!id) {
      Message.warning('文档ID不存在，无法发布文章');
      return;
    }
    
    try {
      // 步骤1：先保存文章内容
      console.log('正在保存文章内容...');
      const contentResponse = await updateDocumentContent(id, markdownContent);
      
      if (contentResponse) {
        // 步骤2：更新文章状态为"生效中"
        console.log('正在发布文章...');
        const statusResponse = await updateDocumentBasicInfo(id, { status: '生效中' });
        
        if (statusResponse) {
          // 更新本地文章状态为"生效中"
          setArticleInfo(prev => ({ ...prev, status: '生效中' }));
          console.log('文章发布成功:', { ...articleInfo, content: markdownContent, status: '生效中' });
          Message.success('文章已发布');
          navigate('/manage/document');
        } else {
          Message.warning('文章内容已保存，但发布失败');
        }
      } else {
        Message.error('保存文章内容失败，发布中断');
      }
    } catch (error) {
      console.error('发布文章失败:', error);
      Message.error('发布文章失败，请稍后重试');
    }
  };

  return (
    <>
      <div className={styles.container}>
        {/* Header部分 */}
        <div className={styles.header}>
          {/* 左侧部分 */}
          <div className={styles.leftSection}>
            {/* 返回按钮 - 正方形带图标 */}
            <button 
              onClick={handleBack}
              className={styles.backButton}
            >
              <IconLeft />
            </button>
            
            {/* 文章信息 */}
            <div className={styles.articleInfo}>
              <div className={styles.titleWithStatus}>
                <h2 className={styles.articleTitle}>
                  {articleInfo.title}
                </h2>
                <span className={getStatusClass(articleInfo.status)}>
                  {articleInfo.status}
                </span>
              </div>
              <p className={styles.articleCategory}>
                所属类别：{articleInfo.category} - {articleInfo.subcategory}
              </p>
            </div>
          </div>
          
          {/* 右侧按钮 */}
          <div className={styles.rightSection}>
            {/* 存草稿按钮 - 圆角为宽度的1/2 */}
            <button 
              onClick={handleSaveDraft}
              className={styles.draftButton}
            >
              存草稿
            </button>
            
            {/* 去发布按钮 - 圆角为宽度的1/2 */}
            <button 
              onClick={handlePublish}
              className={styles.publishButton}
            >
              去发布
            </button>
          </div>
        </div>
        
        {/* 主要内容区域 */}
        <div className={styles.mainContent}>
          {/* Markdown编辑器 */}
          <div className={styles.editForm}>
            <div className={styles.markdownEditor}>
              <MDEditor
                value={markdownContent}
                onChange={(val) => setMarkdownContent(val || '')}
                preview="live"
                data-color-mode="light"
                className="custom-md-editor"
              />
              <div className={styles.tipsContainer}>
                <p className={styles.tipsText}>💡 提示：图片请使用绝对路径 ![图片描述](https://example.com/image.jpg)，超链接建议添加描述文本 [链接文本](https://example.com)</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 侧边功能栏 - 简化样式 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarItem} onClick={handleOpenPdfModal}>
            <div className={styles.sidebarIcon}>📄</div>
            <span className={styles.sidebarText}>PDF导入</span>
          </div>
          <div className={styles.sidebarItem} onClick={handleOpenEditModal}>
            <div className={styles.sidebarIcon}>✏️</div>
            <span className={styles.sidebarText}>修改信息</span>
          </div>
        </div>
      </div>
      {/* 修改信息模态框 */}
      <Modal
        title="修改文档信息"
        visible={editModalVisible}
        onOk={handleSubmitEdit}
        onCancel={handleCloseEditModal}
      >
        <Form
          autoComplete="off"
          onChange={handleFormChange}
          initialValues={editFormData}
          form={form}
        >
          <Form.Item label="文章标题" field="title" required>
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item label="一级标签" field="primaryTag" required>
            <Select placeholder="请选择一级标签">
              {primaryTags.map(tag => (
                <Select.Option key={tag} value={tag}>{tag}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="二级标签" field="secondaryTag" required>
            <Select placeholder="请选择二级标签">
              {editFormData.primaryTag && secondaryTagsMap[editFormData.primaryTag]?.map(tag => (
                <Select.Option key={tag} value={tag}>{tag}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="状态" field="status" required>
            <Select placeholder="请选择文档状态">
              {statusOptions.map(status => (
                <Select.Option key={status} value={status}>{status}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* PDF导入模态框 */}
      <Modal
      title="导入PDF文件"
      visible={pdfModalVisible}
      onCancel={handleClosePdfModal}
      footer={[
        <Button key="cancel" onClick={handleClosePdfModal} disabled={converting || aiConverting}>
          取消
        </Button>,
        <Button
          key="normal"
          type="primary"
          onClick={handlePdfConvert}
          disabled={!selectedPdfFile || converting || aiConverting}
        >
          {converting ? '转换中...' : '普通导入'}
        </Button>,
        <Button
          key="ai"
          type="primary"
          onClick={handleAiImport}
          disabled={!selectedPdfFile || converting || aiConverting}
          style={{ marginLeft: 12 }}
        >
          {aiConverting ? 'AI导入中...' : 'AI导入'}
        </Button>,
      ]}
    >
        <div className={styles.pdfImportContainer}>
          {(converting || aiConverting) ? (
            <div className={styles.convertingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.convertingText}>
                {converting ? '正在转换PDF为Markdown...' : aiConversionResult}
              </p>
              <p className={styles.conversionTime}>
                已用时: {conversionTime}s
              </p>
              {aiConverting && aiParsedWordCount > 0 && (
                <p className={styles.parsedWordCount}>
                  已解析: {aiParsedWordCount}字
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.fileUploadSection}>
                <label 
                  htmlFor="pdf-upload"
                  className={styles.fileUploadLabel}
                >
                  <div className={styles.fileUploadArea}>
                    <div className={styles.fileIcon}>📄</div>
                    <p className={styles.fileUploadText}>点击或拖拽PDF文件到此处上传</p>
                    <p className={styles.fileUploadHint}>仅支持PDF格式文件</p>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                    />
                  </div>
                </label>
              </div>
              {selectedPdfFile && (
                <div className={styles.selectedFileInfo}>
                  <div className={styles.fileInfoIcon}>📄</div>
                  <div className={styles.fileInfoText}>
                    <p className={styles.fileName}>{selectedPdfFile.name}</p>
                    <p className={styles.fileSize}>
                      文件大小：{(selectedPdfFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button 
                    className={styles.removeFileButton}
                    onClick={() => {
                      setSelectedPdfFile(null);
                      // 重置文件输入元素，确保可以再次上传同一文件
                      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
                      if (fileInput) {
                        fileInput.value = '';
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </>
          )}</div>
      </Modal>
    </>
  );
};

export default EditPage;