# GitHub Pages 部署指南

## 快速部署

### 1. 推送到 GitHub

```bash
# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 创建 gh-pages 分支并推送
git checkout -b gh-pages
git push origin gh-pages
```

### 2. 开启 GitHub Pages

1. 进入 GitHub 仓库页面
2. 点击 **Settings** > **Pages**
3. Source 选择 **gh-pages** 分支
4. 点击 **Save**

等待几分钟后，访问：
```
https://你的用户名.github.io/仓库名/
```

---

## 功能说明

### 数据持久化
- 所有数据存储在浏览器的 **localStorage**
- 刷新页面数据不丢失
- 不同浏览器数据独立
- 清除浏览器数据会重置

### 主要功能
- ✅ 单打/双打排行榜
- ✅ 选手资料管理
- ✅ 比赛记录（单打/双打）
- ✅ 比赛日历
- ✅ 批量删除比赛
- ✅ 数据本地持久化
- ✅ 数据导出/导入（访问 `admin.html`）

### 快捷操作
- 点击导航栏 **+** 按钮：新建比赛
- 点击排行榜选手名字：查看详情
- 点击日历日期：查看当天比赛
- 批量删除：选择多场比赛一键删除
- 访问 `admin.html`：数据管理

---

## 数据管理

### 导出数据
打开浏览器控制台，输入：
```javascript
// 导出数据
const data = {
    players: localStorage.getItem('badminton_players'),
    doubles: localStorage.getItem('badminton_doubles'),
    matches: localStorage.getItem('badminton_matches')
};
console.log(JSON.stringify(data));
```

### 导入数据
```javascript
// 替换为你的数据
const data = {
    players: '[...]',
    doubles: '[...]',
    matches: '[...]'
};
localStorage.setItem('badminton_players', data.players);
localStorage.setItem('badminton_doubles', data.doubles);
localStorage.setItem('badminton_matches', data.matches);
location.reload();
```

### 重置数据
```javascript
// 清除所有数据
localStorage.clear();
location.reload();
```

---

## 注意事项

1. **数据备份**：数据仅存储在本地，建议定期备份
2. **浏览器兼容**：需要支持 localStorage 的现代浏览器
3. **隐私安全**：数据仅存储在本地，不会上传到服务器
4. **清除数据**：清除浏览器缓存会删除所有数据

---

## 本地开发测试

```bash
# 使用任意静态服务器
# 方式 1：Python
python3 -m http.server 8000

# 方式 2：Node.js
npx http-server -p 8000

# 方式 3：VS Code Live Server 插件
```

然后访问 `http://localhost:8000`

---

## 文件说明

| 文件 | 说明 |
|------|------|
| index.html | 主页（排行榜） |
| player.html | 选手详情页 |
| matchday.html | 比赛日历详情页 |
| style.css | 样式文件 |
| app.js | 主要逻辑（含 localStorage 持久化） |

---

## 更新部署

```bash
# 修改代码后
git add .
git commit -m "更新说明"
git push origin gh-pages
```

GitHub Pages 会在几分钟内自动更新。
