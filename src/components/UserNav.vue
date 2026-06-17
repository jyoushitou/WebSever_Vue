/**
 * ============================================================
 *  UserNav.vue — 用户导航组件（登录 / 注册 / 用户信息）
 * ============================================================
 *
 * 【功能】
 *   提供统一用户认证 UI，所有页面只需引入此组件即可：
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  未登录:  [登 录]  [注 册]                              │
 *   │  已登录:  [头像 A]  nickname  [退出]                    │
 *   └─────────────────────────────────────────────────────────┘
 *
 * 【用法】
 *   import UserNav from '@/components/UserNav.vue'
 *   <UserNav />
 *
 * 【弹窗结构（Teleport 到 body）】
 *   .usernav-overlay (fixed 遮罩)
 *     └── .usernav-modal (居中模态框)
 *           ├── h2 ("登 录" / "注 册")
 *           ├── input#authUser     (用户名)
 *           ├── input#authPass     (密码)
 *           ├── input#authPass2    (确认密码，仅注册时显示)
 *           ├── .usernav-error     (错误提示)
 *           ├── button 提交
 *           └── .usernav-toggle    (切换登录/注册模式)
 *
 * 【交互逻辑】
 *   - 点击"登录"/"注册"按钮 → 打开弹窗
 *   - 点击遮罩层或 ✕ → 关闭弹窗
 *   - 提交时检查表单完整性 + 密码一致性（注册时）
 *   - 注册成功 → 自动切换到登录模式
 *   - 登录成功 → 关闭弹窗，显示用户信息
 *   - 已登录 → 显示头像/昵称/退出按钮
 *
 * 【依赖】
 *   apiStore.login()   — Pinia 登录方法
 *   apiStore.logout()  — Pinia 退出方法
 *   apiStore.user      — 当前用户信息
 *   apiStore.isLoggedIn— 登录状态
 * ============================================================
 */

<script setup>
import { ref } from 'vue'
import { useApiStore } from '@/stores/api'

// ── 获取全局 API 状态管理实例 ──
const apiStore = useApiStore()

// ════════════════════════════════════════════════════════════
//  弹窗响应式状态
// ════════════════════════════════════════════════════════════
const isLogin = ref(true)           // true=登录模式, false=注册模式
const showAuth = ref(false)         // 是否显示弹窗
const authTitle = ref('登 录')       // 弹窗标题
const authSubmitText = ref('登 录')  // 提交按钮文字
const toggleText = ref('还没有账号？<span>立即注册</span>') // 切换模式链接（含 HTML）
const showPass2 = ref(false)        // 是否显示"确认密码"输入框
const authError = ref('')           // 表单错误提示文字
const authLoading = ref(false)      // 提交中（禁用按钮）

/**
 * openAuth(mode) — 打开登录/注册弹窗
 *
 * @param {'login'|'register'} mode - 弹窗模式
 *
 * 根据 mode 切换标题、提交按钮文字、切换链接文字，
 * 注册模式显示"确认密码"输入框，然后显示弹窗。
 */
function openAuth(mode) {
  authError.value = ''                     // 清除上次错误
  isLogin.value = mode === 'login'
  authTitle.value = isLogin.value ? '登 录' : '注 册'
  authSubmitText.value = isLogin.value ? '登 录' : '注 册'
  toggleText.value = isLogin.value
    ? '还没有账号？<span>立即注册</span>'
    : '已有账号？<span>去登录</span>'
  showPass2.value = !isLogin.value          // 注册时显示确认密码
  showAuth.value = true
}

/**
 * closeAuth() — 关闭登录/注册弹窗
 */
function closeAuth() {
  showAuth.value = false
}

/**
 * toggleAuthMode() — 切换登录/注册模式
 * 用于底部"还没有账号？立即注册" / "已有账号？去登录" 点击事件
 */
function toggleAuthMode() {
  openAuth(isLogin.value ? 'register' : 'login')
}

/**
 * handleOverlayClick(e) — 点击遮罩层关闭弹窗
 * 只有点击遮罩层（overlay）本身时关闭，点击模态框内部不关闭
 */
function handleOverlayClick(e) {
  if (e.target === e.currentTarget) closeAuth()
}

/**
 * handleSubmit() — 提交登录/注册表单
 *
 * 【流程】
 *   1. 从 DOM 读取用户名和密码
 *   2. 基本校验（非空）
 *   3. 注册模式 → 校验密码一致性 → POST /api/register → 切到登录
 *   4. 登录模式 → apiStore.login() → 成功关闭弹窗，失败显示错误
 *
 * 【注意】
 *   使用 document.getElementById 而非 v-model 绑定，
 *   是因为 input 在 Teleport 到 body 的弹窗中，v-model 绑定稍复杂。
 */
async function handleSubmit() {
  const user = document.getElementById('authUser').value
  const pass = document.getElementById('authPass').value

  // ── 基本校验 ──
  if (!user || !pass) {
    authError.value = '请填写完整信息'
    return
  }

  authLoading.value = true
  authError.value = ''

  if (!isLogin.value) {
    // ════════════════════════════════════════════════
    //  注册模式
    // ════════════════════════════════════════════════
    const pass2 = document.getElementById('authPass2').value
    if (pass !== pass2) {
      authError.value = '两次密码不一致'
      authLoading.value = false
      return
    }
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user, password: pass })
      })
      const data = await response.json()
      if (data.status === 'success') {
        alert('注册成功！请登录')
        openAuth('login')     // 注册成功 → 切换到登录模式
      } else {
        authError.value = data.message || '注册失败'
      }
    } catch {
      authError.value = '注册失败：后端未开放注册接口，请直接登录'
    }
  } else {
    // ════════════════════════════════════════════════
    //  登录模式
    // ════════════════════════════════════════════════
    try {
      const data = await apiStore.login({ name: user, password: pass })
      if (data.status === 'success') {
        closeAuth()           // 登录成功 → 关闭弹窗
      } else {
        authError.value = data.message || '登录失败'
      }
    } catch {
      authError.value = apiStore.error || '登录失败，请检查用户名和密码'
    }
  }
  authLoading.value = false
}
</script>

<template>
  <!-- ════════════════════════════════════════════════════════
       未登录状态：显示登录 + 注册按钮
       ════════════════════════════════════════════════════════ -->
  <div v-if="!apiStore.isLoggedIn" class="usernav-buttons">
    <button class="usernav-btn" @click="openAuth('login')">登 录</button>
    <button class="usernav-btn" @click="openAuth('register')">注 册</button>
  </div>

  <!-- ════════════════════════════════════════════════════════
       已登录状态：显示头像 + 用户名 + 退出按钮
       有 avatar 时显示图片，否则显示名字首字母圆形头像
       ════════════════════════════════════════════════════════ -->
  <div v-else class="usernav-user">
    <img v-if="apiStore.user.avatar" :src="apiStore.user.avatar" class="usernav-avatar-img" alt="头像" />
    <div v-else class="usernav-avatar">{{ apiStore.user.name.charAt(0).toUpperCase() }}</div>
    <span class="usernav-nickname">{{ apiStore.user.name }}</span>
    <button class="usernav-logout-btn" @click="apiStore.logout()">退出</button>
  </div>

  <!-- ════════════════════════════════════════════════════════
       登录/注册弹窗
       使用 Teleport 渲染到 <body> 下，避免父容器 transform
       或 overflow 影响 fixed 定位。
       ════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <!-- 遮罩层：点击外部关闭 -->
    <div class="usernav-overlay" :class="{ show: showAuth }" @click="handleOverlayClick">
      <!-- 模态框 -->
      <div class="usernav-modal">
        <!-- 关闭按钮 -->
        <button class="usernav-close-btn" @click="closeAuth">✕</button>
        <!-- 标题 -->
        <h2>{{ authTitle }}</h2>
        <!-- 表单：用户名 -->
        <input type="text" id="authUser" placeholder="用户名" />
        <!-- 表单：密码 -->
        <input type="password" id="authPass" placeholder="密码" />
        <!-- 表单：确认密码（注册模式时显示） -->
        <input type="password" id="authPass2" placeholder="确认密码" :style="{ display: showPass2 ? 'block' : 'none' }" />
        <!-- 错误提示 -->
        <div v-if="authError" class="usernav-error">{{ authError }}</div>
        <!-- 提交按钮 -->
        <button class="usernav-submit-btn" @click="handleSubmit" :disabled="authLoading">
          {{ authLoading ? '处理中...' : authSubmitText }}
        </button>
        <!-- 切换登录/注册 -->
        <div class="usernav-toggle" @click="toggleAuthMode" v-html="toggleText"></div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* ════════════════════════════════════════════════════════════
   未登录状态 — 登录 / 注册按钮
   半透明毛玻璃效果，hover 时增强透明度
   ════════════════════════════════════════════════════════════ */
.usernav-buttons {
  display: flex;
  gap: 14px;
}
.usernav-btn {
  padding: 8px 30px;
  font-size: 1rem;
  border: 1px solid rgba(255,255,255,0.45);
  border-radius: 8px;
  background: rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.95);
  cursor: pointer;
  transition: all 0.25s;
  letter-spacing: 2px;
}
.usernav-btn:hover {
  background: rgba(255,255,255,0.5);
}

/* ════════════════════════════════════════════════════════════
   已登录状态 — 用户信息栏
   头像圆形裁剪（有图用 img，无图用首字母渐变圆），
   昵称加粗，退出按钮 hover 变红色
   ════════════════════════════════════════════════════════════ */
.usernav-user {
  display: flex;
  align-items: center;
  gap: 10px;
}
.usernav-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  border: 2px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  flex-shrink: 0;
}
.usernav-avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  flex-shrink: 0;
}
.usernav-nickname {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.95);
  letter-spacing: 1px;
  white-space: nowrap;
}
.usernav-logout-btn {
  padding: 5px 16px;
  font-size: 0.85rem;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.95);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.usernav-logout-btn:hover {
  background: rgba(239, 68, 68, 0.45);
}

/* ════════════════════════════════════════════════════════════
   弹窗样式（遮罩层 + 模态框）
   遮罩层 fixed 全屏覆盖，深色半透明背景；
   模态框居中，白底黑边圆角，黑色主题按钮
   ════════════════════════════════════════════════════════════ */
.usernav-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
  z-index: 1001;
}
.usernav-overlay.show {
  display: block;
}

.usernav-modal {
  background: #fff;
  border: 2px solid #000;
  border-radius: 16px;
  padding: 40px 50px;
  position: absolute;
  min-width: 320px;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.usernav-modal .usernav-close-btn {
  position: absolute;
  top: 12px; right: 16px;
  border: none; background: none;
  font-size: 24px; cursor: pointer;
  color: #999;
}
.usernav-modal .usernav-close-btn:hover { color: #000; }
.usernav-modal h2 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: #000;
}
.usernav-modal input {
  display: block; width: 100%;
  padding: 10px 14px; margin: 12px 0;
  border: 2px solid #000; border-radius: 8px;
  font-size: 1rem; outline: none;
}
.usernav-modal input:focus { border-color: #666; }
.usernav-modal .usernav-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  margin: 8px 0;
  text-align: center;
}
.usernav-modal .usernav-submit-btn {
  width: 100%; padding: 10px; margin-top: 10px;
  border: 2px solid #000; border-radius: 8px;
  background: #000; color: #fff;
  font-size: 1.1rem; cursor: pointer;
  transition: background 0.2s;
}
.usernav-modal .usernav-submit-btn:hover { background: #333; }
.usernav-modal .usernav-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.usernav-modal .usernav-toggle {
  margin-top: 14px;
  font-size: 0.95rem;
  color: #666;
  cursor: pointer;
}
.usernav-modal .usernav-toggle span {
  color: #0066cc;
  text-decoration: underline;
}

/* ═══════════════════════════════════════════
   响应式
   ═══════════════════════════════════════════ */
@media (max-width: 768px) {
  .usernav-btn {
    padding: 6px 18px;
    font-size: 0.9rem;
  }
  .usernav-modal {
    min-width: 280px;
    padding: 30px 24px;
    margin: 0 10px;
  }
}
</style>