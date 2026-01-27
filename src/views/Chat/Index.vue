<template>
  <div class="chat-container">
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="{ left: menuLeft + 'px', top: menuTop + 'px' }"
    >
      <div class="menu-item" @click="toggleTop">
        {{ currentContextItem && getTopStatus(currentContextItem) === 1 ? '取消置顶' : '置顶聊天' }}
      </div>
      <div class="menu-item" @click="toggleDisturb">
        {{ currentContextItem && getDisturbStatus(currentContextItem) === 1 ? '取消免打扰' : '消息免打扰' }}
      </div>
      <div class="menu-item" @click="delSessions">
        删除
      </div>
    </div>
    
    <div class="chat-list" ref="chatList" @scroll="handleScroll">
      <div class="search-container">
        <input
          v-model="searchInput"
          placeholder="Search"
          class="searchInput"
        />
        <div class="customHelper" v-if="isCustomStatus" @click="toggleCustom">
          <el-icon :size="18">
            <ArrowLeft />
          </el-icon>
          <span class="customName">客服助手</span>
        </div>
      </div>
      <div 
        v-if="!isCustomStatus"
        v-for="item in sortedSessions" 
        class="chat-item"
        :class="{ active: $route.params.id === item.chat_id.toString(),
          'top-chat': getTopStatus(item) === 1 
         }"
        @click="selectChat(item)"
        @contextmenu.prevent="handleRightClick($event, item)"
      >
        <!-- 头像区域 -->
        <div class="chat-avatar">
          <div 
            v-if="item.unread_count > 0" 
            class="unread-indicator"
            :class="{
              'dot': getDisturbStatus(item) === 1,
              'count': getDisturbStatus(item) !== 1
            }"
          >
            <template v-if="getDisturbStatus(item) !== 1">
              {{ item.unread_count > 99 ? '99+' : item.unread_count }}
            </template>
          </div>


          <template v-if="item.chat_type === 1">
            <img :src="$formatAvatar(item.chat_logo)" alt="头像" class="avatar-img">
          </template>
          <template v-if="item.chat_type === 2">
            <!-- 当 image_arr 为空时显示 cover_img -->
            <template v-if="!item.image_arr || item.image_arr.length === 0">
              <img 
                :src="$formatAvatar(item.cover_img)" 
                alt="群封面" 
                class="avatar-img"
              >
            </template>
            <!-- 当 image_arr 有数据时显示头像网格 -->
            <template v-else>
              <div 
                class="avatar-grid" 
                :class="`grid-count-${Math.min(item.image_arr.length, 9)}`"
              >
                <div 
                  v-for="(img, index) in item.image_arr.slice(0, 9)" 
                  :key="index"
                  class="avatar-grid-item"
                >
                  <img :src="$formatAvatar(img)" alt="成员头像" class="grid-avatar-img">
                </div>
              </div>
            </template>
          </template>
          <template v-else-if="item.chat_type === 20">
            <img src="/icons/kefu.png" alt="客服头像" class="avatar-img">
          </template>
        </div>
        <!-- 内容区域 -->
        <div class="chat-content-wrapper">
          <!-- 头部：昵称+时间+未读提示 -->
          <div class="chat-header">
            <span class="chat-nickname">
              {{ item.chat_type === 1 ? item.chat_nickname : item.title }}
            </span>
            <div class="header-right">
              <span class="chat-time">{{ formatMsgTime(item.msg_time) }}</span>        
            </div>
          </div>
          <!-- 内容：最后一条消息 -->
          <div class="chat-last-msg">
            <div v-if="item.at_remind == 1" class="notice">有人@了你</div>
            <div class="msg-text">{{ formatLastMsg(item) }}</div>
            <!-- 将免打扰图标移出文本容器 -->
            <el-icon 
              v-if="getDisturbStatus(item) === 1" 
              class="disturb-icon"
            >
              <MuteNotification />
            </el-icon>
          </div>
        </div>
      </div>
      <div class="loading-tip" v-if="loading">
        加载中...
      </div>
      <div 
        v-for="item in ServiceLists" 
        class="CustomList" 
        v-if="isCustomStatus" 
        @click="selectCustom(item)"
      >
        <img class="CustomAvater" :src="$formatAvatar(item.logo)" alt="" srcset="">
        <div class="CustomRight">
          <div class="RightOne">
            <span class="OneFirst">{{ item.nickname }}</span>
            <span class="TwoFirst">{{ formatMsgTime(item.msg_time) }}</span>
          </div>
          <div class="RightTwo">
            <span class="TwoFirst">{{ formatLastMsg(item) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-window-container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted , watch , computed ,onBeforeUnmount,onUnmounted} from 'vue'
import { useRouter } from 'vue-router'
import { apiSessionsList,apiAvoidDisturb,apiPutTop,apiDelSession,apiServiceLists} from '@/api/user';
import { formatMsgTime } from '@/utils/date.js'
import { MuteNotification } from '@element-plus/icons-vue';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/user';
import { ElNotification } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
const userStore = useUserStore();
const chatStore = useChatStore();
const router = useRouter()
const SessionsList = ref([])
const chatList = ref(null) // 引用聊天列表容器
const currentPage = ref(1)
const loading = ref(false)
const noMore = ref(false)
const firstLoad = ref(true)
const searchInput = ref(null)
const ServiceLists = ref([])
const isCustomStatus = ref(false)
const isEnterpriseMode = computed(() => chatStore.enterpriseMode);
const getSessionsList = async () => {
  if (loading.value || noMore.value) return
  loading.value = true
  
  try {
    const res = await apiSessionsList({
      page: currentPage.value,
      limit: 20,
      chat_type: '1,2',
      yuanxin: 1,
      institution_id: localStorage.getItem('enterpriseMode') === '1' ? 2 : 0
    })
    
    // 处理数据
    const newData = res.data.data || []
    if (firstLoad.value) {
      SessionsList.value = newData
      chatStore.initChatStatus(newData);
      firstLoad.value = false
    } else {
      SessionsList.value = [...SessionsList.value, ...newData]
      chatStore.initChatStatus(newData);
    }
    
    // 检查是否还有更多
    if (newData.length < 20) {
      noMore.value = true
    } else {
      currentPage.value += 1
    }
  } catch (error) {
    console.error('加载会话失败', error)
  } finally {
    loading.value = false
  }
}
// 添加计算属性获取免打扰状态
const getDisturbStatus = (item) => {
  // 优先从 store 获取，没有则使用原始数据
  return chatStore.getDisturbStatus(item.chat_id) ?? item.avoid_disturb;
};
const getTopStatus = (item) => {
  // 优先从 store 获取，没有则使用原始数据
  return chatStore.getTopStatus(item.chat_id) ?? item.is_top;
};
const delSessions = async () => {
  await apiDelSession(currentContextItem.value.id)
  await getSessionsList()
  ElMessage({
    message: '删除成功',
    type: 'success',
  })
}

//获取客服列表
const getServiceLists = async () => {
  const res = await apiServiceLists()
  ServiceLists.value = res.data.data
}


const showContextMenu = ref(false);
const menuLeft = ref(0);
const menuTop = ref(0);
const currentContextItem = ref(null);
// 处理右键点击
const handleRightClick = (event, item) => {
  currentContextItem.value = item;
  showContextMenu.value = true;
  menuLeft.value = event.clientX;
  menuTop.value = event.clientY;
  // 添加全局点击监听器，用于关闭菜单
  document.addEventListener('click', closeContextMenu);
};
// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
  document.removeEventListener('click', closeContextMenu);
};
// 切换置顶状态
const toggleTop = async () => {
  if (!currentContextItem.value) return;
  
  const chatId = currentContextItem.value.chat_id;
  const currentStatus = getTopStatus(currentContextItem.value);
  const newStatus = currentStatus === 1 ? 0 : 1;
  
  try {
    await apiPutTop(currentContextItem.value.id, {
      type: newStatus === 1 ? 1 : 2
    });
    
    // 更新store中的状态
    chatStore.updateTopStatus(chatId, newStatus);
    
    // 更新当前项的本地状态（如果需要）
    const index = SessionsList.value.findIndex(item => item.chat_id === chatId);
    if (index !== -1) {
      SessionsList.value[index] = {
        ...SessionsList.value[index],
        is_top: newStatus
      };
    }
  } catch (error) {
    console.error('切换置顶状态失败', error);
    ElNotification.error('操作失败，请重试');
  }
  closeContextMenu();
};

// 切换免打扰状态
const toggleDisturb = async () => {
  if (!currentContextItem.value) return;
  
  const chatId = currentContextItem.value.chat_id;
  const currentStatus = getDisturbStatus(currentContextItem.value);
  const newStatus = currentStatus === 1 ? 0 : 1;
  
  try {
    await apiAvoidDisturb(currentContextItem.value.id, {
      avoid_disturb: newStatus
    });
    
    // 更新store中的状态
    chatStore.updateDisturbStatus(chatId, newStatus);
    
    // 更新当前项的本地状态（如果需要）
    const index = SessionsList.value.findIndex(item => item.chat_id === chatId);
    if (index !== -1) {
      SessionsList.value[index] = {
        ...SessionsList.value[index],
        avoid_disturb: newStatus
      };
    }
  } catch (error) {
    console.error('切换免打扰状态失败', error);
    ElNotification.error('操作失败，请重试');
  }
  closeContextMenu();
};


// 添加计算属性来生成排序后的列表
const sortedSessions = computed(() => {
  // 创建副本避免直接修改原数组
  let sessions = [...SessionsList.value].sort((a, b) => {
    // 获取两个会话的置顶状态（优先使用store中的最新状态）
    const aIsTop = chatStore.getTopStatus(a.chat_id) || 0;
    const bIsTop = chatStore.getTopStatus(b.chat_id) || 0;
    
    // 比较置顶状态：置顶的排在非置顶前面
    if (aIsTop === 1 && bIsTop !== 1) {
      return -1;
    } else if (aIsTop !== 1 && bIsTop === 1) {
      return 1;
    }
    
    // 如果置顶状态相同，则按时间倒序排列（最新消息在前）
    return b.msg_time - a.msg_time;
  });
  // 添加客服项（如果ServiceLists有数据）
  if (ServiceLists.value && ServiceLists.value.length > 0 && isEnterpriseMode.value) {
    // 计算总未读数
    const totalUnread = ServiceLists.value.reduce((sum, item) => sum + (item.kf_unread_count || 0), 0);
    // 使用第一条记录的时间
    const firstMsgTime = ServiceLists.value[0]?.msg_time
    const firstMsgcontent = ServiceLists.value[0]?.last_msg
    const firstMsgtype = ServiceLists.value[0]?.last_msg_type
    const customServiceItem = {
      chat_id: 'custom_service',
      chat_type: 20,
      chat_logo: '/icons/kefu.png',
      title: '客服助手',
      msg_time: firstMsgTime,
      last_msg: firstMsgcontent,
      last_msg_type: firstMsgtype,
      unread_count: totalUnread,
      is_top: 0,
      avoid_disturb: 0
    };
    // 将客服项插入到列表最前面（如果置顶项存在，则放在置顶项之后）
    sessions.unshift(customServiceItem);
  }
  return sessions;
});

// 监听store中的置顶状态变化，强制重新排序
watch(() => chatStore.topStatusMap, () => {
  // 触发计算属性更新
  SessionsList.value = [...SessionsList.value];
}, { deep: true });

//退出群聊后进行更新
const unwatch = watch(() => router.currentRoute.value, async (newRoute, oldRoute) => {
  if (newRoute.name === 'chat' && newRoute.query.forceReload) {
    try {
      currentPage.value = 1;
      noMore.value = false;
      SessionsList.value = ''
      await getSessionsList();
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  }
}, { immediate: true });

const handleScroll = () => {
  const el = chatList.value
  if (!el || loading.value || noMore.value) return
  
  // 检查是否滚动到底部（添加50px的缓冲区域）
  const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (scrollBottom < 50) {
    if (isCustomStatus.value) {
      console.log("客服下一页")
    } else {
      if (!noMore.value) {
        getSessionsList()
      }
    }
  }
}
onMounted(()=>{
  getSessionsList()
  getServiceLists()
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('websocket-message', debouncedHandleWebSocketMessage);
  window.addEventListener('focus', async () => {
    if (window.electronAPI) {
      window.electronAPI.stopFlashNotification();
    }
  });
})
onUnmounted(() => {
  unwatch(); // 取消路由监听
});

const formatLastMsg = (item) => {
  if (!item.last_msg) return '暂无消息';
  switch (item.last_msg_type) {
    case 1:
      return item.last_msg;
    case 2:
      return '[图片]';
    case 3:
      return '[语音]';
    case 4:
      return '[视频]';
    case 6:
      return '[商品]';
    case 7:
      return '[系统信息]';
    case 10:
      return '[系统信息]';
    default:
      return item.last_msg;
  }
}

const selectChat = (item) => {
  // 重置@提醒状态
  if (item.at_remind === 1) {
    const index = SessionsList.value.findIndex(s => s.id === item.id);
    if (index !== -1) {
      SessionsList.value[index] = {
        ...SessionsList.value[index],
        at_remind: 0  // 重置@提醒状态
      };
    }
  }

  if (item.unread_count > 0) {
    // 找到并更新原始列表中的会话项
    const index = SessionsList.value.findIndex(s => s.id === item.id);
    if (index !== -1) {
      // 创建新对象确保响应式更新
      SessionsList.value[index] = {
        ...SessionsList.value[index],
        unread_count: 0
      };
      // 使用新方法更新 Pinia 存储中的会话状态
      chatStore.updateChatStatus(item.chat_id, {
        unread_count: 0
      });
    }
  }

  if (item.chat_type === 1) { // 私聊
    router.push({ 
      name: 'private-chat-detail',
      params: { id: item.chat_id },
      state: { 
        chat_with_uid: item.chat_with_uid,
        nickname: item.chat_nickname,
        message_id: item.id,
        sign: item.sign
        // avoid_disturb: item.avoid_disturb,
        // is_top: item.is_top
      }
    })
  } else if (item.chat_type === 2) { // 群聊
    router.push({ 
      name: 'group-chat-detail',
      params: { id: item.chat_id },
      state: { 
        group_id: item.chat_id,
        nickname: item.title,
        message_id: item.id,
        sign: item.sign
      }
    })
  } else if (item.chat_type === 20) {
    isCustomStatus.value = true
    router.push({
      name: 'chat'
    })
  }
}
const selectCustom = (item) => {
  router.push({ 
    name: 'custom-chat-detail',
    params: { id: item.id },
    state: { 
      group_id: item.chat_id,
      nickname: item.title,
      message_id: item.id,
      sign: item.sign,
      store_name: item.store_name
    }
  })
}

const toggleCustom = () => {
  isCustomStatus.value = !isCustomStatus.value
  router.push({
    name: 'chat'
  })
}

const handleWebSocketMessage = async (event) => {
  const message = event.detail;
  if (message.type === 'chat_record' || (message.type === 'chat_group' && message.is_from_group == 1)) {
    updateSessionForNewMessage(message);
    // 如果当前窗口不是焦点窗口，则触发闪烁效果
    if (!document.hasFocus()) {
      console.log("触发闪烁")
      await sendFlashNotification();
      await playNotificationSound(); 
    }
  }
  if(message.type === 'CustomerServiceNewSession'){
    console.log("有人进入了店铺")
    await showSystemNotification(message);
  }
  if(message.type === 'ordinary_login_remind'){
    console.log("有人进入了展馆")
    await showSystemNotification(message);
  }
}
// 新增声音播放
const playNotificationSound = async () => {
  if (window.electronAPI) {
    window.electronAPI.playNotificationSound();
  } else {
    // 浏览器环境下的备选方案
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('无法播放声音:', e));
  }
};
//windows端图标闪烁
const sendFlashNotification = async () => {
  if (window.electronAPI) {
    // 检查应用是否处于焦点状态
    const isFocused = await window.electronAPI.isAppFocused();
    // 如果应用不在焦点状态，才发送闪烁通知
    if (!isFocused) {
      window.electronAPI.sendFlashNotification();
    }
  } else {
    // 浏览器环境下的备选方案
    document.title = document.title === '新消息' ? '元信' : '新消息';
  }
};
let notificationCount = 0;
let lastNotificationTime = 0;
const NOTIFICATION_LIMIT = 2; // 每分钟最多2次
const ONE_MINUTE = 60 * 1000; // 1分钟的毫秒数
// 显示系统通知
const showSystemNotification = async (message) => {
  const now = Date.now();
  // 如果超过1分钟，重置计数器
  if (now - lastNotificationTime > ONE_MINUTE) {
    notificationCount = 0;
    lastNotificationTime = now;
  }
  // 检查是否达到限制
  if (notificationCount >= NOTIFICATION_LIMIT) {
    console.log('已达到每分钟通知限制');
    return;
  }
  // 增加计数器
  notificationCount++;

  let title, body, routePath, state;
  if (message.type === 'CustomerServiceNewSession') {
    title = `${message.session?.store?.title || '店铺'}有客户咨询来了`;
    body = '有新的客户进入店铺，请及时接待';
    routePath = `/chat/custom/${message.session.id}`;
    state = { message_id: message.session?.id };
  } 
  else if (message.type === 'ordinary_login_remind') {
    title = `${message.nickname || '有人'}进入了${message.title || '展馆'}`;
    body = '您好,有人进入你的数字空间了';
    routePath = `/chat/group/${message.model_id}`; // 使用展馆的路由格式
    state = { params: { id: message.model_id } };
  }
  else {
    title = '新消息';
    body = '您有新消息';
    routePath = '/chat'; // 默认跳转到聊天页面
    state = {};
  }
  if (window.electronAPI) {
    window.electronAPI.showNotification(title, body, routePath, state);
  } else {
    // 浏览器环境：使用Web Notification API
    if (Notification.permission === 'granted') {
      new Notification('新消息', {
        body: '您有新消息',
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      // 如果权限未设置，先请求权限
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('新消息', {
            body: '您有新消息',
            icon: '/favicon.ico'
          });
        }
      });
    }
  }
};
const debouncedHandleWebSocketMessage = debounce(handleWebSocketMessage, 300);
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

//websocket更新列表
const updateSessionForNewMessage = (message) => {
  // 获取当前用户ID
  const currentUserId = userStore.userInfo.id;
  // 确定聊天的chat_id
  const chatId = message.chat_id;
  // 查找对应的会话
  const sessionIndex = SessionsList.value.findIndex(
    session => session.chat_id.toString() === chatId
  );
  if (sessionIndex !== -1) {
    // 更新会话的最后消息和时间
    const session = SessionsList.value[sessionIndex];
    session.last_msg = message.msg_content;
    session.last_msg_type = parseInt(message.msg_type);
    // 统一处理时间字段
    const timestamp = message.created_at || message.send_time;
    session.msg_time = new Date(timestamp).getTime();
    // 判断是否是自己发送的消息
    const senderId = message.send_id || message.send_user_id;
    const isOwnMessage = parseInt(senderId) === currentUserId;
    if (!isOwnMessage) {
      // 检查是否在当前聊天页面
      const isCurrentChat = router.currentRoute.value.params.id === chatId;
      // 检查免打扰状态
      const isDisturb = getDisturbStatus(session);
      // 只有在非当前页面且非免打扰时才增加未读计数
      if (!isCurrentChat && isDisturb !== 1) {
        session.unread_count = (session.unread_count || 0) + 1;
        console.log(`增加未读计数: chatId=${chatId}, 新计数=${session.unread_count}`);
      }
    }
    // 确保Vue响应式更新
    SessionsList.value[sessionIndex] = {...session};
    // 将更新的会话移到最前面（非置顶会话）
    if (getTopStatus(session) !== 1) {
      const updatedSession = SessionsList.value.splice(sessionIndex, 1)[0];
      SessionsList.value.unshift(updatedSession);
    }
  } else {
    // 如果找不到会话，可能是新聊天，重新加载会话列表
    SessionsList.value = [];
    currentPage.value = 1;
    noMore.value = false;
    getSessionsList();
  }
};

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll, true);
  // 移除防抖函数
  window.removeEventListener('websocket-message', debouncedHandleWebSocketMessage);
  document.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped lang="scss">
$active-bg: #E6F0FE;
$hover-bg: #F5F5F5;
$text-primary: #333;
$text-secondary: #666;
$text-tertiary: #999;
$unread-red: #FF4D4F;



/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 10000;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-width: 120px;
  overflow: hidden;
  
  .menu-item {
    padding: 8px 16px;
    font-size: 14px;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: #ecf5ff;
      color: #409eff;
    }
  }
}




.chat-container {
  display: flex;
  height: 100vh;
  background-color: #F0F2F5;
}

// 聊天列表（左侧）
.chat-list {
  width: 200px;
  flex-shrink: 0; 
  border-right: 1px solid #d4d4d4;
  background-color: #fff;
  overflow-y: auto;
  position: relative;

  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  
  /* Webkit浏览器 (Chrome, Safari) */
  &::-webkit-scrollbar {
    display: none; /* 完全隐藏滚动条 */
  }
  .search-container {
    cursor: pointer;
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fcfbfbfd;
    padding: 10px;
    border-bottom: 1px solid #eee;
    .searchInput {
      outline: none;
      border: 1px solid #ededed;
      background: #eaeaea;
      width: 100%;
      padding: 6px;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .customHelper{
      padding: 10px 6px 0 6px;
      display: flex;
      align-items: center;
      font-size: 16px;
      .customName{
        padding-left: 6px;
      }
    }
  }
}
/* 聊天窗口容器（右侧） */
.chat-window-container {
  flex: 1; /* 占据剩余空间 */
  
  display: flex;
  overflow-x: auto; /* 允许水平滚动 */
}


.chat-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  // Hover效果（浅灰）
  &:hover {
    background-color: $hover-bg;
  }

  // 选中效果（浅蓝）
  &.active {
    background-color: $active-bg;
  }
}

// 头像区域
.chat-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar-img {
  width: 37px;
  height: 37px;
  border-radius: 5px;
  object-fit: cover;
}

.avatar-grid {
  width: 37px;
  height: 37px;
  display: grid;
  gap: 1px;
  border-radius: 5px;
  overflow: hidden;
  background-color: #f0f0f0;
}

/* 根据头像数量设置不同的网格布局 */
.grid-count-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}
.grid-count-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.grid-count-2,
.grid-count-3,
.grid-count-5,
.grid-count-6,
.grid-count-7,
.grid-count-8,
.grid-count-9 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.avatar-grid-item {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.chat-content-wrapper {
  flex: 1;
  min-width: 0;
}

// 头部（昵称+时间+未读）
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

// 昵称
.chat-nickname {
  font-size: 14px;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

// 头部右侧（时间+未读）
.header-right {
  display: flex;
}

// 时间
.chat-time {
  font-size: 12px;
  color: $text-tertiary;
}
.unread-indicator {
  position: absolute; /* 绝对定位在头像右上角 */
  top: -7px;
  right: -7px;
  z-index: 10;
  &.count {
    min-width: 16px;
    height: 16px;
    padding: 0 2px;
    border-radius: 9px;
    background-color: $unread-red;
    color: white;
    font-size: 10px;
    text-align: center;
    line-height: 18px;
    box-sizing: border-box;
  }
  
  &.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: $unread-red;
  }
}

// 最后一条消息
.chat-last-msg {
  font-size: 12px;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; 
  line-height: 1.4;
  display: flex;
  align-items: center;
  .msg-text {
    flex: 1;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .disturb-icon {
    flex-shrink: 0; // 防止图标被压缩
    margin-left: 4px; // 添加左边距
    font-size: 14px; // 调整图标大小
    color: $text-tertiary; // 使用次级文字颜色
  }
  .notice{
    color: #f0c63d;
    padding-right: 4px;
  }
}
.loading-tip{
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: #999;
}
.chat-item.top-chat {
  background-color: #f5f5f5; /* 置顶聊天的背景色 */
  border-left: 3px solid #41addf; /* 左侧标记线 */
}



.CustomList{
  padding: 8px 12px;
  display: flex;
  align-items: center;
  width: 200px;
  cursor: pointer;
  .CustomAvater{
    width: 37px;
    height: 37px;
    border-radius: 5px;
    object-fit: cover;
  }
  .CustomRight{
    flex: 1;
    min-width: 0;
    .RightOne{
      width: 100%;
      font-size: 14px;
      color: $text-primary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .OneFirst{
        margin-left: 10px;
      }
      .TwoFirst{
        font-size: 12px;
        color: $text-tertiary;
      }
    }
    .RightTwo{
      margin-left: 10px;
      font-size: 12px;
      color: $text-secondary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap; 
      line-height: 1.4;
      display: flex;
      align-items: center;
      .TwoFirst{
        flex: 1;
        overflow: hidden;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>