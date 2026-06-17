/**
 * ============================================================
 *  App.vue — Vue 3 根组件（应用入口模板）
 * ============================================================
 *
 * 【功能概述】
 *   - 根据当前路由判断使用"全屏布局"或"标准布局"
 *   - 全屏布局：首页（/）和文章页（/article）无公共导航栏
 *   - 标准布局：顶部渐变导航栏 + 内容区 + 页脚
 *   - 挂载时初始化登录状态（从 localStorage 恢复）& 检测服务器连通性
 *
 * 【布局结构】
 *   ┌──────────────────────────────────────┐
 *   │   Logo + 服务器状态 + UserNav        │  ← 仅标准布局
 *   │   首页 ｜ API 演示 ｜ 关于            │  ← 导航标签
 *   ├──────────────────────────────────────┤
 *   │         <RouterView />               │  ← 路由视图
 *   ├──────────────────────────────────────┤
 *   │             页脚                     │
 *   └──────────────────────────────────────┘
 *
 * 【依赖】
 *   vue-router  → 路由导航 & 路由信息
 *   Pinia       → 全局状态管理（apiStore）
 *   UserNav     → 用户登录/注册/头像组件
 * ============================================================
 */

<script setup>
// ── Vue / Vue Router 核心 ──
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue'

// ── 组件 ──
import UserNav from '@/components/UserNav.vue'

// ── Store ──
import { useApiStore } from '@/stores/api'

const apiStore = useApiStore()

// ── 服务器连通性状态 ──
const serverStatus = ref('checking...')   // 初始: "checking..." → 检测后: "🟢 在线" / "🔴 离线"
const route = useRoute()

// ── 计算属性：判断当前路由是否使用全屏布局 ──
const isHome = computed(() => route.path === '/')
const isArticle = computed(() => route.path === '/article')
const isFullPage = computed(() => isHome.value || isArticle.value)  // 首页和文章页无公共导航栏

onMounted(async () => {
  // 1. 从 localStorage 恢复登录状态
  apiStore.initAuth()

  // 2. 检测后端服务器是否在线
  try {
    const response = await apiStore.hello()
    serverStatus.value = '🟢 在线'
  } catch {
    serverStatus.value = '🔴 离线'
  }
})
</script>

<template>
    <!-- ════════════════════════════════════════════════════════
       全屏页面模式
       首页（/）和文章页（/article）拥有独立的沉浸式布局，
       不需要公共导航栏和页脚。
       ════════════════════════════════════════════════════════ -->
  <template v-if="isFullPage">
    <RouterView />
  </template>

  <!-- ════════════════════════════════════════════════════════
       标准页面模式
       包含：header（Logo + 状态 + 用户导航 + 标签栏）
            → main（路由视图）
            → footer（版权信息）
       ════════════════════════════════════════════════════════ -->
  <template v-else>
    <div class="app-container">
      <!-- ── 顶部 header ── -->
      <header class="app-header">
        <div class="header-content">
          <!-- Logo + 副标题 -->
          <div class="logo">
            <h1>Native Socket Server</h1>
            <span class="subtitle">C++ 后端 · Vue 3 前端</span>
          </div>
          <!-- 服务器实时连通性指示器 -->
          <div class="server-status">
            <span class="status-label">服务器状态：</span>
            <span :class="['status-indicator', serverStatus.includes('在线') ? 'online' : 'offline']">
              {{ serverStatus }}
            </span>
          </div>
          <!-- 用户登录/注册/信息组件 -->
          <UserNav />
        </div>
        <!-- ── 导航标签栏 ── -->
        <nav class="nav-bar">
          <RouterLink to="/" class="nav-link" active-class="active">首页</RouterLink>
          <RouterLink to="/api-demo" class="nav-link" active-class="active">API 演示</RouterLink>
          <RouterLink to="/about" class="nav-link" active-class="active">关于</RouterLink>
        </nav>
      </header>

      <!-- ── 主内容区：展示当前路由对应的页面 ── -->
      <main class="main-content">
        <RouterView />
      </main>

      <!-- ── 页脚 ── -->
      <footer class="app-footer">
        <p>Native Socket Server &copy; 2024 | 基于 C++ 原生 Socket 和 Vue 3</p>
      </footer>
    </div>
  </template>
</template>

<style>
/* ════════════════════════════════════════════════════════════
   Flex 容器：header 吸顶 + footer 置底
   ════════════════════════════════════════════════════════════ */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ════════════════════════════════════════════════════════════
   header：紫色渐变背景 + 白色文字
   ════════════════════════════════════════════════════════════ */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* ── 顶部内容区：Logo + 状态 + 用户导航，水平等分布局 ── */
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ── Logo 文字 ── */
.logo h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
.subtitle { font-size: 0.9rem; opacity: 0.8; }

/* ── 服务器状态指示器（圆角胶囊） ── */
.server-status {
  background: rgba(255,255,255,0.15);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
}
.status-indicator { font-weight: 600; }
.status-indicator.online { color: #4ade80; }   /* 🟢 绿色 */
.status-indicator.offline { color: #f87171; }  /* 🔴 红色 */

/* ════════════════════════════════════════════════════════════
   导航标签栏：首页 | API 演示 | 关于
   活动标签白底紫字，其余半透明白字
   ════════════════════════════════════════════════════════════ */
.nav-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 4px;
}
.nav-link {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  font-weight: 500;
}
.nav-link:hover { background: rgba(255,255,255,0.1); color: white; }
.nav-link.active { background: white; color: #667eea; }

/* ════════════════════════════════════════════════════════════
   主内容区：内容容器，自动撑满剩余高度
   ════════════════════════════════════════════════════════════ */
.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  width: 100%;
}

/* ════════════════════════════════════════════════════════════
   页脚：深色背景 + 居中版权文字
   ════════════════════════════════════════════════════════════ */
.app-footer {
  background: #1a1a2e;
  color: rgba(255,255,255,0.7);
  text-align: center;
  padding: 20px;
  margin-top: auto;
  font-size: 0.9rem;
}
</style>