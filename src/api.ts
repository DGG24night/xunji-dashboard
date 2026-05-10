import { TrainResponse, XunjiApiError } from './types';

const BASE_URL = 'https://trains.xunjiapp.cn';

/** 调用训记 API 获取训练数据 */
export async function fetchTrains(datestr: string, apiKey: string): Promise<string[]> {
  if (!apiKey) {
    throw new XunjiApiError('请先在设置中配置训记 API Key');
  }

  const url = `${BASE_URL}/api_trains_for_llm`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ datestr }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new XunjiApiError(
      `API 请求失败: ${response.status} ${response.statusText}`,
      response.status,
      text
    );
  }

  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    throw new XunjiApiError(
      'API 返回的 JSON 无效',
      response.status,
      text
    );
  }

  // 处理频率限制错误
  if (result.success === false && typeof result.res === 'string') {
    const match = result.res.match(/too frequent, retry after (\d+)s/);
    if (match) {
      throw new XunjiApiError(
        `请求过于频繁，请在 ${match[1]} 秒后重试`,
        undefined,
        text
      );
    }
    // 其他错误
    throw new XunjiApiError(
      `API 返回失败: ${result.res}`,
      undefined,
      text
    );
  }

  // 成功情况：res 是数组
  if (Array.isArray(result.res)) {
    return result.res;
  }

  // 如果有 success: true 且 res 是数组
  if (result.success === true && Array.isArray(result.res)) {
    return result.res;
  }

  // 未知格式
  throw new XunjiApiError(
    `API 返回格式异常: ${text}`,
    undefined,
    text
  );
}
