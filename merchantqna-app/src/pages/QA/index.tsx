import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import { IconMenuFold, IconMessage, IconEdit, IconDelete, IconMenuUnfold, IconSearch, IconTiktokColor, IconImport, IconUser, IconSend, IconSync } from '@arco-design/web-react/icon';
import { Message } from '@arco-design/web-react';
import { getChatListByUserId, createChat, deleteChat, getChatMessages } from '../../api/chatService';
import type { Message as ChatMessage } from '../../api/chatService';

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
      onClick={isInternalLink ? handleInternalClick : handleInternalClick}
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
        title={title} 
        className={`${styles.customImage} ${loading ? styles.loading : ''} ${error ? styles.error : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
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
          timestamp: msg.sendTime
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
  const handleConfirmEdit = () => {
    if (newChatTitle.trim() && selectedChat) {
      setSelectedChat((prev: any) => prev ? { ...prev, title: newChatTitle.trim() } : null);
      setIsEditModalVisible(false);
      setNewChatTitle('');
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
    if (!inputValue.trim()) return;
    
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
      timestamp: new Date().toISOString()
    };
    
    // 添加到消息列表（用户消息和空的助手消息）
    setChatMessages(prev => [...prev, newMessage, assistantMessage]);
    
    // 清空输入框并重置高度
    setInputValue('');
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
    }
    
    // 将当前消息列表转换为sendChatQuery所需的格式
    const history: ChatMessage[] = []

    // 使用用户提供的简单流式请求方式获取回答
    const fetchStreamData = async (currentChatId: string) => {
      try {
        // 使用与request.ts相同的baseURL配置
        const baseURL = import.meta.env.VITE_API_BASE;
        
        // 确保有chatId
        if (!currentChatId) {
          throw new Error('聊天会话ID不存在');
        }
        
        const response = await fetch(`${baseURL}/chat/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
          },
          body: JSON.stringify({ query: inputValue.trim(), history, chatId: currentChatId })
        });

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
                  // 如果需要，可以在这里添加完成后的处理逻辑
                }
              } catch (jsonError) {
                console.error('JSON解析错误:', jsonError, jsonStr);
              }
            }
          }
        }

        console.log('流式输出完成');
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
    
    // 检查是否有正在思考的助手消息
    const hasEmptyAssistantMessage = chatMessages.some(msg => 
      msg.sender === 'assistant' && msg.content === ''
    );
    
    if (hasEmptyAssistantMessage) {
      // 如果有正在思考的消息，但还没有开始计时，设置开始时间
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
    } else {
      // 如果没有正在思考的消息，重置计时
      setThinkingStartTime(null);
      setThinkingDuration(0);
    }
    
    // 清理函数
    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [chatMessages, thinkingStartTime]);

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
      <div className={styles.mainContent}>
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
        <div className={styles.chatContent}>
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
                          {/* 如果助手消息内容为空，显示加载动画和计时 */}
                              {message.content === '' && (
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
                                    正在思考中... {thinkingDuration}秒
                                  </span>
                                </div>
                              )}
                          {/* 渲染助手消息内容 */}
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeSlug]} 
                            components={components}
                          >{message.content}</ReactMarkdown>
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
                  disabled={!inputValue.trim()}
                >
                  <IconSend />
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
    </div>
  );
};

export default QA;