import { fetchTrains } from './api';
import { readCache, writeCache, hasCache, clearCache, clearAllCache } from './cache';
import { QueryResult, XunjiApiError } from './types';

export { XunjiApiError } from './types';
export type { QueryResult, CacheData, TrainResponse } from './types';
export { clearCache, clearAllCache, hasCache };

// 存储 API Key
let _apiKey: string = '';

/** 设置 API Key */
export function setApiKey(key: string) {
  _apiKey = key;
}

/** 获取 API Key */
export function getApiKey(): string {
  return _apiKey;
}

/** 生成日期范围内的所有日期 */
function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  // 确保日期有效
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new XunjiApiError('日期格式无效，请使用 YYYY-MM-DD 格式');
  }

  // 确保开始日期不晚于结束日期
  if (startDate > endDate) {
    throw new XunjiApiError('开始日期不能晚于结束日期');
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/** 格式化日期字符串 */
function formatDate(datestr: string): string {
  // 确保格式为 YYYY-MM-DD
  const match = datestr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    throw new XunjiApiError('日期格式无效，请使用 YYYY-MM-DD 格式');
  }
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * 获取单日训练数据
 * @param datestr 日期字符串 YYYY-MM-DD
 * @param forceRefresh 是否强制刷新缓存
 * @returns 训练数据数组
 */
export async function getTrains(datestr: string, forceRefresh?: boolean): Promise<QueryResult>;

/**
 * 获取日期范围内的训练数据
 * @param start 开始日期 YYYY-MM-DD
 * @param end 结束日期 YYYY-MM-DD
 * @param forceRefresh 是否强制刷新缓存
 * @returns 训练数据数组
 */
export async function getTrains(start: string, end: string, forceRefresh?: boolean): Promise<QueryResult[]>;

export async function getTrains(
  startOrDatestr: string,
  endOrForceRefresh?: string | boolean,
  forceRefresh?: boolean
): Promise<QueryResult | QueryResult[]> {
  // 判断是单日查询还是范围查询
  const isRangeQuery = typeof endOrForceRefresh === 'string';

  if (isRangeQuery) {
    // 范围查询
    const start = formatDate(startOrDatestr);
    const end = formatDate(endOrForceRefresh as string);
    const refresh = forceRefresh || false;
    const dates = generateDateRange(start, end);

    const results: QueryResult[] = [];

    for (const date of dates) {
      const result = await fetchSingleDay(date, refresh);
      results.push(result);
    }

    return results;
  } else {
    // 单日查询
    const datestr = formatDate(startOrDatestr);
    const refresh = (endOrForceRefresh as boolean) || false;
    return fetchSingleDay(datestr, refresh);
  }
}

/** 获取单日数据（内部函数） */
async function fetchSingleDay(datestr: string, forceRefresh: boolean): Promise<QueryResult> {
  // 检查缓存
  if (!forceRefresh && hasCache(datestr)) {
    const cached = readCache(datestr);
    if (cached) {
      return {
        datestr,
        data: cached.data,
        fromCache: true,
      };
    }
  }

  // 从 API 获取
  try {
    const data = await fetchTrains(datestr, _apiKey);

    // 写入缓存
    writeCache(datestr, data);

    return {
      datestr,
      data,
      fromCache: false,
    };
  } catch (error) {
    if (error instanceof XunjiApiError) {
      throw error;
    }
    throw new XunjiApiError(`获取数据失败: ${error}`);
  }
}
