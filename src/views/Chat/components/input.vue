<template>
  <div class="chat-input-container">

    <!-- 图片预览区域 -->
    <div v-if="pendingImages.length > 0" class="image-previews">
      <div v-for="(image, index) in pendingImages" :key="index" class="image-preview">
        <img :src="image.previewUrl" alt="预览图片" />
        <button @click="removeImage(index)" class="remove-image-btn">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
    
    <!-- 成员选择器 -->
    <div v-if="showMentionList && onlineUsers.length > 0" class="mention-list" ref="mentionList">
      <div class="mention-header">选择提及的成员</div>
      <div 
        v-for="(user, index) in filteredUsers" 
        :key="user.id"
        class="mention-item"
        :class="{ 'selected': selectedMentionIndex === index }"
        @click="selectMentionUser(user)"
        @mouseenter="selectedMentionIndex = index"
      >
        <div class="mention-info">
          <img :src="$formatAvatar(user.logo)" alt="" srcset="" class="group_avater">
          <div class="mention-name">{{ user.name || '用户' }}</div>
        </div>
      </div>
      <div v-if="filteredUsers.length === 0" class="no-results">
        未找到匹配的成员
      </div>
    </div>
    
    <!-- 外部点击捕获层 -->
    <div v-if="showMentionList" class="mention-overlay" @click="closeMentionList"></div>
    
    <!-- 输入栏头部 -->
    <div class="input-footer">
      <div class="features">
        <el-tooltip content="表情" placement="top">
          <el-button circle size="small" @click="toggleEmojiPicker" class="emoji-trigger">
            <el-icon><ChatRound /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="图片" placement="top">
          <el-button circle size="small" @click="handleImageUpload">
            <el-icon><Picture /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="文件" placement="top">
          <el-button circle size="small">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <!-- 表情选择器 -->
    <div v-show="showEmojis" class="emoji-picker" ref="emojiPicker">
      <div 
        v-for="emoji in emojis" 
        :key="emoji" 
        class="emoji-item"
        @click="addEmoji(emoji)"
      >
        {{ emoji }}
      </div>
    </div>
    
    <!-- 外部点击捕获层 -->
    <div v-if="showEmojis" class="emoji-overlay" @click="closeEmojiPicker"></div>
    
    <div class="input-wrapper">
      <el-input
        ref="inputRef"
        v-model="inputValue"
        type="textarea"
        :rows="4"
        :autosize="{ minRows: 2, maxRows: 6 }"
        placeholder="请输入消息"
        resize="none"
        @keydown.enter.exact.prevent="handleSend"
        @keydown.enter.shift.exact.prevent="addNewLine"
        @input="handleInputChange"
        @keydown.down.exact.prevent="navigateMentionList('down')"
        @keydown.up.exact.prevent="navigateMentionList('up')"
        @keydown.enter.ctrl.exact.prevent="selectMentionUserWithEnter"
        @keydown.escape="closeMentionList"
        @paste="handlePaste"
      />
    </div>
    
    <div class="action-buttons">
      <el-button type="primary" @click="handleSend" :disabled="isSendDisabled">
        <span>发送</span>
        <el-icon><Position /></el-icon>
      </el-button>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Position, ChatRound, Picture, Document , Close} from '@element-plus/icons-vue';

const props = defineProps({
  onlineUsers: {
    type: Array,
    default: () => []
  },
   pendingImages: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['send-message', 'trigger-image-upload','remove-image','add-pasted-image']);
const inputRef = ref(null);
const inputValue = ref('');
const showEmojis = ref(false);
const emojiPicker = ref(null);
const mentionList = ref(null);
const removeImage = (index) => {
  emit('remove-image', index);
};

// 提及功能相关状态
const showMentionList = ref(false);
const selectedMentionIndex = ref(0);
const currentMentionKeyword = ref('');
const lastAtPosition = ref(-1);
const mentionedUserIds = ref([]); 

const emojis = ['😀', '😂', '😍', '🤔', '👍', '👏', '🎉', '❤️', '🙏', '👋', '💯', '🔥'];

// 发送按钮是否禁用
const isSendDisabled = computed(() => {
  return inputValue.value.trim().length === 0 && props.pendingImages.length === 0;
});

// 过滤后的用户列表
const filteredUsers = computed(() => {
  if (!currentMentionKeyword.value) {
    return props.onlineUsers;
  }
  
  const keyword = currentMentionKeyword.value.toLowerCase();
  return props.onlineUsers.filter(user => {
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    
    return name.includes(keyword) || 
           email.includes(keyword) || 
           username.includes(keyword);
  });
});

// 处理输入变化
const handleInputChange = () => {
  const textarea = inputRef.value?.textarea;
  if (!textarea) return;
  
  const cursorPos = textarea.selectionStart;
  const textBeforeCursor = inputValue.value.substring(0, cursorPos);
  
  // 查找光标前最后一个@符号
  const lastAt = textBeforeCursor.lastIndexOf('@');
  
  if (lastAt !== -1) {
    // 检查@后面是否有空格，如果有空格则关闭提及列表
    const afterAt = textBeforeCursor.substring(lastAt + 1);
    if (afterAt.includes(' ')) {
      closeMentionList();
      return;
    }
    
    // 提取@后的关键字
    const keyword = textBeforeCursor.substring(lastAt + 1);
    
    // 如果@符号后面直接是其他字符（非空格），则显示提及列表
    if (keyword.length > 0 || !showMentionList.value) {
      lastAtPosition.value = lastAt;
      currentMentionKeyword.value = keyword;
      showMentionList.value = true;
      selectedMentionIndex.value = 0;
    }
  } else {
    // 没有找到@符号，关闭提及列表
    closeMentionList();
  }
};
const remindIds = ref(null)
// 选择提及用户
const selectMentionUser = (user) => {
  if (!user) return;
  
  // 添加被@用户的ID到数组中（避免重复）
  if (!mentionedUserIds.value.includes(user.uid)) {
    mentionedUserIds.value.push(user.uid);
  }
  
  const textarea = inputRef.value?.textarea;
  if (!textarea) return;
  
  const textBeforeAt = inputValue.value.substring(0, lastAtPosition.value);
  const textAfterCursor = inputValue.value.substring(textarea.selectionStart);
  
  // 构建新的文本，在@位置插入用户名
  const mentionText = `@${user.name || '用户'} `;
  inputValue.value = textBeforeAt + mentionText + textAfterCursor;
  
  // 设置光标位置
  const newCursorPos = textBeforeAt.length + mentionText.length;
  
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    closeMentionList();
  });
};

// 使用Enter键选择提及用户
const selectMentionUserWithEnter = () => {
  if (showMentionList.value && filteredUsers.value.length > 0) {
    const user = filteredUsers.value[selectedMentionIndex.value];
    selectMentionUser(user);
  }
};

// 导航提及列表
const navigateMentionList = (direction) => {
  if (!showMentionList.value || filteredUsers.value.length === 0) return;
  
  if (direction === 'down') {
    selectedMentionIndex.value = 
      (selectedMentionIndex.value + 1) % filteredUsers.value.length;
  } else if (direction === 'up') {
    selectedMentionIndex.value = 
      selectedMentionIndex.value === 0 ? 
      filteredUsers.value.length - 1 : 
      selectedMentionIndex.value - 1;
  }
  
  // 滚动到选中的项
  nextTick(() => {
    const selectedElement = mentionList.value?.querySelector('.mention-item.selected');
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  });
};

// 关闭提及列表
const closeMentionList = () => {
  showMentionList.value = false;
  currentMentionKeyword.value = '';
  selectedMentionIndex.value = 0;
  lastAtPosition.value = -1;
};
// 添加被@的用户（外部调用）
const addMentionedUser = (user) => {
  // 添加用户ID（如果尚未添加）
  if (!mentionedUserIds.value.includes(user.id)) {
    mentionedUserIds.value.push(user.id);
  }
  
  // 在输入框中插入@用户名
  insertText(`@${user.name || '用户'} `);
};
// 处理消息发送
const handleSend = () => {
  if (showMentionList.value) {
    // 如果提及列表显示，使用Ctrl+Enter选择当前项
    selectMentionUserWithEnter();
    return;
  }
  
  if (inputValue.value.trim().length > 0 || props.pendingImages.length > 0) {
    // 发送消息时传递被@的用户ID数组
    emit('send-message', inputValue.value, mentionedUserIds.value);
    inputValue.value = '';
    mentionedUserIds.value = []; // 清空被@用户ID数组
    showEmojis.value = false;
  }
};

// 添加换行符
const addNewLine = () => {
  inputValue.value += '\n';
};

// 切换表情选择器
const toggleEmojiPicker = () => {
  showEmojis.value = !showEmojis.value;
  closeMentionList();
};

// 添加表情
const addEmoji = (emoji) => {
  inputValue.value += emoji;
  showEmojis.value = false;
};

// 处理粘贴事件
const handlePaste = (event) => {
  // 获取粘贴板中的内容
  const items = (event.clipboardData || window.clipboardData).items;
  
  // 遍历粘贴板中的内容
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // 如果是图片类型
    if (item.type.indexOf('image') !== -1) {
      // 阻止默认粘贴行为
      event.preventDefault();
      
      // 获取图片文件
      const blob = item.getAsFile();
      
      // 创建预览URL
      const previewUrl = URL.createObjectURL(blob);
      
      // 触发添加图片事件
      emit('add-pasted-image', {
        file: blob,
        previewUrl
      });
      
      break; // 只处理第一个图片
    }
  }
};

// 触发图片上传
const handleImageUpload = () => {
  showEmojis.value = false;
  closeMentionList();
  emit('trigger-image-upload');
};

// 关闭表情选择器
const closeEmojiPicker = (event) => {
  // 如果点击了表情选择器本身，则不关闭
  if (emojiPicker.value && !emojiPicker.value.contains(event.target)) {
    showEmojis.value = false;
  }
};

// 点击外部关闭表情选择器
const handleClickOutside = (event) => {
  // 处理表情选择器外部点击
  if (showEmojis.value && emojiPicker.value && !emojiPicker.value.contains(event.target)) {
    const emojiTriggers = document.querySelectorAll('.emoji-trigger');
    let isTrigger = false;   
    emojiTriggers.forEach(trigger => {
      if (trigger.contains(event.target)) {
        isTrigger = true;
      }
    });
    
    if (!isTrigger) {
      showEmojis.value = false;
    }
  }
  
  // 处理提及列表外部点击
  if (showMentionList.value && mentionList.value && !mentionList.value.contains(event.target)) {
    // 检查是否点击了输入框
    const textarea = inputRef.value?.textarea;
    if (textarea && !textarea.contains(event.target)) {
      closeMentionList();
    }
  }
};

// 添加插入文本的方法
const insertText = (text) => {
  // 确保输入框存在
  if (!inputRef.value || !inputRef.value.textarea) return;
  
  const textarea = inputRef.value.textarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const currentValue = inputValue.value;
  
  // 在光标位置插入文本
  inputValue.value = 
    currentValue.substring(0, start) + 
    text + 
    currentValue.substring(end);
  
  // 设置新的光标位置
  const newCursorPos = start + text.length;
  
  // 使用 nextTick 确保 DOM 更新后再设置光标位置
  nextTick(() => {
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    // 聚焦输入框
    textarea.focus();
  });
};

// 暴露方法给父组件
defineExpose({
  insertText,
  closeMentionList,
  mentionedUserIds,
  addMentionedUser
});

// 监听输入框焦点
watch(() => inputRef.value?.isFocus, (isFocus) => {
  if (!isFocus) {
    closeMentionList();
  }
});

// 添加全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.chat-input-container {
  position: relative;
  background-color: #ededed;
  border-top: 1px solid #d4d4d4;
  padding: 10px 15px;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  margin-bottom: 8px;
}
.group_avater{
  width: 30px;
  height: 30px;
  margin-right: 10px;
}
.action-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.action-buttons .el-button {
  padding: 8px 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.features {
  display: flex;
  gap: 8px;
}

.features .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: none;
}

.features .el-button:hover {
  background-color: #e6f1ff;
}

/* 提及列表样式 */
.mention-list {
  position: absolute;
  bottom: 160px;
  left: 10px;
  right: 10px;
  width: 200px;
  max-height: 200px;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 12;
}

.mention-header {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
}

.mention-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mention-item:hover {
  background-color: #f5f7fa;
}

.mention-item.selected {
  background-color: #e6f1ff;
}

.mention-avatar {
  margin-right: 10px;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.mention-info {
  display: flex;
  align-items: center;
}

.mention-name {
  margin-bottom: 2px;
}

.mention-status {
  font-size: 12px;
}

.mention-status.online {
  color: #67c23a;
}

.mention-status.offline {
  color: #909399;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.mention-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 11;
}

.emoji-picker {
  position: absolute;
  bottom: 160px;
  left: 10px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  width: 300px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 11; /* 高于覆盖层 */
}

.emoji-item {
  cursor: pointer;
  font-size: 20px;
  text-align: center;
  padding: 5px;
  border-radius: 4px;
}

.emoji-item:hover {
  background-color: #f0f7ff;
}

.emoji-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 10; /* 低于表情选择器 */
}





.image-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.remove-image-btn:hover {
  background-color: rgba(255, 0, 0, 0.7);
}
</style>