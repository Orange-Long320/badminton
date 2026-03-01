# 宿舍羽毛球排行榜

> 纯前端版本，数据存储在本地浏览器，无需后端即可使用。

## 功能特点

- 单打/双打排行榜
- 选手资料管理
- 比赛记录（单打/双打）
- 羽毛球日历
- 批量删除比赛
- 数据本地持久化（localStorage）

## 快速开始

### 直接使用
直接在浏览器打开 `index.html` 即可使用。

### 本地开发
```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# VS Code
# 右键 index.html > Open with Live Server
```

## 部署到 GitHub Pages

```bash
# 推送到 gh-pages 分支
git checkout -b gh-pages
git push origin gh-pages
```

然后在 GitHub 仓库 Settings > Pages 中启用。

详细部署指南参考 [GITHUB_PAGES.md](GITHUB_PAGES.md)

## 使用说明

### 查看排行榜（只读）
访问 `index.html`，任何人都可以查看：
- 单打/双打排行榜
- 选手资料
- 比赛历史记录

### 录入数据（需要密码）
访问 `admin.html`，输入管理密码（默认：`admin123`）后可以：
- 📝 录入新比赛（单打/双打）
- 📊 查看数据统计
- 📤 导出数据备份
- 📥 导入数据恢复
- 🗑️ 删除比赛记录

### 修改管理密码
编辑 `admin.html`，找到这行修改密码：
```javascript
const ADMIN_PASSWORD = 'admin123'; // 改为你的密码
```

## 数据管理

### 查看和管理数据
访问 `admin.html` 页面可以：
- 📊 查看数据统计（选手数量、比赛记录等）
- 📤 导出数据为 JSON 文件
- 📥 导入数据（从备份恢复）
- ⚠️ 重置所有数据

### 浏览器控制台
打开浏览器控制台（F12），输入：
```javascript
// 导出数据
const data = {
    players: localStorage.getItem('badminton_players'),
    doubles: localStorage.getItem('badminton_doubles'),
    matches: localStorage.getItem('badminton_matches')
};
console.log(JSON.stringify(data, null, 2));

// 导入数据（替换为你的数据）
localStorage.setItem('badminton_players', '[...]');
localStorage.setItem('badminton_doubles', '[...]');
localStorage.setItem('badminton_matches', '[...]');
location.reload();

// 重置数据
localStorage.clear();
location.reload();
```

## 文件结构

```
羽毛球测试/
├── index.html          # 主页（排行榜）
├── player.html         # 选手详情页
├── matchday.html       # 比赛日历详情页
├── style.css           # 样式文件
├── app.js              # 主要逻辑
├── GITHUB_PAGES.md     # GitHub 部署指南
└── README.md           # 本文件
```

## 注意事项

1. 数据仅存储在本地，建议定期备份
2. 不同浏览器/设备数据不共享
3. 清除浏览器缓存会删除所有数据

## License

MIT
