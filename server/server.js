require('dotenv').config();

const { initDb } = require('./src/db');
const config = require('./src/config');

async function start() {
  await initDb();
  console.log('[DB] 数据库初始化完成');

  const app = require('./src/app');
  const { cronFetchZhihu } = require('./src/services/zhihuCrawler');

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Tanzhi API running on port ${config.port}`);
    setTimeout(cronFetchZhihu, 5000);
    setInterval(cronFetchZhihu, 6 * 3600 * 1000);
  });
}

start().catch(e => {
  console.error('启动失败:', e);
  process.exit(1);
});
