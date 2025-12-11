import React, { useState, useRef, useEffect } from 'react';
import { IconDown, IconRight, IconDownload, IconCopy } from '@arco-design/web-react/icon';
import { Message } from '@arco-design/web-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import html2pdf from 'html2pdf.js';

import { getDocumentDetail, incrementDocumentViews } from '../../../api/knowledgeService';
import styles from './styles.module.css';

// 移除未使用的函数

// 自定义链接组件
const CustomLink = ({ href, children, ...props }: { href?: string; children: React.ReactNode; [key: string]: any }) => {
  // 判断是否为内部链接（以#开头）或外部链接
  const isInternalLink = href && typeof href === 'string' && href.startsWith('#');
  
  // 内部链接处理逻辑
  const handleInternalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (href && typeof href === 'string') {
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <a 
      href={href} 
      className={styles.customLink}
      target={isInternalLink ? '_self' : '_blank'} 
      rel={isInternalLink ? 'noopener noreferrer' : 'noopener noreferrer'} 
      onClick={isInternalLink ? handleInternalClick : undefined}
      {...props}
    >
      {children}
      {!isInternalLink && (
        <svg width="12" height="12" viewBox="0 0 12 12" className={styles.linkIcon}>
          <path fill="currentColor" d="M4.5 1a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 4.5 1zm5.5 1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2.586L4.707 4.293a.5.5 0 0 0 .708.708L7 3.707V6a.5.5 0 0 0 1 0V3h2z"/>
        </svg>
      )}
    </a>
  );
};

// 自定义段落组件 - 设置文本为黑色
const CustomParagraph = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return (
    <p style={{ color: '#000000' }} {...props}>
      {children}
    </p>
  );
};

// 导出与rehype-slug兼容的slugify函数
export const slugify = (text: string): string => {
  // 允许中文字符、字母、数字、连字符和空格
  // 首先移除除了中文字符、字母、数字、连字符和空格之外的所有字符
  let cleaned = text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // 确保ID不为空
  return cleaned || 'section';
};

// 为每个标题级别创建单独的组件，确保ID正确应用
const CustomH1 = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <h1 style={{ color: 'black' }} {...props}>{children}</h1>;
};

const CustomH2 = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <h2 style={{ color: 'black' }} {...props}>{children}</h2>;
};

const CustomH3 = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <h3 style={{ color: 'black' }} {...props}>{children}</h3>;
};

const CustomH4 = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <h4 style={{ color: 'black' }} {...props}>{children}</h4>;
};

const CustomH5 = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <h5 style={{ color: 'black' }} {...props}>{children}</h5>;
};

const CustomH6 = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <h6 style={{ color: 'black' }} {...props}>{children}</h6>;
};

// 自定义图片组件
const CustomImage = ({ src, alt, title, onClick }: { src: string; alt?: string; title?: string; onClick?: (src: string) => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const handleLoad = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // 处理图片点击事件
  const handleImageClick = () => {
    if (onClick) {
      onClick(src);
    }
  };

  return (
    <div className={styles.imageContainer}>
      {loading && (
        <div className={styles.imageLoading}>
          <div className={styles.spinner}></div>
          <span>加载中...</span>
        </div>
      )}
      {error && (
        <div className={styles.imageError}>
          <span>图片加载失败</span>
        </div>
      )}
      <img 
        src={src} 
        alt={alt || '图片'} 
        title={title || '点击查看大图'} 
        className={`${styles.customImage} ${loading ? styles.loading : ''} ${error ? styles.error : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleImageClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    </div>
  );
};



// 使用ReactMarkdown组件代替手动解析函数

// 定义目录项类型
interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}

// 定义文档数据接口
interface DocumentData {
  id: string;
  title: string;
  primaryTag: string;
  secondaryTag: string;
  updateTime: string;
  content: string;
  tableOfContents: TableOfContentsItem[];
}

const RuleDetail: React.FC = () => {
  // 状态管理
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  // 图片预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // 定义ReactMarkdown组件映射
  const components: any = {
    a: CustomLink,
    img: ({ src, alt, title }: { src: string; alt?: string; title?: string }) => (
      <CustomImage 
        src={src} 
        alt={alt} 
        title={title} 
        onClick={(imgSrc: string) => {
          setPreviewImage(imgSrc);
          setPreviewVisible(true);
        }} 
      />
    ),
    p: CustomParagraph,
    h1: CustomH1,
    h2: CustomH2,
    h3: CustomH3,
    h4: CustomH4,
    h5: CustomH5,
    h6: CustomH6,
  };
  
  // 直接使用上面导出的slugify函数

  // 从markdown内容生成目录
  const generateTableOfContents = (markdown: string): TableOfContentsItem[] => {
    const toc: TableOfContentsItem[] = [];
    const headingMatches = markdown.matchAll(/^(#{2,6})\s+(.+)$/gm);
    
    // 用于跟踪标题层级的栈
    const stack: TableOfContentsItem[] = [];
    const idMap = new Map<string, number>(); // 用于处理重复标题
    
    for (const match of headingMatches) {
      const level = match[1].length;
      const title = match[2].trim();
      
      // 生成与rehype-slug兼容的ID
      let baseId = slugify(title);
      let id = baseId;
      
      // 处理重复标题
      if (idMap.has(baseId)) {
        const count = (idMap.get(baseId) || 0) + 1;
        idMap.set(baseId, count);
        id = `${baseId}-${count}`;
      } else {
        idMap.set(baseId, 1);
      }
      
      const newItem: TableOfContentsItem = {
        id,
        title,
        level,
        children: []
      };
      
      // 根据级别插入到适当的位置
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        toc.push(newItem);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(newItem);
      }
      
      stack.push(newItem);
    }
    
    return toc;
  };
  
  // 获取文档详情并增加浏览数
  useEffect(() => {
    const fetchDocumentDetail = async () => {
      try {
        setLoading(true);
        // 从URL获取id参数（这里简化处理，实际项目中应该使用useRouter）
        const id = window.location.pathname.split('/').pop() || '1';
        
        // 并行执行获取文档详情和增加浏览数
        const [response] = await Promise.all([
          getDocumentDetail(id),
          incrementDocumentViews(id) // 增加浏览数
        ]);
        
        if (response && response.data && response.data.knowledge) {
          const data = response.data.knowledge;
          // 过滤掉content中以#开头且和title相同的内容
          let filteredContent = data.content || '';
          if (data.title && filteredContent) {
            // 使用简单的字符串处理方法
            const lines = filteredContent.split('\n');
            const filteredLines = lines.filter((line: string) => {
              // 检查行是否以#开头并且内容与title相同（忽略前后空格）
              const trimmedLine = line.trim();
              const expectedHeading = `# ${data.title}`;
              return trimmedLine !== expectedHeading;
            });
            filteredContent = filteredLines.join('\n');
          }
          
          // 生成目录
          const tableOfContents = generateTableOfContents(filteredContent);
          
          setDocumentData({
            ...data,
            content: filteredContent, // 使用过滤后的内容
            tableOfContents,
            updateTime: data.updatedAt ? new Date(data.updatedAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')
          });
          
          // 默认展开一级目录
          const expandedSet = new Set<string>();
          tableOfContents.forEach(item => {
            expandedSet.add(item.id);
          });
          setExpandedItems(expandedSet);
        }
      } catch (error) {
        console.error('获取文档详情失败:', error);
        // 出错时使用默认数据
        setDocumentData({
          id: '1',
          title: '文档加载失败',
          primaryTag: '未知',
          secondaryTag: '未知',
          updateTime: new Date().toLocaleString('zh-CN'),
          content: '<p>无法加载文档内容，请稍后重试</p>',
          tableOfContents: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentDetail();
  }, []);

  // 切换展开/折叠状态
  const toggleExpand = (itemId: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    setExpandedItems(newExpandedItems);
  };

  // 滚动到指定章节
  const scrollToSection = (sectionId: string) => {
    // 查找目标元素
    const element = document.getElementById(sectionId);
    if (element) {
      // 计算元素位置并考虑顶部栏遮挡（偏移80px）
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 80; // 顶部栏高度偏移量
      
      // 平滑滚动到偏移位置
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.warn(`未找到ID为 ${sectionId} 的元素`);
    }
  };

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewImage('');
  };

  // 处理URL参数path，自动滚动到对应的位置
  useEffect(() => {
    if (!documentData || loading) return;

    // 从URL中获取path参数
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get('path');
    
    if (pathParam) {
      // 解析path参数，获取路径的各个部分
      const pathParts = pathParam.split('-').filter(part => part.trim());
      
      if (pathParts.length > 0) {
        // 获取最后一部分
        const lastPart = pathParts[pathParts.length - 1].trim();
        
        // 检查目录中是否存在这一路径
        const findInToc = (toc: TableOfContentsItem[], path: string[]): boolean => {
          for (const item of toc) {
            if (item.title.includes(path[0].trim())) {
              if (path.length === 1) {
                return true;
              } else if (item.children) {
                return findInToc(item.children, path.slice(1));
              }
            }
          }
          return false;
        };
        
        console.log(documentData.tableOfContents)
        // 检查路径是否存在
        const pathExists = findInToc(documentData.tableOfContents, pathParts);
        
        if (pathExists) {
          // 对最后一个部分调用slugify函数
          const sectionId = slugify(lastPart);
          
          // 延迟滚动，确保页面内容已加载完成
          setTimeout(() => {
            scrollToSection(sectionId);
          }, 100);
        } else {
          console.warn('路径不存在:', pathParam);
        }
      }
    }
  }, [documentData, loading]);

  // 下载PDF功能
  const handleDownloadPDF = async () => {
    if (!documentData) return;
    
    try {
      Message.loading('正在生成PDF，请稍候...');
      
      // 获取要转换的内容容器
      const contentElement = contentRef.current;
      if (!contentElement) {
        Message.error('无法获取文档内容');
        return;
      }
      
      // 简化方案：直接使用更合适的布局设置
      
      // 创建一个临时容器来渲染完整的PDF内容
      const pdfContentContainer = document.createElement('div');
      pdfContentContainer.style.backgroundColor = '#ffffff';
      pdfContentContainer.style.width = '180mm'; // 内容宽度（与内部元素一致）
      pdfContentContainer.style.boxSizing = 'border-box';
      pdfContentContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContentContainer.style.lineHeight = '1.7';
      pdfContentContainer.style.color = '#333333';
      pdfContentContainer.style.textAlign = 'left'; // 文本左对齐
      pdfContentContainer.style.margin = '0 auto'; // 水平居中
      
      // 创建标题区域
      const titleSection = document.createElement('div');
      titleSection.style.textAlign = 'center';
      titleSection.style.marginBottom = '40px';
      titleSection.style.width = '100%';
      
      // 创建标题元素
      const titleElement = document.createElement('h1');
      titleElement.textContent = documentData.title;
      titleElement.style.fontSize = '28px';
      titleElement.style.margin = '0 0 15px 0';
      titleElement.style.color = '#1a1a1a';
      titleElement.style.textAlign = 'center';
      titleElement.style.fontWeight = '700';
      titleElement.style.lineHeight = '1.3';
      titleElement.style.paddingBottom = '10px';
      titleElement.style.borderBottom = '3px solid #3498db';
      titleElement.style.width = '100%';
      
      // 创建文档信息区域
      const infoSection = document.createElement('div');
      infoSection.style.fontSize = '12px';
      infoSection.style.color = '#666';
      infoSection.style.marginBottom = '25px';
      infoSection.style.textAlign = 'center';
      
      if (documentData.updateTime) {
        const updateInfo = document.createElement('div');
        updateInfo.textContent = `更新时间：${documentData.updateTime}`;
        infoSection.appendChild(updateInfo);
      }
      
      // 添加标签信息
      if (documentData.primaryTag) {
        const tagInfo = document.createElement('div');
        tagInfo.style.marginTop = '5px';
        tagInfo.innerHTML = `标签：<span style="color: #3498db; font-weight: 600;">${documentData.primaryTag}</span>${documentData.secondaryTag ? ` / ${documentData.secondaryTag}` : ''}`;
        infoSection.appendChild(tagInfo);
      }
      
      // 创建内容元素
      const contentClone = contentElement.cloneNode(true) as HTMLElement;
      contentClone.style.width = '180mm'; // 内容宽度
      contentClone.style.margin = '0 auto'; // 强制水平居中
      contentClone.style.padding = '0';
      contentClone.style.textAlign = 'left'; // 保持文本左对齐
      
      // 添加样式到内容
      const allElements = contentClone.querySelectorAll('*');
      allElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.fontFamily = 'Arial, sans-serif';
        
        // 重置可能影响宽度的样式
        htmlEl.style.maxWidth = '100%';
        htmlEl.style.minWidth = 'auto';
        
        // 标题样式
        if (htmlEl.tagName === 'H1' || htmlEl.tagName === 'H2' || htmlEl.tagName === 'H3' || 
            htmlEl.tagName === 'H4' || htmlEl.tagName === 'H5' || htmlEl.tagName === 'H6') {
          htmlEl.style.color = '#2c3e50';
          htmlEl.style.marginTop = '30px';
          htmlEl.style.marginBottom = '15px';
          htmlEl.style.fontWeight = '600';
        }
        
        // 一级标题
        if (htmlEl.tagName === 'H1') {
          htmlEl.style.fontSize = '24px';
          htmlEl.style.borderBottom = '2px solid #ecf0f1';
          htmlEl.style.paddingBottom = '8px';
        }
        
        // 二级标题
        if (htmlEl.tagName === 'H2') {
          htmlEl.style.fontSize = '20px';
          htmlEl.style.borderBottom = '1px solid #ecf0f1';
          htmlEl.style.paddingBottom = '6px';
        }
        
        // 三级标题
        if (htmlEl.tagName === 'H3') {
          htmlEl.style.fontSize = '18px';
        }
        
        // 段落样式
        if (htmlEl.tagName === 'P') {
          htmlEl.style.marginBottom = '15px';
          htmlEl.style.textIndent = '2em';
        }
        
        // 列表样式
        if (htmlEl.tagName === 'UL' || htmlEl.tagName === 'OL') {
          htmlEl.style.marginBottom = '15px';
          htmlEl.style.paddingLeft = '25px';
        }
        
        if (htmlEl.tagName === 'LI') {
          htmlEl.style.marginBottom = '5px';
        }
        
        // 表格样式
        if (htmlEl.tagName === 'TABLE') {
          htmlEl.style.width = '100%';
          htmlEl.style.borderCollapse = 'collapse';
          htmlEl.style.marginBottom = '20px';
          htmlEl.style.fontSize = '14px';
        }
        
        if (htmlEl.tagName === 'TH') {
          htmlEl.style.backgroundColor = '#f8f9fa';
          htmlEl.style.border = '1px solid #dee2e6';
          htmlEl.style.padding = '8px 12px';
          htmlEl.style.textAlign = 'left';
          htmlEl.style.fontWeight = '600';
        }
        
        if (htmlEl.tagName === 'TD') {
          htmlEl.style.border = '1px solid #dee2e6';
          htmlEl.style.padding = '8px 12px';
        }
        
        // 代码块样式
        if (htmlEl.tagName === 'PRE' || htmlEl.tagName === 'CODE') {
          htmlEl.style.backgroundColor = '#f5f5f5';
          htmlEl.style.borderRadius = '4px';
          htmlEl.style.padding = '10px';
          htmlEl.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
          htmlEl.style.fontSize = '13px';
          htmlEl.style.overflowX = 'auto';
        }
        
        // 链接样式
        if (htmlEl.tagName === 'A') {
          htmlEl.style.color = '#3498db';
          htmlEl.style.textDecoration = 'none';
        }
      });
      
      // 添加到临时容器
      titleSection.appendChild(titleElement);
      titleSection.appendChild(infoSection);
      pdfContentContainer.appendChild(titleSection);
      pdfContentContainer.appendChild(contentClone);
      
      // 确保标题区域也正确居中
      titleSection.style.width = '180mm'; // 与内容相同的宽度
      titleSection.style.margin = '0 auto'; // 水平居中
      
      // 临时添加到DOM
      document.body.appendChild(pdfContentContainer);
      
      // 配置html2pdf选项 - 确保内容居中
      const opt = {
        margin: [10, 15, 10, 15] as [number, number, number, number], // 上下边距10mm，左右边距15mm（保持不变）
        filename: `${documentData.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          // 移除可能导致问题的裁剪设置
          allowTaint: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const
        },
        pagebreak: {
          mode: ['avoid-all', 'css'] as const,
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['h1', 'h2', 'h3', 'table', 'figure'] as const
        }
      };
      
      // 使用html2pdf生成PDF
      await html2pdf().set(opt).from(pdfContentContainer).save();
      
      // 移除临时容器
      document.body.removeChild(pdfContentContainer);
      
      Message.success('PDF下载成功');
    } catch (error) {
      console.error('生成PDF失败:', error);
      Message.error('生成PDF失败，请稍后重试');
    }
  };
  
  // 渲染目录项的内部函数
  const renderTocItem = (item: TableOfContentsItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <div key={item.id} className={styles.tocItem}>
        <div className={styles.tocItemContent}>
          {/* 箭头在文字左侧15px，并且不同层级的箭头与上一级文字对齐 */}
          <span 
            className={styles.tocItemInner}
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {/* 固定位置的切换图标区域 */}
            <span className={styles.toggleIconContainer}>
              {hasChildren && (
                <span 
                  className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(item.id);
                  }}
                >
                  {isExpanded ? <IconDown style={{ fontSize: '12px' }} /> : <IconRight style={{ fontSize: '12px' }} />}
                </span>
              )}
            </span>
            {/* 文本区域 */}
            <span 
              className={styles.tocText}
              onClick={() => scrollToSection(item.id)}
            >
              {item.title}
            </span>
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div className={styles.tocChildren}>
            {item.children?.map(child => renderTocItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>加载中...</p>
      </div>
    );
  }
  
  if (!documentData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>无法加载文档</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sidebar}>
        <div className={styles.tableOfContents}>
          <h3 className={styles.tocTitle}>{documentData.title}</h3>
          <div className={styles.tocList}>
            {documentData.tableOfContents.map(item => renderTocItem(item))}
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        {/* 导航路径 - 移动到右侧内容区域内 */}
        <div className={styles.navPath}>
          <a href="/rules" className={styles.navItem}>知识库</a>
          <span className={styles.navArrow}> &gt; </span>
          <a href={`/rules?primaryTag=${encodeURIComponent(documentData.primaryTag)}`} className={styles.navItem}>{documentData.primaryTag}</a>
          <span className={styles.navArrow}> &gt; </span>
          <a href={`/rules?primaryTag=${encodeURIComponent(documentData.primaryTag)}&secondaryTag=${encodeURIComponent(documentData.secondaryTag)}`} className={styles.navItem}>{documentData.secondaryTag}</a>
          <span className={styles.navArrow}> &gt; </span>
          <span className={`${styles.navItem} ${styles.current}`}>{documentData.title}</span>
        </div>
        
        <div className={styles.documentHeader}>
          <h1 className={styles.documentTitle}>{documentData.title}</h1>
          <div className={styles.documentMeta}>
            <span className={styles.updateTime}>更新时间: {documentData.updateTime}</span>
          </div>
        </div>
        
        <div 
          className={styles.documentContent}
          ref={contentRef}
        >
          <ReactMarkdown components={components} remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSlug, rehypeRaw]}>{documentData.content}</ReactMarkdown>
        </div>
        
        {/* 右下角操作按钮 */}
        <div className={styles.actionButtons}>
          <div className={styles.tooltipContainer}>
            <span className={styles.tooltip}>下载PDF</span>
            <button 
              className={styles.actionButton}
              onClick={() => handleDownloadPDF()}
              aria-label="下载PDF"
            >
              <IconDownload style={{ fontSize: '18px', color: '#333333' }} />
            </button>
          </div>
          <div className={styles.tooltipContainer}>
            <span className={styles.tooltip}>复制链接</span>
            <button 
              className={styles.actionButton}
              onClick={() => {
                // 复制链接功能
                const currentUrl = window.location.href;
                navigator.clipboard.writeText(currentUrl).then(() => {
                  Message.success('链接已复制到剪贴板');
                }).catch(err => {
                  console.error('复制失败:', err);
                  Message.error('复制失败，请手动复制链接');
                });
              }}
              aria-label="复制链接"
            >
              <IconCopy style={{ fontSize: '18px', color: '#333333' }} />
            </button>
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {previewVisible && (
        <div className={styles.imagePreviewModal} onClick={handleClosePreview}>
          <button className={styles.previewCloseButton} onClick={handleClosePreview} aria-label="关闭预览">
            ✕
          </button>
          <div className={styles.previewImageContainer} onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="预览图片" 
              className={styles.previewImage} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RuleDetail;
