import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useChatStore = defineStore('chat', () => {
  const disturbStatusMap = ref({});
  const topStatusMap = ref({});
  
  // 更新免打扰状态
  const updateDisturbStatus = (chatId, status) => {
    disturbStatusMap.value[chatId] = status;
  };
  
  // 更新置顶状态
  const updateTopStatus = (chatId, status) => {
    topStatusMap.value[chatId] = status;
  };
  
  // 获取免打扰状态
  const getDisturbStatus = (chatId) => {
    return disturbStatusMap.value[chatId];
  };
  
  // 获取置顶状态
  const getTopStatus = (chatId) => {
    return topStatusMap.value[chatId];
  };

  // 新增 updateChatStatus 方法
   const updateChatStatus = (chatId, updates) => {
    // 使用 chat_id 查找会话索引
    const sessionIndex = sessions.value.findIndex(s => s.chat_id == chatId);
    
    if (sessionIndex !== -1) {
      // 使用 Vue 的响应式方式更新对象
      const updatedSession = { ...sessions.value[sessionIndex], ...updates };
      sessions.value.splice(sessionIndex, 1, updatedSession);
      
      // 同时更新状态映射
      if ('avoid_disturb' in updates) {
        disturbStatusMap.value[chatId] = updates.avoid_disturb;
      }
      if ('is_top' in updates) {
        topStatusMap.value[chatId] = updates.is_top;
      }
    }
  };

  // 企业模式状态
  const enterpriseMode = ref(localStorage.getItem('enterpriseMode') === '1');
  
  // 切换企业模式的方法
  const toggleEnterpriseMode = (val) => {
    enterpriseMode.value = val;
    localStorage.setItem('enterpriseMode', val ? '1' : '0');
  };


  // 在 useChatStore 中添加
  const removeSession = (chatId) => {
    sessions.value = sessions.value.filter(s => s.chat_id !== chatId);
    delete messages.value[chatId];
    delete disturbStatusMap.value[chatId];
    delete topStatusMap.value[chatId];
  };

  const sessions = ref([])
  const messages = ref({})

  // 添加消息到指定会话
  const addMessage = (chatId, message) => {
    if (!messages.value[chatId]) {
      messages.value[chatId] = []
    }
    messages.value[chatId].push(message)
  }

   // 更新会话
  const updateSession = (session) => {
    const index = sessions.value.findIndex(s => s.chat_id === session.chat_id)
    if (index !== -1) {
      sessions.value[index] = session
    } else {
      sessions.value.push(session)
    }
  }

  // 初始化会话列表
  const initSessions = (sessionList) => {
    sessions.value = sessionList
    // 初始化会话状态
    initChatStatus(sessionList)
  }
  
  // 初始化会话状态
  const initChatStatus = (sessions) => {
    sessions.forEach(session => {
      disturbStatusMap.value[session.chat_id] = session.avoid_disturb;
      topStatusMap.value[session.chat_id] = session.is_top;
    });
  };
  
  return {
    disturbStatusMap,
    topStatusMap,
    updateDisturbStatus,
    updateTopStatus,
    getDisturbStatus,
    getTopStatus,
    initChatStatus,


    updateChatStatus,
    
    removeSession,

    enterpriseMode,
    toggleEnterpriseMode,

    
    sessions,
    messages,
    addMessage,
    updateSession,
    initSessions
  };
});