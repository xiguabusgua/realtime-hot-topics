# 实时热点资讯聚合平台

一个简单的实时热点资讯聚合网站，汇集科技、金融、社会类热点新闻。

## 功能

- 📱 多源热点聚合（8个数据源）
- 📂 分类浏览（科技、金融、社会）
- ⚡ 5分钟缓存刷新
- 📱 响应式设计
- 🎯 点击跳转至原文

## 数据源

| 分类 | 数据源 |
|------|--------|
| 科技 | IT之家、36氪、GitHub Trending |
| 金融 | 华尔街见闻、金十数据 |
| 社会 | 微博热搜、百度热搜、今日头条 |

## 快速开始

### 使用 Node.js
```bash
npm install
npm start
```

### 使用 Bun
```bash
bun install
bun run server.js
```

访问 http://localhost:3000 即可查看。

## API 接口

- `GET /api/topics` - 所有热点数据
- `GET /api/topics/tech` - 科技热点
- `GET /api/topics/finance` - 金融热点
- `GET /api/topics/society` - 社会热点
- `GET /api/categories` - 分类列表
- `GET /api/health` - 健康检查

## 项目结构

```
.
├── server.js          # 应用入口
├── package.json       # 项目配置
├── config/
│   └── sources.js     # 数据源配置
├── services/
│   ├── baseService.js # 基础服务 & 解析器
│   └── aggregatorService.js # 聚合服务
├── routes/
│   └── api.js         # API 路由
├── utils/
│   ├── cache.js       # 缓存管理
│   └── logger.js      # 日志工具
└── public/
    ├── index.html     # 主页面
    ├── css/style.css  # 样式
    └── js/app.js      # 前端逻辑
```

## 技术栈

- 后端: Node.js + Express + Cheerio
- 前端: 原生 JavaScript + CSS3
- 运行时: Node.js 或 Bun

## 部署

详细部署指南请查看 [DEPLOY.md](DEPLOY.md)

## 文档

完整文档请查看 [CODE_WIKI.md](CODE_WIKI.md)

## 许可证

MIT
