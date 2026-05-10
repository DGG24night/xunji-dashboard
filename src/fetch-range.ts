import { getTrains, setApiKey } from './index';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // 从环境变量读取 API Key
  const apiKey = process.env.XUNJI_API_KEY;
  if (!apiKey) {
    console.error('\n❌ 请设置环境变量 XUNJI_API_KEY');
    console.error('例如: export XUNJI_API_KEY=your_api_key\n');
    process.exit(1);
  }
  setApiKey(apiKey);

  // 获取命令行参数
  const args = process.argv.slice(2);
  
  let startDate: string;
  let endDate: string;
  
  if (args.length >= 2) {
    startDate = args[0];
    endDate = args[1];
  } else {
    // 默认获取最近30天的数据
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    
    startDate = lastMonth.toISOString().split('T')[0];
    endDate = today.toISOString().split('T')[0];
  }
  
  console.log(`\n=== 批量获取训练数据 ===`);
  console.log(`日期范围: ${startDate} 至 ${endDate}\n`);
  
  try {
    const results = await getTrains(startDate, endDate);
    
    let successCount = 0;
    let cacheCount = 0;
    let errorCount = 0;
    
    for (const result of results) {
      if (result.data.length > 0) {
        if (result.fromCache) {
          cacheCount++;
          console.log(`📦 ${result.datestr}: 从缓存读取 (${result.data.length} 条记录)`);
        } else {
          successCount++;
          console.log(`✅ ${result.datestr}: 从API获取 (${result.data.length} 条记录)`);
        }
      } else {
        console.log(`⚪ ${result.datestr}: 无训练数据`);
      }
    }
    
    console.log(`\n=== 完成 ===`);
    console.log(`成功获取: ${successCount} 天`);
    console.log(`从缓存读取: ${cacheCount} 天`);
    console.log(`总记录数: ${results.reduce((sum, r) => sum + r.data.length, 0)} 条\n`);
    
  } catch (error: any) {
    if (error.message && error.message.includes('请求过于频繁')) {
      console.error(`\n❌ 请求过于频繁，请稍后再试`);
      console.error(`提示: 同一训练日 90 秒内只能读取一次\n`);
    } else {
      console.error(`\n❌ 获取数据失败: ${error.message}\n`);
    }
    process.exit(1);
  }
}

main();
