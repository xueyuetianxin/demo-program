import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import webSocketService from '@/utils/websocket'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || 'null') || {
    uid: localStorage.getItem('uid') || ''
  });

  const isLoggedIn = computed(() => !!token.value)

  function loginSuccess(data) {
    token.value = data.token
    userInfo.value = {
      ...(data.user || {}),
      uid: data.user?.uid || localStorage.getItem('uid') || ''
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user_info', JSON.stringify(userInfo.value));
    webSocketService.connect()
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('uid');
    webSocketService.disconnect()
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    loginSuccess,
    logout
  }
})