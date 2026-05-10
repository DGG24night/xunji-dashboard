/**
 * 训记 API 类型定义
 */

/** API 返回的训练响应结构 */
export interface TrainResponse {
  success: boolean;
  res: string[] | string;
}

/** 缓存数据结构 */
export interface CacheData {
  /** 日期字符串 YYYY-MM-DD */
  datestr: string;
  /** 训练数据数组 */
  data: string[];
  /** 缓存创建时间戳 */
  cachedAt: number;
}

/** API 错误类型 */
export class XunjiApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: string
  ) {
    super(message);
    this.name = 'XunjiApiError';
  }
}

/** 日期范围 */
export interface DateRange {
  start: string;
  end: string;
}

/** 查询结果 */
export interface QueryResult {
  datestr: string;
  data: string[];
  fromCache: boolean;
}
