import { request } from './request';
import { Message } from '@arco-design/web-react';

// 统计数据接口定义
export interface StatisticsData {
  userCount: number;
  knowledgeCount: number;
  messageCount: number;
  totalViews: number;
  totalReferences: number;
}

// 统计数据响应接口
export interface StatisticsResponse {
  success: boolean;
  data: StatisticsData;
}

// 分块引用数据接口
export interface ChunkReference {
  knowledgeId: string;
  title: string;
  totalReferences: number;
}

// 分块引用响应接口
export interface ChunkReferencesResponse {
  success: boolean;
  data: ChunkReference[];
}

// 二级标签引用统计接口
export interface SecondaryTagReference {
  primaryTag: string;
  secondaryTag: string;
  totalReferences: number;
}

// 二级标签引用统计响应接口
export interface SecondaryTagReferencesResponse {
  success: boolean;
  data: SecondaryTagReference[];
}

// 知识文档切片引用接口
export interface KnowledgeChunkReference {
  chunkId: string;
  path: string;
  referenceCount: number;
}

// 知识文档切片引用响应接口
export interface KnowledgeChunkReferencesResponse {
  success: boolean;
  data: KnowledgeChunkReference[];
}

/**
 * 获取系统统计数据
 * @returns 统计数据对象
 */
export const getSystemStatistics = async (): Promise<StatisticsData> => {
  try {
    const response = await request.get<StatisticsResponse>('/data/statistics');
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('获取统计数据失败');
    }
  } catch (error) {
    console.error('获取系统统计数据失败:', error);
    Message.error('获取系统统计数据失败，请稍后重试');
    
    // 返回模拟数据作为后备
    return {
      userCount: 234,
      knowledgeCount: 15,
      messageCount: 1245,
      totalViews: 8923,
      totalReferences: 456
    };
  }
};

/**
 * 获取指定分类的引用次数列表
 * @param primaryTag 一级标签名称
 * @param secondaryTag 二级标签名称
 * @returns 分块引用次数列表
 */
export const getChunkReferences = async (primaryTag: string, secondaryTag: string): Promise<ChunkReference[]> => {
  try {
    const response = await request.get<ChunkReferencesResponse>('/data/chunk-references', {
      params: { primaryTag, secondaryTag }
    });
    
    if (response.data.success) {
      console.log('分块引用数据:', response.data.data);
      return response.data.data;
    } else {
      throw new Error('获取分块引用数据失败');
    }
  } catch (error) {
    console.error('获取分块引用数据失败:', error);    
    // 返回模拟数据作为后备
    return [
      { knowledgeId: '24f5eba5-6379-4e45-9746-1b34dc395de6', title: '【抖音电商】商品体感验货规范', totalReferences: 0 },
      { knowledgeId: '4d8d2136-4e4f-4e34-bf2f-a7ff0333913a', title: '【抖音电商】商品品质抽检规范', totalReferences: 36 },
      { knowledgeId: '1d398b5b-790f-4fb5-a404-fc39a691c9d4', title: '【抖音电商】商品现场验货规范', totalReferences: 7 },
      { knowledgeId: '2c3eb7b7-9b4f-4b3b-ac52-95e1a828d80c', title: '抖音电商食品安全制度', totalReferences: 3 }
    ];
  }
};

/**
 * 获取二级分类的总引用次数
 * @returns 二级分类总引用次数统计列表
 */
export const getSecondaryTagReferences = async (): Promise<SecondaryTagReference[]> => {
  try {
    const response = await request.get<SecondaryTagReferencesResponse>('/data/secondary-tag-references');
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error('获取二级标签引用统计失败');
    }
  } catch (error) {
    console.error('获取二级标签引用统计失败:', error);
    Message.error('获取二级标签引用统计失败，请稍后重试');
    
    // 返回模拟数据作为后备
    return [
      { primaryTag: '产品', secondaryTag: '价格', totalReferences: 120 },
      { primaryTag: '产品', secondaryTag: '质量', totalReferences: 200 },
      { primaryTag: '服务', secondaryTag: '配送', totalReferences: 150 },
      { primaryTag: '服务', secondaryTag: '退款', totalReferences: 80 },
      { primaryTag: '政策', secondaryTag: '保修', totalReferences: 90 },
      { primaryTag: '技术', secondaryTag: '支持', totalReferences: 180 }
    ];
  }
};

/**
 * 获取指定知识文档的切片引用记录
 * @param knowledgeId 知识文档ID
 * @returns 按引用次数排序的切片引用记录列表
 */
export const getKnowledgeChunkReferences = async (knowledgeId: string): Promise<KnowledgeChunkReference[]> => {
  try {
    const response = await request.get<KnowledgeChunkReferencesResponse>('/data/chunk-references/knowledge', {
      params: { knowledgeId }
    });
    
    if (response.data.success) {
      console.log('知识文档切片引用数据:', response.data.data);
      return response.data.data;
    } else {
      throw new Error('获取知识文档切片引用数据失败');
    }
  } catch (error) {
    console.error('获取知识文档切片引用数据失败:', error);
    Message.error('获取知识文档切片引用数据失败，请稍后重试');
    
    // 返回模拟数据作为后备
    return [
      { chunkId: 'chunk001', path: '文档/产品规范/第1章/第1节', referenceCount: 25 },
      { chunkId: 'chunk002', path: '文档/产品规范/第2章/第3节', referenceCount: 18 },
      { chunkId: 'chunk003', path: '文档/产品规范/第1章/第2节', referenceCount: 12 },
      { chunkId: 'chunk004', path: '文档/产品规范/第3章/第1节', referenceCount: 8 },
      { chunkId: 'chunk005', path: '文档/产品规范/第2章/第1节', referenceCount: 5 }
    ];
  }
};
