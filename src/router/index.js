/**
 * ============================================================
 *  router/index.js — Vue Router 路由配置
 * ============================================================
 *
 * 【路由模式】
 *   createWebHistory() — HTML5 History 模式（URL 无 # 号）
 *   需要后端配合：所有非静态文件请求返回 index.html
 *
 * 【路由表】
 *   ┌────────────┬────────────────────┬──────────────────────┐
 *   │ 路径        │ 名称               │ 组件                 │
 *   ├────────────┼────────────────────┼──────────────────────┤
 *   │ /          │ home               │ HomeView       首页  │
 *   │ /article   │ article            │ ArticleView    文章  │
 *   │ /api-demo  │ api-demo           │ ApiDemoView    API   │
 *   │ /about     │ about              │ AboutView      关于  │
 *   └────────────┴────────────────────┴──────────────────────┘
 *
 * 【注意】
 *   import.meta.env.BASE_URL 在 vite.config.js 中配置，
 *   可在不同环境（开发/生产）下提供不同的基础路径。
 * ============================================================
 */

import { createRouter, createWebHistory } from 'vue-router'

// ── 路由组件导入（@/ 是 vite 配置的 src/ 别名） ──
import HomeView from '@/views/HomeView.vue'      // 首页
import ApiDemoView from '@/views/ApiDemoView.vue' // API 测试
import AboutView from '@/views/AboutView.vue'     // 关于页面
import ArticleView from '@/views/ArticleView.vue' // 文章阅读

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
    // ── 路由表 ──
  routes: [
    {
      path: '/',            // 首页 —— 内容展示大图 + 板块导航 + 开屏动画
      name: 'home',
      component: HomeView
    },
    {
      path: '/article',     // 文章阅读 —— 章节式阅读器，侧边栏导航
      name: 'article',
      component: ArticleView
    },
    {
      path: '/api-demo',    // API 演示 —— 测试所有后端 RESTful 接口
      name: 'api-demo',
      component: ApiDemoView
    },
    {
      path: '/about',       // 关于页面 —— 项目介绍、技术栈、API 文档
      name: 'about',
      component: AboutView
    }
  ]
})

export default router