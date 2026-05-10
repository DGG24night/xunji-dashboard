import * as fs from 'fs';
import * as path from 'path';
import { CacheData } from './types';

const CACHE_DIR = path.join(process.cwd(), 'cache');

/** 确保缓存目录存在 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/** 获取缓存文件路径 */
function getCacheFilePath(datestr: string): string {
  return path.join(CACHE_DIR, `${datestr}.json`);
}

/** 读取缓存 */
export function readCache(datestr: string): CacheData | null {
  ensureCacheDir();
  const filePath = getCacheFilePath(datestr);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as CacheData;
  } catch {
    return null;
  }
}

/** 写入缓存 */
export function writeCache(datestr: string, data: string[]): void {
  ensureCacheDir();
  const filePath = getCacheFilePath(datestr);

  const cacheData: CacheData = {
    datestr,
    data,
    cachedAt: Date.now(),
  };

  fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/** 检查是否有缓存 */
export function hasCache(datestr: string): boolean {
  const filePath = getCacheFilePath(datestr);
  return fs.existsSync(filePath);
}

/** 清除指定日期的缓存 */
export function clearCache(datestr: string): boolean {
  const filePath = getCacheFilePath(datestr);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/** 清除所有缓存 */
export function clearAllCache(): void {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    }
  }
}
