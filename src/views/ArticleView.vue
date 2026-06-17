/**
 * ============================================================
 *  ArticleView.vue — 文章阅读页面（章节式阅读器）
 * ============================================================
 *
 * 【功能概述】
 *   从后端 /api/article 接口获取文章及其章节，提供沉浸式阅读体验。
 *
 * 【布局（桌面端）】
 *   ┌─────────────────────────────────────────────┐
 *   │  fixed-corner-title ("jyoushitou" 左上角)    │
 *   │  header (菜单☰ + 文章标题 + UserNav)        │
 *   │  breadcrumb (文章名 > 当前章节)              │
 *   ├──────────┬──────────────────────────────────┤
 *   │ sidebar  │ content-area                     │
 *   │ 章节列表  │  当前章节标题 + 正文             │
 *   │ 上一篇↓  │  (底部 上一篇/下一篇)             │
 *   │ 下一篇↓  │                                  │
 *   └──────────┴──────────────────────────────────┘
 *
 * 【布局（移动端）】
 *   - 侧边栏隐藏，使用下拉式"展开/收起章节目录"
 *   - 上一篇/下一篇移至内容区上下方
 *
 * 【核心交互】
 *   - 侧边栏章节导航（桌面） / 下拉章节选择（移动）
 *   - 上一篇 / 下一篇翻页
 *   - 导航菜单 ☰ 弹出五个板块入口（主页/文章/图片/视频/博客）
 *   - 点击"主页"时：标题飞回居中 → 跳转（对应首页动画）
 *   - 入场动画：header → breadcrumb → sidebar + content 依次弹出
 *   - 背景图随机选择，与首页同一组图片
 *
 * 【数据】
 *   API: GET /api/article → { title, chapters: [{name, content}] }
 *   加载中 / 失败时使用保底数据。
 * ============================================================
 */

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import UserNav from '@/components/UserNav.vue'

const router = useRouter()
const route = useRoute()

// ════════════════════════════════════════════════════════════
//  样式状态
// ════════════════════════════════════════════════════════════
const bgImage = ref('')         // 随机背景图 CSS url()

// ════════════════════════════════════════════════════════════
//  导航菜单状态
//  ☰ 按钮在导航打开时隐藏，右侧 UserNav 也隐藏
//  关闭导航时恢复显示
// ════════════════════════════════════════════════════════════
const navOpen = ref(false)
const menuBtnDisplay = ref('inline-flex')    // ☰ 按钮的 display
const headerRightDisplay = ref('flex')       // 右侧 UserNav 的 display

/**
 * toggleNav() — 切换导航菜单的打开/关闭
 * 打开时隐藏 ☰ 按钮和 UserNav，显示板块导航列表
 */
function toggleNav() {
  navOpen.value = !navOpen.value
  menuBtnDisplay.value = navOpen.value ? 'none' : 'inline-flex'
  headerRightDisplay.value = navOpen.value ? 'none' : 'flex'
}

/**
 * closeNav() — 关闭导航菜单
 */
function closeNav() {
  navOpen.value = false
  menuBtnDisplay.value = 'inline-flex'
  headerRightDisplay.value = 'flex'
}

// ════════════════════════════════════════════════════════════
//  移动端章节下拉菜单状态
// ════════════════════════════════════════════════════════════
const chapterOpen = ref(false)
const chapterBtnText = ref('展开章节目录')

function toggleChapter() {
  chapterOpen.value = !chapterOpen.value
  chapterBtnText.value = chapterOpen.value ? '收起章节目录' : '展开章节目录'
}

/**
 * navTo(path) — 导航到指定路径
 *
 * 如果路径是 '/'（回首页）：
 *   1. 所有内容元素淡出（opacity 0 + translateY）
 *   2. "jyoushitou" 从左上角飞回居中（fly-back）
 *   3. 延迟 900ms 后跳转（配合动画时长）
 *
 * 其他路径：直接跳转
 */
function navTo(path) {
  closeNav()
  if (path === '/') {
    // 文章内容淡出
    const allContent = document.querySelectorAll('.header, .breadcrumb, .sidebar, .content-area, .mobile-chapter-wrap')
    allContent.forEach(el => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
    })
    // "jyoushitou" 从左上角飞回居中
    const titleEl = document.querySelector('.fixed-corner-title')
    if (titleEl) titleEl.classList.add('fly-back')
    setTimeout(() => router.push('/'), 900)
  } else {
    router.push(path)
  }
}

// ════════════════════════════════════════════════════════════
//  文章数据（保底数据）
//  结构: { title, chapters: [{ name, content }] }
//  API 请求成功后会被替换
// ════════════════════════════════════════════════════════════
const articleTitle = ref('文章名')
const currentChapter = ref('')
const chapters = ref([
  { name: '第一章 开篇', content: '清晨的微光透过窗棂洒落，轻轻拂过桌面，为平凡的一日拉开序幕。生活总在日复一日的前行中书写着不同的故事，有人奔赴远方追寻理想，有人留守身旁守护温暖，每一种选择都有着独属于自己的意义。' },
  { name: '第二章 内容一', content: '行走在世间，我们会遇见形形色色的人，经历大大小小的事，有欢声笑语相伴，也难免有失意迷茫相随。就像四季更迭，春有百花秋有月，夏有凉风冬有雪，不同的光景拼凑出完整的人生画卷。' },
  { name: '第三章 内容二', content: '我们在成长中学会接纳，在挫折中变得坚强，在陪伴中懂得珍惜。每一次迈步，都是对未来的期许；每一次停留，都是对当下的感悟。不必焦虑前路漫漫，也不必纠结过往遗憾，用心感受眼前的点滴美好，认真对待每一分每一秒，便是对生活最好的回应。' },
  { name: '第四章 结尾', content: '时光缓缓流淌，带走稚嫩，沉淀阅历，让原本懵懂的内心慢慢变得丰盈而笃定。无论是喧嚣的闹市，还是静谧的郊野，只要心怀热爱，处处皆是风景。待人以真诚，处事以坦然，在烟火日常里守住本心，在风雨来袭时挺直脊梁。人生本就是一场不断探索、不断修行的旅程，沿途的坎坷与惊喜，都是命运赠予的礼物。学会和自己和解，和世界温柔相处，不慌不忙，慢慢前行，终会在属于自己的天地里，收获独有的光芒。' }
])
const activeChapterIndex = ref(0)  // 当前阅读的章节索引
const contentLoading = ref(true)   // 内容加载中

/**
 * updateDocumentTitle() — 更新浏览器标签页标题
 * 格式: "文章名 - 当前章节名"
 */
function updateDocumentTitle() {
  const chapterName = chapters.value[activeChapterIndex.value]?.name || currentChapter.value
  document.title = `${articleTitle.value} - ${chapterName}`
}

/**
 * switchChapter(index) — 切换到指定章节
 * 更新 activeChapterIndex、currentChapter 和页面标题
 * 如果 index 超出范围则不操作
 */
function switchChapter(index) {
  if (index >= 0 && index < chapters.value.length) {
    activeChapterIndex.value = index
    currentChapter.value = chapters.value[index].name
    updateDocumentTitle()
  }
}

/**
 * fetchArticle() — 从后端获取文章数据
 * 调用：GET /api/article
 *
 * 成功时（code === 200）：
 *   更新 articleTitle 和 chapters
 * 失败时：
 *   保留保底数据，仅 console.error 警告
 *
 * finally：
 *   设置 contentLoading = false
 *   默认选中第一章
 *   更新页面标题
 */
async function fetchArticle() {
  contentLoading.value = true
  try {
    const res = await fetch('/api/article')
    const data = await res.json()
    if (data.code === 200 && data.data) {
      articleTitle.value = data.data.title || '文章名'
      chapters.value = data.data.chapters || chapters.value
    }
  } catch (e) {
    console.error('获取文章数据失败，使用保底数据:', e)
  } finally {
    contentLoading.value = false
    if (chapters.value.length > 0) {
      currentChapter.value = chapters.value[0].name
      activeChapterIndex.value = 0
    }
    updateDocumentTitle()
  }
}

/**
 * onMounted — 页面加载初始化
 *
 * 【流程】
 *   1. 随机选择背景图（与首页同一组图片，视觉连续）
 *   2. nextTick 等待 DOM 渲染
 *   3. 显示主内容（main-content display: none → block）
 *   4. requestAnimationFrame 确保 transition 生效后播放入场动画
 *      - header        → 50ms  弹出
 *      - breadcrumb    → 200ms 弹出
 *      - sidebar + content → 400ms 弹出
 *   5. 异步获取文章数据（不阻塞动画）
 */
onMounted(async () => {
  // ── 1. 随机背景图 ──
  const bgList = [
    'url("/image/129442526_p0.png")',
    'url("/image/88515515_p0.png")'
  ]
  bgImage.value = bgList[Math.floor(Math.random() * bgList.length)]

  // ── 2. 等待 DOM 渲染 ──
  await nextTick()

  // ── 3. 显示主内容（初始 display: none） ──
  const mainContent = document.getElementById('mainContent')
  if (mainContent) {
    mainContent.style.display = 'block'
  }

  // ── 4. ★ 立即播放入场动画（不等 API 数据） ──
  requestAnimationFrame(() => {
    // header 弹出
    setTimeout(() => {
      const header = document.querySelector('.article-body .header')
      if (header) header.classList.add('pop-in')
    }, 50)
    // breadcrumb 弹出
    setTimeout(() => {
      const breadcrumb = document.querySelector('.article-body .breadcrumb')
      if (breadcrumb) breadcrumb.classList.add('pop-in')
    }, 200)
    // sidebar + content 同时弹出
    setTimeout(() => {
      const sidebar = document.querySelector('.article-body .sidebar')
      if (sidebar) sidebar.classList.add('pop-in')
      const content = document.querySelector('.article-body .content-area')
      if (content) content.classList.add('pop-in')
    }, 400)
  })

  // ── 5. 异步加载数据 ──
  await fetchArticle()
  await nextTick()
})
</script>

<template>
    <div class="article-body" :style="{ backgroundImage: bgImage }">
    <div class="main-content" id="mainContent">

      <!-- ════════════════════════════════════════════════════
           "jyoushitou" 固定在左上角
           位置与首页 fly-corner 状态一致，视觉无跳转
           回首页时添加 fly-back class 飞回居中
           ════════════════════════════════════════════════════ -->
      <div class="fixed-corner-title">jyoushitou</div>

      <!-- ── Header: ☰ 菜单 + 文章标题 + UserNav ── -->
      <header class="header">
        <!-- ☰ 导航菜单按钮（导航打开时隐藏） -->
        <button class="menu-btn" id="menuBtn" :style="{ display: menuBtnDisplay }" @click="toggleNav">☰</button>
        <!-- 文章标题 -->
        <h1 class="page-title">{{ articleTitle }}</h1>
        <!-- 右侧用户组件（导航打开时隐藏） -->
        <div class="header-right" id="headerRight" :style="{ display: headerRightDisplay }">
          <UserNav />
        </div>

        <!-- ── 下拉导航菜单（五个板块入口） ── -->
        <div class="nav-dropdown" id="navDropdown" :class="{ show: navOpen }">
          <div class="nav-box" @click="navTo('/')">主页</div>
          <div class="nav-box" @click="navTo('/article')">文章</div>
          <div class="nav-box">图片</div>
          <div class="nav-box">视频</div>
          <div class="nav-box">博客</div>
          <button class="nav-close-btn" id="navCloseBtn" @click="closeNav">✕</button>
        </div>
      </header>

      <!-- ── 面包屑导航：文章名 > 当前章节 ── -->
      <div class="breadcrumb">
        <div class="breadcrumb-item">{{ articleTitle }}</div>
        <div class="breadcrumb-item">{{ currentChapter }}</div>
      </div>

      <!-- ── 移动端章节选择器（桌面端隐藏） ── -->
      <div class="mobile-chapter-wrap">
        <button class="chapter-toggle" id="chapterToggle" @click="toggleChapter">{{ chapterBtnText }}</button>
        <div class="mobile-chapter" id="mobileChapter" :class="{ show: chapterOpen }">
          <h4>文章章节</h4>
          <a v-for="(ch, ci) in chapters" :key="ci" href="#" @click.prevent="switchChapter(ci); chapterOpen = false">{{ ch.name }}</a>
        </div>
      </div>

      <!-- ── 主内容区（桌面端侧边栏 + 内容区） ── -->
      <div class="main-container">
        <!-- 侧边栏：章节列表 + 上一篇/下一篇 -->
        <div class="sidebar">
          <!-- 章节导航列表 -->
          <div class="chapter-list">
            <h3>文章章节</h3>
            <a
              v-for="(ch, ci) in chapters"
              :key="ci"
              href="#"
              @click.prevent="switchChapter(ci)"
              :class="{ active: ci === activeChapterIndex }"
            >{{ ch.name }}</a>
          </div>
          <!-- 翻页（仅桌面端显示） -->
          <div class="page-turn">
            <a
              href="#"
              @click.prevent="switchChapter(activeChapterIndex - 1)"
              :style="{ visibility: activeChapterIndex > 0 ? 'visible' : 'hidden' }"
            >← 上一篇</a>
            <a
              href="#"
              @click.prevent="switchChapter(activeChapterIndex + 1)"
              :style="{ visibility: activeChapterIndex < chapters.length - 1 ? 'visible' : 'hidden' }"
            >下一篇 →</a>
          </div>
        </div>

        <!-- 正文内容区 -->
        <div class="content-area">
          <!-- 移动端上一篇 -->
          <div class="mobile-prev">
            <a
              href="#"
              @click.prevent="switchChapter(activeChapterIndex - 1)"
              :style="{ visibility: activeChapterIndex > 0 ? 'visible' : 'hidden' }"
            >← 上一篇</a>
          </div>

          <!-- 当前章节标题 + 正文 -->
          <h2>{{ chapters[activeChapterIndex]?.name || '文章正文' }}</h2>
          <p class="article-text">{{ chapters[activeChapterIndex]?.content || '加载中...' }}</p>

          <!-- 移动端下一篇 -->
          <div class="mobile-next">
            <a
              href="#"
              @click.prevent="switchChapter(activeChapterIndex + 1)"
              :style="{ visibility: activeChapterIndex < chapters.length - 1 ? 'visible' : 'hidden' }"
            >下一篇 →</a>
          </div>
        </div>
      </div>
        </div>
  </div>
</template>

<style scoped>
/* ════════════════════════════════════════════════════════════
   全局字体：楷体（文章阅读页专用）
   容器：全屏覆盖 + fixed 背景图
   ════════════════════════════════════════════════════════════ */
.article-body, .article-body * { font-family: "KaiTi", "STKaiti", serif; }
.article-body {
    padding: 20px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
}

/* ════════════════════════════════════════════════════════════
   Header：半透明毛玻璃，左右拉宽 4cm
   初始隐藏（opacity 0），pop-in 弹出
   ════════════════════════════════════════════════════════════ */
.article-body .header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 30px;
    margin-bottom: 14px;
    margin-left: -4cm;
    width: calc(100% + 4cm + 4cm);
    background: rgba(255,255,255,0.35);
    border: 1px solid rgba(255,255,255,0.45);
    border-radius: 14px;
    position: relative;
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}
.article-body .header.pop-in { opacity: 1; transform: translateY(0); }

/* ── ☰ 菜单按钮 ── */
.article-body .menu-btn {
    border: 1px solid rgba(255,255,255,0.45);
    padding: 10px 16px;
    background: rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.95);
    cursor: pointer;
    font-size: 1.3rem;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    position: absolute;
    left: 24px;
    z-index: 10;
    transition: background 0.25s;
}
.article-body .menu-btn:hover { background: rgba(255,255,255,0.5); }

/* ── 文章标题 ── */
.article-body .page-title {
    font-size: 2.2rem;
    font-weight: normal;
    color: rgba(255,255,255,0.95);
    letter-spacing: 6px;
}

/* ── 右侧用户组件 ── */
.article-body .header-right {
    display: flex;
    align-items: center;
    gap: 14px;
    position: absolute;
    right: 24px;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}
.article-body .header-right .auth-btn {
    padding: 10px 20px;
    font-size: 1.1rem;
    border: 1px solid rgba(255,255,255,0.45);
    border-radius: 10px;
    background: rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.95);
    cursor: pointer;
    transition: background 0.25s;
    letter-spacing: 3px;
}
.article-body .header-right .auth-btn:hover { background: rgba(255,255,255,0.5); }

/* ── 导航下拉菜单（☰ 展开后显示） ── */
.article-body .nav-dropdown {
    display: none;
    position: absolute;
    left: 24px;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.article-body .nav-dropdown.show { display: flex; }
.article-body .nav-dropdown .nav-box {
    padding: 10px 22px;
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: 8px;
    background: rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.9);
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.25s;
    letter-spacing: 3px;
}
.article-body .nav-dropdown .nav-box:hover { background: rgba(255,255,255,0.5); }
.article-body .nav-close-btn {
    margin-left: auto;
    border: 1px solid rgba(255,255,255,0.45);
    padding: 6px 14px;
    background: rgba(255,255,255,0.3);
    color: rgba(255,255,255,0.9);
    cursor: pointer;
    font-size: 1.2rem;
    border-radius: 8px;
    transition: background 0.25s;
}
.article-body .nav-close-btn:hover { background: rgba(255,255,255,0.5); }

/* ════════════════════════════════════════════════════════════
   面包屑导航
   ════════════════════════════════════════════════════════════ */
.article-body .breadcrumb {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 14px;
    margin-left: -4cm;
    width: calc(100% + 4cm + 4cm);
    gap: 12px;
    flex-wrap: wrap;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.article-body .breadcrumb.pop-in { opacity: 1; transform: translateY(0); }
.article-body .breadcrumb-item {
    border: 1px solid rgba(255,255,255,0.45);
    padding: 8px 24px;
    font-size: 1.1rem;
    background: rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.95);
    border-radius: 10px;
}

/* ════════════════════════════════════════════════════════════
   主内容区：flex 双栏布局（侧边栏 flex:2 + 内容区 flex:8）
   ════════════════════════════════════════════════════════════ */
.article-body .main-container {
    display: flex;
    height: calc(100vh - 170px);
    gap: 14px;
    margin-left: -4cm;
    width: calc(100% + 4cm + 4cm);
}

/* ════════════════════════════════════════════════════════════
   侧边栏：章节列表 + 上一篇/下一篇
   ════════════════════════════════════════════════════════════ */
.article-body .sidebar {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 200px;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.article-body .sidebar.pop-in { opacity: 1; transform: translateY(0); }
.article-body .chapter-list {
    flex: 1;
    border: 1px solid rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.35);
    padding: 20px;
    border-radius: 10px;
    color: rgba(255,255,255,0.95);
}
.article-body .chapter-lst h3 {
    margin-bottom: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.3);
    padding-bottom: 8px;
    font-size: 1.3rem;
    color: rgba(255,255,255,0.95);
}
.article-body .chapter-list a {
    display: block;
    margin: 10px 0;
    font-size: 1.1rem;
    color: rgba(255,255,255,0.85);
    text-decoration: none;
    transition: color 0.2s;
}
.article-body .chapter-list a:hover { color: #fff; }
.article-body .chapter-list a.active { color: #fff; font-weight: bold; text-shadow: 0 0 8px rgba(255,255,255,0.5); }

/* ── 翻页按钮 ── */
.article-body .page-turn {
    border: 1px solid rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.35);
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
    border-radius: 10px;
}
.article-body .page-turn a {
    font-size: 1.15rem;
    color: rgba(255,255,255,0.85);
    text-decoration: none;
    transition: color 0.2s;
}
.article-body .page-turn a:hover { color: #fff; }

/* ════════════════════════════════════════════════════════════
   正文内容区
   ════════════════════════════════════════════════════════════ */
.article-body .content-area {
    flex: 8;
    border: 1px solid rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.35);
    padding: 30px;
    overflow-y: auto;
    border-radius: 10px;
    color: rgba(255,255,255,0.95);
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.article-body .content-area.pop-in { opacity: 1; transform: translateY(0); }
.article-body .content-area h2 {
    margin-bottom: 16px;
    font-size: 1.8rem;
    font-weight: normal;
    letter-spacing: 3px;
}
.article-body .content-area .article-text {
    font-size: 1.2rem;
    line-height: 2.2;
    margin: 16px 0;
    letter-spacing: 1px;
}

/* ════════════════════════════════════════════════════════════
   移动端专用元素（桌面端隐藏）
   ════════════════════════════════════════════════════════════ */
.article-body .mobile-chapter-wrap { display: none; }
.article-body .mobile-prev,
.article-body .mobile-next { display: none; }

/* ════════════════════════════════════════════════════════════
   "jyoushitou" 固定左上角
   与首页 fly-corner 状态位置一致，回首页时 fly-back 飞回居中
   ════════════════════════════════════════════════════════════ */
.article-body .fixed-corner-title {
    position: fixed;
    top: 10px;
    left: 16px;
    font-size: 1.1rem;
    font-weight: 900;
    font-family: "KaiTi", "STKaiti", serif;
    color: rgba(255,255,255,0.7);
    letter-spacing: 3px;
    opacity: 0.7;
    z-index: 999;
    pointer-events: none;
    transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
    white-space: nowrap;
}
.article-body .fixed-corner-title.fly-back {
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 3rem;
    letter-spacing: 6px;
    text-align: center;
}

/* ── 主内容初始隐藏（入场动画前不可见） ── */
.article-body .main-content {
    display: none;
}

/* ════════════════════════════════════════════════════════════
   响应式 (max-width: 768px)
   - 侧边栏隐藏，显示下拉章节选择
   - 上下翻页移至内容区
   - 缩小字体和间距
   ════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
    .article-body { padding: 8px; }

    .article-body .header { padding: 10px 14px; border-radius: 10px; margin-left: 0; width: 100%; }
    .article-body .menu-btn { left: 10px; padding: 8px 12px; font-size: 1.1rem; border-radius: 8px; }
    .article-body .header-right { right: 10px; gap: 8px; }
    .article-body .header-right .auth-btn { padding: 8px 14px; font-size: 0.95rem; border-radius: 8px; }
    .article-body .page-title { font-size: 1.4rem; letter-spacing: 4px; }
    .article-body .nav-dropdown {
        left: 10px;
        right: 10px;
        gap: 4px;
    }
    .article-body .nav-dropdown .nav-box { padding: 6px 14px; font-size: 0.95rem; letter-spacing: 2px; }
    .article-body .nav-close-btn { padding: 4px 10px; font-size: 0.95rem; }
    .article-body .breadcrumb-item { padding: 5px 16px; font-size: 0.95rem; }

    .article-body .breadcrumb { margin-left: 0; width: 100%; }
    .article-body .main-container { flex-direction: column; height: auto; gap: 10px; margin-left: 0; width: 100%; }
    .article-body .sidebar { display: none; }
    .article-body .content-area {
        width: 100%;
        overflow-y: visible;
        padding: 16px;
    }
    .article-body .content-area h2 { font-size: 1.4rem; }
    .article-body .content-area .article-text { font-size: 1rem; line-height: 2; }

    /* ── 移动端章节下拉选择器 ── */
    .article-body .mobile-chapter-wrap {
        display: block;
        position: sticky;
        top: 5px;
        z-index: 99;
        padding: 5px 0;
    }
    .article-body .chapter-toggle {
        border: 1px solid rgba(255,255,255,0.45);
        background: rgba(255,255,255,0.35);
        color: rgba(255,255,255,0.95);
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        margin-bottom: 5px;
        font-size: 0.95rem;
        letter-spacing: 2px;
        transition: background 0.25s;
    }
    .article-body .chapter-toggle:hover { background: rgba(255,255,255,0.5); }
    .article-body .mobile-chapter {
        border: 1px solid rgba(255,255,255,0.45);
        background: rgba(255,255,255,0.35);
        padding: 12px;
        border-radius: 8px;
        display: none;
    }
    .article-body .mobile-chapter.show { display: block; }
    .article-body .mobile-chapter h4 {
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.3);
        padding-bottom: 6px;
        font-size: 1rem;
        color: rgba(255,255,255,0.95);
    }
    .article-body .mobile-chapter a {
        display: inline-block;
        margin: 5px 10px 5px 0;
        font-size: 0.95rem;
        color: rgba(255,255,255,0.85);
        text-decoration: none;
    }

    /* ── 移动端上一篇/下一篇 ── */
    .article-body .mobile-prev {
        display: block;
        margin-top: 10px;
        margin-bottom: 15px;
        padding: 12px;
        border: 1px solid rgba(255,255,255,0.45);
        border-radius: 8px;
        background: rgba(255,255,255,0.35);
    }
    .article-body .mobile-prev a { font-size: 1rem; color: rgba(255,255,255,0.85); text-decoration: none; }
    .article-body .mobile-next {
        display: block;
        margin-top: 20px;
        padding: 12px;
        border: 1px solid rgba(255,255,255,0.45);
        border-radius: 8px;
        background: rgba(255,255,255,0.35);
    }
    .article-body .mobile-next a { font-size: 1rem; color: rgba(255,255,255,0.85); text-decoration: none; }

    .modal { min-width: 280px; padding: 30px 24px; margin: 0 10px; }
}
</style>
