<template>
  <div class="pages">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item 
            :class="{ 'clickable': breadcrumbItems.length > 0 }"
            @click="goBackToRoot"
          >
            全部素材
          </el-breadcrumb-item>
          <el-breadcrumb-item 
            v-for="(item, index) in breadcrumbItems" 
            :key="index"
            :class="{ 'clickable': index < breadcrumbItems.length - 1 }"
            @click="goBackTo(item.id)"
          >
            {{ item.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <!-- 返回按钮（当有面包屑时显示） -->
      <el-button 
        v-if="breadcrumbItems.length > 0"
        class="back-button"
        type="text"
        @click="goBack"
      >
        <i class="el-icon-back"></i>
        返回上一级
      </el-button>
      
      <!-- 类型下拉菜单 -->
      <div class="type-selector">
        <el-select
          v-model="selectedType"
          placeholder="选择类型"
          size="small"
          style="width: 120px"
          @change="handleTypeChange"
        >
          <el-option 
            v-for="option in typeOptions" 
            :key="option.value"
            :label="option.label" 
            :value="option.value" 
          />
        </el-select>
      </div>
    </div>
    
    <!-- 所有数据项统一在一个容器中渲染 -->
    <div v-if="MaterialGroup && hasData" class="items-container">
      <!-- 渲染 groups 数组 -->
      <div v-if="MaterialGroup?.groups?.length" class="items-group">
        <div v-for="group in MaterialGroup.groups" :key="group.id" class="item">
          <img 
            class="material-logo"
            src="https://cdn.11xyz.com/Uploads/image/202208/20220830630dc04c62c7e.png?t=1661845636171" 
            alt="" 
            @click="openSecond(group.id, group.group_name)"
          >
          <div class="item-info">
            <div class="item-name">{{ group.group_name }}</div>
            <div class="item-date">{{ group.created_at.split(' ')[0] }}</div>
          </div>
        </div>
      </div>
      
      <!-- 渲染 materials.data 数组 -->
      <div v-if="MaterialGroup?.materials?.data?.length" class="items-group">
        <div v-for="material in MaterialGroup.materials.data" :key="material.id" class="item">

          <el-image 
            :src="$formatAvatar(material.url)"
            :preview-src-list="[$formatAvatar(material.url)]"
            :preview-teleported="true"
            class="material-logo"
            :max-scale="5"
            :min-scale="0.2"
            :z-index="9999"
            :initial-index="0"
            fit="contain"
            hide-on-click-modal
          >
            <template #error>
              <div class="image-error"></div>
            </template>
          </el-image>

          <div class="item-info">
            <div class="item-name">{{ material.title }}</div>
            <div class="item-date">{{ material.updated_at.split(' ')[0] }}</div>
          </div>
        </div>
      </div>
      
      <!-- 渲染 models.data 数组 -->
      <div v-if="MaterialGroup?.models?.data?.length" class="items-group">
        <div v-for="model in MaterialGroup.models.data" :key="model.id" class="item">
          <img class="material-logo" :src="$formatAvatar(model.coverImg)" alt="">
          <div class="item-info">
            <div class="item-name">{{ model.alias }}</div>
            <div class="item-date">{{ formatDate(model.create_time) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>
    
    <!-- 空状态 -->
    <div v-if="MaterialGroup && !hasData && !loading" class="empty">
      暂无数据
    </div>
    
    <!-- 悬浮底部分页组件 -->
    <div v-if="MaterialGroup && hasData" class="floating-pagination">
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :background="background"
          size="small"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { apiMaterialGroup } from '@/api/user'

const MaterialGroup = ref(null)
const loading = ref(false)

// 分页相关变量
const currentPage = ref(1)
const pageSize = ref(24)
const background = ref(true)
const total = ref(0)

const currentGroupId = ref(0)
const selectedType = ref(0) // 0表示全部类型

// 面包屑数据
const breadcrumbItems = ref([])

// 类型选项配置
const typeOptions = reactive([
  { label: '全部', value: 0 },
  { label: '模型', value: 99 },
  { label: '图片', value: 1 },
  { label: '视频', value: 2 },
  { label: '音频', value: 3 },
  { label: '电子书', value: 4 },
  { label: '文件', value: 5 }
])

// 计算属性：检查是否有数据
const hasData = computed(() => {
  if (!MaterialGroup.value) return false
  return (
    MaterialGroup.value.groups?.length > 0 ||
    MaterialGroup.value.materials?.data?.length > 0 ||
    MaterialGroup.value.models?.data?.length > 0
  )
})

// 获取数据
const getMaterialGroup = async () => {
  loading.value = true
  try {
    const res = await apiMaterialGroup({
      type: selectedType.value,
      limit: pageSize.value,
      page: currentPage.value,
      group_id: currentGroupId.value,
      institution_id: 2
    })
    MaterialGroup.value = res.data
    
    let materialsTotal = res.data.materials?.total || 0
    let modelsTotal = res.data.models?.total || 0
    
    total.value = materialsTotal + modelsTotal 
    
  } catch (error) {
    console.error('获取数据失败:', error)
    MaterialGroup.value = { groups: [], materials: { data: [] }, models: { data: [] } }
  } finally {
    loading.value = false
  }
}

// 进入子分组
const openSecond = (groupId, groupName) => {
  // 添加到面包屑
  breadcrumbItems.value.push({
    id: groupId,
    name: groupName
  })
  
  currentGroupId.value = groupId // 设置当前选中的group_id
  currentPage.value = 1 // 重置到第一页
  getMaterialGroup() // 重新获取数据
}

// 返回上一级
const goBack = () => {
  if (breadcrumbItems.value.length > 0) {
    // 移除最后一个面包屑
    breadcrumbItems.value.pop()
    
    // 获取新的当前分组ID（如果面包屑还有项，取最后一项的id，否则为0）
    currentGroupId.value = breadcrumbItems.value.length > 0 
      ? breadcrumbItems.value[breadcrumbItems.value.length - 1].id 
      : 0
    
    currentPage.value = 1
    getMaterialGroup()
  }
}

// 返回到指定层级
const goBackTo = (groupId) => {
  // 找到要返回到的层级索引
  const index = breadcrumbItems.value.findIndex(item => item.id === groupId)
  if (index !== -1) {
    // 移除该层级之后的所有面包屑
    breadcrumbItems.value = breadcrumbItems.value.slice(0, index + 1)
    
    currentGroupId.value = groupId
    currentPage.value = 1
    getMaterialGroup()
  }
}

// 返回到根目录
const goBackToRoot = () => {
  if (currentGroupId.value !== 0 || breadcrumbItems.value.length > 0) {
    breadcrumbItems.value = []
    currentGroupId.value = 0
    currentPage.value = 1
    getMaterialGroup()
  }
}

// 类型改变处理
const handleTypeChange = () => {
  currentPage.value = 1
  getMaterialGroup()
}

// 页码改变时的处理函数
const handleCurrentChange = (val) => {
  currentPage.value = val
  getMaterialGroup()
}

// 每页条数改变时的处理函数
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getMaterialGroup()
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

onMounted(() => {
  getMaterialGroup()
})
</script>

<style scoped lang="scss">
.pages {
  padding: 20px;
  padding-bottom: 80px; /* 为悬浮分页留出底部空间 */
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  
  /* 顶部导航栏样式 */
  .top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
    
    .breadcrumb {
      flex: 1;
      min-width: 0; /* 防止flex item溢出 */
      
      .clickable {
        cursor: pointer;
        
        &:hover {
          color: #409EFF;
        }
      }
    }
    
    .back-button {
      margin: 0 20px;
      flex-shrink: 0;
      
      i {
        margin-right: 4px;
      }
    }
    
    .type-selector {
      flex-shrink: 0;
    }
    
    /* 响应式调整 */
    @media (max-width: 768px) {
      flex-wrap: wrap;
      gap: 10px;
      
      .breadcrumb {
        order: 1;
        width: 100%;
        margin-bottom: 10px;
      }
      
      .back-button {
        order: 2;
        margin: 0;
        flex: 1;
        text-align: left;
      }
      
      .type-selector {
        order: 3;
        flex: 1;
        text-align: right;
      }
    }
  }
  
  .loading, .empty {
    text-align: center;
    padding: 50px;
    color: #999;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .items-container {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    
    .items-group {
      display: contents;
    }
  }
  
  .item {
    display: flex;
    flex-direction: column;
    width: 80px;
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
  
  .material-logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    background: #f5f5f5;
    cursor: pointer;
  }
  
  .item-info {
    padding: 8px;
    text-align: center;
    background: #fff;
  }
  
  .item-name, .item-date {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    font-size: 12px;
  }
  
  .item-name {
    font-weight: bold;
    margin-bottom: 4px;
    color: #333;
  }
  
  .item-date {
    color: #999;
  }
  
  /* 悬浮底部分页样式 */
  .floating-pagination {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
    z-index: 99;
    padding: 15px 0;
    margin-left: 60px;
    
    .pagination-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      
      /* 让分页组件靠右对齐 */
      :deep(.el-pagination) {
        display: flex;
        justify-content: flex-end;
      }
      
      /* 响应式调整 */
      @media (max-width: 768px) {
        :deep(.el-pagination) {
          justify-content: center;
        }
        
        :deep(.el-pagination__total),
        :deep(.el-pagination__sizes),
        :deep(.el-pagination__jump) {
          display: none !important;
        }
        
        :deep(.el-pagination__prev),
        :deep(.el-pagination__next),
        :deep(.el-pager) {
          margin: 0 2px;
        }
      }
    }
  }
}

/* 为内容区域添加滚动条样式 */
.pages {
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
}

/* 确保页面有滚动条时内容不会被分页遮挡 */
@media (min-height: 600px) {
  .pages {
    padding-bottom: 90px;
  }
  
  .floating-pagination {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>