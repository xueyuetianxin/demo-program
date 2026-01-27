import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import defaultAvatar from '@/static/default-avatar.png'
import webSocketService from '@/utils/websocket'
import { useUserStore } from '@/stores/user'
// 创建应用实例
const app = createApp(App)

// 头像格式化函数
const formatAvatar = (avatarUrl) => {
  if (!avatarUrl || avatarUrl.trim() === '') {
    return defaultAvatar
  }
  if (avatarUrl.includes('https://')) {
    return avatarUrl
  }
  if (avatarUrl.startsWith('/')) {
    return `https://cdn.11xyz.com${avatarUrl}`
  }
  return `https://cdn.11xyz.com/${avatarUrl}`
}

// 添加到全局属性
app.config.globalProperties.$formatAvatar = formatAvatar
app.provide('formatAvatar', formatAvatar)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
const userStore = useUserStore()

// 添加 Electron 通知点击处理
const setupElectronHandlers = () => {
  if (window.electronAPI) {
    // 处理通知点击后的路由跳转
    window.electronAPI.receive('navigate-to', ({ routePath, state }) => {
      router.push({
        path: routePath,
        state // 传递状态
      });
    });
  }
}

setupElectronHandlers()

// 如果用户已登录，连接WebSocket
if (userStore.isLoggedIn) {
  setTimeout(() => {
    webSocketService.connect()
  }, 1000)
}