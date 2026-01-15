<template>
  <div class="chat-detail">
    <Head 
      v-if="chatId && personsLoaded"
      ref="HeadRef"
      :nicknameProp="nickname" 
      :avoid_disturb="avoid_disturb" 
      :is_top="is_top" 
      :sign="sign" 
      :chatId="chatId"
      :personsList="PersonsList"
      @design-disturb="Disturb"
      @putTop="put_top"
      @handleClear="ClearContent"
      @openAdd="OpenAdd"
      @openClose="OpenClose"
      @toggle-profile="handleToggleProfile"
      @exit="exitGroup"
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
        v-for="(message, index) in GroupDetail" 
        :key="index" 
        class="message-item"
        :class="{ 
          'message-right': message.is_me,
          'message-left': !message.is_me
        }"
      > 
        <div v-if="message.msg_type === 9" class="notification-message">
          <div >{{ message.msg_content }}</div>
        </div>
        <template v-else>
          <img 
            class="avatar" 
            :src="$formatAvatar(message.send_logo)" 
            @click.stop="toggleProfile(message, $event)"
            @contextmenu.prevent="openContextMenu(message, $event)"
            alt="头像"
          />
          <div class="message-content">
            <!-- 所有消息都显示发送者名称和时间 -->
            <div class="sender-name" :class="{ 'sender-right': message.is_me, 'sender-left': !message.is_me }">
              <!-- 只有我发的消息（右对齐）才互换时间和名称位置 -->
              <template v-if="message.is_me">
                <span class="time">{{formatMsgTime(message.created_at)}}</span>
                <span>{{ message.send_nickname || nickname }}</span>
              </template>
              <template v-else>
                <span>{{ message.send_nickname || nickname }}</span>
                <span class="time">{{formatMsgTime(message.created_at)}}</span>
              </template>
            </div>
            <div 
              v-if="message.msg_type === 1" 
              class="message-bubble" 
              :class="{ 
                'bubble-right': message.is_me, 
                'bubble-left': !message.is_me,
                'bubble-active': activeMessageId === message.id }"
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
        </template>
      </div>
    </div>

    <!-- 右键菜单 - 头像 -->
    <div 
      v-if="contextMenu.show && contextMenu.type === 'avatar'"
      class="context-menu" 
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="mentionUser">@TA</div>
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
      <div v-if="sign == '1' || sign == '2'" class="menu-item" @click="revokeMsg">撤回</div>
    </div>

    <UserProfileCard 
      :userId="profileUserId"
      :position="profilePosition"
      @close="closeProfileCard"
      @send="EnterPrivate"
      @add="addFriend"
      class="infoCard"
    />
    <input 
      type="file" 
      ref="fileInputRef"
      accept="image/*"
      @change="handleImageSelect"
      style="display: none"
    >
    <ChatInput
      @send-message="handleSendMessage"
      @trigger-image-upload="triggerImageUpload"
      @add-pasted-image="handlePastedImage"
      @remove-image="removePendingImage"
      :online-users="PersonsList"
      :pendingImages="pendingImages"
      ref="chatInputRef"
    ></ChatInput>
    <selectFriend 
      class="Selection" 
      v-if="selectStatus"
      :personsList="PersonsList"
      :mode="currentMode"
      @close="closeSelect"
      @select="addSelectFriend"
      @remove="DelSelectFriend"
      >
    </selectFriend>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick ,onBeforeUnmount} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {apiGroupDetail,apiSendMessages,apiUploadImage,apiAvoidDisturb,apiPutTop,apiClearContent,
apiFriendRequest,apiDisplayDetail,apiGroupPersons,apiRevokeMsg,apiContentCollect,apiPullToGroup,
apiCuratorLogout,apiUserLogout } from '@/api/user';
import ChatInput from "./components/input.vue"
import Head from "./components/head.vue"
import selectFriend from '@/components/selectFriend.vue';
// import GroupWebSocketService from '@/utils/groupWebSocket'
import UserProfileCard from '../Contact/components/UserProfileCard.vue'
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/user';
import { formatMsgTime } from '@/utils/date.js'
import { ElMessage } from 'element-plus'
const userStore = useUserStore();
const chatStore = useChatStore();
const route = useRoute()
const router = useRouter()
const chatId = ref(null)
const GroupDetail = ref([])
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
const sign = ref(null)
const storedUid = localStorage.getItem('uid')
const user_id = ref(null)
const groupWebSocketService = ref(null)
const pendingImages = ref([])
const selectStatus = ref(false)
const HeadRef = ref(null);
const chatInputRef = ref(null);
const activeMessageId = ref(null)
const currentMode = ref('add')


//打开添加群员
const OpenAdd = () => {
  currentMode.value = 'add'
  selectStatus.value = true
}
//关闭选中添加
const closeSelect = () => {
  selectStatus.value = false
}
//打开移除群员
const OpenClose = () => {
  currentMode.value = 'remove'
  selectStatus.value = true
}
// 退出群聊
const exitGroup = async () => {
  try {
    await apiUserLogout({
      model_id: chatId.value
    });
    ElMessage({ message: '退出成功', type: 'success' });
    // 清除 forceReload 参数避免重复触发
    router.push({
      name: 'chat',
      query: { forceReload: true }
    }).then(() => {
      // 成功跳转后清除参数
      router.replace({ query: {} });
    });
  } catch (error) {
    ElMessage({ message: '退出失败', type: 'error' });
    console.error('退出群聊失败:', error);
  }
}

const addSelectFriend = async (selectedFriends) => {
  // 提取选中好友的ID数组
  const userIds = selectedFriends.map(friend => friend.friend_id);
  await apiPullToGroup({
    model_id: chatId.value,
    user_id_arr: userIds
  });
  await getGroupPersons();
  ElMessage({message: '添加成功',type: 'success'});
}
const DelSelectFriend = async (selectedFriends) => {
  const userIds = selectedFriends.map(friend => friend.uid);
  await Promise.all(
    userIds.map(userId => 
      apiCuratorLogout({
        model_id: chatId.value,
        user_id: userId  // 现在是单个字符串
      })
    )
  );
  await getGroupPersons();
  ElMessage({message: '移出成功',type: 'success'});
}

// 头像右键菜单函数
const openContextMenu = (message, event) => {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'avatar',
    message: message
  };
};
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
  type: '', // 'avatar' 或 'text'
  message: null
});
// 关闭菜单
const closeContextMenu = () => {
  contextMenu.value.show = false;
  activeMessageId.value = null;
};

//点击头像@
const mentionUser = () => {
  if (contextMenu.value.message) {
    const user = {
      id: contextMenu.value.message.send_id, // 使用send_id作为用户ID
      name: contextMenu.value.message.send_nickname || nickname.value
    };
    if (chatInputRef.value) {
      chatInputRef.value.addMentionedUser(user);
    }
  }
  closeContextMenu();
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
//消息撤回
const revokeMsg = async () => {
  if (!contextMenu.value.message) return;
  try {
    await apiRevokeMsg({
      msg_id: contextMenu.value.message.id
    });
    getGroupDetail();
    ElMessage({
      message: '消息已撤回',
      type: 'success',
    });
  } catch (error) {
    console.error('撤回消息失败:', error);
    ElMessage({
      message: '撤回消息失败',
      type: 'error',
    });
  }
  closeContextMenu();
}

//获取在馆人员列表
const PersonsList = ref(null)
const personsLoaded = ref(false)
const getGroupPersons = async (id) => {
  const res = await apiGroupPersons({
    model_id: chatId.value
  })
  PersonsList.value = res.data
  personsLoaded.value = true
}

//展馆详情
const room = ref(null)
const getDisplayDetail = async (id) => {
  try {
    const res = await apiDisplayDetail(id);
    room.value = res.data.room
    user_id.value = `${storedUid}&${room.value}`;
    // if (groupWebSocketService.value) {
    //   groupWebSocketService.value.disconnect()
    // }
    // groupWebSocketService.value = new GroupWebSocketService(
    //   chatId.value,
    //   room.value,
    //   user_id.value,
    //   sign.value
    // )
    // groupWebSocketService.value.connect()
  } catch (error) {
    console.error("获取展馆详情失败:", error);
  }
}

//添加好友
const addFriend = async () => {
  try {
    await apiFriendRequest({
      to_uid: profileUserId.value
    });
    ElMessage({
      message: '添加成功',
      type: 'success',
    });
  } catch (error) { 
    ElMessage({
      message: '添加失败',
      type: 'error',
    });
  }
};

const showProfileCard = ref(false)
const profileUserId = ref(null)
const profilePosition = ref({ x: 0, y: 0 })
const profileUserNickname = ref(null)

//点击头像查看信息详情
const toggleProfile = (message, event) => {
  if (showProfileCard.value && profileUserId.value === message.send_id) {
    closeProfileCard();
    return;
  }
  const clickX = event.clientX;
  const clickY = event.clientY;
  profilePosition.value = {
    x: clickX,
    y: clickY
  };
  profileUserId.value = message.uid;
  profileUserNickname.value = message.send_nickname; 
  showProfileCard.value = true;
}
const handleToggleProfile = ({ user, event }) => {
  console.log("触发了head的点击")
  toggleProfile(user, event);
};
// 暴露方法给子组件
const toggleProfileFromParent = (user, event) => {
  toggleProfile(user, event);
};
defineExpose({
  toggleProfile: toggleProfileFromParent
});
// 确保关闭卡片方法正确重置状态
const closeProfileCard = () => {
  showProfileCard.value = false;
  profileUserId.value = null;
}
//合成私聊会话chat_id
const generateChatId = () => {
  const myId = parseInt(storedUid)
  const contactId = parseInt(profileUserId.value)
  if (myId < contactId) {
    return `${myId}-${contactId}`
  } else {
    return `${contactId}-${myId}`
  }
}
//点击私聊
const EnterPrivate = () => {
  const chatId = generateChatId()
  router.push({
    name: 'private-chat-detail',
    params: { id: chatId },
    state: { 
      chat_with_uid: profileUserId.value,
      nickname: profileUserNickname.value
    }
  })
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
  getGroupDetail();
}

const triggerImageUpload = () => {
  fileInputRef.value.click()
}
const handlePastedImage = (imageData) => {
  pendingImages.value.push(imageData);
};
// 移除待发送图片
const removePendingImage = (index) => {
  URL.revokeObjectURL(pendingImages.value[index].previewUrl);
  pendingImages.value.splice(index, 1);
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
// 处理消息发送
const handleSendMessage = async (messageText, remindIds = []) => {
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
      await apiSendMessages({
        chat_id: chatId.value,
        msg_type: 2, // 图片消息
        msg_content: imageUrl,
        remind_ids: remindIds 
      });
      // 释放预览URL并从待发送列表中移除
      URL.revokeObjectURL(image.previewUrl);
      pendingImages.value.shift();
    }
    // 如果有文本内容，发送文本消息
    if (messageText.trim()) {
      await apiSendMessages({
        chat_id: chatId.value,
        msg_type: 1, // 文本消息
        msg_content: messageText,
        remind_ids: remindIds 
      });   
    }
    nextTick(scrollToBottom)
    if (chatInputRef.value) {
      chatInputRef.value.mentionedUserIds = [];
    }
  } catch (error) {
    console.error("消息发送失败:", error);
  }
};
// 发送文本消息
// const handleSendMessage = async (content, remindIds = []) => {
//   try {
//     const res = await apiSendMessages({
//       chat_id: chatId.value,
//       msg_type: 1,
//       msg_content: content,
//       remind_ids: remindIds 
//     });
//     nextTick(scrollToBottom)
//     // 重置被@用户ID数组
//     if (chatInputRef.value) {
//       chatInputRef.value.mentionedUserIds = [];
//     }
//   } catch (error) {
//     console.error('发送消息失败:', error)
//   }
// }


//获取聊天详情
const getGroupDetail = async (id) => {
  isLoading.value = true
  try {
    const res = await apiGroupDetail({
      chat_id: id || chatId.value,
      limit: 20,
      page: page.value,
      join_notice: 1
    })
    if (page.value === 1) {
      GroupDetail.value = res.data.data.reverse()
      // 初始化时滚动到底部
      nextTick(scrollToBottom)
    } else {
      // 加载更多时，将新数据放在前面
      const newMessages = res.data.data.reverse()
      const prevScrollHeight = messageListRef.value.scrollHeight
      GroupDetail.value = [...newMessages, ...GroupDetail.value]
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
  await getGroupDetail(chatId.value)
}

// 监听路由变化
watch(() => route.params.id, (newId) => {
  chatId.value = newId
  const state = window.history.state
  chatWithUid.value = state?.chat_with_uid
  nickname.value = state?.nickname
  message_id.value = state?.message_id
  sign.value = state?.sign
  avoid_disturb.value = chatStore.getDisturbStatus(newId) ?? state?.avoid_disturb
  is_top.value = chatStore.getTopStatus(newId) ?? state?.is_top
  getGroupDetail(newId)
  getDisplayDetail(chatId.value);
  getGroupPersons(chatId.value)
})

onMounted(() => {
  chatId.value = route.params.id
  const state = window.history.state
  chatWithUid.value = state?.chat_with_uid
  nickname.value = state?.nickname
  message_id.value = state?.message_id
  sign.value = state?.sign
  avoid_disturb.value = chatStore.getDisturbStatus(route.params.id) ?? state?.avoid_disturb
  is_top.value = chatStore.getTopStatus(route.params.id) ?? state?.is_top
  getGroupDetail(route.params.id)
  getDisplayDetail(chatId.value);
  getGroupPersons()
  window.addEventListener('websocket-message', handleWebSocketMessage)
  document.addEventListener('click', closeContextMenu);
})
onBeforeUnmount(() => {
  window.removeEventListener('websocket-message', handleWebSocketMessage)
  document.removeEventListener('click', closeContextMenu);
  if (groupWebSocketService.value) {
    groupWebSocketService.value.disconnect()
  }
})
const groupMessage = () => {
  console.log("收到消息了,主动更新")
  getGroupDetail();
}
const handleWebSocketMessage = (event) => {
  const message = event.detail
  // 处理群聊消息
  if (message.type === 'chat_group' ) {
    groupMessage(message)
  }
}
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
    min-width: 0;
    align-self: flex-end;
    justify-content: flex-start;
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

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  min-width: 0;
  width: auto;
  flex: 0 1 auto;
  padding: 0 4px;
  .message-right & {
    align-items: flex-end;
  }
  .message-left & {
    align-items: flex-start;
  }
}

.sender-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  word-break: break-word;
  white-space: normal;
  max-width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  .time {
    font-size: 11px;
    color: #999;
  }
  &.sender-left {
    text-align: left;
    margin-left: 6px;
    span:not(.time) {
      padding-right: 6px;
    }
  }
  &.sender-right {
    text-align: right;
    justify-content: flex-end;
    margin-right: 6px;
    .time {
      order: 1;
    }
    span:not(.time) {
      order: 2;
      padding-left: 6px;
    }
  }
}

.message-bubble {
  max-width: 100%;
  position: relative;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  display: inline-block;
  box-sizing: border-box;
  word-break: break-word;
  white-space: pre-wrap;
  &.bubble-left {
    background-color: #FFFFFF;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    min-width: 0 !important;
    width: fit-content;
    max-width: 100%;
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
    min-width: 0 !important;
    width: fit-content;
    max-width: 100%;
    &:before {
      content: "";
      position: absolute;
      right: -6px;
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
  min-width: 0;
  max-width: 100%;
  width: 100%;
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
    margin-right: 46px;
  }
  &.image-left {
    justify-content: flex-start;
    margin-left: 6px;
  }
}
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
.Selection{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 700px;
  height: 540px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1), 0 10px 30px rgba(0, 0, 0, 0.15);
}
.notification-message {
  width: 100%;
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 5px 0;
}
.infoCard{
  z-index: 99999;
}
</style>