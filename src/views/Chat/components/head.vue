<template>
  <div class="pages">
    <div class="left">{{ nicknameProp }}</div>
    <div class="right">
      <el-icon size="28" class="icons"><ChatDotRound /></el-icon>
      <el-icon @click="drawer = true" size="28" class="icons"><MoreFilled /></el-icon>
      <el-drawer 
        v-model="drawer" 
        :with-header="false" 
        class="custom-drawer" 
        modal-class="custom-modal"
        size="250px"
      >
        <div class="drawer-content">

        <div class="persons-grid" v-if="personsList.length > 0">
          <!-- 显示成员，根据showAllMembers决定显示数量 -->
          <div 
            class="person-item" 
            v-for="(item, index) in showAllMembers 
              ? personsList.filter(person => person.is_group_member === 1)
              : personsList
                .filter(person => person.is_group_member === 1)
                .slice(0, sign === 1 || sign === 2 ? 14 : 15)" 
            :key="item.index"
            @click.stop="handleToggleProfile(item, $event)"
          >
            <img :src="$formatAvatar(item.logo)" alt="">
            <div class="person-name">{{ item.name }}</div>
          </div>
          
          <!-- 显示加号 -->
          <div class="person-item" @click="Add">
            <img 
              class="icon" 
              src="/icons/add-bold.png" 
              alt="Add Icon" 
            />
            <div class="text">添加</div>
          </div>
          <div class="person-item" v-if="sign === 1 || sign === 2" @click="Delete">
            <img 
              class="icon" 
              src="/icons/minus-bold.png" 
              alt="Minus Icon" 
            />
            <div class="text">移出</div>
          </div> 
        </div>
        
        <!-- 修改查看更多按钮 -->
        <div 
          v-if="((sign === 1 || sign === 2) && personsList.length > 14) || 
                (sign === 0 && personsList.length > 15)"
          @click="showAllMembers = !showAllMembers"
          style="cursor: pointer;"
        >
          {{ showAllMembers ? '收起' : '查看更多' }}
        </div>
        


        <div class="no_notice" @click="AvoidDisturb">
          <span>消息免打扰</span>
          <el-switch size="small" v-model="value1" />
        </div>
        <div class="put_top" @click="is_Top">
          <span>置顶聊天</span>
          <el-switch size="small" v-model="value2" />
        </div>
        <div class="clear" @click="centerDialogVisible = true">
          <span>清空聊天记录</span>
        </div>
        <div 
          class="clear" v-if="(sign == 0 || sign == 2) && personsList.length > 0"
          @click="centerDialogVisible1 = true"
        >
          <span>退出群聊</span>
        </div>
        </div>
      </el-drawer>
      <el-dialog
        v-model="centerDialogVisible"
        width="400"
        align-center
      >
        <span>清空聊天记录?</span>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="danger" @click="clear_content">清空</el-button>
            <el-button @click="centerDialogVisible = false">
              取消
            </el-button>
          </div>
        </template>
      </el-dialog>
      <el-dialog
        v-model="centerDialogVisible1"
        width="400"
        align-center
      >
        <span>退出群聊?</span>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="danger" @click="exit_group">确定</el-button>
            <el-button @click="centerDialogVisible1 = false">
              取消
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted , watch } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue';
import { MoreFilled } from '@element-plus/icons-vue';
import { useChatStore } from '@/stores/chatStore';

const chatStore = useChatStore();
const emit = defineEmits(['design-disturb','putTop','handleClear','openAdd',
'openClose','toggle-profile','exit']);
const drawer = ref(false)
const value1 = ref(false)
const value2 = ref(false)
const showAllMembers = ref(false)

const props = defineProps({
  nicknameProp: {
    type: String,
    default: ''
  },
  avoid_disturb: {
    type: Number,
    default: 0
  },
  is_top: {
    type: Number,
    default: 0
  },
  chatId: {
    type: [String, Number],
    required: true
  },
  sign: {
    type: [String, Number],
    required: false,
    default: ''
  },
  personsList: {
    type: Array,
    default: () => []  // 默认值为空数组
  }
})

// 使用 watch 监听 Pinia 状态变化
watch(() => chatStore.getTopStatus(props.chatId), (newVal) => {
  value2.value = newVal === 1
}, { immediate: true })

watch(() => chatStore.getDisturbStatus(props.chatId), (newVal) => {
  value1.value = newVal === 1
}, { immediate: true })


const closeDrawer = () => {
  drawer.value = false;
};

defineExpose({
  closeDrawer
});

const handleToggleProfile = (user, event) => {
  emit('toggle-profile', { user, event });
};

const AvoidDisturb = async () => {
  value1.value = !value1.value
  emit('design-disturb');
}

const Add = () => {
  emit('openAdd');
}
const Delete = () => {
  emit('openClose');
}

const is_Top = async () => {
  value2.value = !value2.value
  emit('putTop');
}
const centerDialogVisible = ref(false)
const centerDialogVisible1 = ref(false)
const clear_content = () => {
  centerDialogVisible.value = false
  emit('handleClear');
}
const exit_group = () => {
  centerDialogVisible1.value = false
  emit('exit');
}

</script>
<style scoped lang="scss">
.pages{
  height: 50px;
  border-bottom: 1px solid #d4d4d4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  .left{
      padding-left: 6px;
  }
  .right{
    display: flex;
    align-items: center;
    .icons{
      margin: 0 6px;
      padding: 4px;
      &:hover {
        background-color: #ccc;
      }
    }
  }
} 
.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.custom-drawer) {
  // 调整位置 (距离顶部40px)
  top: 50px;
  box-shadow: none;
  border: 1px solid #d4d4d4;
  border-top: none;
  font-size: 12px;
  .no_notice{
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #d4d4d4;
    padding-top: 10px;
  }
  .put_top{
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #d4d4d4;
    padding-bottom: 10px;
  }
  .clear{
    padding: 20px 0 5px 0;
    text-align: center;
    color: #d11111;
    cursor: pointer;
  }
  // 调整内部内容样式
  .el-drawer__body {
    padding: 20px;
  }
}
:deep(.custom-modal) {
  background-color: rgba(0, 0, 0, 0); 
}

.persons-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 10px 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  .person-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    img {
      width: 37px;
      height: 37px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .person-name {
      margin-top: 4px;
      font-size: 12px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 37px;
      color: #9e9e9e;
    }
    .icon {
      width: 37px;
      height: 37px;
      border-radius: 4px;
      border: 1px dashed #cacaca;
      padding: 7px; 
      box-sizing: border-box;
      margin-left: 4px;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
    .text{
      margin-top: 4px;
      font-size: 12px;
      color: #9e9e9e;
    }
  } 
}
</style>