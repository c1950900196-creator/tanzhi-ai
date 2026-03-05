require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const { cronFetchZhihu } = require('./src/services/zhihuCrawler');

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Tanzhi API running on port ${config.port}`);
  setTimeout(cronFetchZhihu, 5000);
  setInterval(cronFetchZhihu, 6 * 3600 * 1000);
});
