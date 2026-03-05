require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'tanzhi_jwt_secret_fallback',
  adminKey: process.env.ADMIN_KEY || '',

  doubao: {
    apiKey: process.env.DOUBAO_API_KEY,
    model: process.env.DOUBAO_MODEL || 'doubao-seed-1-6-flash-250828',
    chatModel: process.env.DOUBAO_CHAT_MODEL || 'doubao-1-5-pro-32k-250115',
    embeddingModel: process.env.DOUBAO_EMBEDDING_MODEL,
    baseUrl: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    embeddingUrl: process.env.DOUBAO_EMBEDDING_URL || 'https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal'
  },

  db: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'tanzhi',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'tanzhi'
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://175.24.131.130', 'http://localhost:5173']
  }
};

const required = ['DOUBAO_API_KEY', 'JWT_SECRET', 'ADMIN_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[配置] 警告: 缺少环境变量 ${key}`);
  }
}

module.exports = config;
