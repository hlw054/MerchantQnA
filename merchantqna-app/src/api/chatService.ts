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

