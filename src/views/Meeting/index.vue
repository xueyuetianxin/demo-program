<template>
  <div class="pages">

    <div class="icon-safe">
      <div class="icon-group" @click="meetingstatus = true">
        <div class="icon-container">
          <img class="icon-create" src="/meetingicon/create.png" alt="创建会议">
        </div>
        <div>创建会议</div>
      </div>
      
      <div class="icon-group" @click="openjoin">
        <div class="icon-container">
          <img class="icon-enter" src="/meetingicon/enter.png" alt="加入会议">
        </div>
        <div>加入会议</div>
      </div>
    </div>

    
    <div class="meetList">
      <div 
        v-for="item in MeetingList" 
        :key="item.id" 
        class="meetList-item"
      >
        <div class="meetList-head">
          <div>会议主题: {{ item.title }}</div>
          <div>主持人: {{ item.name }}</div>
          <el-icon 
            v-if="Number(item.compere_id) === Number(userUid)"  
            @click="openDesign(item)"
            ><Setting /></el-icon>
          <el-icon 
            v-else
            @click="openNotice(item)"
          ><Delete /></el-icon>
        </div>
        <div class="meetList-body">
          会议号: {{ item.id }}
        </div>
        <div class="meetList-footer">
          <div class="footer-time">时间: {{ item.created_at }}</div>
          <div class="footer-buttom">
            <span class="text" @click="enterMeeting(item)">进入</span>
            <el-icon style="color: #666;" size="22px" @click="shareMeeting(item)"><Share /></el-icon>
          </div>
        </div>   
      </div>
    </div>


    <el-dialog
      v-model="centerDialogVisible"
      title="设置"
      width="500"
      align-center
      class="dialog"
    >
      <div class="end" @click="QuitMeeting">结束会议</div>
    </el-dialog>

    <el-dialog
      v-model="centerDialogVisible1"
      title="提示"
      width="500"
      align-center
      class="dialog"
    >
      <div>确定退出该展馆吗？</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="centerDialogVisible1 = false">取消</el-button>
          <el-button type="primary" @click="QuitMeeting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    

    <div class="meeting" v-if="meetingstatus">
      <div class="meeting-head">
        <div>创建会议</div>
        <div @click="meetingstatus = false">×</div>
      </div>
      <div class="meeting-body">
        <div class="body-item">
          <span>主题</span>
          <input 
            placeholder="请输入主题" 
            class="item-input" 
            type="text" 
            v-model="titleInput"
          />
        </div>
        <div class="body-item">
          <span>密码</span>
          <input 
            placeholder="请输入密码" 
            class="item-input" 
            type="text" 
            v-model="passwordInput"
          />
        </div>
      </div>
      <div class="meeting-footer">
        <div class="footer-end" @click="createMeeting">创建</div>
      </div>
    </div>

    <div class="meeting" v-if="Enterstatus">
      <div class="meeting-head">
        <div>进入会议</div>
        <div @click="Enterstatus = false">×</div>
      </div>
      <div class="meeting-body">
        <div class="body-item">
          <span>会议号</span>
          <input 
            placeholder="请输入会议号" 
            class="item-input" 
            type="text" 
            v-model="meeting_idInput"
          />
        </div>
        <div class="body-item">
          <span>密码</span>
          <input 
            placeholder="请输入密码" 
            class="item-input" 
            type="text" 
            v-model="EnterpasswordInput"
          />
        </div>
      </div>
      <div class="meeting-footer">
        <div class="footer-end" @click="joinMeeting">加入</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiCreateMeeting, apiMeetingLists, apiQuitMeeting, apiJoinMeeting } from '@/api/user.js'
import { ElMessage } from 'element-plus'
import { Delete , Setting , Share } from '@element-plus/icons-vue';

const meetingstatus = ref(false)
const Enterstatus = ref(false)
const passwordInput = ref('')
const meeting_idInput = ref('')
const EnterpasswordInput = ref('')
const titleInput = ref('')
const MeetingList = ref([])
const centerDialogVisible = ref(false)
const centerDialogVisible1 = ref(false)
const meeting_id = ref(null)
const secondJoin = ref(false)

const userName = ref('')
const userUid = ref('')
//分享会议链接
const shareMeeting = (meeting) => {
  const shareText = `${userName.value} 邀请您加入【${meeting.name}的元宇宙会议室】\n点击链接直接加入会议：\nhttps://www.11xyz.com/meeting-detail?id=${meeting.id}\n元宇宙会议：${meeting.id}\n点击链接元宇宙会议即可参与`
  
  navigator.clipboard.writeText(shareText).then(() => {
    ElMessage({
      message: '已复制会议邀请信息',
      type: 'success',
    })
  }).catch(err => {
    console.error('复制失败:', err)
    ElMessage({
      message: '复制失败',
      type: 'error',
    })
  })
}
//获取会议列表
const getMeetingList = async () => {
  try {
    const res = await apiMeetingLists()
    MeetingList.value = res.data.data
  } catch (error) {
    console.error('获取会议列表失败:', error)
  }
}

const openjoin = () => {
  Enterstatus.value = !Enterstatus.value
  secondJoin.value = false
}
//创建会议
const createMeeting = async () => {
  if (!titleInput.value) {
    ElMessage({
      message: '请输入会议主题',
      type: 'warning',
    })
    return
  }

  try {
    await apiCreateMeeting({
      end_at: '2030-12-31 23:59:59',
      end_time: '',
      meeting_id: '',
      password: passwordInput.value,
      people_num: '100',
      permission_type: 2,
      room_id: 0,
      start_at: '2000-01-01 00:00:00',
      start_time: '',
      title: titleInput.value
    })
    
    meetingstatus.value = false
    titleInput.value = ''
    passwordInput.value = ''
    
    ElMessage({
      message: '创建成功',
      type: 'success',
    })
    // 重新获取会议列表
    await getMeetingList()
  } catch (error) {
    console.error('创建会议失败:', error)
    ElMessage({
      message: '创建失败',
      type: 'error',
    })
  }
}
//打开设置或关闭弹窗
const openDesign = (item) => {
  centerDialogVisible.value = !centerDialogVisible.value
  meeting_id.value = item.id
}
const openNotice = (item) => {
  centerDialogVisible1.value = !centerDialogVisible1.value
  meeting_id.value = item.id
}
//结束会议
const QuitMeeting = async () => {
  const res = await apiQuitMeeting({
    meeting_id: meeting_id.value,
    type: '2'
  })
  await getMeetingList()
  centerDialogVisible.value = false
  centerDialogVisible1.value = false
  ElMessage({
    message: '操作成功',
    type: 'success'
  })
}
const userToken = localStorage.getItem('token')
//进入会议详情
const enterMeeting = (item) => {
  if(Number(item.compere_id) === Number(userUid.value)){
    window.open(`https://www.11xyz.com/meeting-detail?id=${item.id}&token=${userToken}`, '_blank')
  } else {
    Enterstatus.value = !Enterstatus.value
    meeting_idInput.value = item.id
    secondJoin.value = true
  }
}


const joinMeeting = async () => {
  const res = await apiJoinMeeting({
    end_at: '2030-12-31 23:59:59',
    end_time: '',
    meeting_id: meeting_idInput.value,
    password: EnterpasswordInput.value,
    people_num: '100',
    permission_type: 2,
    room_id: 0,
    start_at: '2000-01-01 00:00:00',
    start_time: ''
  })
  Enterstatus.value = false
  EnterpasswordInput.value = ''
  await getMeetingList()
  ElMessage({
    message: '加入成功',
    type: 'success'
  })
  if(secondJoin.value){
    window.open(`https://www.11xyz.com/meeting-detail?id=${meeting_idInput.value}&token=${userToken}`, '_blank')
  }
  meeting_idInput.value = ''
}

onMounted(() => {
  userName.value = localStorage.getItem('nickname')
  userUid.value = localStorage.getItem('uid')
  getMeetingList()
})
</script>

<style scoped lang="scss">
.pages {
  padding: 20px;
  .icon-safe {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
    
    .icon-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      
      &:hover {
        opacity: 0.8;
      }
    }
    
    .icon-container {
      width: 100px;
      height: 90px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 8px;
      
      .icon-create {
        width: 60px;
        height: 60px;
        object-fit: contain;
      }
      
      .icon-enter {
        width: 70px;
        height: 70px;
        object-fit: contain;
      }
    }
  }
  
  .meetList {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    
    .meetList-item {
      width: calc(50% - 5px);
      box-sizing: border-box;
      padding: 15px;
      background: #ffffff;
      border: 1px solid #e4e4e4;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
      
      .meetList-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        font-weight: bold;
        color: #333;
        font-size: 14px;
      }
      
      .meetList-body {
        margin-bottom: 10px;
        font-size: 13px;
        color: #666;
      }
      
      .meetList-footer {
        font-size: 12px;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .footer-time{
          color: #666;
        }
        .footer-buttom{
          display: flex;
          gap: 6px;
          .text{
            cursor: pointer;
            padding: 4px 8px;
            background: #999;
            border-radius: 4px;
          }
        }
      }
    }
  }
}

.meeting {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99;
  width: 400px;
  height: 300px;
  background: #4ea3db;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  .meeting-head {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #1a89d3;
    color: #ffffff;
    font-weight: bold;
    
    div:last-child {
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      
      &:hover {
        color: #ffcccc;
      }
    }
  }
  
  .meeting-body {
    padding: 20px 0;
    
    .body-item {
      display: flex;
      align-items: center;
      margin: 20px;
      color: #fff;
      font-weight: 500;
      span {
        width: 70px;
        text-align: right;
        margin-right: 10px;
      }
      
      .item-input {
        border: none;
        outline: none;
        width: calc(100% - 70px);
        background: #ffffff;
        padding: 8px 12px;
        margin-left: 14px;
        border-radius: 4px;
        border: 1px solid #ddd;
        
        &:focus {
          border-color: #1a89d3;
          box-shadow: 0 0 0 2px rgba(26, 137, 211, 0.2);
        }
      }
    }
  }
  
  .meeting-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    
    .footer-end {
      color: #ffffff;
      padding: 8px 24px;
      background: #2d30b6;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      
      &:hover {
        background: #3a3dcc;
        transform: scale(1.05);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
}
.dialog{
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  .end{
    cursor: pointer;
    text-align: center;
  }
}
</style>