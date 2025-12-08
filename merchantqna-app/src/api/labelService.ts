import { request } from './request';
import { Message } from '@arco-design/web-react';

// 标签接口定义
export interface Label {
  id: string;
  name: string;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// 分类接口定义（用于前端展示）
export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

// 子分类接口定义（用于前端展示）
export interface Subcategory {
  id: string;
  name: string;
}

// 标签列表响应接口
export interface LabelListResponse {
  success: boolean;
  data: Category[];
  message: string;
}

// 单个标签响应接口
export interface LabelResponse {
  success: boolean;
  data: Label;
  message: string;
}

// 通用响应接口
export interface CommonResponse {
  success: boolean;
  message: string;
}

/**
 * 获取所有标签列表
 */
export const getAllLabels = async (): Promise<Category[]> => {
  try {
    const response = await request.get<LabelListResponse>('/label');
    const data = response.data;
    if (data.success) {
        console.log(data.data);
      return data.data;
    } else {
      Message.error(data.message || '获取标签列表失败');
      return [];
    }
  } catch (error) {
    console.error('获取标签列表失败:', error);
    Message.error('获取标签列表失败，请稍后重试');
    return [];
  }
};

/**
 * 创建一级标签
 * @param name 标签名称
 */
export const createPrimaryLabel = async (name: string): Promise<Label | null> => {
  try {
    const response = await request.post<LabelResponse>('/label/primary', { name });
    const data = response.data;
    if (data.success) {
      Message.success(data.message || '一级标签创建成功');
      return data.data;
    } else {
      Message.error(data.message || '一级标签创建失败');
      return null;
    }
  } catch (error) {
    console.error('创建一级标签失败:', error);
    Message.error('创建一级标签失败，请稍后重试');
    return null;
  }
};

/**
 * 创建二级标签
 * @param name 标签名称
 * @param parentId 父标签ID
 */
export const createSecondaryLabel = async (name: string, parentId: string): Promise<Label | null> => {
  try {
    const response = await request.post<LabelResponse>('/label/secondary', { name, parentId });
    const data = response.data;
    if (data.success) {
      Message.success(data.message || '二级标签创建成功');
      return data.data;
    } else {
      Message.error(data.message || '二级标签创建失败');
      return null;
    }
  } catch (error) {
    console.error('创建二级标签失败:', error);
    Message.error('创建二级标签失败，请稍后重试');
    return null;
  }
};

/**
 * 删除一级标签
 * @param id 标签ID
 */
export const deletePrimaryLabel = async (id: string): Promise<boolean> => {
  try {
    const response = await request.delete<CommonResponse>(`/label/primary/${id}`);
    const data = response.data;
    if (data.success) {
      Message.success(data.message || '一级标签删除成功');
      return true;
    } else {
      Message.error(data.message || '一级标签删除失败');
      return false;
    }
  } catch (error) {
    console.error('删除一级标签失败:', error);
    Message.error('删除一级标签失败，请稍后重试');
    return false;
  }
};

/**
 * 删除二级标签
 * @param id 标签ID
 */
export const deleteSecondaryLabel = async (id: string): Promise<boolean> => {
  try {
    const response = await request.delete<CommonResponse>(`/label/secondary/${id}`);
    const data = response.data;
    if (data.success) {
      Message.success(data.message || '二级标签删除成功');
      return true;
    } else {
      Message.error(data.message || '二级标签删除失败');
      return false;
    }
  } catch (error) {
    console.error('删除二级标签失败:', error);
    Message.error('删除二级标签失败，请稍后重试');
    return false;
  }
};