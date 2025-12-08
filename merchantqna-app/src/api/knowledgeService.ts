import { request } from './request';
import { Message } from '@arco-design/web-react';

// 文档接口定义
export interface Document {
  id: string;
  title: string;
  primaryTag: string;
  secondaryTag: string;
  status: string;
  publishTime: string;
  createdAt: string;
  updatedAt: string;
  isAddedToRAG: boolean;
}

// 文档列表响应接口
export interface DocumentListResponse {
  status: string;
  data: {
    knowledgeList: Document[];
    total: number;
  };
}

// 根据标签获取文档列表
export const getDocumentsByTags = async (primaryTag?: string, secondaryTag?: string) => {
  try {
    const params = new URLSearchParams();
    if (primaryTag) params.append('primaryTag', primaryTag);
    if (secondaryTag) params.append('secondaryTag', secondaryTag);
    
    const response = await request.get<DocumentListResponse>(`/knowledge/list?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('获取文档列表失败:', error);
    Message.error('获取文档列表失败，请稍后重试');
    
    // 返回模拟数据作为后备
    return {
      status: 'success',
      data: {
        knowledgeList: [
        ],
        total: 0
      }
    };
  }
};

// 获取单个文档详情
export const getDocumentDetail = async (id: string) => {
  try {
    const response = await request.get(`/knowledge/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取文档详情失败:', error);
    Message.error('获取文档详情失败，请稍后重试');
    throw error;
  }
};

// 创建新文档
export const createDocument = async (title: string, primaryTag: string, secondaryTag: string) => {
  try {
    const response = await request.post('/knowledge', {
      title,
      primaryTag,
      secondaryTag
    });
    return response.data;
  } catch (error) {
    console.error('创建文档失败:', error);
    Message.error('创建文档失败，请稍后重试');
    throw error;
  }
};

// 更新文档基本信息
export const updateDocumentBasicInfo = async (id: string, data: {
  title?: string;
  primaryTag?: string;
  secondaryTag?: string;
  status?: string;
}) => {
  try {
    const response = await request.put(`/knowledge/basic-info/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('更新文档基本信息失败:', error);
    Message.error('更新文档基本信息失败，请稍后重试');
    throw error;
  }
};

// 更新文档内容
export const updateDocumentContent = async (id: string, content: string) => {
  try {
    const response = await request.put(`/knowledge/content/${id}`, {
      content
    });
    return response.data;
  } catch (error) {
    console.error('更新文档内容失败:', error);
    Message.error('更新文档内容失败，请稍后重试');
    throw error;
  }
};

// 删除文档
export const deleteDocument = async (id: string) => {
  try {
    // 参数验证
    if (!id) {
      throw new Error('文档ID是必填的');
    }
    
    const response = await request.delete(`/knowledge/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('删除文档失败:', error);
    // 显示适当的错误消息
    throw error;
  }
};

// PDF转Markdown
export const convertPdfToMarkdown = async (pdfFile: File) => {
  try {
    // 参数验证
    if (!pdfFile) {
      throw new Error('PDF文件是必填的');
    }
    
    // 验证文件类型
    if (!pdfFile.name.endsWith('.pdf')) {
      throw new Error('请上传PDF格式的文件');
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    
    // 调用API
    const response = await request.post('/pdf/conversion/to-markdown', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // 直接返回转换结果数据
    return response.data;
  } catch (error: any) {
    console.error('PDF转Markdown失败:', error);
    // 显示适当的错误消息
    const errorMessage = error.response?.data?.message || 'PDF转Markdown失败，请稍后重试';
    Message.error(errorMessage);
    throw error;
  }
};

// 上传文档到RAG
export const uploadToRAG = async (documentId: string) => {
  try {
    const response = await request.post(`/knowledge/${documentId}/add-to-rag`);
    return response.data;
  } catch (error) {
    console.error('上传到RAG失败:', error);
    Message.error('上传到RAG失败，请稍后重试');
    throw error;
  }
};

// 从RAG移除文档
export const removeFromRAG = async (documentId: string) => {
  try {
    const response = await request.post(`/knowledge/${documentId}/remove-from-rag`);
    return response.data;
  } catch (error) {
    console.error('从RAG移除失败:', error);
    Message.error('从RAG移除失败，请稍后重试');
    throw error;
  }
};

// 查看文档分块
export const viewDocumentChunks = async (documentId: string) => {
  try {
    const response = await request.get(`/knowledge/${documentId}/rag-chunks`);
    console.log('查看文档分块成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('查看文档分块失败:', error);
    Message.error('查看文档分块失败，请稍后重试');
    throw error;
  }
};
