# GitHub Pages 部署指南

## 重要说明

GitHub Pages 只能托管**静态文件**（HTML/CSS/JS），无法运行 Node.js 后端和 MySQL 数据库。

### 解决方案对比

| 方案 | 前端 | 后端 | 数据库 | 说明 |
|------|------|------|--------|------|
| 方案一 | GitHub Pages | 阿里云/腾讯云 | MySQL | 推荐，前后端分离 |
| 方案二 | GitHub Pages | Vercel/Render | PostgreSQL | 全免费，但需改数据库 |
| 方案三 | 阿里云 | 阿里云 | MySQL | 最简单，无需分离 |

---

## 方案一：GitHub Pages + 阿里云后端（推荐）

### 第一部分：部署前端到 GitHub Pages

#### 1. 修改 API 配置
编辑 `api-client.js`，将 baseURL 改为你的后端地址：

```javascript
const API_CONFIG = {
  baseURL: 'http://你的服务器 IP:3000/api',  // 改为阿里云后端地址
  timeout: 10000
};
```

#### 2. 创建 gh-pages 分支
```bash
# 在本地项目根目录执行
git checkout -b gh-pages

# 确保包含以下文件
git add index.html player.html matchday.html
git add style.css app.js api-client.js
git add login.html login.css login.js

# 提交
git commit -m "deploy: 部署到 GitHub Pages"

# 推送
git push origin gh-pages
```

#### 3. 开启 GitHub Pages
1. 进入 GitHub 仓库
2. Settings > Pages
3. Source 选择 `gh-pages` 分支
4. 点击 Save

几分钟后访问：`https://你的用户名.github.io/仓库名/`

#### 4. 配置 CORS（在阿里云后端）
编辑后端 `.env` 文件：
```env
FRONTEND_URL=https://你的用户名.github.io
CORS_ORIGIN=https://你的用户名.github.io
```

---

## 方案二：全免费部署（前端 + 后端）

### 前端：GitHub Pages
同上，部署到 `gh-pages` 分支。

### 后端：使用 Vercel / Render / Railway

#### 选项 A：Vercel（推荐）

Vercel 支持 Node.js 服务，但有 Serverless 限制。

**1. 改造后端为 Vercel 格式**

创建 `vercel.json`：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

**2. 修改数据库为 PostgreSQL**

Vercel 无 MySQL，需改用 PostgreSQL 或使用云数据库。

推荐使用 [Neon](https://neon.tech) 免费 PostgreSQL：
- 注册 Neon
- 创建数据库
- 获取连接字符串

**3. 修改后端配置**

编辑 `backend/config/database.js`：
```javascript
const mysql = require('mysql2/promise');

// 改为 PostgreSQL（使用 pg 库）
// 或继续使用 MySQL 但连接阿里云数据库

const pool = mysql.createPool({
  host: process.env.DB_HOST,  // 阿里云数据库地址
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 5
});
```

**4. 部署到 Vercel**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd backend
vercel --prod
```

**5. 设置环境变量**
在 Vercel 控制台设置：
```
DB_HOST=你的 MySQL 地址
DB_USER=root
DB_PASSWORD=xxx
DB_NAME=badminton_ranking
JWT_SECRET=xxx
```

#### 选项 B：Render（更简单）

Render 提供免费的 Node.js 托管（有休眠时间）。

**1. 创建 `render.yaml`**
```yaml
services:
  - type: web
    name: badminton-api
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DB_HOST
        sync: false
      - key: DB_USER
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: DB_NAME
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

**2. 部署步骤**
1. 推送代码到 GitHub
2. 登录 [Render](https://render.com)
3. New > Web Service
4. 连接你的 GitHub 仓库
5. 设置环境变量
6. Deploy

**3. 免费额度**
- 750 小时/月（约 24 天连续运行）
- 休眠后首次访问需等待 30 秒唤醒

---

## 方案三：GitHub Actions 自动部署

### 创建自动部署工作流

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # 或你的主分支

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Configure API URL
        run: |
          sed -i "s|baseURL: 'http://localhost:3000/api'|baseURL: 'http://你的服务器 IP:3000/api'|" api-client.js

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          publish_branch: gh-pages
          exclude_assets: '.github,backend,database,node_modules,*.md'
```

### 使用方式
```bash
# 推送代码后自动部署
git add .
git commit -m "feat: 新功能"
git push origin main
```

---

## 方案四：纯前端演示版（无后端）

如果只想在 GitHub 上展示，可以修改为**纯前端版本**（数据存在 localStorage）。

### 修改 `app.js`

将内存数据改为 localStorage 持久化：

```javascript
// 读取本地存储的数据
function loadLocalData() {
    const savedPlayers = localStorage.getItem('badminton_players');
    const savedDoubles = localStorage.getItem('badminton_doubles');
    const savedMatches = localStorage.getItem('badminton_matches');

    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
        // 重新计算积分
        recalculateAllPoints();
    }
    if (savedDoubles) doublesTeams = JSON.parse(savedDoubles);
    if (savedMatches) matchHistory = JSON.parse(savedMatches);
}

// 保存数据到本地
function saveLocalData() {
    localStorage.setItem('badminton_players', JSON.stringify(players));
    localStorage.setItem('badminton_doubles', JSON.stringify(doublesTeams));
    localStorage.setItem('badminton_matches', JSON.stringify(matchHistory));
}

// 每次数据变化时保存
// 在 createMatch(), deleteMatch() 等函数后添加 saveLocalData()
```

---

## 快速对照表

### 前端文件（部署到 GitHub Pages）
- [x] index.html
- [x] player.html
- [x] matchday.html
- [x] style.css
- [x] app.js
- [x] api-client.js
- [x] login.html
- [x] login.css
- [x] login.js

### 后端文件（部署到阿里云/Vercel/Render）
- [x] backend/server.js
- [x] backend/config/
- [x] backend/controllers/
- [x] backend/models/
- [x] backend/routes/
- [x] backend/middleware/
- [x] database/schema.sql

---

## 常见问题

### Q1: 本地开发时如何连接远程后端？
在本地创建 `.env` 或使用配置：
```javascript
const API_CONFIG = {
  baseURL: 'http://你的服务器 IP:3000/api'
};
```

### Q2: GitHub Pages 支持自定义域名吗？
支持。在仓库 Settings > Pages > Custom domain 设置。

### Q3: 如何在 Vercel 上运行 MySQL？
Vercel 不支持 MySQL，需：
1. 改用 PostgreSQL（推荐 Neon）
2. 或使用远程 MySQL（阿里云）

### Q4: 部署后出现 CORS 错误？
在后端 `.env` 中配置：
```env
FRONTEND_URL=https://你的用户名.github.io
CORS_ORIGIN=https://你的用户名.github.io
```

并确保 `backend/server.js` 中的 CORS 配置正确：
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Q5: 如何查看部署日志？
- GitHub Pages: Actions 标签页
- Vercel: 控制台 > Deployments
- Render: Dashboard > Logs

---

## 推荐方案总结

| 需求 | 推荐方案 |
|------|----------|
| 个人学习/演示 | GitHub Pages + localStorage（方案四） |
| 完整功能 + 低成本 | GitHub Pages + 阿里云后端（方案一） |
| 全免费 + 完整功能 | GitHub Pages + Render + Neon（方案二） |
| 最简单部署 | 阿里云一键部署（参考 DEPLOY.md） |

---

## 费用对比

| 方案 | 月费用 | 优点 | 缺点 |
|------|--------|------|------|
| GitHub Pages + 阿里云 | ~163 元 | 稳定、完整功能 | 需付费 |
| GitHub Pages + Render | 0 元 | 免费 | Render 会休眠 |
| GitHub Pages + Vercel | 0 元 | 免费、快速 | 需改 PostgreSQL |
| 纯前端 localStorage | 0 元 | 最简单 | 数据不共享 |
