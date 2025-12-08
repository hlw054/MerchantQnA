import React, { useState, useRef, useEffect } from 'react';
import { IconDown, IconRight, IconDownload, IconCopy } from '@arco-design/web-react/icon';
import { Message } from '@arco-design/web-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';

import { getDocumentDetail } from '../../../api/knowledgeService';
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
  
  // 获取文档详情
  useEffect(() => {
    const fetchDocumentDetail = async () => {
      try {
        setLoading(true);
        // 从URL获取id参数（这里简化处理，实际项目中应该使用useRouter）
        const id = window.location.pathname.split('/').pop() || '1';
        const response = await getDocumentDetail(id);
        
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
              onClick={() => {
                // 下载PDF功能 - 这里是示例实现
                console.log('下载PDF:', documentData.title);
                // 实际项目中应该调用API获取PDF或生成PDF
                Message.success(`下载PDF: ${documentData.title}`);
              }}
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
