/**
 * ============================================================
 *  main.js — Vue 3 应用入口文件
 * ============================================================
 *
 * 【职责】
 *   1. 创建 Vue 应用实例
 *   2. 注册 Pinia（全局状态管理）
 *   3. 注册 Vue Router（路由管理）
 *   4. 导入全局样式
 *   5. 挂载到 DOM 上的 #app 元素
 *
 * 【执行顺序】
 *   createApp → use(Pinia) → use(Router) → mount('#app')
 *
 * 【注意】
 *   必须在 mount 之前调用 use() 注册插件，否则组件内无法使用。
 * ============================================================
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')