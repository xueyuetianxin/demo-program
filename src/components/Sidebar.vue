<template>
  <div class="sidebar">
    <nav class="nav-links">
      <div class="top-links">
        <!-- 聊天导航项 -->
        <router-link 
          to="/chat" 
          class="nav-link"
          :style="{ color: ($route.name === 'chat' || $route.name === 'private-chat-detail' || $route.name === 'group-chat-detail') ? '#07C160' : '#999' }"
        >
          <img 
            class="icons" 
            :src="($route.name === 'chat' || $route.name === 'private-chat-detail' || $route.name === 'group-chat-detail') ? homeInactive    : homeActive" 
            alt="聊天"
          >
          <div>聊天</div>
        </router-link>
        
        <!-- 联系人导航项 -->
        <router-link 
          to="/contact" 
          class="nav-link"
          :class="{ active: $route.name === 'contact' || $route.name === 'contact-detail' }"
        >
          <img 
            class="icons" 
            :src="($route.name === 'contact' || $route.name === 'contact-detail' || $route.name === 'contact-verify') ? contactActive : contactInactive"  
            alt="联系人"
          >
          <div>联系人</div>
        </router-link> 

        <!-- 办公导航项 -->
        <router-link 
          v-if="enterpriseMode1"
          to="/office" 
          class="nav-link"
          :class="{ active: $route.name === 'office' || $route.name === 'office' }"
        >
          <img 
            class="icons1" 
            :src="($route.name === 'office' || $route.name === 'office') ? banGongActive : banGong"  
            alt="办公"
          >
          <div>办公</div>
        </router-link> 

        <!-- 云盘导航项 -->
        <router-link 
          v-if="enterpriseMode1"
          to="/cloud" 
          class="nav-link"
          :class="{ active: $route.name === 'cloud' || $route.name === 'cloud' }"
        >
          <img 
            class="icons" 
            :src="($route.name === 'cloud' || $route.name === 'cloud') ? CloudActive : Cloud"  
            alt="云盘"
          >
          <div>云盘</div>
        </router-link> 

        <!-- 会议导航项 -->
        <router-link 
          v-if="enterpriseMode1"
          to="/meeting" 
          class="nav-link"
          :class="{ active: $route.name === 'meeting' || $route.name === 'meeting' }"
        >
          <img 
            class="icons" 
            :src="($route.name === 'meeting' || $route.name === 'meeting') ? MeetingActive : Meeting"  
            alt="会议"
          >
          <div>会议</div>
        </router-link> 
      </div>

      <!-- 底部图标区域 -->
      <div class="bottom-links">
        <div class="nav-link" @click="toggleSettings">
          <el-icon class="icon" size="22"><Operation /></el-icon>
          <div>设置</div>
        </div>
      </div>
    </nav>

    <el-dialog v-model="isSettingsActive" title="设置" width="400" center>
      <div class="Allbody">
        <div class="settings-panel-left">
          <div 
            class="setting-item" 
            :class="{ active: activeSetting === 'account' }"
            @click="activeSetting = 'account'"
          >
            账号管理
          </div>
          <div 
            class="setting-item" 
            :class="{ active: activeSetting === 'identity' }"
            @click="activeSetting = 'identity'"
          >
            身份切换
          </div>
        </div>
        <div class="settings-panel-right">
          <div v-if="activeSetting === 'account'" class="setting-content">
            <div class="info-item">
              <div class="left">
                <img class="avater" :src="$formatAvatar(meInfo?.logo)" alt="" srcset="">
                <div class="item-right">
                  <div>{{ meInfo?.nickname }}</div>
                  <div>{{ meInfo?.identity_id }}</div>
                </div>
              </div>
              <div class="right">
                <span class="tuichu" @click="handleLogout">退出登录</span>
              </div>
            </div>
          </div>
          
          <div v-if="activeSetting === 'identity'" class="setting-content">
            <div class="identity-content">
              <div class="content-left">
                <div>切换到企业模式</div>
              </div>
              <div class="content-right">
                <el-switch 
                  size="small" 
                  v-model="value2"
                  @change="handleEnterpriseModeChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div> 
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Operation } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chatStore';
import { apiMeInfo } from '@/api/user'
// 导入所有图标资源
import homeInactive from '@/static/icons/xiaoxi.png';
import homeActive from '@/static/icons/xiaoxi-h.png';
import contactInactive from '@/static/icons/txl.png';
import contactActive from '@/static/icons/txl-h.png';
import banGong from '@/static/icons/bangong2.png';
import banGongActive from '@/static/icons/bangong-h.png';
import Cloud from '@/static/icons/cloud.png'
import CloudActive from '@/static/icons/cloud-h.png'
import Meeting from '@/static/icons/meeting.png'
import MeetingActive from '@/static/icons/meeting-h.png'

const chatStore = useChatStore();
const userStore = useUserStore()
const route = useRoute();
const router = useRouter();
const meInfo = ref(null)
const isSettingsActive = ref(false);
const activeSetting = ref('account');
const value2 = ref(false)

// 组件挂载时从本地存储读取企业模式状态
onMounted(() => {
  const enterpriseMode = localStorage.getItem('enterpriseMode')
  value2.value = enterpriseMode === '1'
})
const enterpriseMode1 = ref(localStorage.getItem('enterpriseMode') === '1')
const toggleSettings = async () => {
  isSettingsActive.value = !isSettingsActive.value;
  if(isSettingsActive.value){
    const res = await apiMeInfo();
    meInfo.value = res.data
  }
}

const handleLogout = () => {
  userStore.logout() // 调用store的登出方法
  isSettingsActive.value = false // 关闭设置弹窗
  router.push('/home');
}

// 监听企业模式开关变化
const handleEnterpriseModeChange = (val) => {
  value2.value = val
  // 保存到本地存储，1表示开启，0表示关闭
  chatStore.toggleEnterpriseMode(val)
  enterpriseMode1.value = val
  isSettingsActive.value = false
  router.push({
    name: 'chat',
    query: { forceReload: true }
  }).then(() => {
    // 成功跳转后清除参数
    router.replace({ query: {} });
  });
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 60px;
  background-color: #e8e7e7;
  color: rgb(17, 5, 5);
  height: 100%;
  .nav-links {
    padding: 10px 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    .nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 0;
      color: #666;
      text-decoration: none;
      transition: background-color 0.3s;
      font-size: 12px;
      margin: 12px 0;
      &:hover {
        background-color: #ddd;
      }
      &.active {
        background-color: #ddd;
        color: #07C160;       
        .icon-chat {
          color: #07C160 !important;
        }
      }
    }
    .icons {
      width: 20px;
      height: 20px;
      margin-bottom: 4px;
    }
    .icons1 {
      margin-left: 6px;
      width: 30px;
      height: 20px;
      margin-bottom: 4px;
    }
    .icon-chat {
      width: 20px;
      height: 20px;
      margin-bottom: 4px;
      background-color: #999;
      display: inline-block;
    }
  }
}
.icon{
  margin-bottom: 4px;
}
.Allbody{
  display: flex;
  justify-content: space-between;
  height: 400px;
  .settings-panel-left{
    width: 76px; 
    background: #eaeaea;
    .setting-item{
      padding: 8px;
      cursor: pointer;
      &:hover {
        background: #14a7f5;
        color: #fff;
      }
      &.active {
        background: #14a7f5;
        color: #fff;
      }
    }
  }
  .settings-panel-right{
    background: #eaeaea;
    width: 280px;
    padding: 8px;
    .panel-header{
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .info-item{
      display: flex;
      align-items: center;
      justify-content: space-between;
      .left{
        display: flex;
        align-items: center;
        .avater{
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }
      }
      .right{
        .tuichu{
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          background: rgb(19, 131, 223);
          color: #fff;
        }
      }
    }
    .identity-content {
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}

.bottom-links .nav-link {
  cursor: pointer;
  &:hover {
    background-color: #ddd;
  }
}
:deep(.el-dialog) {
  margin: 0 auto;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>