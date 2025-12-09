import { request } from './request';

// 定义消息类型
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 定义聊天类型
export interface Chat {
  chatId: string;
  userId: string;
  chatTitle: string;
  createdAt: string;
}

// 定义检索结果类型
export interface RetrievalResult {
  knowledgeId: string;
  content: string;
  metadata: {
    path: string;
  };
  relevanceScore: number;
  source: string;
}

// 定义第一阶段响应类型
export interface Phase1Response {
  optimizedQuery: string;
  mergedResults: RetrievalResult[];
  sources: {
    knowledgeId: string;
    title: string;
    path: string;
  }[];
}

/**
 * 执行聊天查询的第一阶段（检索）
 * @param query 用户原始查询内容
 * @param chatId 聊天会话ID
 * @returns 第一阶段的检索结果
 */
export const executeChatQueryPhase1 = async (query: string, chatId: string): Promise<Phase1Response> => {
  try {
    const response = await request.post(
      '/chat/query/phase1',
      { query, chatId }
    );
    console.log('第一阶段检索成功:', response);
    return response.data.data;
  } catch (error) {
    console.error('第一阶段检索失败:', error);
    throw error;
  }
}

/**
 * 执行聊天查询的第二阶段（生成回答）
 * @param query 用户原始查询内容
 * @param chatId 聊天会话ID
 * @param history 对话历史
 * @param optimizedQuery 第一阶段返回的优化查询
 * @param mergedResults 第一阶段返回的检索结果
 * @returns 包含SSE流的响应对象
 */
export const executeChatQueryPhase2 = async (
  query: string,
  chatId: string,
  history: Message[],
  optimizedQuery: string,
  mergedResults: RetrievalResult[]
): Promise<Response> => {
  try {
    const baseURL = import.meta.env.VITE_API_BASE;
    const response = await fetch(`${baseURL}/chat/query/phase2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify({ query, chatId, history, optimizedQuery, mergedResults })
    });
    return response;
  } catch (error) {
    console.error('第二阶段请求失败:', error);
    throw error;
  }
}

// 注意：流式请求功能已移至QA页面本地实现

/**
 * 通过userId获取Chat列表
 * @param userId 用户ID
 * @returns 聊天列表
 */
export const getChatListByUserId = async (userId: string) => {
  try {
    const response = await request.get(`/chat/${userId}/list`);
    
    console.log('获取聊天列表成功:', response);
    
    // 确保response.data.data存在且chats是数组
    if (response.data && response.data.data && Array.isArray(response.data.data.chats)) {
      return response.data.data.chats;
    }
    
    // 如果chats不存在或不是数组，返回一个默认的空列表
    return [];
  } catch (error) {
    console.error('获取聊天列表失败:', error);
    // 发生错误时返回空列表
    return [];
  }
}

/**
 * 创建聊天会话
 * @param query 用户查询内容（必填）
 * @param userId 用户ID（必填）
 * @returns 创建的聊天会话
 */
export const createChat = async (query: string, userId: string) => {
  try {
    const response = await request.post(
      '/chat/create',
      { query, userId }
    );
    console.log('创建聊天会话成功:', response);
    return response.data.data.chat;
  } catch (error) {
    console.error('创建聊天会话失败:', error);
    throw error;
  }
}

/**
 * 删除聊天会话及关联的所有消息
 * @param chatId 聊天ID（必填）
 * @returns 删除结果消息
 */
export const deleteChat = async (chatId: string) => {
  try {
    const response = await request.delete(`/chat/${chatId}`);
    console.log('删除聊天会话成功:', response);
    return response.data.data.message;
  } catch (error) {
    console.error('删除聊天会话失败:', error);
    throw error;
  }
}

/**
 * 通过聊天ID获取该聊天会话的所有消息列表
 * @param chatId 聊天ID（必填）
 * @returns 消息列表
 */
export const getChatMessages = async (chatId: string) => {
  try {
    const response = await request.get(`/chat/messages/${chatId}`);
    console.log('获取消息列表成功:', response);
    
    // 确保response.data.data存在且messages是数组
    if (response.data && response.data.data && Array.isArray(response.data.data.messages)) {
      return response.data.data.messages;
    }
    
    // 如果messages不存在或不是数组，返回一个默认的空列表
    return [];
  } catch (error) {
    console.error('获取消息列表失败:', error);
    // 发生错误时返回空列表
    return [];
  }
}

/**
 * 通过messageId删除单条消息
 * @param messageId 消息ID（必填）
 * @returns 删除结果
 */
export const deleteMessageById = async (messageId: string) => {
  try {
    const response = await request.delete(`/chat/message/${messageId}`);
    console.log('删除消息成功:', response);
    return response.data.data;
  } catch (error) {
    console.error('删除消息失败:', error);
    throw error;
  }
}

