/**
 * ============================================================
 *  HomeView.vue — 首页（内容展示 + 开屏动画）
 * ============================================================
 *
 * 【功能概述】
 *   展示四个板块（文章/图片/视频/博客），每个板块包含若干标签行，
 *   每行展示多张图片缩略图。页面包含丰富的入场/退场/滚动动画。
 *
 * 【核心特性】
 *   1. 打字机标题 —— 首次访问时逐字打出"jyoushitou"
 *   2. 弹出动画 —— header、板块标题、内容行、图片依次 pop-in
 *   3. 滚动动画 —— IntersectionObserver 监听，进出视口时触发 scroll-in/out
 *   4. 文章跳转 —— 点击"文章"板块，内容四散淡出，标题飞往左上角
 *   5. 随机背景 —— 每次加载随机选择一张背景图
 *   6. API 数据 —— 调用 /api/contents 获取动态数据，失败则使用保底数据
 *
 * 【动画流程】
 *   onMounted → 渲染保底数据 → 弹出动画（不等 API） → 打字机效果 → 异步 API
 *
 * 【组件结构】
 *   top-typing-bar ("jyoushitou")
 *   header (UserNav 登录/注册)
 *   main
 *     ├── first-title (板块标题，可点击)
 *     └── section
 *           └── h-backgrand (标签行)
 *                 ├── second-title (标签名)
 *                 └── img-row
 *                       └── img-box × N (图片缩略图)
 * ============================================================
 */

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserNav from '@/components/UserNav.vue'

const router = useRouter()

// ════════════════════════════════════════════════════════════
//  goToArticle(event) — 点击"文章"板块时的跳转动画
//
//  效果：所有内容元素从点击位置向外四散淡出（爆炸式消失），
//        顶部的 "jyoushitou" 标题飞往左上角固定位置，
//        然后路由跳转到 /article。
//
//  原理：
//    1. 计算每个元素中心到点击位置的向量
//    2. 按向量方向分配 30~200px 的偏移量（距离越远偏移越大）
//    3. requestAnimationFrame 统一应用 transition + transform
//    4. 550ms 后跳转（与 transition 时长 0.7s 配合，避免空白停顿）
// ════════════════════════════════════════════════════════════
function goToArticle(event) {
  const clickX = event ? event.clientX : window.innerWidth / 2
  const clickY = event ? event.clientY : window.innerHeight / 2

  // 收集所有需要动画的元素
  const els = document.querySelectorAll('.header, .first-title, .section, .h-backgrand, .img-box, .second-title')
  const styles = []

  // 批量计算每个元素的偏移方向 + 距离
  els.forEach(el => {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = cx - clickX
    const dy = cy - clickY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    const drift = Math.min(dist * 0.15 + 30, 200)  // 至少 30px，最多 200px
    const tx = Math.cos(angle) * drift
    const ty = Math.sin(angle) * drift
    styles.push({ el, tx, ty })
  })

  // 统一应用动画（避免逐元素触发导致卡顿）
  requestAnimationFrame(() => {
    styles.forEach(({ el, tx, ty }) => {
      el.style.transition = 'all 0.7s cubic-bezier(0.5, 0, 0.75, 0)'
      el.style.opacity = '0'
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.7)`
    })
  })

  // "jyoushitou" 移到左上角固定位置
  const typingBar = document.querySelector('.top-typing-bar')
  if (typingBar) {
    typingBar.classList.add('fly-corner')
  }

  // 淡出动画接近完成时跳转
  setTimeout(() => router.push('/article'), 550)
}

// ════════════════════════════════════════════════════════════
//  顶部打字机动画状态
//  首次访问时逐字打出 "jyoushitou"，非首次直接显示完整文字
//  使用 sessionStorage 标记是否已看过动画
// ════════════════════════════════════════════════════════════
const typedText = ref('')
const showCursor = ref(true)
const fullText = 'jyoushitou'
// ─── 页面数据（
// ════════════════════════════════════════════════════════════
//  页面数据（保底数据）
//  四个板块：文章 / 图片 / 视频 / 博客
//  每个板块包含多个标签行（rows），每行有标签名 + 图片列表
//  图片列表为空时该行不渲染（见模板 v-if="row.imgs.length > 0"）
//  API 请求成功后会被响应数据替换
// ════════════════════════════════════════════════════════════
const sectionsData = ref([
  { title: '文章', rows: [
    { label: '穿越', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] },
    { label: '标签2', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png'] },
    { label: '标签3', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] }
  ]},
  { title: '图片', rows: [
    { label: '标签1', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] },
    { label: '标签2', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png'] },
    { label: '标签3', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] }
  ]},
  { title: '视频', rows: [
    { label: '标签1', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] },
    { label: '标签2', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png'] },
    { label: '标签3', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] }
  ]},
    { title: '博客', rows: [
    { label: '标签1', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] },
    { label: '标签2', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png'] },
    { label: '标签3', imgs: ['/image/129442526_p0.png','/image/88515515_p0.png','/image/129442526_p0.png','/image/88515515_p0.png'] },
    { label: '空标签(无图片)', imgs: [] }
  ]}
])

/**
 * fetchContents() — 从后端 API 获取内容数据
 *
 * 调用：GET /api/contents
 * 成功时（code === 200）替换 sectionsData 为服务器数据
 * 失败时保留保底数据（不抛出错误）
 *
 * 注意：无论成功还是失败，最后都通过展开运算符触发响应式更新，
 *       保证 Vue 重新渲染 DOM 以绑定动画 class。
 */
async function fetchContents() {
  try {
    const res = await fetch('/api/contents')
    const data = await res.json()
    if (data.code === 200 && data.data && data.data.length > 0) {
      sectionsData.value = data.data
    }
  } catch (e) {
    console.error('获取内容列表失败，使用默认数据:', e)
  }
  // 强制触发响应式更新（创建新数组引用），确保 DOM 重新渲染
  sectionsData.value = [...sectionsData.value]
}

// ── IntersectionObserver 实例，用于滚动动画 ──
let observer = null

/**
 * runContentAnimations() — 执行页面入场弹出动画
 *
 * 动画顺序（使用 setTimeout 链控制）：
 *   1. header (UserNav)        — 50ms   弹出
 *   2. first-title (板块标题)   — 200ms  起依次弹出（间隔 150ms）
 *   3. section (内容区)         — 与标题同步弹出
 *   4. h-backgrand (标签行)     — 500ms  起依次弹出
 *   5. img-box (图片缩略图)     — 每行内图片间隔 60ms 依次弹出
 *   6. 全部完成后启动 IntersectionObserver（滚动动画）
 *
 * 若 DOM 尚未渲染，递归用 requestAnimationFrame 重试。
 */
function runContentAnimations() {
  const allBgs = document.querySelectorAll('.h-backgrand')
  if (allBgs.length === 0) {
    // DOM 还没渲染好，下一帧重试
    requestAnimationFrame(() => runContentAnimations())
    return
  }

  const header = document.querySelector('.header')
  const firstTitles = document.querySelectorAll('.first-title')
  const sectionEls = document.querySelectorAll('.section')

  // ── 弹出 header ──
  if (header) {
    setTimeout(() => header.classList.add('pop-in'), 50)
  }

  // ── 依次弹出板块标题 + section ──
  for (let ti = 0; ti < firstTitles.length; ti++) {
    setTimeout(() => {
      firstTitles[ti].classList.add('pop-in')
      if (sectionEls[ti]) sectionEls[ti].classList.add('pop-in')
    }, 200 + ti * 150)
  }

  // ── 计算最大行数（用于后续循环） ──
  let maxRows = 0
  for (let si = 0; si < sectionEls.length; si++) {
    const rc = sectionEls[si].querySelectorAll('.h-backgrand').length
    if (rc > maxRows) maxRows = rc
  }

  // ── 逐行弹出 h-backgrand 及其内部的 img-box ──
  let delay = 500
  for (let rj = 0; rj < maxRows; rj++) {
    const rowIdx = rj
    // 弹出当前行的 h-backgrand
    setTimeout(() => {
      for (let siA = 0; siA < sectionEls.length; siA++) {
        const bgsA = sectionEls[siA].querySelectorAll('.h-backgrand')
        if (bgsA[rowIdx]) bgsA[rowIdx].classList.add('pop-in')
      }
    }, delay)

    // 计算当前行中最多图片数
    let maxImg = 0
    for (let si2 = 0; si2 < sectionEls.length; si2++) {
      const bgs2 = sectionEls[si2].querySelectorAll('.h-backgrand')
      if (bgs2[rowIdx]) {
        const ic = bgs2[rowIdx].querySelectorAll('.img-box').length
        if (ic > maxImg) maxImg = ic
      }
    }

    // 逐张弹出图片（每张间隔 60ms）
    for (let bj = 0; bj < maxImg; bj++) {
      setTimeout(() => {
        for (let si3 = 0; si3 < sectionEls.length; si3++) {
          const bgs3 = sectionEls[si3].querySelectorAll('.h-backgrand')
          if (bgs3[rowIdx]) {
            const boxes = bgs3[rowIdx].querySelectorAll('.img-box')
            if (boxes[bj]) boxes[bj].classList.add('pop-in')
          }
        }
      }, delay + 40 + bj * 60)
    }
    delay += maxImg * 60 + 40
  }

  // 入场动画全部完成后启动 IntersectionObserver（滚动动画）
  setTimeout(() => {
    startObserver(allBgs)
  }, delay + 400)
}

/**
 * startObserver(allBgs) — 启动 IntersectionObserver 滚动动画
 *
 * 监听所有 .h-backgrand 元素：
 *   - 进入视口 (isIntersecting) → 添加 scroll-in class（放大淡入）
 *   - 离开视口 → 添加 scroll-out class（缩小淡出）
 *
 * threshold: 0.1 — 元素 10% 进入视口即触发
 */
function startObserver(allBgs) {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('pop-in', 'scroll-out')
        entry.target.classList.add('scroll-in')
      } else {
        entry.target.classList.remove('scroll-in')
        entry.target.classList.add('scroll-out')
      }
    })
  }, { threshold: 0.1 })

  allBgs.forEach(bg => observer.observe(bg))
}

// ── watch: 数据变化时不做额外动画（Vue 自动响应式更新 DOM） ──
watch(sectionsData, () => {})

/**
 * onMounted — 页面加载初始化
 *
 * 【执行流程】
 *   1. 随机选择背景图 → 设置 body 背景
 *   2. 发起异步 API 请求（不 await，不阻塞）
 *   3. nextTick 等待保底数据渲染到 DOM
 *   4. 立即播放入场弹出动画（使用保底数据）
 *   5. 打字机效果（首次访问逐字打出，非首次直接显示）
 *   6. 等待 API 数据完成（自动响应式更新 DOM，不影响已有动画）
 */
onMounted(async () => {
  // ── 1. 随机背景图 ──
  const bgList = [
    'url("/image/129442526_p0.png")',
    'url("/image/88515515_p0.png")'
  ]
  const bg = bgList[Math.floor(Math.random() * bgList.length)]
  const hp = document.querySelector('.home-page')
  if (hp) hp.style.backgroundImage = bg

  // ── 2. 异步获取数据（不 await，不阻塞后续动画） ──
  const fetchPromise = fetchContents()

  // ── 3. 等待 Vue 渲染保底数据到 DOM ──
  await nextTick()

  // ── 4. ★ 立即播放入场动画（用保底数据），不等 API ──
  runContentAnimations()

  // ── 5. 打字机效果 ──
  const hasTyped = sessionStorage.getItem('jyoushitou_typed')
  if (!hasTyped) {
    // 首次访问：逐字打印
    for (let i = 0; i < fullText.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 80))
      typedText.value += fullText[i]
    }
    setTimeout(() => { showCursor.value = false }, 800)
    sessionStorage.setItem('jyoushitou_typed', 'true')
  } else {
    // 非首次：直接显示完整文字
    typedText.value = fullText
    showCursor.value = false
  }

  // ── 6. 等待数据加载完成（如果有新数据，Vue 自动响应式更新） ──
  await fetchPromise
})

/**
 * onBeforeUnmount — 组件卸载前清理
 * 断开 IntersectionObserver，防止内存泄漏
 */
onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
        <div class="home-page index-body">
    <div class="main-content" id="mainContent">

      <!-- ════════════════════════════════════════════════════
           顶部打字标题栏 "jyoushitou"
           - 固定定位，初始居中（大型楷体）
           - 点击"文章"跳转时添加 fly-corner 飞到左上角
           - 打字光标闪烁动画
           ════════════════════════════════════════════════════ -->
      <div class="top-typing-bar">
        <span class="typing-text">{{ typedText }}</span>
        <span v-if="showCursor" class="typing-cursor">|</span>
      </div>

      <!-- ── header: 用户登录/注册组件 ── -->
      <header class="header">
        <UserNav />
      </header>

      <!-- ── 主体内容：四个板块（文章/图片/视频/博客） ── -->
      <main>
        <template v-for="(sec, si) in sectionsData" :key="si">
          <!-- 板块标题（仅"文章"可点击，触发四散跳转动画） -->
          <h2
            class="first-title"
            :class="{ clickable: sec.title === '文章' }"
            @click="sec.title === '文章' && goToArticle($event)"
          >{{ sec.title }}</h2>

          <section class="section">
            <!-- 标签行循环 -->
            <template v-for="(row, ri) in sec.rows" :key="ri">
              <!-- 无图片的行不渲染 -->
              <div
                v-if="row.imgs && row.imgs.length > 0"
                class="h-backgrand"
                :class="{ clickable: sec.title === '文章' }"
                @click="sec.title === '文章' && goToArticle($event)"
              >
                <!-- 标签名 -->
                <div
                  class="second-title"
                  :class="{ clickable: sec.title === '文章' }"
                  @click.stop="sec.title === '文章' && goToArticle($event)"
                >{{ row.label }}</div>

                <!-- 图片行（水平滚动） -->
                <div class="content-col">
                  <div class="img-row">
                    <div
                      v-for="(img, bi) in row.imgs.slice(0, 10)"
                      :key="bi"
                      class="img-box"
                      :class="{ clickable: sec.title === '文章' }"
                      @click.stop="sec.title === '文章' && goToArticle($event)"
                    ><img :src="img" alt="" /></div>
                  </div>
                </div>
              </div>
            </template>
          </section>
        </template>
      </main>
        </div>
  </div>
</template>

<style>
/* ════════════════════════════════════════════════════════════
   首页容器：全屏深色背景覆盖，fixed 背景图
   ════════════════════════════════════════════════════════════ */
.home-page {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* ════════════════════════════════════════════════════════════
   Header — 右上角用户组件
   初始隐藏（opacity:0 + translateY），添加 pop-in class 后弹出
   ════════════════════════════════════════════════════════════ */
.index-body .header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
  margin-top: 20px;
  opacity: 0;
  transform: translateY(40px) scale(0.9);
  transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.index-body .header.pop-in { opacity: 1; transform: translateY(0) scale(1); }

/* ════════════════════════════════════════════════════════════
   板块标题 — 居中大字，带弹出动画
   clickable 类仅在"文章"板块生效（可点击跳转）
   ════════════════════════════════════════════════════════════ */
.first-title {
  text-align: center;
  padding: 28px 0 12px 0;
  font-size: 1.6rem;
  font-weight: normal;
  color: rgba(255,255,255,0.9);
  letter-spacing: 4px;
  opacity: 0;
  transform: translateY(30px) scale(0.85);
  transition: opacity 0.9s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.first-title.pop-in { opacity: 1; transform: translateY(0) scale(1); }
.first-title.clickable { cursor: pointer; transition: all 0.3s ease; }
.first-title.clickable:hover { text-shadow: 0 0 20px rgba(255,255,255,0.6); transform: scale(1.05); }

/* ── 可点击元素的 hover 反馈 ── */
.h-backgrand.clickable { cursor: pointer; transition: all 0.3s ease; }
.h-backgrand.clickable:hover { background: rgba(255,255,255,0.55); }
.second-title.clickable { cursor: pointer; transition: all 0.3s ease; }
.second-title.clickable:hover { text-shadow: 0 0 12px rgba(255,255,255,0.5); }
.img-box.clickable { cursor: pointer; transition: all 0.3s ease; }
.img-box.clickable:hover { transform: scale(1.08); box-shadow: 0 0 15px rgba(255,255,255,0.4); }

/* ════════════════════════════════════════════════════════════
   Section — 板块内容容器
   使用 flex column 排列各标签行
   ════════════════════════════════════════════════════════════ */
.section {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.section.pop-in { opacity: 1; transform: translateY(0); }

/* ════════════════════════════════════════════════════════════
   h-backgrand — 单个标签行
   - 半透明白色背景
   - 左右各拉宽 4cm（负 margin-left 实现视觉延展）
   - 支持三种动画状态：pop-in(入场) / scroll-in(进入视口) / scroll-out(离开视口)
   ════════════════════════════════════════════════════════════ */
.h-backgrand {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 6px;
  background: rgba(255,255,255,0.45);
  border-radius: 6px;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.9s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* 左右各拉宽 4cm */
  width: calc(100% + 4cm + 4cm);
  margin-left: -4cm;
  padding: 4px 4cm 4px 0;
}
.h-backgrand.pop-in { opacity: 1; transform: translateY(0); }
.h-backgrand.scroll-in {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.h-backgrand.scroll-out {
  opacity: 0;
  transform: translateY(-15px) scale(0.5);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

/* ════════════════════════════════════════════════════════════
   标签行内元素
   second-title（标签名） + content-col（图片容器）
   ════════════════════════════════════════════════════════════ */
.second-title {
  min-width: 60px;
  padding: 8px 12px;
  font-size: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.95);
  white-space: nowrap;
}
.content-col {
  flex: 1;
  padding: 4px 8px;
  font-size: 1rem;
  min-width: 0;
}

/* ════════════════════════════════════════════════════════════
   img-row — 图片水平滚动行
   img-box — 16:10 缩略图卡片，带弹出动画
   ════════════════════════════════════════════════════════════ */
.img-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 0;
  width: 100%;
}
.img-row::-webkit-scrollbar { height: 3px; }
.img-row::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 2px; }
.img-box {
  min-width: 100px;
  width: 110px;
  aspect-ratio: 16 / 10;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255,255,255,0.3);
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px) scale(0.95);
  transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-box.pop-in { opacity: 1; transform: translateY(0) scale(1); }

/* ════════════════════════════════════════════════════════════
   顶部打字标题栏 "jyoushitou"
   - 固定定位，初始居中（大型楷体，3rem）
   - fly-corner：点击文章跳转时飞到左上角（1.1rem）
   - 光标闪烁动画
   ════════════════════════════════════════════════════════════ */
.top-typing-bar {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3rem;
  font-weight: 900;
  font-family: "KaiTi", "STKaiti", serif;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  letter-spacing: 6px;
  text-align: center;
  z-index: 100;
  transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
}
.top-typing-bar.fly-corner {
  top: 10px;
  left: 16px;
  transform: translateX(0);
  font-size: 1.1rem;
  letter-spacing: 3px;
  text-align: left;
  pointer-events: none;
}
.typing-cursor {
  color: rgba(255,255,255,0.8);
  font-weight: 100;
  animation: blink 0.7s step-end infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
.main-content { display: block; }

/* ════════════════════════════════════════════════════════════
   响应式 (max-width: 767px)
   缩小字号、间距、图片尺寸
   ════════════════════════════════════════════════════════════ */
@media (max-width: 767px) {
  .index-body { padding: 10px; }
  .index-body .auth-buttons .auth-btn { padding: 6px 22px; font-size: 0.95rem; }
  .first-title { font-size: 1.3rem; padding: 20px 0 8px 0; }
  .second-title { min-width: 40px; font-size: 0.9rem; padding: 6px 8px; }
  .content-col { font-size: 0.9rem; }
  .img-box { min-width: 72px; width: 80px; }
}
</style>