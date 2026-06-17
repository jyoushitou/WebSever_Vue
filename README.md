# Vue 3 前端

> **现代全栈 Web 前端**，搭配 C++ 原生 HTTP 服务器使用。

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 | 前端框架（Composition API） |
| Vue Router | 路由管理 |
| Pinia | 状态管理 |
| Axios | HTTP 请求封装 |
| Vite | 构建工具 |

## 项目结构

```
vue/
├── index.html                     # HTML 模板
├── vite.config.js                 # Vite 配置（代理 /api -> 后端）
├── package.json                   # 依赖管理
└── src/
    ├── main.js                    # 应用入口
    ├── App.vue                    # 根组件
    ├── assets/
    │   └── main.css               # 全局样式（CSS Reset + 过渡动画）
    ├── router/
    │   └── index.js               # Vue Router 路由配置
    ├── stores/
    │   └── api.js                 # Pinia 状态管理 & Axios 封装
    ├── components/
    │   └── UserNav.vue            # 用户导航组件（登录/注册弹窗）
    └── views/
        ├── HomeView.vue           # 首页（开屏动画、内容展示）
        ├── ArticleView.vue        # 文章阅读页（章节式阅读器）
        ├── ApiDemoView.vue        # API 接口演示页
        └── AboutView.vue          # 关于页面
```

## 快速开始

```bash
cd vue
npm install
npm run dev
```

开发服务器运行在 **http://localhost:60907**，Vite 自动将 `/api/*` 代理到后端。

## 生产构建

```bash
npm run build
```

构建产物在 `vue/dist/`，后端 C++ 服务器可自动查找并服务静态文件。

## 前端特性

- **开屏动画**：首页加载时品牌标题动画，内容级联弹入
- **滚动动画**：基于 IntersectionObserver 的入场/退场效果
- **登录/注册弹窗**：Teleport 到 body，避免父容器影响定位
- **多设备管理**：同一账户可多设备登录，独立退出
- **服务器状态检测**：导航栏实时显示后端连通状态
- **响应式设计**：适配桌面与移动端