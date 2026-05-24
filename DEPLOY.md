# 部署指南

## 方案：Railway 后端 + GitHub Pages 前端

### 第一步：部署后端到 Railway

1. 访问 https://railway.app
2. 用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择 `xiguabusgua/realtime-hot-topics` 仓库
5. 点击 "Deploy" 等待部署完成
6. 部署成功后，你会获得一个 URL，例如：`https://xxx.up.railway.app`
7. 测试：访问 `https://xxx.up.railway.app/api/health`，应该返回 `{"status":"ok"}`

### 第二步：更新前端 API 地址

1. 编辑 `public/js/config.js` 文件
2. 把 `API_BASE` 改成你的 Railway 地址，例如：
   ```javascript
   const CONFIG = {
     API_BASE: 'https://xxx.up.railway.app/api',
   };
   ```

### 第三步：部署前端到 GitHub Pages

方式 A：用现有仓库的 GitHub Pages

1. 把代码推送到 GitHub 的 `main` 分支
2. 在 GitHub 仓库设置中开启 GitHub Pages：
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`, Folder: `/public`
3. 访问 `https://xiguabusgua.github.io/realtime-hot-topics/`

方式 B：创建单独的前端仓库

1. 创建新的 GitHub 仓库（例如 `realtime-hot-topics-frontend`）
2. 把 `public/` 目录里的所有内容复制过去
3. 在 GitHub Pages 部署这个新仓库

## 其他部署方案

### 方案 2：只部署到 Railway（最简单）

- 只需要第一步，无需 GitHub Pages
- 直接用 Railway 的 URL 访问
- 优点：一步部署，无需额外配置

### 方案 3：部署到 Render

类似 Railway，访问 https://render.com 即可。

