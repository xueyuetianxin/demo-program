<template>
  <div class="contact-view">
    <div class="contact-list">
      <!-- 新的朋友分组 -->
      <div class="contact-group" @click="toggleGroup('newFriends')">
        <div class="group-header">
          <el-icon :class="{'rotate-icon': activeGroup === 'newFriends'}">
            <ArrowRight />
          </el-icon>
          <span>新的朋友</span>
        </div>
        <!-- 申请列表 -->
        <div v-show="activeGroup === 'newFriends'" class="group-content">
          <div 
            v-for="apply in filteredApplyList" 
            :key="apply.id"
            class="contact-item apply-item"
            @click.stop="viewApply(apply)"
          >
            <div class="contact-info">
              <img class="logo_avater" :src="$formatAvatar(apply.apply_logo)" alt="">
              <div class="apply_all">
                <div class="apply_head">
                  <span class="nickname">{{ apply.apply_nickname }}</span>
                  <span class="agree_buttom1" v-if="apply.status == 0">等待验证</span>
                  <span class="agree_buttom1" v-if="apply.status == 1">已添加</span>
                </div>
                <div class="apply_body" v-if="apply.apply_reason == ''">我是{{ apply.apply_nickname }}</div>
                <div class="apply_body" v-if="apply.apply_reason !== ''">{{ apply.apply_reason }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 联系人分组 -->
      <div class="contact-group" @click="toggleGroup('contacts')">
        <div class="group-header">
          <el-icon :class="{'rotate-icon': activeGroup === 'contacts'}">
            <ArrowRight />
          </el-icon>
          <span>联系人</span>
          <span class="friend-count">({{ friendList.length }})</span>
        </div>
        <!-- 好友列表 -->
        <div v-show="activeGroup === 'contacts'" class="group-content">
          <div 
            v-for="item in friendList" 
            :key="item.id" 
            class="contact-item"
            :class="{ active: $route.params.id === item.friend_id.toString() }"
            @click.stop="selectChat(item)"
            @contextmenu.prevent="openContextMenu($event, item)"
          >
            <div class="contact-info">
              <img class="logo_avater" :src="$formatAvatar(item.logo)" alt="">
              <span class="title">{{ item.friend_remark || item.nickname }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系人分组 -->
      <div class="contact-group" @click="toggleGroup('enterprise')">
        <div class="group-header">
          <el-icon :class="{'rotate-icon': activeGroup === 'enterprise'}">
            <ArrowRight />
          </el-icon>
          <span>企业成员</span>
          <span class="friend-count">({{ InstitutionList.length }})</span>
        </div>
        <!-- 好友列表 -->
        <div v-show="activeGroup === 'enterprise'" class="group-content">
          <div 
            v-for="item in InstitutionList" 
            :key="item.id" 
            class="contact-item"
            
          >
            <div class="contact-info">
              <img class="logo_avater" :src="$formatAvatar(item.user_logo)" alt="">
              <div class="title">
                <div class="first_name">{{ item.name }}</div>
                <div class="second_name">{{ item.post_name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu" 
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="sendMessage">发送消息</div>
      <div class="menu-item" @click="delFriend">删除联系人</div>
    </div>
    
    <router-view class="contact-detail-container"></router-view>  
  </div>
</template>

<script setup>
import { ref, onMounted , computed ,onBeforeUnmount} from 'vue'
import { apiFriendList , apiApplyList , apiDelFriend ,apiInstitutionList} from '@/api/user.js';
import { useRouter } from 'vue-router'
import { useFriendStore } from '@/stores/friend.js'
import { storeToRefs } from 'pinia'
import { ArrowRight } from '@element-plus/icons-vue';

const router = useRouter()
const friendStore = useFriendStore();
const { friendList } = storeToRefs(friendStore)
const ApplyList = ref([])
const InstitutionList = ref([])
const activeGroup = ref('contacts') // 当前激活的分组
const priseMode = localStorage.getItem('enterpriseMode')
// 获取好友列表
const getFriendList = async () => {
  const res = await apiFriendList({ 
    limit: 999 ,
    institution_id: priseMode == 1 ? 2 : 0 
  })
  friendStore.friendList = res.data.data
  localStorage.setItem('friendList', JSON.stringify(friendStore.friendList))
}

// 获取好友申请列表
const getApplyList = async () => {
  const res = await apiApplyList({
    institution_id: priseMode == 1 ? 2 : 0 
  })
  ApplyList.value = res.data.data
}

//获取企业成员列表
const getInstitutionList = async () => {
  const res = await apiInstitutionList()
  InstitutionList.value = [...new Map(
    res.data.user_list.map(item => [item.user_id, item])
  ).values()]
}




const filteredApplyList = computed(() => {
  return ApplyList.value.filter(apply => apply.is_me === 0)
})

// 右键菜单相关
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  selectedFriend: null
})

// 打开右键菜单
const openContextMenu = (e, friend) => {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    selectedFriend: friend
  }
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenu.value.visible = false
}

// 点击其他地方关闭菜单
const handleClickOutside = () => {
  if (contextMenu.value.visible) {
    closeContextMenu()
  }
}

const storedUid = ref(null)
// 生成私聊会话ID
const generateChatId = (friendId) => {
  const myId = parseInt(storedUid.value)
  const contactId = parseInt(friendId)
  if (myId < contactId) {
    return `${myId}-${contactId}`
  } else {
    return `${contactId}-${myId}`
  }
}
// 删除好友
const delFriend = async () => {
  if (!contextMenu.value.selectedFriend) return
  try {
    await apiDelFriend(contextMenu.value.selectedFriend.id)
    await friendStore.removeFriend(contextMenu.value.selectedFriend.friend_id)
    ElMessage({
      message: '删除成功',
      type: 'success',
    })
    closeContextMenu()
    // 如果当前查看的是被删除的好友详情，则跳转到联系人列表
    if (router.currentRoute.value.params.id === contextMenu.value.selectedFriend.friend_id.toString()) {
      router.push({ name: 'contact' })
    }
    await getFriendList()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 发送消息
const sendMessage = () => {
  if (!contextMenu.value.selectedFriend) return
  const chatId = generateChatId(contextMenu.value.selectedFriend.friend_id)
  router.push({
    name: 'private-chat-detail',
    params: { id: chatId },
    state: { 
      chat_with_uid: contextMenu.value.selectedFriend.friend_id,
      nickname: contextMenu.value.selectedFriend.nickname
    }
  })
  closeContextMenu()
}


onMounted(() => {
  getFriendList()
  getApplyList()
  
  storedUid.value = localStorage.getItem('uid')
  document.addEventListener('click', handleClickOutside)
  if(priseMode == 1){
    getInstitutionList()
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
// 切换分组展开/收起
const toggleGroup = (groupName) => {
  activeGroup.value = activeGroup.value === groupName ? null : groupName
}

// 查看好友申请详情
const viewApply = (apply) => {
  if(apply.status == 1){
    router.push({
      name: 'contact-detail', 
      params: { id: apply.apply_id }
    })
  } else if (apply.status == 0) {
    router.push({
      name: 'contact-verify',
      params: { id: apply.apply_id },
      state: {
        reason: apply.apply_reason,
        apply_id: apply.id
    }
    })
  }
}

// 选择好友信息
const selectChat = (item) => {
  router.push({ 
    name: 'contact-detail', 
    params: { id: item.friend_id },
    state: { 
      friend_remark: item.friend_remark,
      list_id: item.id
    }
  })
}
</script>

<style scoped lang="scss">
.contact-view {
  display: flex;
  background-color: #f7f7f7;
  width: 100%;
  max-width: 1200px;
  min-width: 500px;
  height: 100%;
  .contact-list {
    width: 200px;
    flex-shrink: 0;
    height: 100%;
    overflow-y: auto;
    border-right: 1px solid #d0cfcf;
    .contact-group {
      cursor: pointer;
      border-bottom: 1px solid #eaeaea;
      .group-header {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        font-weight: 500;
        background-color: #f7f7f7;
        .el-icon {
          margin-right: 8px;
          transition: transform 0.3s;
        }
        .rotate-icon {
          transform: rotate(90deg);
        }
        .friend-count {
          margin-left: 5px;
          color: #999;
          font-size: 12px;
        }
      }
      .group-content {
        background-color: #fff;
        overflow-y: auto;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }
    }
    .contact-item {
      width: 200px;
      display: flex;
      align-items: center;
      padding: 12px 20px;
      .contact-info {
        display: flex;
        width: 100%;
        align-items: center;
        .logo_avater {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 3px;
          margin-right: 10px;
        }
        .title{
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
          max-width: 100%;
          .first_name{
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            max-width: 100%;
          }
          .second_name{
            font-size: 12px;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #999;
          }
        }
        .apply_all {
          flex: 1;
          min-width: 0;
          .apply_head {
            display: flex;
            align-items: center;
            font-size: 14px;
            .nickname {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .agree_buttom, .agree_buttom1 {
              flex-shrink: 0; 
              padding: 2px 4px;
              border-radius: 2px;
              margin-left: 8px;
              font-size: 10px;
            }
            .agree_buttom {
              background: #5399f5;
              color: #fff;
            }
            .agree_buttom1 {
              color: #999;
            }
          }
          .apply_body {
            font-size: 12px;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
      &.apply-item {
        display: flex;
        .contact-info {
          display: flex;
          align-items: center;
        }
      }
    }
    .contact-item:hover {
      background-color: #f9f9f9;
    }
    .contact-item.active {
      background-color: #E6F0FE;
    }
  }
  .contact-detail-container {
    flex: 1;
    min-width: 0;
    background-color: #f0f0f0;
  }
}
//右键菜单
.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
  
  .menu-item {
    padding: 8px 20px;
    font-size: 14px;
    color: #606266;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f7fa;
      color: #409eff;
    }
  }
}
</style>