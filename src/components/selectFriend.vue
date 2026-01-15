<template>
  <div class="selectFriend">
    <div class="select_left">
      <el-input
        v-model="searchInput"
        style="width: 240px"
        placeholder="搜索好友"
        :prefix-icon="Search"
      />
      <div class="friend-list">
        <!-- 添加模式下显示friendList，移除模式下显示personsList中的群成员 -->
        <div 
          v-for="item in filteredItems" 
          :key="item[itemKey]" 
          class="friend-item"
          @click="!isDisabled(item[itemKey]) && toggleSelect(item)"
          :class="{ 
            'selected': isSelected(item[itemKey]),
            'disabled': isDisabled(item[itemKey])
          }"
        >
          <div class="friend-avatar">
            <img 
              class="icon" 
              :src="getCheckIcon(item[itemKey])" 
              alt="Check Icon" 
            />
            <img :src="$formatAvatar(item.logo)" alt="avatar">
          </div>
          <div class="friend-info">
            <div class="friend-name">{{ item.friend_remark || item.nickname || item.name }}</div>
            <div class="friend-status" v-if="isDisabled(item[itemKey])">(已是群成员)</div>
          </div>
        </div>
      </div>
    </div>
    <div class="select_right">
      <div>已选成员 ({{ selectedItems.length }})</div>
      <div class="selected-list">
        <div 
          v-for="item in selectedItems" 
          :key="item[itemKey]" 
          class="selected-item"
        >
          <div class="selected-avatar">
            <img :src="$formatAvatar(item.logo)" alt="avatar">
          </div>
          <div class="selected-name">{{ item.friend_remark || item.nickname || item.name }}</div>
          <el-icon class="remove-icon" @click.stop="removeSelected(item[itemKey])">
            <Close />
          </el-icon>
        </div>
        <div class="placeholder" v-if="selectedItems.length === 0">
          请从左侧选择好友
        </div>
      </div>
      <div class="action-buttons">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :disabled="selectedItems.length === 0" @click="confirm">确定</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Close } from '@element-plus/icons-vue'
import { apiFriendList } from '@/api/user.js';

const props = defineProps({
  personsList: {
    type: Array,
    default: () => []
  },
  mode: {
    type: String,
    default: 'add', // 'add' | 'remove'
    validator: v => ['add', 'remove'].includes(v)
  }
})

const searchInput = ref('')
const friendList = ref([])
const selectedItems = ref([])

const emit = defineEmits(['close', 'select','remove'])

// 根据模式确定item的key
const itemKey = computed(() => props.mode === 'add' ? 'friend_id' : 'uid')

// 从localStorage加载好友列表
const loadFriendList = async () => {
  // 只有添加模式下需要加载好友列表
  if (props.mode !== 'add') return
  
  // 先尝试从本地缓存获取
  const cachedList = localStorage.getItem('friendList')
  if (cachedList) {
    try {
      friendList.value = JSON.parse(cachedList)
      return // 如果缓存有效，直接返回
    } catch (e) {
      console.error('解析缓存好友列表失败', e)
    }
  }
  // 从接口获取好友列表
  try {
    const response = await apiFriendList({ limit: 999 })
    friendList.value = response.data.data
    localStorage.setItem('friendList', JSON.stringify(friendList.value))
  } catch (error) {
    console.error('获取好友列表失败:', error)
  }
}

// 获取对应的复选框图标
const getCheckIcon = (id) => {
  if (isDisabled(id)) {
    return '/icons/check.png'
  }
  return isSelected(id) ? '/icons/check-h.png' : '/icons/check-no.png'
}

// 根据模式过滤显示的列表
const filteredItems = computed(() => {
  const getDisplayName = (item) => {
    return item.friend_remark || item.nickname || item.name || ''
  }

  const baseList = props.mode === 'remove' 
    ? props.personsList.filter(person => person && person.sign === 0 && person.is_group_member === 1)
    : friendList.value
    
  if (!searchInput.value) return baseList
  
  const searchText = searchInput.value.toLowerCase()
  return baseList.filter(item => {
    const name = getDisplayName(item).toLowerCase()
    return name.includes(searchText)
  })
})

// 是否禁用
const isDisabled = (id) => {
  if (props.mode === 'remove') return false // 移除模式下不禁用任何项
  if (!props.personsList || !Array.isArray(props.personsList)) return false
  return props.personsList.some(person => 
    person && person.uid === id && person.is_group_member === 1
  )
}

// 检查是否已选中
const isSelected = (id) => {
  return selectedItems.value.some(item => item[itemKey.value] === id)
}

// 切换选中状态
const toggleSelect = (item) => {
  const id = item[itemKey.value]
  
  if (isSelected(id)) {
    selectedItems.value = selectedItems.value.filter(i => i[itemKey.value] !== id)
  } else {
    selectedItems.value = [...selectedItems.value, item]
  }
}

// 移除已选中的项
const removeSelected = (id) => {
  selectedItems.value = selectedItems.value.filter(item => item[itemKey.value] !== id)
}

// 确认选择
// const confirm = () => {
//   if (selectedItems.value.length > 0) {
//     emit('select',  [...selectedItems.value])
//     emit('close')
//   }
// }
// 确认选择
const confirm = () => {
  if (selectedItems.value.length > 0) {
    if (props.mode === 'add') {
      // 添加模式：直接传递选中的好友列表
      emit('select', [...selectedItems.value])
    } else {
      // 移除模式：传递 'remove' 标识和选中的群成员列表
      emit('remove', [...selectedItems.value])
    }
    emit('close')
  }
}

const cancel = () => {
  emit('close')
}

// 组件挂载时加载好友列表
onMounted(() => {
  loadFriendList()
})
</script>

<style scoped lang="scss">
.selectFriend {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  background-color: #fff;
  height: 500px;
  .select_left {
    width: 45%;
    border-right: 1px solid #eee;
    padding-right: 20px;
    overflow: hidden;
    .friend-list {
      margin-top: 20px;
      height: calc(100% - 60px);
      overflow-y: auto;
      overflow-x: hidden;
      .friend-item {
        display: flex;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        width: 100%;
        border-radius: 4px;
        transition: background-color 0.3s;
        &:hover {
          background-color: #f5f5f5;
        }
        &.selected {
          background-color: #e6f7ff;
        }
        &.disabled {
          cursor: not-allowed;
          opacity: 0.6;
          background-color: transparent !important;
        }
        .friend-avatar {
          display: flex;
          align-items: center;
          .icon{
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }
          img {
            width: 31px;
            height: 31px;
            border-radius: 3px;
            margin-right: 6px;
            object-fit: cover;
          }
        }
        .friend-info {
          .friend-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            max-width: 100%;
            font-size: 14px;
            color: #333;
          }
          .friend-status {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }
  .select_right {
    width: 45%;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .selected-list {
      height: 80%;
      overflow-y: auto;
      .selected-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 4px;
        position: relative;
        transition: background-color 0.3s;
        &:hover {
          background-color: #f5f5f5;
        }
        .selected-avatar {
          img {
            width: 31px;
            height: 31px;
            border-radius: 3px;
            margin-right: 10px;
            object-fit: cover;
          }
        }
        .selected-name {
          font-size: 14px;
          color: #333;
          flex-grow: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
          max-width: 100%;
        }
        .remove-icon {
          cursor: pointer;
          color: #999;
          transition: opacity 0.3s; 
          &:hover {
            color: #f56c6c;
          }
        }
      }
      .placeholder {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
      }
    }
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  }
}
</style>