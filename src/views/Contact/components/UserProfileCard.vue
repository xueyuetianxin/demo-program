<template>
  <div>
    <div 
      v-if="visible" 
      class="user-profile-card"
      :style="cardPosition"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
      @click.stop
    >
      <div class="header">
        <div class="close-btn" @click="close">×</div>
      </div>
      <div class="info_item">
        <div class="left">
          <img class="infoLogo" :src="$formatAvatar(userInfo?.logo)" alt="" srcset="">
        </div>
        <div class="right">
          <div>{{ userInfo?.nickname }}</div>
          <div>DID号:{{ userInfo?.identity_id }}</div>
          <div>地区:{{ userInfo?.province }}  {{ userInfo?.city }}</div>
        </div>
      </div>
      <div class="buttoms" v-if="showActionButton">
        <div v-if="isFriend" @click="sendMessage">发信息</div>
        <div v-else-if="!isCurrentUser" @click="addFriend">添加好友</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { apiPublicInfo } from '@/api/user';

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const emit = defineEmits(['close', 'send', 'add'])
const storedUid = localStorage.getItem('uid')
const uid = ref('')
const visible = ref(false)
const userInfo = ref({
  nickname: '',
  logo: '',
  identity_id: ''
})

// 获取好友列表缓存
const getCachedFriendList = () => {
  try {
    const cached = localStorage.getItem('friendList')
    return cached ? JSON.parse(cached) : []
  } catch (e) {
    console.error('解析好友列表缓存失败', e)
    return []
  }
}

// 计算属性：是否是当前登录用户
const isCurrentUser = computed(() => {
  return userInfo.value?.id && String(userInfo.value.id) === storedUid
})

// 计算属性：是否是好友
const isFriend = computed(() => {
  if (!userInfo.value?.id) return false
  const friendList = getCachedFriendList()
  return friendList.some(friend => 
    friend.friend_id === userInfo.value.id || 
    friend.id === userInfo.value.id
  )
})

// 计算属性：是否显示操作按钮
const showActionButton = computed(() => {
  // 当前用户不显示按钮
  if (isCurrentUser.value) return false
  // 非当前用户都显示按钮（好友显示发信息，非好友显示添加好友）
  return true
})

// 计算卡片位置，确保不会超出屏幕
const cardPosition = computed(() => {
  const { x, y } = props.position
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const cardWidth = 280
  const cardHeight = 300
  
  let left = x + 20
  let top = y - 20
  // 如果右侧空间不足，向左偏移
  if (left + cardWidth > screenWidth) {
    left = x - cardWidth - 20
  }
  // 如果顶部空间不足，向下偏移
  if (top < 0) {
    top = 20
  }
  // 如果底部空间不足，向上偏移
  if (top + cardHeight > screenHeight) {
    top = screenHeight - cardHeight - 20
  }
  
  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

// 获取用户信息
const fetchUserInfo = async () => {
  if (!uid.value) return
  try {
    const res = await apiPublicInfo(uid.value)
    userInfo.value = res.data
    visible.value = true
  } catch (error) {
    console.error('获取用户信息失败:', error)
    visible.value = false
  }
}

// 关闭卡片方法
const close = () => {
  if (clickFromAvatar.value) return;
  visible.value = false;
  emit('close');
}

// 发送消息
const sendMessage = () => {
  visible.value = false;
  emit('send');
}

// 添加好友
const addFriend = () => {
  visible.value = false;
  emit('add', userInfo.value);
}

// 监听userId变化
watch(() => props.userId, (newVal) => {
  if (newVal) {
    uid.value = newVal
    fetchUserInfo();
  } else {
    visible.value = false;
  }
})

// 点击外部关闭卡片
let closeTimer = null
let clickFromAvatar = ref(false);

const handleClickOutside = (e) => {
  const isAvatar = e.target.classList.contains('avatar') || e.target.closest('.avatar');
  if (isAvatar) {
    clickFromAvatar.value = true;
    setTimeout(() => {
      clickFromAvatar.value = false;
    }, 100);
    return;
  }
  
  if (visible.value && !e.target.closest('.user-profile-card')) {
    close();
  }
}

const onMouseEnter = () => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const onMouseLeave = () => {
  closeTimer = setTimeout(close, 1000)
}

// 添加全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
.user-profile-card {
  position: fixed;
  z-index: 2000;
  width: 280px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 6px;
  animation: slide-in 0.3s ease-out;
}
.info_item{
  display: flex;
  justify-content: center;
  .left{
    margin-right: 20px;
    .infoLogo{
      width: 50px;
      height: 50px;
      border-radius: 6px;
    }
  }
  .right{
    font-size: 16px;
  }
  padding-bottom: 20px;
}
.buttoms{
  padding-bottom: 20px;
  text-align: center;
  cursor: pointer;
  
  div {
    padding: 8px 16px;
    background-color: #4a90e2;
    color: white;
    border-radius: 4px;
    display: inline-block;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #3a7bc8;
    }
  }
}
.header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
    .close-btn {
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      color: #999;
      transition: color 0.2s;
      &:hover {
        color: #333;
      }
    }
}
</style>