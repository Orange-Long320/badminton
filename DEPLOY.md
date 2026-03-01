# 阿里云部署指南

## 一、购买云服务器

### 1. 选择实例
1. 登录 [阿里云官网](https://www.aliyun.com)
2. 进入 **产品** > **计算** > **云服务器 ECS**
3. 点击 **创建实例**

### 2. 基础配置推荐
| 配置项 | 推荐选项 | 说明 |
|--------|----------|------|
| 计费方式 | 按量付费 / 包年包月 | 测试用选按量付费，约 0.2 元/小时 |
| 地域 | 选择离你最近的 | 如：华东 1（杭州）、华南 1（深圳） |
| 实例规格 | ecs.t6 / ecs.c6 | 1 核 2G 或 2 核 4G，约 60-120 元/月 |
| 镜像 | Ubuntu 22.04 / CentOS 7.9 | 推荐 Ubuntu，新手友好 |
| 存储 | 40GB ESSD 云盘 | 足够存放代码和数据 |

### 3. 网络和安全组
- **带宽**：1-5 Mbps（测试用 1Mbps 即可，约 23 元/月）
- **安全组**：放行以下端口
  - `22` - SSH 远程连接
  - `3000` - 后端 API 服务
  - `80` - HTTP（可选，用于 Nginx 反向代理）
  - `443` - HTTPS（可选）

### 4. 登录凭证
- 选择 **密钥对**（推荐）或 **密码**
- 如选密码，记住 root 密码

---

## 二、连接服务器

### 方式一：阿里云 Workbench（推荐新手）
1. 登录阿里云控制台
2. 进入 **ECS 实例列表**
3. 找到你的实例，点击 **远程连接**
4. 使用 Workbench 登录

### 方式二：SSH 客户端（Mac/Linux）
```bash
# 替换为你的公网 IP
ssh root@your_server_ip

# 输入密码或使用密钥
```

### 方式三：Xshell / PuTTY（Windows）
- 主机：你的公网 IP
- 端口：22
- 用户名：root

---

## 三、安装环境

### Ubuntu / Debian
```bash
# 更新包管理器
apt update && apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装 MySQL
apt install -y mysql-server

# 安装 Git
apt install -y git

# 安装 Nginx（可选，用于反向代理）
apt install -y nginx
```

### CentOS / Alibaba Cloud Linux
```bash
# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装 MySQL
yum install -y mysql-community-server

# 安装 Git
yum install -y git

# 安装 Nginx
yum install -y nginx
```

### 验证安装
```bash
node -v          # 应显示 v18.x.x
npm -v           # 应显示 9.x.x 或更高
mysql --version  # 应显示 MySQL 8.x
```

---

## 四、部署后端服务

### 1. 克隆代码到服务器
```bash
# 创建应用目录
mkdir -p /var/www/badminton
cd /var/www/badminton

# 方式一：使用 Git（推荐）
git clone <你的仓库地址> .

# 方式二：本地上传
# 在本地打包：
# tar -czf badminton.tar.gz backend/ database/
# 然后用 SCP 上传：
# scp badminton.tar.gz root@your_server_ip:/var/www/badminton/
# 在服务器上解压：
# tar -xzf badminton.tar.gz
```

### 2. 安装后端依赖
```bash
cd /var/www/badminton/backend
npm install --production
```

### 3. 配置环境变量
```bash
# 创建 .env 文件
cd /var/www/badminton/backend
cp .env.example .env

# 编辑配置
vim .env
```

`.env` 文件内容：
```env
# 服务器端口
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的 MySQL 密码
DB_NAME=badminton_ranking

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=your_random_secret_key_here_123456

# 文件上传目录
UPLOAD_DIR=/var/www/badminton/backend/uploads

# 前端 URL（如果使用 Nginx 反向代理则填写服务器 IP 或域名）
FRONTEND_URL=http://your_server_ip
CORS_ORIGIN=http://your_server_ip
```

### 4. 初始化数据库
```bash
# 启动 MySQL
systemctl start mysql
systemctl enable mysql

# 设置 MySQL 密码（如果是首次）
mysql_secure_installation

# 执行初始化脚本
cd /var/www/badminton
mysql < database/schema.sql
```

### 5. 启动后端服务
```bash
# 方式一：直接启动（测试用）
cd /var/www/badminton/backend
npm start

# 方式二：使用 PM2 守护进程（推荐）
npm install -g pm2
cd /var/www/badminton/backend
pm2 start server.js --name badminton-api
pm2 save
pm2 startup
```

---

## 五、部署前端

### 方式一：直接部署（简单）
```bash
# 在服务器上修改 api-client.js
vim /var/www/badminton/api-client.js

# 修改 baseURL 配置
const API_CONFIG = {
  baseURL: 'http://your_server_ip:3000/api',
  timeout: 10000
};
```

然后将前端文件复制到 Nginx 目录：
```bash
# 安装 Nginx（如果未安装）
apt install -y nginx

# 复制前端文件
cp /var/www/badminton/*.html /var/www/html/
cp /var/www/badminton/*.css /var/www/html/
cp /var/www/badminton/*.js /var/www/html/
```

### 方式二：使用 Nginx 反向代理（推荐）
```bash
# 创建 Nginx 配置文件
vim /etc/nginx/sites-available/badminton
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name your_domain.com;  # 或使用服务器 IP

    # 前端静态文件
    location / {
        root /var/www/badminton;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件静态访问
    location /uploads {
        alias /var/www/badminton/backend/uploads;
        expires 30d;
    }
}
```

启用配置：
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/badminton /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## 六、配置安全组

在阿里云控制台：
1. 进入 **ECS 实例** > **安全组**
2. 点击 **配置规则** > **入方向**
3. 添加规则：

| 端口范围 | 授权对象 | 说明 |
|----------|----------|------|
| 80/80 | 0.0.0.0/0 | HTTP |
| 443/443 | 0.0.0.0/0 | HTTPS（如有） |
| 3000/3000 | 0.0.0.0/0 | 后端 API（如不用 Nginx 则需要） |

---

## 七、访问测试

### 方式一：直接使用 IP
- 前端：`http://your_server_ip`
- 后端：`http://your_server_ip:3000/api/health`

### 方式二：绑定域名（可选）
1. 在域名服务商添加 A 记录
2. 域名 -> 服务器公网 IP
3. 等待 DNS 生效（约 10 分钟）
4. 访问 `http://your-domain.com`

---

## 八、HTTPS 证书（可选，推荐）

使用阿里云免费 SSL 证书：
1. 登录阿里云 > **SSL 证书**
2. 申请免费证书（域名验证）
3. 下载证书（Nginx 格式）
4. 上传到服务器：
```bash
mkdir -p /etc/nginx/ssl
# 上传 cert.pem 和 key.pem 到 /etc/nginx/ssl/
```

5. 更新 Nginx 配置：
```nginx
server {
    listen 443 ssl;
    server_name your_domain.com;

    ssl_certificate /etc/nginx/ssl/your_domain.pem;
    ssl_certificate_key /etc/nginx/ssl/your_domain.key;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 其他配置同上
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your_domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 九、常用运维命令

### PM2 管理
```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart badminton-api  # 重启
pm2 stop badminton-api     # 停止
pm2 delete badminton-api   # 删除
```

### Nginx 管理
```bash
systemctl status nginx
systemctl restart nginx
systemctl stop nginx
systemctl start nginx
nginx -t  # 测试配置
```

### MySQL 管理
```bash
systemctl status mysql
systemctl restart mysql

# 登录 MySQL
mysql -u root -p

# 备份数据库
mysqldump -u root -p badminton_ranking > backup.sql

# 恢复数据库
mysql -u root -p badminton_ranking < backup.sql
```

### 查看日志
```bash
# 后端日志
pm2 logs badminton-api

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 十、故障排查

### 1. 后端无法启动
```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 检查 Node.js 版本
node -v

# 检查依赖是否安装
cd /var/www/badminton/backend
npm install
```

### 2. 数据库连接失败
```bash
# 检查 MySQL 状态
systemctl status mysql

# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES;"

# 检查用户权限
mysql -u root -p -e "SELECT user,host FROM mysql.user;"
```

### 3. 跨域问题
- 确保 `.env` 中 `FRONTEND_URL` 和 `CORS_ORIGIN` 配置正确
- 如果使用 Nginx 反向代理，确保配置了 `/api` 代理

### 4. 文件上传失败
```bash
# 检查 uploads 目录权限
chown -R www-data:www-data /var/www/badminton/backend/uploads
chmod -R 755 /var/www/badminton/backend/uploads
```

---

## 十一、成本估算（月）

| 项目 | 费用（元） |
|------|-----------|
| ECS 实例（2 核 4G） | ~120 |
| 带宽（1Mbps） | ~23 |
| 系统盘（40GB） | ~20 |
| **总计** | **~163 元/月** |

> 提示：使用按量付费，不用时关机，可节省费用（约 0.2 元/小时）

---

## 十二、快速部署脚本

创建 `deploy.sh` 脚本：
```bash
#!/bin/bash

# 快速部署脚本
set -e

echo "🚀 开始部署宿舍羽毛球排行榜系统..."

# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. 安装 MySQL
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 4. 安装 Nginx
apt install -y nginx

# 5. 安装 PM2
npm install -g pm2

# 6. 创建目录
mkdir -p /var/www/badminton

# 7. 复制代码（假设已在当前目录）
cp -r . /var/www/badminton/

# 8. 安装依赖
cd /var/www/badminton/backend
npm install --production

# 9. 创建 .env
cat > .env <<EOF
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=请设置你的 MySQL 密码
DB_NAME=badminton_ranking
JWT_SECRET=$(openssl rand -hex 32)
UPLOAD_DIR=/var/www/badminton/backend/uploads
EOF

echo "⚠️ 请编辑 /var/www/badminton/backend/.env 设置数据库密码"

# 10. 初始化数据库
echo "📦 初始化数据库..."
mysql < /var/www/badminton/database/schema.sql

# 11. 启动后端
pm2 start server.js --name badminton-api
pm2 save

# 12. 配置 Nginx
echo "⚙️ 配置 Nginx..."
# ...（参考上方 Nginx 配置）

echo "✅ 部署完成！"
echo "前端：http://$(curl -s ifconfig.me)"
echo "后端：http://$(curl -s ifconfig.me):3000/api/health"
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```
