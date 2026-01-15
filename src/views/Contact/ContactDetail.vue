<template>
  <div class="contact-detail">
    <div class="center-container">
      <div class="info_item">   
        <div class="left">
          <img class="infoLogo" :src="$formatAvatar(PublicInfo?.logo)" alt="" srcset="">
        </div>
        <div class="right">
          <div class="right_head" v-if="friend_remark">
            <span>{{ friend_remark }}</span>
            <div class="more-container">
              <span @click.stop="toggleMoreMenu"><el-icon class="icons"><More /></el-icon></span>
              <div v-if="showMoreMenu" class="more-menu">
                <div class="menu-item">加入黑名单</div>
                <div @click="enter_delete" class="menu-item delete">删除联系人</div>
              </div>
            </div>
          </div>
          <div>
            <span v-if="friend_remark">昵称</span>
            {{ PublicInfo?.nickname }}
          </div>
          <div>DID号:{{ PublicInfo?.identity_id }}</div>
          <div>地区:{{ PublicInfo?.province }}  {{ PublicInfo?.city }}</div>
        </div>
      </div>
      <div class="info_item others">
        <div class="remark_name">
          <div class="title">备注</div>
          <div v-if="!beizhu_status" @click="startEdit">
            {{ friend_remark || PublicInfo?.nickname }}
          </div>
          <div v-else>
            <el-input 
              ref="remarkInputRef"
              v-model="remarkInput" 
              style="width: 240px"
              @blur="saveRemark"
              @keyup.enter="saveRemark"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="buttoms">
      <div class="send_buttom" @click="sendMessage">发信息</div>
    </div>

    <el-dialog v-model="centerDialogVisible" title="删除好友" width="500" center align-center>
      <span>
        确定要删除好友吗？
      </span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cannel">取消</el-button>
          <el-button type="primary" @click="confirm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>


  </div>
</template>

<script setup>
import { ref, computed ,watch ,onMounted ,nextTick,onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiPublicInfo , apiDelFriend } from '@/api/user';
import { ElMessage } from 'element-plus'
import { useFriendStore } from '@/stores/friend';
import { More } from '@element-plus/icons-vue';

const friendStore = useFriendStore();
const remarkInput = ref('')
const beizhu_status = ref(false)
const remarkInputRef = ref(null) // 用于获取输入框DOM引用
const showMoreMenu = ref(false)
const list_id = ref(null)
const centerDialogVisible = ref(false)

const route = useRoute()
const router = useRouter()
const PublicInfo = ref(null)
// 使用计算属性获取当前好友信息
const currentFriend = computed(() => {
  return friendStore.friendList.find(
    f => f.friend_id.toString() === route.params.id.toString()
  ) || {};
});
// 使用计算属性获取备注
const friend_remark = computed(() => {
  return currentFriend.value.friend_remark || currentFriend.value.nickname || '';
});
const storedUid = ref(null) 

// 添加点击外部关闭菜单的逻辑
const handleClickOutside = (event) => {
  const moreContainer = document.querySelector('.more-container');
  if (moreContainer && !moreContainer.contains(event.target)) {
    showMoreMenu.value = false;
  }
};






// 获取联系人详情
const getPublicInfo = async (id) => {
  try {
    const res = await apiPublicInfo(id)
    PublicInfo.value = res.data
  } catch (error) {
    PublicInfo.value = null
  }
}

// 开始编辑备注
const startEdit = () => {
  beizhu_status.value = true;
  remarkInput.value = friend_remark.value;
  nextTick(() => remarkInputRef.value?.focus());
}

// 保存备注
const saveRemark = async () => {
  if (!remarkInput.value.trim()) {
    beizhu_status.value = false;
    return;
  }
  try {
    await friendStore.updateRemark(route.params.id, remarkInput.value);
    ElMessage.success('备注修改成功');
  } catch (error) {
    ElMessage.error('备注修改失败');
  } finally {
    beizhu_status.value = false;
  }
};


// 生成私聊会话ID
const generateChatId = () => {
  const myId = parseInt(storedUid.value)
  const contactId = parseInt(route.params.id)
  if (myId < contactId) {
    return `${myId}-${contactId}`
  } else {
    return `${contactId}-${myId}`
  }
}

// 跳转到私聊页面
const sendMessage = () => {
  const chatId = generateChatId()
  router.push({
    name: 'private-chat-detail',
    params: { id: chatId },
    state: { 
      chat_with_uid: route.params.id,
      nickname: friend_remark.value || PublicInfo.value?.nickname
    }
  })
}
const enter_delete = () => {
  showMoreMenu.value = !showMoreMenu.value;
  centerDialogVisible.value = true
}
// 修改菜单显示切换方法
const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value;
  if (showMoreMenu.value) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside);
    });
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
};
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
const cannel = () => {
  centerDialogVisible.value = false
}
//删除好友
const confirm = async () => {
  centerDialogVisible.value = false
  await apiDelFriend(list_id.value)
  await friendStore.removeFriend(route.params.id)
  ElMessage({
    message: '删除成功',
    type: 'success',
  })
  router.push({
    name: 'contact',
  })
}
// 监听路由变化
watch(route, (newRoute) => {
  if (newRoute.params.id) {
    getPublicInfo(newRoute.params.id)
    const state = window.history.state
    list_id.value = state?.list_id
    beizhu_status.value = false
    remarkInput.value = ''
  }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  storedUid.value = localStorage.getItem('uid')
  if (route.params.id) {
    getPublicInfo(route.params.id)
  }
})
</script>

<style scoped lang="scss">
.contact-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  .center-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    .info_item {
      width: 80%;
      max-width: 500px;
      margin: 15px auto;
      padding: 15px 0;
      border-bottom: 1px solid #ccc;
      display: flex;
      justify-content: center;
      .left {
        margin-right: 20px;
        .infoLogo {
          width: 60px;
          height: 60px;
          border-radius: 6px;
        }
      }
      .right {
        font-size: 16px;
        .right_head{
          width: 100%; 
          display: flex;
          justify-content: space-between;
          .icons{
            cursor: pointer;
            margin-top: 4px;
            padding: 2px;
            width: 16px;
            height: 16px;
            &:hover {
              background-color: #ccc;
            }
          }
        }
      }
      .remark_name {
        display: flex;
        align-items: center;
        .title {
          padding-right: 20px;
        }
      }
    }
    .others {
      padding-bottom: 30px;
    }
  }
  .buttoms {
    text-align: center;
    padding: 20px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    .send_buttom{
      width: 10%;
    }
  }
}
.more-container {
  position: relative;
  display: inline-block;
  .more-menu {
    position: absolute;
    right: -100px;
    top: 100%;
    background: white;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 10;
    min-width: 100px;
    .menu-item {
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      &:hover {
        background-color: #f5f7fa;
        color: #409eff;
      }
    }
    .delete{
      color: #dd4040;
      &:hover {
        background-color: #dd4040;
        color: #fff;
      }
    }
  }
}
</style>