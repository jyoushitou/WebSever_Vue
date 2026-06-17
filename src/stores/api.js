/**
 * ============================================================
 *  stores/api.js — API 请求封装 & 全局状态管理 (Pinia)
 * ============================================================
 *
 * 【架构说明】
 *   整个前端与后端的 HTTP 通信集中于此 store，组件通过调用
 *   apiStore 的方法发起请求并获取响应数据。
 *
 * ┌──────────────┐    axios 实例     ┌──────────────┐
 * │  组件/视图    │ ──────────────→  │  apiStore    │
 * │  (业务逻辑)   │ ←────────────── │  (Pinia)     │
 * └──────────────┘   响应数据        └──────┬───────┘
 *                                          │ axios 拦截器
 *                                          ↓
 *                                    ┌──────────────┐
 *                                    │  C++ 后端     │
 *                                    │  /api/*       │
 *                                    └──────────────┘
 *
 * 【核心功能】
 *   1. axios 实例配置 —— 基础 URL (/api)、超时 5s、JSON 请求头
 *   2. 请求拦截器 —— 自动从 localStorage 读取 token，注入 Authorization
 *   3. 登录状态管理 —— token + user 持久化到 localStorage，刷新不丢失
 *   4. 五个 API 方法 —— hello / postData / updateData / deleteData / login
 *   5. 统一的 loading / error 状态 —— 组件可绑定按钮禁用、错误提示
 *
 * 【状态字段】
 *   helloMessage  - GET /api/hello 返回的问候消息
 *   serverTime    - 服务器时间（从 hello 接口的 path 字段获取）
 *   lastPostData  - 最近一次 POST 的响应
 *   lastUpdateData- 最近一次 PUT 的响应
 *   lastDeleteData- 最近一次 DELETE 的响应
 *   loading       - 布尔值，正在请求时 true
 *   error         - 错误信息字符串
 *   user          - 当前登录用户对象 { user_id, level, name, avatar }
 *   isLoggedIn    - 是否已登录
 * ============================================================
 */

import { defineStore } from 'pinia'
import axios from 'axios'

// ════════════════════════════════════════════════════════════
//  创建 axios 实例
//   - baseURL: '/api'  —— 所有请求自动拼接 /api 前缀
//   - timeout: 5000ms  —— 超时自动抛出错误
//   - headers: JSON 格式请求体
// ════════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ════════════════════════════════════════════════════════════
//  axios 请求拦截器
//  作用：每次 HTTP 请求发出前自动执行
//  逻辑：从 localStorage 读取登录 token → 添加到 Authorization 头部
//  格式：Authorization: Bearer <token>
//  注意：拦截器对所有 /api/* 请求生效，因为 api 实例的 baseURL 是 /api
// ════════════════════════════════════════════════════════════
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ════════════════════════════════════════════════════════════
//  useApiStore — Pinia Store 定义
//  名称: 'api' — 全局唯一，可在任何组件中用 useApiStore() 调用
// ════════════════════════════════════════════════════════════
export const useApiStore = defineStore('api', {
  // ──────────────────────────────────────────────────────────
  //  state — 响应式状态定义
  //  所有字段均为响应式，组件中直接绑定或 watch
  // ──────────────────────────────────────────────────────────
  state: () => ({
    helloMessage: '',     // GET /api/hello 返回的问候语文本
    serverTime: '',       // 从 hello 接口 path 字段提取的服务器时间
    lastPostData: null,   // POST /api/data 最近一次响应数据
    lastUpdateData: null, // PUT /api/update 最近一次响应数据
    lastDeleteData: null, // DELETE /api/delete/:id 最近一次响应数据
    loading: false,       // 请求进行中 → true（组件可绑定按钮 disabled）
    error: null,          // 请求失败的错误信息（字符串或 null）
    user: null,           // 当前登录用户: { user_id, level, name, avatar }
    isLoggedIn: false     // 是否已登录（布尔值）
  }),

  // ──────────────────────────────────────────────────────────
  //  actions — 操作 / 方法
  //  包含所有 API 调用逻辑，遵循 try/catch/finally 模式：
  //    try      → 请求成功，更新状态
  //    catch    → 请求失败，记录错误 & 向上抛出
  //    finally  → 无论成功失败，重置 loading = false
  // ──────────────────────────────────────────────────────────
  actions: {
    /**
     * initAuth() — 应用启动时从 localStorage 恢复登录状态
     *
     * 调用时机：App.vue → onMounted
     * 作用：    刷新页面后自动登录，无需用户重新输入密码
     *
     * 流程：
     *   1. 读取 localStorage 中的 token 和 user
     *   2. 如果两者都存在，解析 user JSON 并恢复为 this.user
     *   3. 设置 isLoggedIn = true
     *   4. 若 JSON 解析失败（数据损坏），清除 localStorage
     */
    initAuth() {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (token && savedUser) {
        try {
          this.user = JSON.parse(savedUser)
          this.isLoggedIn = true
          console.log('[Auth] 从 localStorage 恢复登录状态:', this.user.name)
        } catch (e) {
          // localStorage 数据损坏 → 清除残留数据
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    },

    /**
     * hello() → GET /api/hello
     *
     * 用途：验证后端服务是否在线，获取欢迎消息
     *
     * 返回示例：
     *   { message: "Hello from C++ Server", pid: 12345, path: "/api/hello" }
     *
     * 调用点：
     *   - App.vue 挂载时（检测服务器状态）
     *   - ApiDemoView 用户点击"发送 GET 请求"
     */
    async hello() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/hello')
        this.helloMessage = response.data.message
        return response.data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * getTime() — 获取服务器时间
     *
     * 注意：实际调用的是 /api/hello 接口
     * 用返回的 path 字段作为时间展示（因为后端没有独立的时间接口）
     */
    async getTime() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/hello')
        this.serverTime = response.data.path || new Date().toLocaleString()
        return response.data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * postData(data) → POST /api/data
     *
     * 参数: { name: string, age: number, email: string }
     * 用途：向服务器提交用户数据，由后端子进程异步处理
     *
     * 调用点：ApiDemoView "发送 POST 请求"
     */
    async postData(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/data', data)
        this.lastPostData = response.data
        return response.data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * updateData(data) → PUT /api/update
     *
     * 参数: { id: number, name: string }
     * 用途：更新数据库中指定 ID 记录的名称字段
     *
     * 调用点：ApiDemoView "发送 PUT 请求"
     */
    async updateData(data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put('/update', data)
        this.lastUpdateData = response.data
        return response.data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * deleteData(id) → DELETE /api/delete/:id
     *
     * 参数: id — 要删除的记录编号
     * 用途：从数据库中删除指定 ID 的记录
     *
     * 调用点：ApiDemoView "发送 DELETE 请求"
     */
    async deleteData(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.delete(`/delete/${id}`)
        this.lastDeleteData = response.data
        return response.data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * login(credentials) → POST /api/login
     *
     * 参数: { name: string, password: string }
     *
     * 成功时（后端返回 status === 'success'）：
     *   1. 提取 user_id, level, token 等字段
     *   2. 保存 token 到 localStorage（供请求拦截器使用）
     *   3. 保存 user 对象到 localStorage（用于刷新后恢复）
     *   4. 更新 this.user 和 this.isLoggedIn
     *
     * 失败时：
     *   设置 this.error，组件显示错误提示
     *
     * 调用点：
     *   - UserNav.vue（登录弹窗）
     *   - ApiDemoView（登录标签页）
     */
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/login', {
          name: credentials.name,
          password: credentials.password
        })

        // ── 登录成功 → 保存登录态 ──
        if (response.data.status === 'success') {
          const userData = {
            user_id: response.data.user_id,
            level: response.data.level,
            name: credentials.name,
            avatar: response.data.avatar || ''
          }

          // 持久化到 localStorage（刷新页面不丢失）
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(userData))

          // 更新 Pinia 状态
          this.user = userData
          this.isLoggedIn = true
        }

        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * logout() → POST /api/logout
     *
     * 退出登录：
     *   1. 尝试通知后端 token 失效（请求失败只警告，不阻断流程）
     *   2. 清除 localStorage 中的 token 和 user
     *   3. 重置 Pinia 状态中的 user 和 isLoggedIn
     *
     * 调用点：
     *   - UserNav.vue 退出按钮
     *   - ApiDemoView 退出按钮
     */
    async logout() {
      try {
        await api.post('/logout')
      } catch (e) {
        // 后端退出接口可能未实现，仅警告不抛出
        console.warn('[Logout] 后端退出请求失败:', e.message)
      }

      // 清除本地持久化登录数据
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // 重置 Pinia 状态
      this.user = null
      this.isLoggedIn = false
    },

    /**
     * clearError() — 清除错误信息
     *
     * 用途：组件在关闭错误提示或重新请求前调用
     */
    clearError() {
      this.error = null
    }
  }
})

export { api }
