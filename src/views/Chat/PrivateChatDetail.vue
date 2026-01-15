<template>
  <div class="chat-detail">
    <Head 
      v-if="chatId"
      :nicknameProp="nickname" 
      :avoid_disturb="avoid_disturb" 
      :is_top="is_top" 
      :chatId="chatId"
      @design-disturb="Disturb"
      @putTop="put_top"
      @handleClear="ClearContent"
    >
    </Head>
    <div 
      class="message-list" 
      ref="messageListRef"
      @scroll="handleScroll"
    >
      <div 
        v-if="loadingMore" 
        class="loading-more"
      >
        加载中...
      </div>
      <div 
        v-for="(message, index) in SessionsDetail" 
        :key="index" 
        class="message-item"
        :class="{ 'message-right': message.is_me, 'message-left': !message.is_me }"
      >
        <img 
          class="avatar" 
          :src="$formatAvatar(message.send_logo)" 
          @click.stop="toggleProfile(message.send_id, $event)"
          alt="头像"
        />
        <div 
          v-if="message.msg_type == 1 || message.msg_type == '1'" 
          class="message-bubble" 
          :class="{ 
            'bubble-right': message.is_me, 
            'bubble-left': !message.is_me,
            'bubble-active': activeMessageId === message.id
          }"
          @contextmenu.prevent="openTextContextMenu(message, $event)"
        >
          <div class="message-text">
            {{ message.msg_content }}
          </div>
        </div>
        <!-- 图片消息直接显示，不包裹在气泡中 -->
        <div v-else-if="message.msg_type === 2" 
          class="message-image-container"
          :class="{ 'image-right': message.is_me, 'image-left': !message.is_me }"
        >
          <el-image 
            :src="message.msg_content"
            :preview-src-list="[message.msg_content]"
            fit="cover"
            :max-scale="1"
            :min-scale="0.2"
            hide-on-click-modal
            :z-index="9999"
          >
            <template #error>
              <div class="image-error">加载失败</div>
            </template>
          </el-image>
        </div>  
      </div>
    </div>

    <!-- 右键菜单 - 文本消息 -->
    <div 
      v-if="contextMenu.show && contextMenu.type === 'text'" 
      class="context-menu" 
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item">复制</div>
      <div @click="collect" class="menu-item">收藏</div>
    </div>

    <UserProfileCard 
      :userId="profileUserId"
      :position="profilePosition"
      @close="closeProfileCard"
    />
    <input 
      type="file" 
      ref="fileInputRef"
      accept="image/*"
      @change="handleImageSelect"
      style="display: none"
    >
    <ChatInput
      ref="chatInputRef"
      @send-message="handleSendMessage"
      @trigger-image-upload="triggerImageUpload"
      @add-pasted-image="handlePastedImage"
      :pendingImages="pendingImages"
      @remove-image="removePendingImage"
    ></ChatInput>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick,onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { apiSessionsDetail,apiPrivate,apiUploadImage,apiAvoidDisturb,apiPutTop,apiClearContent,
  apiContentCollect} from '@/api/user';
import ChatInput from "./components/input.vue"
import Head from "./components/head.vue"
import UserProfileCard from '../Contact/components/UserProfileCard.vue'
import { ElNotification } from 'element-plus';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/user'
const chatStore = useChatStore();
const userStore = useUserStore()
const route = useRoute()
const chatId = ref(null)
const SessionsDetail = ref([])
const fileInputRef = ref(null)
const chatWithUid = ref(null)
const nickname = ref(null)
const page = ref(1)
const hasMore = ref(true)
const isLoading = ref(false)
const loadingMore = ref(false)
const messageListRef = ref(null)
const message_id = ref(null)
const avoid_disturb = ref(null)
const is_top = ref(null)
const activeMessageId = ref(null)


const chatInputRef = ref(null);
const pendingImages = ref([])


const showProfileCard = ref(false)
const profileUserId = ref(null)
const profilePosition = ref({ x: 0, y: 0 })


// 添加/修改的方法
const toggleProfile = (userId, event) => {
  // 如果当前显示的是同一个用户的卡片，则关闭
  if (showProfileCard.value && profileUserId.value === userId) {
    closeProfileCard();
    return;
  }
  
  // 否则打开新卡片
  const clickX = event.clientX;
  const clickY = event.clientY;
  
  profilePosition.value = {
    x: clickX,
    y: clickY
  };
  
  profileUserId.value = userId;
  showProfileCard.value = true;
}

// 确保关闭卡片方法正确重置状态
const closeProfileCard = () => {
  showProfileCard.value = false;
  profileUserId.value = null;
}



// 打开文本消息右键菜单
const openTextContextMenu = (message, event) => {
  event.preventDefault();
  activeMessageId.value = message.id;
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'text',
    message: message
  };
};
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  type: '',
  message: null
});
// 关闭菜单
const closeContextMenu = () => {
  contextMenu.value.show = false;
  activeMessageId.value = null;
};

//消息收藏
const collect = async () => {
  if (!contextMenu.value.message) return;
  try {
    await apiContentCollect({
      chat_record_id: contextMenu.value.message.id
    })
    ElMessage({
      message: '收藏成功',
      type: 'success',
    });
  } catch (error) {
    ElMessage({
      message: '收藏失败',
      type: 'error',
    });
  }
  closeContextMenu();
}








// Websocket消息处理
const handleWebSocketMessage = async (event) => {
  const message = event.detail
  
  // 处理私聊和群聊消息
  if (message.type === 'chat_record' ) {
    handleNewMessage(message)
  }
  
}
// 添加消息处理函数
const handleNewMessage = (message) => {
  // 检查消息是否属于当前聊天
  if (message.chat_id.toString() === chatId.value) {
    // 检查是否已存在相同消息
    const exists = SessionsDetail.value.some(
      msg => msg.id === message.id || 
        (msg.created_at === message.created_at && msg.msg_content === message.msg_content)
    )
    if (!exists) {
      // 添加消息到列表末尾
      SessionsDetail.value.push({
        ...message,
        is_me: message.send_id === userStore.userInfo.uid
      })
      // 滚动到底部
      nextTick(scrollToBottom)
    }
  }
}



//消息免打扰
const Disturb = async () => {
  const newStatus = avoid_disturb.value === 1 ? 0 : 1;
  const res = await apiAvoidDisturb(message_id.value, {
    avoid_disturb: newStatus
  })
  avoid_disturb.value = newStatus;
  chatStore.updateDisturbStatus(chatId.value, newStatus);
}
//会话置顶
const put_top = async () => {
  const newtype = is_top.value === 1 ? 2 : 1;
  await apiPutTop(message_id.value, {
    type: newtype
  })
  is_top.value = newtype === 2 ? 0 : 1;
  chatStore.updateTopStatus(chatId.value, is_top.value);
}
//清空聊天记录
const ClearContent = async () => {
  await apiClearContent(message_id.value)
  getSessionsDetail();
}



//子组件函数
const triggerImageUpload = () => {
  fileInputRef.value.click()
}
const handlePastedImage = (imageData) => {
  pendingImages.value.push(imageData);
};
// 处理图片选择
const handleImageSelect = async (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    const file = files[0];
    if (file && file.type && file.type.startsWith("image/")) {
      try {
        // 创建预览URL
        const previewUrl = URL.createObjectURL(file);  
        // 添加到待发送图片数组
        pendingImages.value.push({
          file,
          previewUrl
        });
      } catch (error) {
        console.error("图片处理失败:", error);
      }
    }
  }
  event.target.value = "";
};
// 移除待发送图片
const removePendingImage = (index) => {
  URL.revokeObjectURL(pendingImages.value[index].previewUrl);
  pendingImages.value.splice(index, 1);
};
// 处理消息发送
const handleSendMessage = async (messageText, mentionedUserIds) => {
  try {
    // 如果有待发送图片，先发送图片
    if (pendingImages.value.length > 0) {
      const image = pendingImages.value[0]; // 只取第一张图片
      // 上传图片
      const formData = new FormData();
      formData.append('file', image.file);
      const response = await apiUploadImage(formData);
      const imageUrl = response.data.fullpath;
      // 发送图片消息
      await apiPrivate({
        chat_uid: chatWithUid.value,
        msg_type: 2, // 图片消息
        msg_content: imageUrl
      });
      // 释放预览URL并从待发送列表中移除
      URL.revokeObjectURL(image.previewUrl);
      pendingImages.value.shift();
    }
    // 如果有文本内容，发送文本消息
    if (messageText.trim()) {
      await apiPrivate({
        chat_uid: chatWithUid.value,
        msg_type: 1, // 文本消息
        msg_content: messageText
      });
    }
  } catch (error) {
    console.error("消息发送失败:", error);
  }
};


// 获取聊天内容
const getSessionsDetail = async (id) => {
  isLoading.value = true
  try {
    const res = await apiSessionsDetail({
      chat_id: id || chatId.value,
      limit: 20,
      page: page.value
    })
    
    if (page.value === 1) {
      SessionsDetail.value = res.data.data.reverse()
      // 初始化时滚动到底部
      nextTick(scrollToBottom)
    } else {
      // 加载更多时，将新数据放在前面
      const newMessages = res.data.data.reverse()
      const prevScrollHeight = messageListRef.value.scrollHeight
      SessionsDetail.value = [...newMessages, ...SessionsDetail.value]
      
      // 保持滚动位置
      nextTick(() => {
        const scrollHeightDifference = messageListRef.value.scrollHeight - prevScrollHeight
        messageListRef.value.scrollTop = scrollHeightDifference
      })
    }
    
    hasMore.value = res.data.last_page > page.value
  } catch (error) {
    console.error("获取会话详情失败:", error)
  } finally {
    isLoading.value = false
    loadingMore.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  const container = messageListRef.value;
  if (!container) return;
  
  // 获取所有图片元素
  const images = container.querySelectorAll('.message-image-container img');
  let loadedCount = 0;
  
  if (images.length === 0) {
    // 如果没有图片，直接滚动到底部
    container.scrollTop = container.scrollHeight;
    return;
  }
  
  // 等待所有图片加载完成
  images.forEach(img => {
    if (img.complete) {
      loadedCount++;
    } else {
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          container.scrollTop = container.scrollHeight;
        }
      };
    }
  });
  
  // 如果所有图片都已加载完成
  if (loadedCount === images.length) {
    container.scrollTop = container.scrollHeight;
  }
  
  // 设置超时回退，确保无论如何都能滚动
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 500);
};

// 处理滚动事件
const handleScroll = () => {
  if (!messageListRef.value || isLoading.value || loadingMore.value || !hasMore.value) return
  
  // 滚动到顶部时加载更多
  if (messageListRef.value.scrollTop === 0) {
    loadMoreMessages()
  }
}

// 加载更多消息
const loadMoreMessages = async () => {
  loadingMore.value = true
  page.value += 1
  await getSessionsDetail(chatId.value)
}
// 监听路由变化
watch(() => route.params.id, (newId) => {
  chatId.value = newId || ''
  const state = window.history.state
  chatWithUid.value = state?.chat_with_uid
  nickname.value = state?.nickname
  message_id.value = state?.message_id
  avoid_disturb.value = chatStore.getDisturbStatus(newId) ?? state?.avoid_disturb
  is_top.value = chatStore.getTopStatus(newId) ?? state?.is_top
  page.value = 1
  getSessionsDetail(newId)
})

onMounted(() => {
  chatId.value = route.params.id
  const state = window.history.state
  chatWithUid.value = state?.chat_with_uid
  nickname.value = state?.nickname
  message_id.value = state?.message_id
  avoid_disturb.value = chatStore.getDisturbStatus(route.params.id) ?? state?.avoid_disturb
  is_top.value = chatStore.getTopStatus(route.params.id) ?? state?.is_top
  getSessionsDetail(route.params.id)
  window.addEventListener('websocket-message', handleWebSocketMessage)
  document.addEventListener('click', closeContextMenu);
  
})
onBeforeUnmount(() => {
  window.removeEventListener('websocket-message', handleWebSocketMessage)
  document.removeEventListener('click', closeContextMenu);
})
</script>

<style scoped lang="scss">
.chat-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #EDEDED;
  background-repeat: repeat;
  background-position: center;
  position: relative;
  min-width: 360px;
  width: 100%;
  overflow-x: auto;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 70%;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
  &.message-right {
    flex-direction: row-reverse; 
  }
  &.message-left {
    justify-content: flex-start;
  }
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  margin: 0 10px;
}

.message-bubble {
  max-width: 70%;
  position: relative;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  
  &.bubble-left {
    background-color: #FFFFFF;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    
    &:before {
      content: "";
      position: absolute;
      left: -8px;
      top: 10px;
      border-width: 6px 10px 6px 0;
      border-style: solid;
      border-color: transparent #FFFFFF transparent transparent;
    }
  }
  
  &.bubble-right {
    background-color: #95EC69;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    
    &:before {
      content: "";
      position: absolute;
      right: -8px;
      top: 10px;
      border-width: 6px 0 6px 10px;
      border-style: solid;
      border-color: transparent transparent transparent #95EC69;
    }
  }
  &.bubble-active {
    &.bubble-left {
      background-color: #e5e5e5;
      &:before {
        border-color: transparent #e5e5e5 transparent transparent;
      }
    }
    &.bubble-right {
      background-color: #85d45e;
      &:before {
        border-color: transparent transparent transparent #85d45e;
      }
    }
  }
}

.message-text {
  word-break: break-word;
  white-space: pre-wrap;
}

/* 图片消息样式 */
.message-image-container {
  max-width: 30%;
  display: flex;
  margin: 0 10px;
  margin-bottom: 15px;

  &.image-right {
    margin-left: auto;
    justify-content: flex-end;
    
    img {
      max-width: 70%;
    }
  }
  
  &.image-left {
    justify-content: flex-start;
  }
  
  img {
    max-width: 70%;
    max-height: 300px;
    border-radius: 4px;
    display: block;
  }
}

/* 加载更多指示器 */
.loading-more {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 14px;
}

// 右键@窗口
.context-menu {
  position: fixed;
  z-index: 10000;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  min-width: 80px;
  .menu-item {
    padding: 8px 15px;
    cursor: pointer;
    font-size: 14px;
    &:hover {
      background-color: #f5f5f5;
    }
  }
}
</style>