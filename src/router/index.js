import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../views/Layout.vue'
import Home from '../views/Home.vue'
import Contact from '../views/Contact/index.vue'

// 检查本地token
const hasToken = () => {
  return !!localStorage.getItem('token') // 根据实际存储的token键名调整
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      // 移除固定重定向，在导航守卫中动态处理
      children: [
        {
          path: 'home',
          name: 'home',
          component: Home,
          meta: { public: true } // 标记为公开路由
        },
        {
          path: 'contact',
          name: 'contact',
          component: Contact,
          meta: { requiresAuth: true }, // 需要认证
          children: [
            {
              path: ':id',
              name: 'contact-detail',
              component: () => import('../views/Contact/ContactDetail.vue'),
              props: true,
              meta: { requiresAuth: true }
            },
            {
              path: 'verify/:id',
              name: 'contact-verify',
              component: () => import('../views/Contact/ContactVerify.vue'),
              props: true,
              meta: { requiresAuth: true }
            }
          ]
        },
        {
          path: 'chat',
          name: 'chat',
          component: () => import('../views/Chat/Index.vue'),
          meta: { requiresAuth: true }, // 需要认证
          children: [
            {
              path: 'private/:id',
              name: 'private-chat-detail',
              component: () => import('../views/Chat/PrivateChatDetail.vue'),
              props: true
            },
            {
              path: 'group/:id',
              name: 'group-chat-detail',
              component: () => import('../views/Chat/GroupChatDetail.vue'),
              props: true
            },
            {
              path: 'custom/:id',
              name: 'custom-chat-detail',
              component: () => import('../views/Chat/CustomChatDetail.vue'),
              props: true
            }
          ]
        },
        {
          path: 'office',
          name: 'office',
          component: () => import('../views/Office/index.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'meeting',
          name: 'meeting',
          component: () => import('../views/Meeting/index.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'cloud',
          name: 'cloud',
          component: () => import('../views/Cloud/index.vue'),
          meta: { requiresAuth: true },
        }
      ]
    }
  ]
})

// 全局前置导航守卫
router.beforeEach((to, from, next) => {
  // 处理根路径重定向
  if (to.path === '/') {
    return next(hasToken() ? '/chat' : '/home')
  }

  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isPublic = to.matched.some(record => record.meta.public)

  if (requiresAuth && !hasToken()) {
    // 需要认证但无token，重定向到首页
    next({ name: 'home' })
  } else if (!isPublic && !hasToken()) {
    // 非公开页面且无token，重定向到首页
    next({ name: 'home' })
  } else {
    // 正常放行
    next()
  }
})

export default router