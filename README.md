# 探知 - AI 认知探索平台

> 一个面向程序员和产品经理的 AI 认知探索工具，通过卡片流 + AI 对话的方式，帮助用户发现和理解新技术趋势与产品思维。

**本项目由产品经理使用 Cursor + AI 辅助开发，零手写代码。**

## 功能亮点

- **卡片流浏览** — 类似 Tinder 的上下滑动交互，浏览 AI 生成的认知卡片
- **AI 对话** — 点击感兴趣的卡片，与 AI 深入讨论
- **个性化推荐** — 基于用户角色（程序员/产品经理）和兴趣标签推荐内容
- **智能去重** — 通过 Embedding 余弦相似度避免重复内容
- **管理后台** — 数据看板、卡片管理、用户管理、标签管理

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端（用户端） | React 19 + Vite 7 + TailwindCSS 4 |
| 前端（管理端） | React 19 + Vite 7 + TailwindCSS 4 |
| 后端 | Node.js + Express + MySQL |
| AI 能力 | 豆包 API（对话、Embedding、Web Search） |
| 部署 | Nginx + PM2 |

## 项目结构

```
tanzhi/
├── client/          # 用户端前端
├── admin/           # 管理后台前端
├── server/          # 后端 API 服务
└── nginx/           # Nginx 配置
```

## 快速开始

```bash
# 1. 安装依赖
cd server && npm install
cd ../client && npm install
cd ../admin && npm install

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 填入你的豆包 API Key 等配置

# 3. 初始化数据库
mysql -u root < server/scripts/schema.sql

# 4. 启动服务
cd server && npm start        # 后端
cd client && npm run dev      # 用户端
cd admin && npm run dev       # 管理端
```

## 许可

MIT
