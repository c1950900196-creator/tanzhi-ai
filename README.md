# 探知 - AI 认知主动探测器

面向程序员和产品经理的 AI 认知探索平台。

## 项目结构

```
tanzhi/
├── server/          # 后端 Node.js (Express + MySQL)
│   ├── src/
│   │   ├── config.js         # 环境变量配置
│   │   ├── db.js             # MySQL 连接池
│   │   ├── app.js            # Express 应用初始化
│   │   ├── middleware/       # 认证、限流、错误处理
│   │   ├── routes/           # API 路由
│   │   ├── services/         # 业务逻辑
│   │   └── utils/            # 工具函数
│   ├── scripts/              # 数据库建表和迁移脚本
│   ├── server.js             # 入口文件
│   ├── .env                  # 环境变量 (不入 Git)
│   └── .env.example          # 环境变量模板
├── client/          # 前端 Vite + React
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── api/              # API 调用封装
│   │   └── App.jsx           # 主应用
│   └── dist/                 # 构建产物
├── admin/           # 管理后台 Vite + React
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   └── App.jsx           # 主应用
│   └── dist/                 # 构建产物
├── nginx/           # Nginx 配置
└── .gitignore
```

## 开发

```bash
# 后端
cd server && npm install && cp .env.example .env
# 编辑 .env 填入真实配置
npm run dev

# 前端 (另一个终端)
cd client && npm install && npm run dev

# 管理后台 (另一个终端)
cd admin && npm install && npm run dev
```

## 部署

```bash
# 构建前端
cd client && npm run build
cd ../admin && npm run build

# 上传到服务器
scp -r server/* user@server:/path/to/tanzhi-api/
scp -r client/dist/* user@server:/path/to/www/
scp -r admin/dist/* user@server:/path/to/www/admin/

# 服务器上重启
pm2 restart tanzhi-api
```

## 数据库迁移 (SQLite -> MySQL)

```bash
cd server
# 确保 .env 中配置了 MySQL 连接信息
# 先在 MySQL 中执行 scripts/schema.sql
node scripts/migrate-sqlite-to-mysql.js
```
