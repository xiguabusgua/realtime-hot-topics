# Code Wiki - 实时热点资讯聚合平台

> **项目名称**: realtime-hot-topics  
> **版本**: 1.0.0  
> **描述**: 实时热点资讯聚合平台 — 科技、金融、社会分类热点追踪  
> **技术栈**: Node.js + Express + Cheerio + 原生前端  
> **运行环境**: Node.js / Bun  

---

## 目录

1. [项目概述](#1-项目概述)
2. [项目结构](#2-项目结构)
3. [整体架构](#3-整体架构)
4. [模块职责详解](#4-模块职责详解)
   - [4.1 配置模块 (config/)](#41-配置模块-config)
   - [4.2 服务层 (services/)](#42-服务层-services)
   - [4.3 路由层 (routes/)](#43-路由层-routes)
   - [4.4 工具层 (utils/)](#44-工具层-utils)
   - [4.5 前端 (public/)](#45-前端-public)
5. [关键类与函数说明](#5-关键类与函数说明)
6. [API 接口文档](#6-api-接口文档)
7. [数据源与解析器](#7-数据源与解析器)
8. [依赖关系](#8-依赖关系)
9. [数据流转流程](#9-数据流转流程)
10. [项目运行方式](#10-项目运行方式)
11. [扩展指南](#11-扩展指南)

---

## 1. 项目概述

本项目是一个**实时热点资讯聚合平台**，通过调用多个公开数据接口，聚合来自IT之家、36氪、GitHub、华尔街见闻、金十数据、微博、百度、今日头条等平台的热门内容，按**科技**、**金融**、**社会**三大分类进行展示。

### 核心特性

- **多源聚合**: 集成 8 个主流平台数据源
- **分类浏览**: 科技 / 金融 / 社会 三大分类 + 全部分类视图
- **缓存机制**: 5 分钟 TTL 内存缓存，减少重复请求
- **容错设计**: 使用 `Promise.allSettled` 确保单个数据源失败不影响整体
- **响应式布局**: 适配桌面端和移动端
- **XSS 防护**: 前端使用 DOM API 进行 HTML 转义

---

## 2. 项目结构

```
realtime-hot-topics/
├── server.js                    # 应用入口，Express 服务器启动
├── package.json                 # 项目配置与依赖声明
├── .gitignore                   # Git 忽略规则
│
├── config/
│   └── sources.js               # 数据源配置、缓存TTL、服务器参数
│
├── services/
│   ├── baseService.js           # 基础数据服务类 + 全部解析器
│   └── aggregatorService.js     # 聚合服务（单例），协调多数据源
│
├── routes/
│   └── api.js                   # RESTful API 路由定义
│
├── utils/
│   ├── cache.js                 # 内存缓存管理器
│   └── logger.js                # 日志工具（单例）
│
├── public/                      # 静态前端资源
│   ├── index.html               # 主页面
│   ├── css/
│   │   └── style.css            # 全局样式
│   └── js/
│       └── app.js               # 前端交互逻辑
│
└── node_modules/                # 依赖包（自动生成）
```

---

## 3. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器 (前端)                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ Tab 导航  │  │ 刷新按钮  │  │  热点卡片渲染引擎     │  │
│  └────┬─────┘  └────┬─────┘  └───────────▲───────────┘  │
│       │              │                    │               │
│       └──────────────┼────────────────────┘               │
│                      │ fetch()                            │
└──────────────────────┼────────────────────────────────────┘
                       │ HTTP
┌──────────────────────┼────────────────────────────────────┐
│                 Express 服务器                             │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────────┐ │
│  │              routes/api.js                            │ │
│  │  GET /api/categories                                 │ │
│  │  GET /api/topics                                     │ │
│  │  GET /api/topics/:category                           │ │
│  │  POST /api/cache/clear                               │ │
│  │  GET /api/health                                     │ │
│  └───────────────────┬──────────────────────────────────┘ │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────────┐ │
│  │          services/aggregatorService.js (单例)         │ │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │ │
│  │  │ 缓存检查 │→│ 并发请求  │→│ 结果聚合 & 缓存写入 │  │ │
│  │  └─────────┘  └────┬─────┘  └────────────────────┘  │ │
│  └────────────────────┼────────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────▼────────────────────────────────┐ │
│  │           services/baseService.js                    │ │
│  │  ┌──────────────┐    ┌──────────────────────────┐   │ │
│  │  │ fetchRawData │ →  │ parseData (解析器路由)    │   │ │
│  │  │  (axios)     │    │ ithome / 36kr / github   │   │ │
│  │  └──────────────┘    │ weibo / baidu / toutiao  │   │ │
│  │                      │ wallstreetcn / jin10     │   │ │
│  │                      └──────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────┐  ┌──────────────┐                        │
│  │ utils/cache│  │ utils/logger │                        │
│  └────────────┘  └──────────────┘                        │
└──────────────────────────────────────────────────────────┘
                       │
                       │ HTTP 请求
                       ▼
        ┌──────────────────────────────┐
        │       外部数据源 API          │
        │ IT之家 / 36氪 / GitHub       │
        │  华尔街见闻 / 金十数据        │
        │  微博 / 百度 / 今日头条       │
        └──────────────────────────────┘
```

---

## 4. 模块职责详解

### 4.1 配置模块 (config/)

#### `config/sources.js`

集中管理所有配置常量，是整个应用的数据源注册中心。

| 导出项 | 类型 | 说明 |
|--------|------|------|
| `SOURCES` | `Object<string, SourceConfig[]>` | 按分类组织的数据源配置，包含 `tech`(3个)、`finance`(2个)、`society`(3个) |
| `CACHE_TTL` | `number` | 缓存过期时间，默认 5 分钟 (300000ms) |
| `SERVER_CONFIG` | `Object` | 服务器端口和主机地址，支持环境变量覆盖 |

**SourceConfig 结构**:

```javascript
{
  id: string,        // 数据源唯一标识
  name: string,      // 数据源显示名称
  type: string,      // 请求类型: 'api' (JSON) | 'html' (HTML文本)
  url: string,       // 数据接口地址
  headers: Object,   // 请求头配置
  parser: string     // 对应的解析器名称
}
```

---

### 4.2 服务层 (services/)

#### `services/baseService.js` — 基础数据服务

核心职责：负责单个数据源的**数据获取**和**数据解析**。

- 通过构造函数接收一个 `SourceConfig` 配置
- `fetchRawData()` 使用 axios 发起 HTTP 请求
- `parseData()` 根据配置中的 `parser` 字段路由到对应解析函数
- `getTopics()` 组合获取+解析，返回标准化的主题列表
- 静态属性 `BaseService.parsers` 存储所有解析器函数

#### `services/aggregatorService.js` — 聚合服务

核心职责：作为**单例**协调所有数据源，提供分类查询和全量查询能力。

- 初始化时为每个分类的每个数据源创建 `BaseService` 实例
- `getCategoryTopics(category)` 并发获取某分类下所有数据源
- `getAllTopics()` 并发获取所有分类数据
- 内置 `CacheManager` 实例进行缓存管理
- 使用 `Promise.allSettled` 确保部分数据源失败不影响整体返回

---

### 4.3 路由层 (routes/)

#### `routes/api.js` — API 路由

基于 Express Router 定义所有 RESTful 接口。

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/categories` | GET | 获取分类列表 |
| `/api/topics` | GET | 获取所有分类热点 |
| `/api/topics/:category` | GET | 获取指定分类热点 |
| `/api/cache/clear` | POST | 清除缓存 |
| `/api/health` | GET | 健康检查 |

所有接口统一返回格式：`{ code: number, data?: any, message?: string }`

---

### 4.4 工具层 (utils/)

#### `utils/cache.js` — 缓存管理器

基于 `Map` 实现的内存缓存，支持 TTL 过期机制。

| 方法 | 说明 |
|------|------|
| `get(key)` | 获取缓存值，过期或不存在返回 `null` |
| `set(key, data)` | 写入缓存，记录时间戳 |
| `has(key)` | 检查缓存是否存在且有效 |
| `clear()` | 清空所有缓存 |
| `getStats()` | 返回缓存统计信息 |

#### `utils/logger.js` — 日志工具

支持 4 级日志（DEBUG / INFO / WARN / ERROR），以单例模式导出。日志格式：`[ISO时间] [级别] 消息 {元数据}`。

---

### 4.5 前端 (public/)

#### `public/index.html` — 主页面

单页应用结构，包含：
- **Header**: 品牌标识
- **Nav**: 分类 Tab 切换 + 刷新按钮 + 更新时间
- **Main**: 内容区域（loading / content / error 三态切换）
- **Footer**: 版权信息

#### `public/css/style.css` — 样式

- CSS 变量驱动的主题系统
- Grid 布局的卡片式数据源展示
- 响应式断点 (768px)
- 排名高亮（前三名金银铜色）
- 加载动画和刷新旋转效果

#### `public/js/app.js` — 前端逻辑

纯原生 JavaScript 实现，无框架依赖。

| 函数 | 说明 |
|------|------|
| `fetchTopics(category)` | 调用后端 API 获取数据 |
| `createTopicItem(topic)` | 生成单条热点 HTML |
| `createSourceCard(source)` | 生成数据源卡片 HTML |
| `renderAllCategories(data)` | 渲染全部分类视图 |
| `renderSingleCategory(data)` | 渲染单分类视图 |
| `loadTopics()` | 主加载流程（loading → fetch → render） |
| `initTabs()` | 初始化 Tab 切换事件 |
| `initRefresh()` | 初始化刷新按钮事件 |
| `escapeHtml(text)` | XSS 防护：HTML 转义 |

---

## 5. 关键类与函数说明

### 5.1 `BaseService` 类

```
文件: services/baseService.js
```

| 成员 | 类型 | 说明 |
|------|------|------|
| `constructor(sourceConfig)` | 构造 | 接收数据源配置，支持自定义超时（默认 10s） |
| `fetchRawData()` | `async → any` | 发起 HTTP 请求获取原始数据，失败返回 `null` |
| `parseData(rawData)` | `→ Topic[]` | 根据 parser 名称路由到对应解析函数 |
| `getTopics()` | `async → SourceResult` | 组合方法：获取 + 解析，返回标准化结果 |
| `BaseService.parsers` | `static Object` | 8 个解析器函数的注册表 |

**Topic 标准结构**:

```javascript
{
  rank: number,      // 排名序号
  title: string,     // 标题
  url: string,       // 原文链接
  hotValue: string,  // 热度值（如 "123.4万"）
  excerpt: string    // 摘要/描述
}
```

### 5.2 `AggregatorService` 类

```
文件: services/aggregatorService.js
导出: 单例实例
```

| 成员 | 类型 | 说明 |
|------|------|------|
| `_initServices()` | `→ Object` | 根据配置初始化所有 BaseService 实例 |
| `getCategoryTopics(category)` | `async → CategoryResult` | 获取指定分类热点，支持缓存 |
| `getAllTopics()` | `async → AllTopicsResult` | 获取全部分类热点，支持缓存 |
| `getCategories()` | `→ CategoryInfo[]` | 返回分类元信息列表 |
| `clearCache()` | `→ void` | 清空缓存 |
| `CATEGORY_NAMES` | `static Object` | 分类 ID 到中文名的映射 |

### 5.3 `CacheManager` 类

```
文件: utils/cache.js
```

| 成员 | 类型 | 说明 |
|------|------|------|
| `constructor(ttl)` | 构造 | 初始化空 Map 和 TTL 值 |
| `get(key)` | `→ any \| null` | 读取缓存，自动检查过期 |
| `set(key, data)` | `→ void` | 写入缓存并记录时间戳 |
| `has(key)` | `→ boolean` | 判断缓存是否有效存在 |
| `clear()` | `→ void` | 清空全部缓存 |
| `getStats()` | `→ Object` | 返回缓存大小和键列表 |

### 5.4 解析器函数 (BaseService.parsers)

| 解析器名 | 数据源 | 输入类型 | 解析逻辑 |
|----------|--------|----------|----------|
| `ithome` | IT之家 | JSON | 从 `data.Result` 提取科技新闻标题和链接 |
| `36kr` | 36氪热榜 | JSON | 从 `data.data.items` 提取快讯标题和描述 |
| `github` | GitHub Trending | HTML | 使用 Cheerio 解析 `article.Box-row` 提取仓库信息 |
| `wallstreetcn` | 华尔街见闻 | JSON | 从 `data.data.items` 提取财经快讯 |
| `jin10` | 金十数据 | JSON | 从 `data.data` 提取快讯，去除 HTML 标签 |
| `weibo` | 微博热搜 | JSON | 从 `data.data.band_list` 提取热搜词和热度 |
| `baidu` | 百度热搜 | HTML | 从页面内的 JSON 字符串提取热搜词条 |
| `toutiao` | 头条热榜 | JSON | 从 `data.data` 提取热榜标题和热度值 |

---

## 6. API 接口文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **统一响应格式**:

```json
{
  "code": 0,
  "data": { ... }
}
```

`code` 为 `0` 表示成功，`-1` 表示失败。

---

### GET /api/categories

获取所有分类信息。

**响应示例**:

```json
{
  "code": 0,
  "data": [
    { "id": "tech", "name": "科技", "sourceCount": 3 },
    { "id": "finance", "name": "金融", "sourceCount": 2 },
    { "id": "society", "name": "社会", "sourceCount": 3 }
  ]
}
```

---

### GET /api/topics

获取所有分类的热点数据。

**响应结构**:

```json
{
  "code": 0,
  "data": {
    "categories": {
      "tech": {
        "category": "tech",
        "sources": [
          {
            "sourceId": "zhihu-hot",
            "sourceName": "知乎热榜",
            "topics": [
              {
                "rank": 1,
                "title": "...",
                "url": "...",
                "hotValue": "234万热度",
                "excerpt": "..."
              }
            ],
            "updatedAt": "2026-05-24T03:39:32.814Z"
          }
        ],
        "updatedAt": "..."
      },
      "finance": { ... },
      "society": { ... }
    },
    "updatedAt": "2026-05-24T03:39:32.814Z"
  }
}
```

---

### GET /api/topics/:category

获取指定分类的热点数据。

**路径参数**:

| 参数 | 类型 | 可选值 | 说明 |
|------|------|--------|------|
| `category` | string | `tech`, `finance`, `society` | 分类标识 |

**错误响应** (400):

```json
{
  "code": -1,
  "message": "Invalid category. Valid options: tech, finance, society"
}
```

---

### POST /api/cache/clear

清除服务端内存缓存。

**响应**:

```json
{
  "code": 0,
  "message": "Cache cleared"
}
```

---

### GET /api/health

健康检查接口。

**响应**:

```json
{
  "code": 0,
  "data": {
    "status": "ok",
    "uptime": 123.456,
    "timestamp": "2026-05-24T03:39:28.830Z"
  }
}
```

---

## 7. 数据源与解析器

### 数据源分类总览

| 分类 | 数据源 | 接口类型 | 解析器 | 说明 |
|------|--------|----------|--------|------|
| **科技** | IT之家 | JSON API | `ithome` | 科技新闻资讯 |
| **科技** | 36氪热榜 | JSON API | `36kr` | 科技快讯 |
| **科技** | GitHub Trending | HTML 页面 | `github` | 热门开源项目 |
| **金融** | 华尔街见闻 | JSON API | `wallstreetcn` | 全球财经快讯 |
| **金融** | 金十数据 | JSON API | `jin10` | 金融快讯 |
| **社会** | 微博热搜 | JSON API | `weibo` | 微博热搜榜 |
| **社会** | 百度热搜 | HTML 页面 | `baidu` | 百度实时热搜 |
| **社会** | 头条热榜 | JSON API | `toutiao` | 今日头条热榜 |

### 解析器映射关系

```
config/sources.js 中的 parser 字段
         │
         ▼
BaseService.parsers[parserName]
         │
         ├── 'ithome'       → BaseService.parsers.ithome()
         ├── '36kr'         → BaseService.parsers['36kr']()
         ├── 'github'       → BaseService.parsers.github()
         ├── 'wallstreetcn' → BaseService.parsers.wallstreetcn()
         ├── 'jin10'        → BaseService.parsers.jin10()
         ├── 'weibo'        → BaseService.parsers.weibo()
         ├── 'baidu'        → BaseService.parsers.baidu()
         └── 'toutiao'      → BaseService.parsers.toutiao()
```

---

## 8. 依赖关系

### 8.1 外部依赖 (npm packages)

| 包名 | 版本 | 用途 |
|------|------|------|
| `express` | ^4.18.2 | Web 框架，提供路由、中间件、静态文件服务 |
| `axios` | ^1.6.0 | HTTP 客户端，用于请求外部数据源 API |
| `cheerio` | ^1.0.0-rc.12 | HTML 解析器，用于解析 GitHub Trending 页面 |
| `cors` | ^2.8.5 | CORS 中间件，允许跨域请求 |

### 8.2 内部模块依赖图

```
server.js
├── utils/logger.js
├── config/sources.js
└── routes/api.js
    └── services/aggregatorService.js  (单例)
        ├── config/sources.js
        ├── utils/cache.js  → CacheManager
        ├── utils/logger.js
        └── services/baseService.js
            ├── axios (外部)
            ├── cheerio (外部)
            └── utils/logger.js

public/js/app.js
└── (无模块依赖，纯原生 JS，通过 fetch 调用 /api 接口)
```

### 8.3 模块依赖方向

```
config/sources.js  ←── services/aggregatorService.js
                     ←── server.js

utils/cache.js     ←── services/aggregatorService.js
utils/logger.js    ←── services/baseService.js
                     ←── services/aggregatorService.js
                     ←── server.js

services/baseService.js ←── services/aggregatorService.js
routes/api.js           ←── server.js
```

---

## 9. 数据流转流程

### 用户请求热点数据的完整流程

```
1. 用户点击 Tab / 页面加载
   │
   ▼
2. 前端 app.js → fetchTopics(category)
   │  发起 GET /api/topics 或 GET /api/topics/:category
   │
   ▼
3. routes/api.js → 路由匹配
   │  参数校验（category 是否合法）
   │
   ▼
4. aggregatorService.getCategoryTopics() 或 getAllTopics()
   │
   ├── 4a. 检查缓存 (CacheManager.get)
   │   ├── 命中 → 直接返回缓存数据
   │   └── 未命中 → 继续
   │
   ├── 4b. 并发请求各数据源 (Promise.allSettled)
   │   │
   │   ├── baseService_1.getTopics()
   │   │   ├── fetchRawData() → axios.get(url, headers)
   │   │   └── parseData() → parsers[parserName](rawData)
   │   │
   │   ├── baseService_2.getTopics()
   │   │   └── ...
   │   └── baseService_N.getTopics()
   │       └── ...
   │
   ├── 4c. 聚合结果，过滤失败项
   │
   └── 4d. 写入缓存 (CacheManager.set)
   │
   ▼
5. 返回 JSON 响应
   │
   ▼
6. 前端渲染
   ├── renderAllCategories() 或 renderSingleCategory()
   ├── createSourceCard() → 生成卡片 HTML
   ├── createTopicItem() → 生成列表项 HTML
   └── updateTimestamp() → 更新时间显示
```

---

## 10. 项目运行方式

### 环境要求

- **Node.js** >= 16.0 或 **Bun** >= 1.0
- **npm** 或 **bun** 包管理器

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 Bun
bun install
```

### 启动服务

```bash
# 使用 Node.js
npm start
# 或
node server.js

# 使用 Bun
bun run server.js

# 开发模式（文件变更自动重启）
npm run dev          # Node.js --watch
bun run bun:dev      # Bun --watch
```

### 访问应用

- **前端页面**: http://localhost:3000
- **API 接口**: http://localhost:3000/api/health
- **全部热点**: http://localhost:3000/api/topics
- **科技热点**: http://localhost:3000/api/topics/tech
- **金融热点**: http://localhost:3000/api/topics/finance
- **社会热点**: http://localhost:3000/api/topics/society

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务器监听端口 |
| `HOST` | `localhost` | 服务器主机地址 |
| `LOG_LEVEL` | `INFO` | 日志级别 (DEBUG / INFO / WARN / ERROR) |

---

## 11. 扩展指南

### 添加新数据源

1. 在 `config/sources.js` 的对应分类数组中添加新的 `SourceConfig` 对象
2. 在 `services/baseService.js` 的 `BaseService.parsers` 中添加对应的解析器函数
3. 重启服务即可生效

**示例 — 添加一个新的科技数据源**:

```javascript
// config/sources.js → SOURCES.tech 数组中添加:
{
  id: 'new-source',
  name: '新数据源名称',
  type: 'api',
  url: 'https://example.com/api/hot',
  headers: { 'User-Agent': '...' },
  parser: 'newSource'
}

// services/baseService.js → BaseService.parsers 中添加:
newSource(data) {
  if (!data?.items) return [];
  return data.items.map((item, index) => ({
    rank: index + 1,
    title: item.title || '',
    url: item.url || '',
    hotValue: item.hot || '',
    excerpt: item.desc || ''
  })).slice(0, 20);
}
```

### 添加新分类

1. 在 `config/sources.js` 的 `SOURCES` 对象中添加新的分类键和数据源数组
2. 在 `services/aggregatorService.js` 的 `CATEGORY_NAMES` 中添加分类中文名
3. 在 `routes/api.js` 的 `validCategories` 数组中添加新分类 ID
4. 在前端 `public/js/app.js` 的 `CATEGORY_LABELS` 中添加显示名称
5. 在 `public/index.html` 的 Tab 组中添加新的 Tab 按钮

### 调整缓存策略

修改 `config/sources.js` 中的 `CACHE_TTL` 值（单位：毫秒）。

---

> **文档生成时间**: 2026-05-24  
> **项目版本**: 1.0.0
