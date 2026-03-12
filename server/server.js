require('dotenv').config();

const { initDb } = require('./src/db');
const config = require('./src/config');

function scheduleDaily(bjHour, bjMinute, fn, name) {
  function getNextRun() {
    const now = new Date();
    const utcHour = (bjHour - 8 + 24) % 24;
    const next = new Date(now);
    next.setUTCHours(utcHour, bjMinute, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  function schedule() {
    const next = getNextRun();
    const delay = next.getTime() - Date.now();
    const hours = (delay / 3600000).toFixed(1);
    const bjStr = `${String(bjHour).padStart(2, '0')}:${String(bjMinute).padStart(2, '0')}`;
    console.log(`[定时] ${name} 下次执行: ${hours}小时后 (北京时间 ${bjStr})`);

    setTimeout(() => {
      console.log(`[定时] 开始执行: ${name}`);
      fn().then(() => {
        console.log(`[定时] ${name} 执行完成`);
      }).catch(e => {
        console.error(`[定时] ${name} 执行失败:`, e.message);
      }).finally(() => {
        schedule();
      });
    }, delay);
  }

  schedule();
}

async function start() {
  await initDb();
  console.log('[DB] 数据库初始化完成');

  const app = require('./src/app');
  const { cronFetchZhihu } = require('./src/services/zhihuCrawler');
  const { dailyGenerate } = require('./src/services/cardGenerator');

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Tanzhi API running on port ${config.port}`);

    // scheduleDaily(2, 0, dailyGenerate, '每日AI内容生成(100张)');
    // scheduleDaily(8, 0, cronFetchZhihu, '每日知乎热榜爬取');
  });
}

start().catch(e => {
  console.error('启动失败:', e);
  process.exit(1);
});
