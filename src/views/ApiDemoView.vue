/**
 * ============================================================
 *  ApiDemoView.vue — API 接口演示 / 测试页面
 * ============================================================
 *
 * 【功能】
 *   以标签页（Tab）形式切换并测试后端的五个 RESTful 接口：
 *   ┌─────────────┬─────────────────┬──────────────────────────┐
 *   │ 标签         │ 接口             │ 说明                     │
 *   ├─────────────┼─────────────────┼──────────────────────────┤
 *   │ 🔐 登录     │ POST /api/login │ 用户名 + 密码鉴权        │
 *   │ 👋 问候     │ GET  /api/hello │ 获取欢迎消息 & PID       │
 *   │ 📤 提交数据 │ POST /api/data  │ 提交 name/age/email      │
 *   │ ✏️ 更新     │ PUT  /api/update│ 更新指定 ID 的记录       │
 *   │ 🗑️ 删除     │ DELETE /api/del │ 删除指定 ID 的记录       │
 *   └─────────────┴─────────────────┴──────────────────────────┘
 *
 * 【交互】
 *   - 每个标签页显示对应接口的表单或按钮
 *   - 发送请求后，响应结果在底部统一展示（JSON 格式化）
 *   - 登录成功后展示用户信息卡片，可退出登录
 *   - 加载状态禁用按钮，显示"请求中..."
 *
 * 【状态管理】
 *   所有 API 调用通过 apiStore（Pinia）分发，响应数据统一管理。
 * ============================================================
 */

<script setup>
import { useApiStore } from '@/stores/api'
import { ref } from 'vue'

// ── 全局 API 状态管理 ──
const apiStore = useApiStore()

// ════════════════════════════════════════════════════════════
//  表单数据
// ════════════════════════════════════════════════════════════
const postForm = ref({ name: '', age: '', email: '' })    // POST /api/data 表单
const loginForm = ref({ name: '', password: '' })          // POST /api/login 表单
const putForm = ref({ id: '', name: '' })                  // PUT /api/update 表单
const deleteForm = ref({ id: '' })                         // DELETE /api/delete 表单

// ════════════════════════════════════════════════════════════
//  标签页状态
// ════════════════════════════════════════════════════════════
const responseData = ref(null)   // 最近一次 API 调用的 JSON 响应
const activeTab = ref('hello')   // 当前选中的标签页 ID

// ── 标签页定义 ──
const tabs = [
  { id: 'login',  label: 'POST /api/login',  icon: '🔐' },
  { id: 'hello',  label: 'GET /api/hello',   icon: '👋' },
  { id: 'post',   label: 'POST /api/data',   icon: '📤' },
  { id: 'put',    label: 'PUT /api/update',  icon: '✏️' },
  { id: 'delete', label: 'DELETE /api/delete', icon: '🗑️' }
]

// ════════════════════════════════════════════════════════════
//  API 测试方法
//  每个方法：设置 activeTab → 调用 apiStore 方法 → 响应存入 responseData
//  失败时将错误信息展示在响应框中
// ════════════════════════════════════════════════════════════

/** GET /api/hello — 问候接口 */
async function testHello() {
  activeTab.value = 'hello'
  try {
    const data = await apiStore.hello()
    responseData.value = data
  } catch (err) {
    responseData.value = { error: err.message }
  }
}

/** POST /api/login — 登录鉴权接口 */
async function testLogin() {
  activeTab.value = 'login'
  try {
    const data = await apiStore.login({
      name: loginForm.value.name,
      password: loginForm.value.password
    })
    responseData.value = data
  } catch (err) {
    responseData.value = { error: err.response?.data?.message || err.message }
  }
}

/** 退出登录，清空表单 */
async function handleLogout() {
  await apiStore.logout()
  loginForm.value.name = ''
  loginForm.value.password = ''
  responseData.value = { message: '已退出登录' }
}

/** POST /api/data — 提交数据接口 */
async function testPost() {
  activeTab.value = 'post'
  try {
    const data = await apiStore.postData({
      name: postForm.value.name,
      age: postForm.value.age ? parseInt(postForm.value.age) : 0,
      email: postForm.value.email
    })
    responseData.value = data
  } catch (err) {
    responseData.value = { error: err.message }
  }
}

/** PUT /api/update — 更新数据接口 */
async function testPut() {
  activeTab.value = 'put'
  try {
    const data = await apiStore.updateData({
      id: putForm.value.id ? parseInt(putForm.value.id) : 0,
      name: putForm.value.name
    })
    responseData.value = data
  } catch (err) {
    responseData.value = { error: err.message }
  }
}

/** DELETE /api/delete — 删除数据接口 */
async function testDelete() {
  activeTab.value = 'delete'
  try {
    const id = deleteForm.value.id ? parseInt(deleteForm.value.id) : 0
    const data = await apiStore.deleteData(id)
    responseData.value = data
  } catch (err) {
    responseData.value = { error: err.message }
  }
}
</script>

<template>
  <div class="api-demo">
    <h2>API 演示</h2>
    <p class="page-description">测试后端提供的各种 API 接口</p>

    <div class="api-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <div class="api-content">
      <!-- GET /api/hello -->
      <div v-if="activeTab === 'hello'" class="api-section">
        <h3>👋 问候接口</h3>
        <p class="api-description">向服务器发送 GET 请求，获取欢迎消息和工作进程 PID</p>
        <button class="btn btn-primary" @click="testHello" :disabled="apiStore.loading">
          {{ apiStore.loading ? '请求中...' : '发送 GET 请求' }}
        </button>
      </div>

      <!-- POST /api/login -->
      <div v-if="activeTab === 'login'" class="api-section">
        <h3>🔐 登录鉴权接口</h3>
        <p class="api-description">提交用户名和密码，后端调用 MySQL::User() 验证身份</p>

        <!-- 已登录状态 -->
        <div v-if="apiStore.isLoggedIn" class="user-info">
          <div class="user-card">
            <span class="user-icon">👤</span>
            <div class="user-details">
              <p class="user-name">{{ apiStore.user.name }}</p>
              <p class="user-meta">ID: {{ apiStore.user.user_id }} | 权限: {{ apiStore.user.level === 2 ? '管理员' : apiStore.user.level === 1 ? '普通用户' : '未知' }}</p>
            </div>
            <button class="btn btn-danger" @click="handleLogout">退出登录</button>
          </div>
        </div>

        <!-- 未登录状态 -->
        <div v-if="!apiStore.isLoggedIn">
          <div class="input-group">
            <label for="login-name">用户名：</label>
            <input id="login-name" v-model="loginForm.name" type="text" placeholder="请输入用户名" class="input-field" />
          </div>
          <div class="input-group">
            <label for="login-password">密码：</label>
            <input id="login-password" v-model="loginForm.password" type="password" placeholder="请输入密码" class="input-field" />
          </div>
          <button class="btn btn-primary" @click="testLogin" :disabled="apiStore.loading">
            {{ apiStore.loading ? '登录中...' : '发送登录请求' }}
          </button>
        </div>
      </div>

      <!-- POST /api/data -->
      <div v-if="activeTab === 'post'" class="api-section">
        <h3>📤 POST 数据接口</h3>
        <p class="api-description">向服务器提交 name、age、email 数据（由子进程处理）</p>
        <div class="input-group">
          <label for="post-name">姓名：</label>
          <input id="post-name" v-model="postForm.name" type="text" placeholder="张三" class="input-field" />
        </div>
        <div class="input-group">
          <label for="post-age">年龄：</label>
          <input id="post-age" v-model="postForm.age" type="number" placeholder="25" class="input-field" />
        </div>
        <div class="input-group">
          <label for="post-email">邮箱：</label>
          <input id="post-email" v-model="postForm.email" type="email" placeholder="zhangsan@example.com" class="input-field" />
        </div>
        <button class="btn btn-primary" @click="testPost" :disabled="apiStore.loading">
          {{ apiStore.loading ? '发送中...' : '发送 POST 请求' }}
        </button>
      </div>

      <!-- PUT /api/update -->
      <div v-if="activeTab === 'put'" class="api-section">
        <h3>✏️ PUT 更新接口</h3>
        <p class="api-description">向服务器发送更新请求，提交要更新的 ID 和新名称</p>
        <div class="input-group">
          <label for="put-id">要更新的 ID：</label>
          <input id="put-id" v-model="putForm.id" type="number" placeholder="1" class="input-field" />
        </div>
        <div class="input-group">
          <label for="put-name">新名称：</label>
          <input id="put-name" v-model="putForm.name" type="text" placeholder="新名称" class="input-field" />
        </div>
        <button class="btn btn-primary" @click="testPut" :disabled="apiStore.loading">
          {{ apiStore.loading ? '发送中...' : '发送 PUT 请求' }}
        </button>
      </div>

      <!-- DELETE /api/delete -->
      <div v-if="activeTab === 'delete'" class="api-section">
        <h3>🗑️ DELETE 删除接口</h3>
        <p class="api-description">向服务器发送删除请求，指定要删除的记录 ID</p>
        <div class="input-group">
          <label for="delete-id">要删除的 ID：</label>
          <input id="delete-id" v-model="deleteForm.id" type="number" placeholder="1" class="input-field" />
        </div>
        <button class="btn btn-danger" @click="testDelete" :disabled="apiStore.loading">
          {{ apiStore.loading ? '发送中...' : '发送 DELETE 请求' }}
        </button>
      </div>

      <!-- 响应结果 -->
      <div v-if="responseData" class="response-section">
        <h4>📦 响应结果：</h4>
        <div class="response-box">
          <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="apiStore.error" class="error-message">
        <p>❌ 错误：{{ apiStore.error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ════════════════════════════════════════════════════════════
   页面入场淡入动画
   ════════════════════════════════════════════════════════════ */
.api-demo {
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ════════════════════════════════════════════════════════════
   页面标题 & 描述
   ════════════════════════════════════════════════════════════ */
h2 {
  color: #e0e0ff;
  font-size: 2rem;
  margin-bottom: 8px;
}
.page-description {
  color: #b0b0d0;
  margin-bottom: 32px;
}

/* ════════════════════════════════════════════════════════════
   标签页导航栏
   ════════════════════════════════════════════════════════════ */
.api-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}
.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
.tab-icon {
  font-size: 1.1rem;
}

/* ════════════════════════════════════════════════════════════
   内容区（白色卡片）
   ════════════════════════════════════════════════════════════ */
.api-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

/* ════════════════════════════════════════════════════════════
   每个 API 标签页内容
   ════════════════════════════════════════════════════════════ */
.api-section {
  margin-bottom: 24px;
}
.api-section h3 {
  color: #1a1a2e;
  margin-bottom: 8px;
}
.api-description {
  color: #666;
  margin-bottom: 16px;
}

/* ════════════════════════════════════════════════════════════
   按钮通用样式
   ════════════════════════════════════════════════════════════ */
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}
.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}
.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
}

/* ════════════════════════════════════════════════════════════
   表单输入
   ════════════════════════════════════════════════════════════ */
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #444;
  font-weight: 500;
}
.input-field {
  width: 100%;
  max-width: 400px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}
.input-field:focus {
  outline: none;
  border-color: #667eea;
}

/* ════════════════════════════════════════════════════════════
   响应结果展示（深色代码框）
   ════════════════════════════════════════════════════════════ */
.response-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}
.response-section h4 {
  color: #1a1a2e;
  margin-bottom: 12px;
}
.response-box {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}
.response-box pre {
  color: #4ade80;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ════════════════════════════════════════════════════════════
   错误提示
   ════════════════════════════════════════════════════════════ */
.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

/* ════════════════════════════════════════════════════════════
   已登录用户信息卡片
   ════════════════════════════════════════════════════════════ */
.user-info {
  margin-bottom: 20px;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
}
.user-icon {
  font-size: 2.5rem;
}
.user-details {
  flex: 1;
}
.user-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #166534;
  margin: 0;
}
.user-meta {
  font-size: 0.85rem;
  color: #15803d;
  margin: 4px 0 0 0;
}
</style>