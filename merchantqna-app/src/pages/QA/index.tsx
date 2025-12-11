import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { IconMenuFold, IconMessage, IconEdit, IconDelete, IconMenuUnfold, IconSearch, IconTiktokColor, IconImport, IconUser, IconSend, IconSync, IconCopy, IconThumbUp, IconThumbDown, IconRefresh, IconDown } from '@arco-design/web-react/icon';
import { Message, Modal } from '@arco-design/web-react';
import { getChatListByUserId, createChat, deleteChat, getChatMessages, executeChatQueryPhase1, executeChatQueryPhase2, executeChatQueryPhase3, deleteMessageById, updateChatTitle } from '../../api/chatService';
import type { Message as ChatMessage } from '../../api/chatService';

// 自定义链接组件
const CustomLink = ({ href, children, mergedResults, ...props }: { href?: string; children?: React.ReactNode; mergedResults?: any[]; [key: string]: any }) => {
  // 判断是否为内部链接（以#开头）或外部链接
  const isInternalLink = href && typeof href === 'string' && href.startsWith('#');
  
  // 浮窗状态管理
  const [isHovered, setIsHovered] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ title?: string; displayPath?: string; content?: string }>({});
  
  // 提取数字并删除汉字的函数
  const extractNumbers = (text: string) => {
    // 使用正则表达式匹配所有数字
    const numbers = text.match(/\d+/g);
    // 如果有数字，将它们连接起来，否则返回原文本
    return numbers ? numbers.join('') : text;
  };
  
  // 处理children，提取数字
  const processedChildren = typeof children === 'string' 
    ? extractNumbers(children)
    : children;
  
  // 鼠标进入事件处理
  const handleMouseEnter = () => {
    if (typeof children === 'string' && mergedResults) {
      const indexStr = extractNumbers(children);
      const index = parseInt(indexStr, 10);
      
      if (!isNaN(index) && mergedResults[index - 1]) {
        const resultObj = mergedResults[index - 1];
        const { metadata, content } = resultObj;
        
        if (metadata?.path) {
          let cleanContent = content || '';
          
          // 去除content前面的path部分（如果存在）
          if (cleanContent.startsWith(metadata.path)) {
            cleanContent = cleanContent.substring(metadata.path.length).trim();
            // 如果去除后内容以换行或标点开头，也一并去除
            cleanContent = cleanContent.replace(/^[\s\n\r\-:\u2014]+/, '');
          }
          
          // 截取content为100字
          const truncatedContent = cleanContent.substring(0, 100) + (cleanContent.length > 100 ? '...' : '');
          
          // 分割path为title和去除title后的路径
          const pathParts = metadata.path.split('-');
          const title = pathParts[0] || '';
          
          // 生成去除title后的路径（如果有多个部分）
          const displayPath = pathParts.length > 1 
            ? pathParts.slice(1).join('-') 
            : '';
          
          setHoverInfo({
            title,
            displayPath,
            content: truncatedContent
          });
          setIsHovered(true);
        }
      }
    }
  };
  
  // 鼠标离开事件处理
  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoverInfo({});
  };
  
  // 链接点击处理逻辑
  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    console.log('点击链接:', href, children, mergedResults);
    if (isInternalLink && href && typeof href === 'string') {
      // 内部链接处理
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (typeof children === 'string' && mergedResults) {
      // 外部链接处理 - 构建规则页面跳转URL
      const indexStr = extractNumbers(children);
      const index = parseInt(indexStr, 10);
      
      if (!isNaN(index) && mergedResults[index - 1]) {
        const resultObj = mergedResults[index - 1];
        const { knowledgeId, metadata } = resultObj;
        
        if (knowledgeId && metadata?.path) {
          // 处理path：去掉第一个元素
          const pathParts = metadata.path.split('-');
          if (pathParts.length > 1) {
            pathParts.shift(); // 去掉第一个元素
            const adjustedPath = pathParts.join('-');
            
            // 构建跳转URL
            const rulesUrl = `/rules/${knowledgeId}?path=${encodeURIComponent(adjustedPath)}`;
            window.open(rulesUrl, '_blank');
          }
        }
      }
    }
  };

  // 当mergedResults为空或未定义时，只显示文本内容，不显示超链接
  const shouldShowLink = mergedResults && mergedResults.length > 0;

  if (!shouldShowLink) {
    return '';
  }

  return (
    <div className={styles.linkWrapper}>
      <a 
        href={href} 
        className={styles.customLink}
        target={isInternalLink ? '_self' : '_blank'} 
        rel={isInternalLink ? 'noopener noreferrer' : 'noopener noreferrer'} 
        onClick={handleLinkClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {processedChildren}
      </a>
      
      {/* Hover浮窗 */}
      {isHovered && hoverInfo.title && (hoverInfo.displayPath || hoverInfo.content) && (
        <div className={styles.linkTooltip}>
          <div className={styles.tooltipTitle}>{hoverInfo.title}</div>
          {hoverInfo.displayPath && (
            <div className={styles.tooltipPath}>{hoverInfo.displayPath}</div>
          )}
          {hoverInfo.content && (
            <div className={styles.tooltipContent}>{hoverInfo.content}</div>
          )}
        </div>
      )}
    </div>
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
const CustomImage = ({ src, alt, title }: { src: string; alt?: string; title?: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const handleLoad = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <span className={styles.imageContainer}>
      {loading && (
        <span className={styles.imageLoading}>
          <span className={styles.spinner}></span>
          <span>加载中...</span>
        </span>
      )}
      {error && (
        <span className={styles.imageError}>
          <span>图片加载失败</span>
        </span>
      )}
      <img 
        src={src} 
        alt={alt || '图片'} 
        title={title} 
        className={`${styles.customImage} ${loading ? styles.loading : ''} ${error ? styles.error : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </span>
  );
};

// 定义ReactMarkdown组件映射
const components: any = {
  a: CustomLink,
  img: CustomImage,
  p: CustomParagraph,
  h1: CustomH1,
  h2: CustomH2,
  h3: CustomH3,
  h4: CustomH4,
  h5: CustomH5,
  h6: CustomH6,
};

const QA: React.FC = () => {
  // 获取用户信息并检查登录状态
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage获取用户信息
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else {
      Message.error('请先登录');
      // 未登录，跳转到登录页面
      navigate('/login');
    }
  }, [navigate]);

  // 状态管理
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null as any);
  const chatTitleRef = useRef<any>(null);
  const [chatList, setChatList] = useState([] as any[]);
  const [inputValue, setInputValue] = useState('');
  const [chatMessages, setChatMessages] = useState([] as any[]);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  // 思考开始时间（用于计时）
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  // 思考时长（秒）
  const [thinkingDuration, setThinkingDuration] = useState<number>(0);
  // 发送按钮loading状态
  const [isSending, setIsSending] = useState(false);
  // 聊天内容区域引用，用于自动滚动
  const chatContentRef = useRef<HTMLDivElement>(null);
  // 点赞状态管理
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  // 点踩状态管理
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set());
  // 思考阶段状态
  const [thinkingPhase, setThinkingPhase] = useState<'retrieving' | 'thinking' | 'generating' | 'complete'>('complete');
  
  // 滚动到最底部按钮可见性状态
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // 参考资料侧边栏状态管理
  const [isReferenceSidebarOpen, setIsReferenceSidebarOpen] = useState(false);
  const [referenceSidebarData, setReferenceSidebarData] = useState<{
    references: any[];
    adoptedIndices: number[];
  } | null>(null);

  // 获取聊天列表
  useEffect(() => {
    const fetchChatList = async () => {
      if (userInfo?.id) {
        try {
          const chats = await getChatListByUserId(userInfo.id);
          
          // 确保chats是数组
          const normalizedChats = Array.isArray(chats) ? chats : [] as any[];
          
          // 设置聊天列表（无论是否为空）
          setChatList(normalizedChats);
          
          // 如果有聊天，自动选择第一个聊天
          if (normalizedChats.length > 0) {
            setSelectedChat({ id: normalizedChats[0].chatId, title: normalizedChats[0].chatTitle });
          } else {
            // 列表为空时，清空选中的聊天
            setSelectedChat({ id: null, title: '新对话' });
            setChatMessages([]);
          }
        } catch (error) {
          console.error('获取聊天列表失败:', error);
          Message.error('获取聊天列表失败，请稍后重试');
          
          // 发生错误时，显示空列表
          setChatList([]);
          setSelectedChat(null);
        }
      }
    };

    fetchChatList();
  }, [userInfo]);

  // 收起/展开侧栏功能
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  // 新建对话功能
  const handleNewChat = () => {
    // 如果当前已经在新对话状态（没有选中的chatId），则显示提示
    if (selectedChat && !selectedChat.id) {
      Message.info('您已经在最新的会话中');
      return;
    }
    
    // 清空当前消息列表
    setChatMessages([]);
    
    // 设置一个临时的selectedChat值，用于显示chat页面
    setSelectedChat({ id: null, title: '新对话' });
  };

  // 处理聊天项点击
  const handleChatItemClick = (chat: any) => {
    setSelectedChat({ id: chat.chatId, title: chat.chatTitle });
  };

  // 当选中的聊天会话变化时，获取消息列表
  useEffect(() => {
    // 如果没有选中的聊天会话或者是新对话，则不获取消息列表
    if (!selectedChat?.id) return;

    if (isNewChat) {
      setIsNewChat(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        // 调用getChatMessages函数获取消息列表
        const messages = await getChatMessages(selectedChat.id);

        // 转换消息格式，确保与现有渲染逻辑兼容
        const formattedMessages = messages.map((msg: any) => ({
          id: msg.messageId,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'assistant',
          mergedResults: msg.mergedResults,
          result: msg.result
        }));

        // 更新消息列表
        setChatMessages(formattedMessages);
      } catch (error) {
        console.error('获取消息列表失败:', error);
        Message.error('获取消息列表失败，请重试');
      }
    };

    fetchMessages();
  }, [selectedChat?.id]);

  // 弹窗状态管理
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  // 处理修改名称点击
  const handleEditChat = () => {
    if (selectedChat) {
      setNewChatTitle(selectedChat.title);
      setIsEditModalVisible(true);
    }
  };

  // 处理确认修改名称
  const handleConfirmEdit = async () => {
    if (newChatTitle.trim() && selectedChat && selectedChat.id) {
      try {
        // 调用API修改聊天标题
        const updatedChat = await updateChatTitle(selectedChat.id, newChatTitle.trim());
        
        // 更新本地状态
        setSelectedChat((prev: any) => prev ? { ...prev, title: updatedChat.chatTitle } : null);
        
        // 更新聊天列表中的标题
        setChatList(prevChatList => prevChatList.map((chat: any) => 
          chat.chatId === selectedChat.id ? { ...chat, chatTitle: updatedChat.chatTitle } : chat
        ));
        
        // 关闭弹窗并重置输入
        setIsEditModalVisible(false);
        setNewChatTitle('');
        
        // 显示成功消息
        Message.success('聊天标题修改成功');
      } catch (error: any) {
        console.error('修改聊天标题失败:', error);
        Message.error(error.message || '修改聊天标题失败，请稍后重试');
      }
    }
  };

  // 处理删除点击
  const handleDeleteChat = () => {
    setIsDeleteModalVisible(true);
  };

  // 处理确认删除
  const handleConfirmDelete = () => {
    // 如果没有选中的聊天会话，则提示用户并关闭模态框
    if (!selectedChat?.id) {
      Message.warning('你没有选中聊天会话');
      setIsDeleteModalVisible(false);
      return;
    }
    
    // 调用deleteChat接口删除聊天会话
    deleteChat(selectedChat.id)
      .then(message => {
        // 更新聊天列表，移除已删除的聊天会话
        setChatList(prevChatList => prevChatList.filter((chat: any) => chat.chatId !== selectedChat.id));
        
        // 关闭删除模态框
        setIsDeleteModalVisible(false);
        
        // 如果删除的是当前选中的聊天会话，则设置新的选中聊天或显示空状态
        setSelectedChat((_: { id: string | null; title: string }) => {
          const remainingChats = chatList.filter((chat: { chatId: string; chatTitle: string }) => chat.chatId !== selectedChat.id);
          if (remainingChats.length > 0) {
            return { id: remainingChats[0].chatId, title: remainingChats[0].chatTitle };
          } else {
            // 没有剩余聊天时，设置为空状态
            setChatMessages([]);
            return { id: null, title: '新对话' };
          }
        });
        
        // 显示删除成功消息
        Message.success(message);
      })
      .catch(error => {
        console.error('删除聊天会话失败:', error);
        // 显示删除失败消息
        Message.error('删除聊天会话失败，请重试');
        // 关闭删除模态框
        setIsDeleteModalVisible(false);
      });
  };

  // 处理发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || isSending) return;
    
    // 设置发送中状态
    setIsSending(true);
    
    // 创建新消息
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    // 创建一个空的助手消息，用于接收流式输出
    const assistantMessageId = `msg-${Date.now() + 1}`;
    const assistantMessage = {
      id: assistantMessageId,
      content: '',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      mergedResults: [], // 用于存储检索结果
      result: [] // 初始化result字段，保持数据结构一致性
    };
    
    // 添加到消息列表（用户消息和空的助手消息）
    setChatMessages(prev => [...prev, newMessage, assistantMessage]);
    
    // 清空输入框并重置高度
    setInputValue('');
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
    
    // 发送新消息后隐藏滚动按钮
    setShowScrollToBottom(false);
    
    // 重置思考阶段
    setThinkingPhase('retrieving');
    console.log('思考阶段:', thinkingPhase);
    
    // 将当前消息列表转换为sendChatQuery所需的格式
    const history: ChatMessage[] = []

    // 使用用户提供的简单流式请求方式获取回答
    const fetchStreamData = async (currentChatId: string) => {
      try {
        // 确保有chatId
        if (!currentChatId) {
          throw new Error('聊天会话ID不存在');
        }
        
        const phase1Result = await executeChatQueryPhase1(inputValue.trim(), currentChatId);
        console.log('第一阶段结果:', phase1Result);
        
        // 将检索结果存储到助手消息中
        setChatMessages(prev => {
          const updatedMessages = [...prev];
          const assistantIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
          if (assistantIndex !== -1) {
            updatedMessages[assistantIndex].mergedResults = phase1Result.mergedResults;
          }
          return updatedMessages;
        });
        
        // 第二阶段：思考阶段（还未收到流式输出前）
        setThinkingPhase('thinking');
        const response = await executeChatQueryPhase2(
          inputValue.trim(),
          currentChatId,
          history,
          phase1Result.optimizedQuery,
          phase1Result.mergedResults
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}\n${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应体的Reader');
        }

        const decoder = new TextDecoder();
        let done = false;
        let buffer = '';

        setThinkingPhase('generating');
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          // 解码当前块
          const chunk = decoder.decode(value, { stream: !done });
          buffer += chunk;
          
          // 按行分割缓冲区
          const lines = buffer.split('\n');
          // 保存最后一行（可能不完整）
          buffer = lines.pop() || '';
          
          // 处理每一行
          for (const line of lines) {
            // 跳过空行
            if (!line.trim()) continue;
            
            // 检查是否是SSE的data字段
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim();
              try {
                // 解析JSON对象
                const data = JSON.parse(jsonStr);
                
                // 根据type字段处理内容
                if (data.type === 'chunk' && data.content !== undefined) {
                  // 开始收到流式输出，切换到生成阶段
                  // 更新助手消息内容
                  setChatMessages(prev => {
                    const updatedMessages = [...prev];
                    const assistantIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
                    if (assistantIndex !== -1) {
                      updatedMessages[assistantIndex].content += data.content;
                    }
                    return updatedMessages;
                  });
                } else if (data.type === 'complete') {
                  // 处理完成事件
                  console.log('流式输出完成', data);
                  // 设置思考阶段为完成
                }
              } catch (jsonError) {
                console.error('JSON解析错误:', jsonError, jsonStr);
              }
            }
          }
        }
        
        // 所有流式数据读取完毕后，重新获取完整的消息列表以确保数据一致性
        if (currentChatId) {
          try {
          
            const messages = await getChatMessages(currentChatId);
            // 转换消息格式，确保与现有渲染逻辑兼容
            const formattedMessages = messages.map((msg: any) => ({
              id: msg.messageId,
              content: msg.content,
              sender: msg.role === 'user' ? 'user' : 'assistant',
              mergedResults: msg.mergedResults,
              result: msg.result, // 包含result字段，与获取历史消息时保持一致
            }));
            // 更新消息列表
            setChatMessages(formattedMessages);
            setThinkingPhase('complete');
            
            // 第三阶段：更新被采纳的文档
            // 获取最新的助手消息（最后一条助手消息）
            const latestAssistantMessage = formattedMessages.slice().reverse().find((msg: { id: string; content: string; sender: string; mergedResults?: any[]; result?: number[] }) => msg.sender === 'assistant' && msg.content !== '');
            if (latestAssistantMessage) {
              // 从回复中判断哪些文档被采用
              // 寻找[描述](链接)格式的超链接，排除![]()图片的干扰，从描述中提取数字
              const content = latestAssistantMessage.content;
              
              // 正则表达式匹配[描述](链接)格式的超链接，排除图片格式(![]())
              // 匹配规则：不是!开头，然后是[描述](链接)
              const linkRegex = /(?<!!)\[(.*?)\]\([^)]*\)/g;
              const adoptedResultsSet = new Set<number>(); // 使用Set去重
              let match;
              
              // 查找所有匹配的超链接
              while ((match = linkRegex.exec(content)) !== null) {
                // 提取[]内的描述
                const description = match[1];
                console.log('匹配到的描述:', description);
                
                // 从描述中提取数字（去除汉字，剩下的就是index）
                const numbers = description.match(/\d+/g);
                if (numbers) {
                  // 将提取的所有数字组合成一个字符串，然后转换为数字
                  const numberStr = numbers.join('');
                  const index = parseInt(numberStr, 10);
                  // 确保数字有效且不为0
                  if (!isNaN(index) && index >= 1) {
                    // 转换为0-based索引并添加到Set中
                    adoptedResultsSet.add(index - 1);
                  }
                }
              }
              
              // 将Set转换为数组并从小到大排序
              const adoptedResults = Array.from(adoptedResultsSet).sort((a, b) => a - b);
              
              // 如果有被采纳的文档，则调用第三阶段接口
              if (adoptedResults.length > 0) {
                try {
                  console.log(adoptedResults)
                  await executeChatQueryPhase3(latestAssistantMessage.id, adoptedResults);
                  console.log('第三阶段接口调用成功');
                  
                  // 更新本地最新助手消息的result字段
                  const updatedMessages = formattedMessages.map((msg: { id: string; content: string; sender: string; mergedResults?: any[]; result?: number[] }) => {
                    if (msg.id === latestAssistantMessage.id) {
                      return { ...msg, result: adoptedResults };
                    }
                    return msg;
                  });
                  
                  // 更新消息列表状态
                  setChatMessages(updatedMessages);
                } catch (error) {
                  console.error('第三阶段接口调用失败:', error);
                  // 失败时不影响用户体验
                }
              }
            }
          } catch (error) {
            console.error('重新获取消息列表失败:', error);
            // 失败时不影响用户体验，保持本地消息列表不变
          }
        }

        console.log('流式输出完成');
        // 发送完成，重置状态
        setIsSending(false);
      } catch (error) {
        console.error('流式输出错误:', error);
        Message.error('获取回答失败，请重试');
        
        // 更新助手消息为错误提示
        setChatMessages(prev => {
          const updatedMessages = [...prev];
          const assistantIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
          if (assistantIndex !== -1) {
            updatedMessages[assistantIndex].content = '抱歉，获取回答失败，请稍后重试。';
          }
          return updatedMessages;
        });
        
        // 发送失败，重置状态
        setIsSending(false);
        setThinkingPhase('complete');
      }
    };

    // 如果是新对话（selectedChat.id为null），则先创建聊天会话，再调用流式请求
    if (!selectedChat.id && userInfo?.id) {
      // 调用createChat接口创建聊天会话
      createChat(inputValue.trim(), userInfo.id)
        .then(newChat => {
          // 将新聊天添加到聊天列表
          setChatList(prevChatList => [newChat, ...prevChatList]);
          
          setIsNewChat(true);
          // 更新selectedChat为这个新创建的会话
          setSelectedChat({ id: newChat.chatId, title: newChat.chatTitle });
          
          // 现在有了chatId，可以调用流式请求了
          fetchStreamData(newChat.chatId);
        })
        .catch(error => {
          console.error('创建聊天会话失败:', error);
          Message.error('创建聊天会话失败，请重试');
          
          // 更新助手消息为错误提示
          setChatMessages(prev => {
            const updatedMessages = [...prev];
            const assistantIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
            if (assistantIndex !== -1) {
              updatedMessages[assistantIndex].content = '抱歉，创建对话失败，请稍后重试。';
            }
            return updatedMessages;
          });
          
          // 创建对话失败，重置发送状态
          setIsSending(false);
        });
    } else if (selectedChat.id) {
      // 已有聊天会话，直接调用流式请求
      fetchStreamData(selectedChat.id);
    } else {
      // 没有userInfo，无法创建聊天会话
      Message.error('请先登录');
      
      // 更新助手消息为错误提示
      setChatMessages(prev => {
        const updatedMessages = [...prev];
        const assistantIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
        if (assistantIndex !== -1) {
          updatedMessages[assistantIndex].content = '抱歉，请先登录后再进行对话。';
        }
        return updatedMessages;
      });
      
      // 未登录，重置发送状态
      setIsSending(false);
    }
  };



  // 防止body出现滚动条
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 思考计时器
  useEffect(() => {
    let timer: number | null = null;
    
    // 检查是否处于思考阶段（retrieving、thinking或generating）
    const isThinking = thinkingPhase === 'retrieving' || thinkingPhase === 'thinking' || thinkingPhase === 'generating';
    
    if (isThinking) {
      // 如果正在思考，但还没有开始计时，设置开始时间
      if (!thinkingStartTime) {
        setThinkingStartTime(Date.now());
      }
      
      // 启动计时器
      timer = window.setInterval(() => {
        if (thinkingStartTime) {
          const duration = Math.floor((Date.now() - thinkingStartTime) / 1000);
          setThinkingDuration(duration);
        }
      }, 1000);
    } else if (thinkingPhase === 'complete') {
      // 如果思考完成，重置计时
      setThinkingStartTime(null);
      setThinkingDuration(0);
    }
    
    // 清理函数
    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [thinkingStartTime, thinkingPhase]);

  // 监听聊天消息变化，自动滚动到底部
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
      setShowScrollToBottom(false); // 滚动到底部后隐藏按钮
    }
  }, [chatMessages]);
  
  // 监听滚动事件，控制滚动到最底部按钮的显示/隐藏
  useEffect(() => {
    const handleScroll = () => {
      if (chatContentRef.current) {
        // 计算当前滚动位置距离底部的距离
        const distanceFromBottom = chatContentRef.current.scrollHeight - chatContentRef.current.scrollTop - chatContentRef.current.clientHeight;
        // 当距离底部超过100px时显示按钮
        const scrollThreshold = 100;
        setShowScrollToBottom(distanceFromBottom > scrollThreshold);
      }
    };
    
    if (chatContentRef.current) {
      chatContentRef.current.addEventListener('scroll', handleScroll);
    }
    
    // 清理函数
    return () => {
      if (chatContentRef.current) {
        chatContentRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#f3f3f3', 
      minHeight: '100vh', 
      width: '100vw', 
      display: 'flex',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* 左侧目录部分 */}
      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        {/* 确保所有侧边栏内容都在条件渲染内 */}
        {!isSidebarCollapsed && (
          <>
            {/* 顶部两个icon */}
            <div className={styles.sidebarHeader}>
              <div className={styles.iconButtonContainer}>
                <div className={styles.iconButton} onClick={handleToggleSidebar}>
                  <IconMenuFold />
                </div>
                <div className={styles.iconTooltip}>
                  收起侧栏
                </div>
              </div>
              <div className={styles.iconButtonContainer} style={{marginLeft: '4px'}}>
                <div className={styles.iconButton} onClick={handleNewChat}>
                  <IconMessage />
                </div>
                <div className={styles.iconTooltip}>
                  新建对话
                </div>
              </div>
            </div>

            {/* 搜索框 */}
            <div className={styles.searchBox}>
              <div className={styles.searchIcon}>
                <IconSearch />
              </div>
              <input type="text" placeholder="搜索" className={styles.searchInput} />
            </div>

            {/* 抖音图标 + 商家问答助手 */}
            <div className={styles.assistantInfo}>
              <div className={styles.douyinIcon}>
                <IconTiktokColor />
              </div>
              <div className={styles.assistantName}>商家问答助手</div>
            </div>

            {/* 加粗字体"聊天" */}
            <div className={styles.chatTitle}>
              聊天
            </div>

            {/* 聊天列表 */}
            <div className={styles.chatList}>
              {chatList.length > 0 ? (
                chatList.map(chat => (
                  <div 
                    key={chat.chatId} 
                    className={`${styles.chatItem} ${selectedChat?.id === chat.chatId ? styles.chatItemActive : ''}`}
                    onClick={() => handleChatItemClick(chat)}
                  >
                    <div className={styles.chatItemContent}>
                      <div className={styles.chatItemTitle}>{chat.chatTitle}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyChatList}>
                  <IconMessage style={{ fontSize: '40px', color: '#ccc', marginBottom: '16px' }} />
                  <div className={styles.emptyChatListText}>暂无问答记录</div>
                </div>
              )}
            </div>

            {/* 返回首页按钮 */}
              <button className={styles.homeButton} onClick={() => navigate('/')}>
                <IconImport style={{ marginRight: '8px' }} />
                返回首页
              </button>

            {/* 底部用户信息 */}
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <IconUser style={{ fontSize: '20px', color: '#333' }} />
              </div>
              <div className={styles.userName}>{userInfo?.username || '商家用户'}</div>
            </div>
          </>
        )}
      </div>

      {/* 右侧内容区域 */}
      <div className={`${styles.mainContent} ${isReferenceSidebarOpen ? styles.mainContentWithSidebar : ''}`}>
        {/* 主聊天内容 */}
        <div className={styles.chatMainArea}>
        {/* 合并的顶部工具栏 */}
        <div className={styles.chatHeader} ref={chatTitleRef}>
          <div className={styles.chatHeaderLeft}>
            {isSidebarCollapsed && (
              <>
                <div className={styles.iconButtonContainer} style={{marginLeft: '0px'}}>
                  <div className={styles.iconButton} onClick={handleToggleSidebar}>
                    <IconMenuUnfold />
                  </div>
                  <div className={styles.iconTooltip}>
                    展开侧栏
                  </div>
                </div>
                <div className={styles.iconButtonContainer} style={{marginLeft: '5px'}}>
                  <div className={styles.iconButton} onClick={handleNewChat}>
                    <IconMessage />
                  </div>
                  <div className={styles.iconTooltip}>
                    新建对话
                  </div>
                </div>
                {/* 添加一个分割线 */}
                <div className={styles.divider} />
                
              </>
            )}
            <div className={styles.chatTitleText}>
              {selectedChat ? selectedChat.title : '请选择或创建一个对话'}
            </div>
          </div>
          {selectedChat && (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'right'}}>
              <div className={styles.iconButtonContainer}>
                <IconEdit 
                  className={styles.headerIcon}
                  onClick={() => handleEditChat()}
                />
                <div className={styles.iconTooltip}>修改名称</div>
              </div>
              <div className={styles.iconButtonContainer}>
                <IconDelete 
                  className={styles.headerIcon}
                  onClick={() => handleDeleteChat()}
                />
                <div className={styles.iconTooltip}>删除</div>
              </div>
            </div>
          )}
        </div>
            
            {/* 聊天内容区域 */}
        <div className={styles.chatContent} ref={chatContentRef}>
          {/* 当selectedChat存在（包括临时的新对话状态）时，显示聊天容器 */}
          <div className={styles.chatContainer}>
            {/* 空聊天状态 */}
            {chatMessages.length === 0 && (
              <div className={styles.welcomeMessage}>
                <div className={styles.welcomeText}>
                  Hi~ 我是商家问答小助手<br />
                  你身边的智能助手，可以为你答疑解惑、精读文档、尽情创作，让我助你轻松工作，多点生活
                </div>
              </div>
            )}
            
            {/* 聊天消息列表 */}
            {chatMessages.length > 0 && (
              <div className={styles.messageList}>
                {chatMessages.map(message => (
                  <div 
                    key={message.id} 
                    className={`${styles.messageItem} ${message.sender === 'user' ? styles.userMessage : styles.assistantMessage}`}
                  >
                    <div className={styles.messageContent}>
                      {message.sender === 'user' ? (
                        // 用户消息：处理换行，将\n转换为<br />标签
                        <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
                      ) : (
                        // 助手消息：使用ReactMarkdown渲染markdown内容
                        <div className={styles.documentContent}>
                          {/* 在思考阶段（retrieving、thinking、generating）显示状态，complete阶段不显示，且只在最后一个助手消息上显示 */}
                              {thinkingPhase !== 'complete' && message.id === chatMessages.slice().reverse().find(m => m.sender === 'assistant')?.id && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px',
                                  padding: '8px 0'
                                }}>
                                  <IconSync 
                                    spin 
                                    style={{ 
                                      fontSize: 16, 
                                      color: 'var(--color-primary)',
                                      marginRight: '4px'
                                    }} 
                                  />
                                  <span style={{ 
                                    fontSize: '14px', 
                                    color: 'var(--color-text-3)',
                                    fontStyle: 'italic'
                                  }}>
                                    {thinkingPhase === 'retrieving' && '正在获取相关文档... '}
                                    {thinkingPhase === 'thinking' && (
                                      <>已获取 {message.mergedResults?.length || 0} 篇相关文档，正在思考回答... </>
                                    )}
                                    {thinkingPhase === 'generating' && (
                                      <>正在生成回答... </>
                                    )}
                                    
                                    {thinkingDuration}秒
                                  </span>
                                </div>
                              )}
                          {/* 渲染助手消息内容 */}
                          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkBreaks]} 
            rehypePlugins={[rehypeSlug, rehypeRaw]} 
            components={{...components, a: (props) => <CustomLink {...props} mergedResults={message.mergedResults} />}}
          >{message.content}</ReactMarkdown>
                          
                          {/* 助手消息功能图标 */}
                          <div className={styles.assistantActions}>
                            {/* 复制功能 */}
                            <IconCopy 
                              style={{ fontSize: 18, marginRight: 16, cursor: 'pointer' }}
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                Message.success('已复制到剪贴板');
                              }}
                            />
                            
                            {/* 点赞功能 */}
                            <IconThumbUp 
                              style={{
                                fontSize: 18,
                                marginRight: 16, 
                                cursor: 'pointer',
                                color: likedMessages.has(message.id) ? '#165DFF' : 'inherit'
                              }}
                              onClick={() => {
                                setLikedMessages(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(message.id)) {
                                    newSet.delete(message.id);
                                  } else {
                                    newSet.add(message.id);
                                    // 如果点了赞，就取消点踩
                                    setDislikedMessages(prevDisliked => {
                                      const newDislikedSet = new Set(prevDisliked);
                                      newDislikedSet.delete(message.id);
                                      return newDislikedSet;
                                    });
                                  }
                                  return newSet;
                                });
                                Message.success('已点赞');
                              }}
                            />
                            
                            {/* 点踩功能 */}
                            <IconThumbDown 
                              style={{
                                fontSize: 18,
                                marginRight: 16, 
                                cursor: 'pointer',
                                color: dislikedMessages.has(message.id) ? '#165DFF' : 'inherit'
                              }}
                              onClick={() => {
                                setDislikedMessages(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(message.id)) {
                                    newSet.delete(message.id);
                                  } else {
                                    newSet.add(message.id);
                                    // 如果点了踩，就取消点赞
                                    setLikedMessages(prevLiked => {
                                      const newLikedSet = new Set(prevLiked);
                                      newLikedSet.delete(message.id);
                                      return newLikedSet;
                                    });
                                  }
                                  return newSet;
                                });
                                Message.success('已点踩');
                              }}
                            />
                    
                            
                            {/* 重新生成功能 - 只在最后一条助手消息显示，且输出完成 */}
                          {chatMessages.indexOf(message) === chatMessages.length - 1 && thinkingPhase === 'complete' && (
                            <IconRefresh 
                              style={{ fontSize: 18, cursor: 'pointer', marginRight: 16 }}
                              onClick={async () => {
                                // 找到当前回答对应的问题索引
                                const currentIndex = chatMessages.indexOf(message);
                                if (currentIndex > 0) {
                                  // 获取问题消息
                                  const questionMessage = chatMessages[currentIndex - 1];
                                  if (questionMessage.sender === 'user') {
                                    // 确认重新生成
                                    Modal.confirm({
                                      title: '确认重新生成',
                                      content: '确定要重新生成回答吗？这将删除当前的回答和问题。',
                                      onOk: async () => {
                                        try {
                                          // 调用API删除问题和回答
                                          await Promise.all([
                                            deleteMessageById(questionMessage.id),
                                            deleteMessageById(message.id)
                                          ]);
                                          // 更新本地状态
                                          const newMessages = chatMessages.filter((_, idx) => idx !== currentIndex - 1 && idx !== currentIndex);
                                          setChatMessages(newMessages);
                                          // 将问题内容复制到输入框
                                          setInputValue(questionMessage.content);
                                          Message.success('已删除当前问答，您可以重新生成');
                                        } catch (error) {
                                          console.error('删除消息失败:', error);
                                          Message.error('删除消息失败，请稍后重试');
                                        }
                                      },
                                    });
                                  }
                                }
                              }}
                            />
                          )}

                            {/* 参考资料提示 - 最后一条助手消息在输出完成或初始状态时显示，非最后一条始终显示 */}
                            {message.mergedResults && message.mergedResults.length > 0 && 
                              (chatMessages.indexOf(message) !== chatMessages.length - 1 || thinkingPhase === 'complete') && (
                              <div 
                                className={styles.referenceHint}
                                onClick={() => {
                                  setIsReferenceSidebarOpen(true);
                                  // 更新侧边栏数据
                                  setReferenceSidebarData({
                                    references: message.mergedResults,
                                    adoptedIndices: message.result || []
                                  });
                                }}
                              >
                                <span style={{ marginRight: '4px' }}>找了 {message.mergedResults.length} 篇资料作为参考</span>
                                <IconDown style={{ fontSize: 14, transform: 'rotate(-90deg)' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* 聊天消息列表会在这里渲染 */}
          </div>
        </div>

        {/* 聊天输入框 */}
        {selectedChat && (
          <div className={styles.inputContainer}>
            {/* 滚动到最底部按钮 */}
            <div className={`${styles.scrollToBottomButton} ${showScrollToBottom ? styles.visible : ''}`} onClick={() => {
              if (chatContentRef.current) {
                chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
                setShowScrollToBottom(false); // 滚动到底部后隐藏按钮
              }
            }}>
              <IconDown />
            </div>
            <div className={`${styles.inputWrapper} ${inputValue.trim() ? styles.inputWrapperActive : ''}`}>
              <textarea
                ref={chatInputRef}
                className={styles.chatInput}
                placeholder="有问题，尽管问，shift+enter换行"
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // 自动调整输入框高度
                  if (chatInputRef.current) {
                    chatInputRef.current.style.height = 'auto';
                    chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 120)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              ></textarea>
              <div className={styles.sendButtonRow}>
                <button 
                  className={`${styles.sendButton} ${inputValue.trim() ? styles.sendButtonActive : ''}`}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isSending}
                >
                  {isSending ? <IconSync spin /> : <IconSend />}
                </button>
              </div>
            </div>
            <div className={styles.aiDisclaimer}>
              内容由AI生成，仅供参考
            </div>
          </div>
        )}

        {/* 编辑名称弹窗 */}
        {isEditModalVisible && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalTitle}>修改聊天名称</div>
              <div className={styles.modalInputContainer}>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder="请输入新的聊天名称"
                  autoFocus
                />
              </div>
              <div className={styles.modalButtons}>
                <button className={styles.modalCancelButton} onClick={() => setIsEditModalVisible(false)}>
                  取消
                </button>
                <button className={styles.modalConfirmButton} onClick={handleConfirmEdit}>
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认弹窗 */}
        {isDeleteModalVisible && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalTitle}>确认删除</div>
              <div className={styles.modalMessage}>确定要删除这个聊天吗？删除后将无法恢复。</div>
              <div className={styles.modalButtons}>
                <button className={styles.modalCancelButton} onClick={() => setIsDeleteModalVisible(false)}>
                  取消
                </button>
                <button className={styles.modalDangerButton} onClick={handleConfirmDelete}>
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        
        {/* 参考资料侧边栏 */}
        {isReferenceSidebarOpen && (
          <div className={styles.referenceSidebar}>
            <div className={styles.referenceSidebarHeader}>
              <div className={styles.referenceSidebarTitle}>引用来源</div>
              <div 
                className={styles.referenceSidebarClose}
                onClick={() => {
                  setIsReferenceSidebarOpen(false);
                  setReferenceSidebarData(null);
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'black' }}>×</span>
              </div>
            </div>
            <div className={styles.referenceList}>
              {referenceSidebarData ? (
                referenceSidebarData.references.map((result: any, index: number) => {
                  const adopted = referenceSidebarData.adoptedIndices.includes(index);
                  
                  // 处理点击跳转功能
                  const handleReferenceClick = () => {
                    if (!result || !result.knowledgeId || !result.metadata?.path) {
                      return;
                    }
                    
                    // 处理path：去掉第一个元素
                    const pathParts = result.metadata.path.split('-');
                    if (pathParts.length > 1) {
                      pathParts.shift(); // 去掉第一个元素
                      const adjustedPath = pathParts.join('-');
                      
                      // 构建跳转URL
                      const rulesUrl = `/rules/${result.knowledgeId}?path=${encodeURIComponent(adjustedPath)}`;
                      window.open(rulesUrl, '_blank');
                    }
                  };
                  
                  return (
                    <div 
                      key={index} 
                      className={`${styles.referenceItem} ${adopted ? styles.referenceItemAdopted : styles.referenceItemNotAdopted}`}
                      onClick={handleReferenceClick}
                    >
                      <div className={styles.referenceContent}>
                        <div className={styles.referenceTitleContainer}>
                          <div className={styles.referenceTitle}>
                            {result.metadata?.title || result.metadata?.path || '未命名文档'}
                          </div>
                          <div 
                            className={`${styles.referenceNumber} ${adopted ? styles.referenceNumberAdopted : styles.referenceNumberNotAdopted}`}
                          >
                            {index + 1}
                          </div>
                        </div>
                        {result.metadata?.date && (
                          <div className={styles.referenceDate}>{result.metadata.date}</div>
                        )}
                        <div className={styles.referenceSnippet}>
                          {result.content?.substring(0, 300) || ''}...
                        </div>
                        <div className={`${styles.referenceStatus} ${adopted ? styles.referenceStatusAdopted : styles.referenceStatusNotAdopted}`}>
                          {adopted ? '已采用' : '未采用'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyReferences}>暂无参考资料</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QA;