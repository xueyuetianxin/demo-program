<template>
  <div class="contact-detail">
    <div class="center-container">
      <div class="info_item">
        <div class="left">
          <img class="infoLogo" :src="$formatAvatar(PublicInfo?.logo)" alt="" srcset="">
        </div>
        <div class="right">
          <div>
            {{ PublicInfo?.nickname }}
          </div>
        </div>
      </div>
      <div class="info_item others">
        <div class="remark_name">
          <div v-if="reason !== ''" >
            {{ reason }}
          </div>
          <div v-if="reason == ''">
            我是{{ PublicInfo?.nickname }}
          </div>
        </div>
      </div>
    </div>
    <div class="buttoms">
      <div @click="agree_apply">同意申请</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed ,watch ,onMounted ,nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiPublicInfo , apiFriendThrough } from '@/api/user';
import { ElMessage } from 'element-plus'
import { useFriendStore } from '@/stores/friend';

const friendStore = useFriendStore();
const remarkInput = ref('')
const beizhu_status = ref(false)
const remarkInputRef = ref(null) // 用于获取输入框DOM引用

const route = useRoute()
const router = useRouter()
const PublicInfo = ref(null)

const storedUid = ref(null) 

// 获取联系人详情
const getPublicInfo = async (id) => {
  try {
    const res = await apiPublicInfo(id)
    PublicInfo.value = res.data
  } catch (error) {
    PublicInfo.value = null
  }
}


const reason = ref(null)
const apply_id = ref(null)
const agree_apply = async () => {
  await apiFriendThrough(apply_id.value, {
    status: 1
  })
  router.push({
    name: 'contact-detail', 
    params: { id: PublicInfo?.id }
  })
}

// 监听路由变化
watch(route, (newRoute) => {
  if (newRoute.params.id) {
    getPublicInfo(newRoute.params.id)
    const state = window.history.state
    reason.value = state?.reason
    apply_id.value = state?.apply_id
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
  const state = window.history.state
  apply_id.value = state?.apply_id
})
</script>

<style scoped lang="scss">
.contact-detail {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使用全屏高度 */
  
  .center-container {
   
    display: flex;
    flex-direction: column;
    align-items: center; /* 水平居中 */
    width: 100%;
    
    .info_item {
      width: 80%; /* 控制宽度 */
      max-width: 500px; /* 最大宽度限制 */
      margin: 15px auto; /* 垂直间距和水平居中 */
      padding: 15px 0;
      border-bottom: 1px solid #ccc;
      display: flex;
      justify-content: center;
      align-items: center;
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
    padding: 20px 0; /* 添加底部间距 */
    cursor: pointer;
  }
}
</style>