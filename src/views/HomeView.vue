/**
 * HomeView.vue — 首页
 * 
 * 展示四个板块（文章/图片/视频/博客），每个板块包含三个标签和若干图片。
 * 页面加载时显示开屏动画，内容逐渐弹出，并且支持滚动时的入场/退场动画。
 * 登录/注册弹窗集成在首页中。
 */

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserNav from '@/components/UserNav.vue'

const router = useRouter()

function goToArticle(event) {
  // 点击"文章"时，所有内容元素从点击位置四散淡出，"jyoushitou" 移到左上角
  const clickX = event ? event.clientX : window.innerWidth / 2
  const clickY = event ? event.clientY : window.innerHeight / 2

  // 给每个内容元素计算相对于点击位置的偏移，四散淡出
  document.querySelectorAll('.header, .first-title, .section, .h-backgrand, .img-box, .second-title').forEach(el => {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = cx - clickX
    const dy = cy - clickY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    const drift = Math.min(dist * 0.15 + 30, 200)
    const tx = Math.cos(angle) * drift
    const ty = Math.sin(angle) * drift
    el.style.transition = 'all 0.7s cubic-bezier(0.5, 0, 0.75, 0)'
    el.style.opacity = '0'
    el.style.transform = `translate(${tx}px, ${ty}px) scale(0.7)`
  })

  // "jyoushitou" 飞到左上角
  const typingBar = document.querySelector('.top-typing-bar')
  if (typingBar) {
    typingBar.classList.add('fly-corner')
  }
  setTimeout(() => router.push('/article'), 900)
}

// ✨ 顶部打字动画状态
const typedText = ref('')
const showCursor = ref(true)
const fullText = 'jyoushitou'
// ─── 页面数据（
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
  // 无论 API 成功还是失败，都触发动画
  sectionsData.value = [...sectionsData.value]
}

let observer = null

function runContentAnimations() {
  const allBgs = document.querySelectorAll('.h-backgrand')
  if (allBgs.length === 0) return

    // 主内容默认已显示，开始弹出内容动画
  const header = document.querySelector('.header')
  const firstTitles = document.querySelectorAll('.first-title')
  const sectionEls = document.querySelectorAll('.section')

  // 弹出 header（登录/注册）
  if (header) {
    setTimeout(() => header.classList.add('pop-in'), 50)
  }
  // 依次弹出板块标题
  for (let ti = 0; ti < firstTitles.length; ti++) {
    setTimeout(() => {
      firstTitles[ti].classList.add('pop-in')
      if (sectionEls[ti]) sectionEls[ti].classList.add('pop-in')
    }, 200 + ti * 150)
  }

  let maxRows = 0
  for (let si = 0; si < sectionEls.length; si++) {
    const rc = sectionEls[si].querySelectorAll('.h-backgrand').length
    if (rc > maxRows) maxRows = rc
  }

  let delay = 500
  for (let rj = 0; rj < maxRows; rj++) {
    const rowIdx = rj
    setTimeout(() => {
      for (let siA = 0; siA < sectionEls.length; siA++) {
        const bgsA = sectionEls[siA].querySelectorAll('.h-backgrand')
        if (bgsA[rowIdx]) bgsA[rowIdx].classList.add('pop-in')
      }
    }, delay)

    let maxImg = 0
    for (let si2 = 0; si2 < sectionEls.length; si2++) {
      const bgs2 = sectionEls[si2].querySelectorAll('.h-backgrand')
      if (bgs2[rowIdx]) {
        const ic = bgs2[rowIdx].querySelectorAll('.img-box').length
        if (ic > maxImg) maxImg = ic
      }
    }
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

  setTimeout(() => {
    startObserver(allBgs)
  }, delay + 400)
}

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

// 监听 sectionsData 变化（API 数据回来后触发动画）
let splashDone = false
watch(sectionsData, async (val) => {
  if (val && val.length > 0 && !splashDone) {
    splashDone = true
    await nextTick()
    runContentAnimations()
  }
})

onMounted(async () => {
  // 先统一加载背景（首页始终使用同一张背景图）
  const bgList = [
    'url("/image/129442526_p0.png")',
    'url("/image/88515515_p0.png")'
  ]
  const bg = bgList[Math.floor(Math.random() * bgList.length)]
  const hp = document.querySelector('.home-page')
  if (hp) hp.style.backgroundImage = bg

  // 先获取数据，数据就绪后 watch 会触发内容渐入动画
  await fetchContents()
  await nextTick()

  // 如果是从其他页面跳转回来的，"jyoushitou" 应该已经在居中位置
  // 只有首次加载时才打字
  const hasTyped = sessionStorage.getItem('jyoushitou_typed')
  if (!hasTyped) {
    for (let i = 0; i < fullText.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 120))
      typedText.value += fullText[i]
    }
    setTimeout(() => { showCursor.value = false }, 1200)
    sessionStorage.setItem('jyoushitou_typed', 'true')
  } else {
    // 非首次加载，直接显示完整文字
    typedText.value = fullText
    showCursor.value = false
  }
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
    <div class="home-page index-body">
    <!-- 主内容区 -->
    <div class="main-content" id="mainContent">
                  <!-- 顶部打字标题栏 -->
                  <div class="top-typing-bar">
                    <span class="typing-text">{{ typedText }}</span>
                    <span v-if="showCursor" class="typing-cursor">|</span>
                  </div>

                  <header class="header">
        <UserNav />
      </header>

      <main>
        <template v-for="(sec, si) in sectionsData" :key="si">
                    <h2 class="first-title" :class="{ clickable: sec.title === '文章' }" @click="sec.title === '文章' && goToArticle($event)">{{ sec.title }}</h2>
          <section class="section">
                        <template v-for="(row, ri) in sec.rows" :key="ri">
                          <div v-if="row.imgs && row.imgs.length > 0" class="h-backgrand" :class="{ clickable: sec.title === '文章' }" @click="sec.title === '文章' && goToArticle($event)">
                            <div class="second-title" :class="{ clickable: sec.title === '文章' }" @click.stop="sec.title === '文章' && goToArticle($event)">{{ row.label }}</div>
                            <div class="content-col">
                              <div class="img-row">
                                <div v-for="(img, bi) in row.imgs.slice(0, 10)" :key="bi" class="img-box" :class="{ clickable: sec.title === '文章' }" @click.stop="sec.title === '文章' && goToArticle($event)"><img :src="img" alt="" /></div>
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
/* home-page 背景 */
.home-page {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* header */
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
.h-backgrand.clickable { cursor: pointer; transition: all 0.3s ease; }
.h-backgrand.clickable:hover { background: rgba(255,255,255,0.55); }
.second-title.clickable { cursor: pointer; transition: all 0.3s ease; }
.second-title.clickable:hover { text-shadow: 0 0 12px rgba(255,255,255,0.5); }
.img-box.clickable { cursor: pointer; transition: all 0.3s ease; }
.img-box.clickable:hover { transform: scale(1.08); box-shadow: 0 0 15px rgba(255,255,255,0.4); }

/* section */
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

/* h-backgrand */
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

/* second-title */
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

/* img-row */
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

/* 顶部打字标题栏 — 固定定位，初始居中，跳转时移到左上角 */
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

/* 响应式 */
@media (max-width: 767px) {
  .index-body { padding: 10px; }
  .index-body .auth-buttons .auth-btn { padding: 6px 22px; font-size: 0.95rem; }
  .first-title { font-size: 1.3rem; padding: 20px 0 8px 0; }
  .second-title { min-width: 40px; font-size: 0.9rem; padding: 6px 8px; }
  .content-col { font-size: 0.9rem; }
  .img-box { min-width: 72px; width: 80px; }
}
</style>