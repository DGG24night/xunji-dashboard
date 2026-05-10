import { getTrains, clearCache, clearAllCache, hasCache, XunjiApiError } from './index';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== 训记训练数据查询示例 ===\n');

  // 示例 1: 单日查询
  console.log('1. 单日查询 (2026-04-02):');
  try {
    const result = await getTrains('2026-04-02');
    console.log(`   来源: ${result.fromCache ? '缓存' : 'API'}`);
    console.log(`   数据: ${JSON.stringify(result.data, null, 2)}`);
  } catch (error) {
    if (error instanceof XunjiApiError) {
      console.error(`   错误: ${error.message}`);
      if (error.message.includes('请求过于频繁')) {
        console.log('   等待 35 秒后重试...');
        await sleep(35000);
        try {
          const result = await getTrains('2026-04-02');
          console.log(`   来源: ${result.fromCache ? '缓存' : 'API'}`);
          console.log(`   数据: ${JSON.stringify(result.data, null, 2)}`);
        } catch (retryError) {
          console.error(`   重试失败: ${retryError}`);
        }
      }
    } else {
      console.error(`   错误: ${error}`);
    }
  }

  console.log('\n2. 再次查询同一天 (应该从缓存读取):');
  try {
    const result = await getTrains('2026-04-02');
    console.log(`   来源: ${result.fromCache ? '缓存' : 'API'}`);
    console.log(`   数据条数: ${result.data.length}`);
  } catch (error) {
    console.error(`   错误: ${error}`);
  }

  console.log('\n3. 强制刷新缓存:');
  try {
    const result = await getTrains('2026-04-02', true);
    console.log(`   来源: ${result.fromCache ? '缓存' : 'API'}`);
    console.log(`   数据条数: ${result.data.length}`);
  } catch (error) {
    console.error(`   错误: ${error}`);
  }

  console.log('\n4. 日期范围查询 (2026-04-01 到 2026-04-03):');
  try {
    const results = await getTrains('2026-04-01', '2026-04-03');
    for (const result of results) {
      console.log(`   ${result.datestr}: ${result.fromCache ? '缓存' : 'API'}, ${result.data.length} 条数据`);
    }
  } catch (error) {
    console.error(`   错误: ${error}`);
  }

  console.log('\n5. 缓存管理:');
  console.log(`   2026-04-02 有缓存: ${hasCache('2026-04-02')}`);

  // 清除单日缓存
  // clearCache('2026-04-02');

  // 清除所有缓存
  // clearAllCache();

  console.log('\n=== 示例完成 ===');
}

main().catch(console.error);
