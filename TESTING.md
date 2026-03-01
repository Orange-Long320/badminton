# 测试指南

## 一、本地测试（推荐先本地测试）

### 步骤 1：启动 MySQL

**Mac:**
```bash
# 如已安装 MySQL
mysql.server start

# 或使用 Docker
docker run --name mysql-badminton -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8
```

**Windows:**
- 服务 > MySQL80 > 启动

**Linux:**
```bash
sudo systemctl start mysql
```

### 步骤 2：初始化数据库
```bash
cd /Users/orangelong/Documents/羽毛球测试
mysql -u root -p < database/schema.sql
```

如遇到权限问题：
```bash
# 登录 MySQL
mysql -u root -p

# 执行 SQL
source /Users/orangelong/Documents/羽毛球测试/database/schema.sql;
```

### 步骤 3：配置后端环境变量
```bash
cd backend
cp .env.example .env
```

编辑 `.env`：
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的 MySQL 密码
DB_NAME=badminton_ranking
JWT_SECRET=test_secret_key_123456
UPLOAD_DIR=/Users/orangelong/Documents/羽毛球测试/backend/uploads
FRONTEND_URL=http://localhost:5500
CORS_ORIGIN=http://localhost:5500
```

### 步骤 4：启动后端服务
```bash
cd backend
npm run dev
```

看到以下输出表示成功：
```
✅ Server running at http://localhost:3000
✅ Database connected!
```

### 步骤 5：测试后端健康检查

**浏览器访问：**
```
http://localhost:3000/api/health
```

**或使用 curl：**
```bash
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "success": true,
  "database": "connected"
}
```

### 步骤 6：启动前端

**方式 A：使用 VS Code Live Server（推荐）**
1. 安装 Live Server 插件
2. 右键 `index.html` > Open with Live Server
3. 自动打开 `http://localhost:5500/index.html`

**方式 B：使用 http-server**
```bash
npm install -g http-server
cd /Users/orangelong/Documents/羽毛球测试
http-server -p 5500
```

然后访问 `http://localhost:5500`

### 步骤 7：测试完整流程

1. **注册账号**
   - 访问 `http://localhost:5500/login.html`
   - 点击"立即注册"
   - 填写信息：
     - 用户名：`testuser`
     - 昵称：`测试用户`
     - 密码：`123456`
   - 提交

2. **登录**
   - 使用刚注册的账号登录

3. **创建选手**
   - 在主页点击"新建单打"
   - 选择选手、输入分数、提交

4. **查看排行榜**
   - 检查单打/双打排行榜是否正确更新

---

## 二、API 接口测试

### 使用 Apifox / Postman

#### 1. 用户注册
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456",
  "nickname": "测试用户",
  "email": "test@example.com"
}
```

#### 2. 用户登录
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

响应包含 token，后续请求需在 Header 中添加：
```
Authorization: Bearer <token>
```

#### 3. 获取选手列表
```
GET http://localhost:3000/api/players
Authorization: Bearer <token>
```

#### 4. 创建选手
```
POST http://localhost:3000/api/players
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "林丹",
  "signature": "羽坛传奇",
  "play_type": "singles"
}
```

#### 5. 创建比赛
```
POST http://localhost:3000/api/matches
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "singles",
  "team1_id": 1,
  "team2_id": 2,
  "team1_score": 21,
  "team2_score": 19,
  "match_date": "2026-03-01"
}
```

#### 6. 获取排行榜
```
GET http://localhost:3000/api/leaderboard/singles
Authorization: Bearer <token>
```

---

## 三、使用测试脚本（自动化）

创建测试脚本 `backend/test-api.js`：

```javascript
// 快速 API 测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let token = '';

async function test() {
  console.log('🧪 开始测试 API...\n');

  try {
    // 1. 注册
    console.log('1️⃣  测试注册...');
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      username: 'test' + Date.now(),
      password: '123456',
      nickname: '测试用户',
      email: 'test@example.com'
    });
    console.log('✅ 注册成功:', regRes.data);

    // 2. 登录
    console.log('\n2️⃣  测试登录...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: regRes.data.data.user.username,
      password: '123456'
    });
    token = loginRes.data.data.token;
    console.log('✅ 登录成功，token:', token.substring(0, 20) + '...');

    // 3. 健康检查
    console.log('\n3️⃣  测试健康检查...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查:', healthRes.data);

    // 4. 获取选手列表
    console.log('\n4️⃣  测试获取选手列表...');
    const playersRes = await axios.get(`${API_BASE}/players`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 选手列表:', playersRes.data.data.length, '人');

    // 5. 创建选手
    console.log('\n5️⃣  测试创建选手...');
    const createPlayerRes = await axios.post(
      `${API_BASE}/players`,
      { name: '测试选手', signature: '测试签名', play_type: 'both' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ 创建选手成功:', createPlayerRes.data.data);

    console.log('\n✅ 所有测试通过!\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

test();
```

运行测试：
```bash
cd backend
node test-api.js
```

---

## 四、服务器测试（阿里云）

### 1. 在服务器上测试

```bash
# SSH 登录服务器
ssh root@你的服务器 IP

# 查看后端状态
pm2 status

# 查看日志
pm2 logs badminton-api

# 测试健康检查
curl http://localhost:3000/api/health

# 测试外网访问
curl http://你的服务器 IP:3000/api/health
```

### 2. 本地测试访问服务器

```bash
# 测试后端 API
curl http://你的服务器 IP:3000/api/health

# 测试前端
curl http://你的服务器 IP
```

### 3. 浏览器测试
- 后端健康检查：`http://你的服务器 IP:3000/api/health`
- 前端页面：`http://你的服务器 IP`

---

## 五、常见问题排查

### 问题 1：数据库连接失败
```bash
# 检查 MySQL 状态
systemctl status mysql

# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES;"

# 检查 .env 配置
cat backend/.env
```

### 问题 2：端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 修改端口
vim backend/.env  # 改为其他端口如 3001
```

### 问题 3：CORS 错误
确保 `.env` 配置正确：
```env
FRONTEND_URL=http://localhost:5500
CORS_ORIGIN=http://localhost:5500
```

### 问题 4：前端无法连接后端
1. 确认后端已启动（端口 3000）
2. 确认 `api-client.js` 的 baseURL 正确
3. 检查浏览器控制台 Network 标签

### 问题 5：登录后刷新数据丢失
- 检查 `api-client.js` 是否正确存储 token
- 确认 `localStorage` 可用

---

## 六、测试检查清单

### 后端测试
- [ ] MySQL 服务已启动
- [ ] 数据库已初始化（`schema.sql` 执行成功）
- [ ] `.env` 配置正确
- [ ] `npm run dev` 无报错
- [ ] `/api/health` 返回 `database: connected`

### API 测试
- [ ] 注册接口可用
- [ ] 登录接口可用，返回 token
- [ ] 获取选手列表需要 token
- [ ] 创建选手成功
- [ ] 创建比赛成功，积分正确更新

### 前端测试
- [ ] 登录页面正常显示
- [ ] 可以注册新用户
- [ ] 可以登录
- [ ] 主页排行榜正常显示
- [ ] 可以创建比赛
- [ ] 比赛后积分正确更新
- [ ] 可以查看选手详情
- [ ] 日历正常显示

### 服务器测试（如部署）
- [ ] SSH 可以连接
- [ ] PM2 进程运行中
- [ ] Nginx 正常转发
- [ ] 公网可以访问

---

## 七、快速测试命令汇总

```bash
# === 本地测试 ===

# 1. 启动 MySQL
mysql.server start

# 2. 初始化数据库
mysql -u root -p < database/schema.sql

# 3. 启动后端
cd backend && npm run dev

# 4. 启动前端（新终端）
http-server -p 5500

# 5. 测试 API
curl http://localhost:3000/api/health

# === 服务器测试 ===

# 1. 查看状态
pm2 status
systemctl status nginx
systemctl status mysql

# 2. 查看日志
pm2 logs
tail -f /var/log/nginx/error.log

# 3. 重启服务
pm2 restart all
systemctl restart nginx
```
