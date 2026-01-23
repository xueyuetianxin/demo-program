<template>
  <div class="pages">
    
    <!-- 渲染 groups 数组 -->
    <div v-if="MaterialGroup?.groups?.length" class="section">
      <div v-for="group in MaterialGroup.groups" :key="group.id">
        <img 
          class="material-logo"
          src="https://cdn.11xyz.com/Uploads/image/202208/20220830630dc04c62c7e.png?t=1661845636171" 
          alt="" 
          srcset=""
        >
        <div>{{ group.group_name }}</div>
        <div>{{ group.created_at.split(' ')[0] }}</div>
      </div>
    </div>
    
    <!-- 渲染 materials.data 数组 -->
    <div v-if="MaterialGroup?.materials?.data?.length" class="section">
      <div v-for="material in MaterialGroup.materials.data" :key="material.id">
        <img class="material-logo" :src="$formatAvatar(material.url)" alt="" srcset="">
        {{ material.title }} 
        <!-- 根据实际数据结构调整显示字段 -->
      </div>
    </div>
    
    <!-- 渲染 models.data 数组 -->
    <div v-if="MaterialGroup?.models?.data?.length" class="section">
      <div v-for="model in MaterialGroup.models.data" :key="model.id">
        <img class="material-logo" :src="$formatAvatar(model.coverImg)" alt="" srcset="">
        {{ model.alias }}
        <!-- 根据实际数据结构调整显示字段 -->
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="!MaterialGroup" class="loading">
      加载中...
    </div>
    
    <!-- 空状态 -->
    <div v-if="MaterialGroup && (!MaterialGroup.groups?.length && 
      !MaterialGroup.materials?.data?.length && !MaterialGroup.models?.data?.length)" 
      class="empty"
    >
      暂无数据
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiMaterialGroup } from '@/api/user'

const MaterialGroup = ref(null)

const getMaterialGroup = async () => {
  try {
    const res = await apiMaterialGroup({
      institution_id: 2,
      type: 0,
      limit: 32,
      page: 1,
      group_id: 0
    })
    MaterialGroup.value = res.data
    console.log('MaterialGroup:', MaterialGroup.value)
  } catch (error) {
    console.error('获取数据失败:', error)
    MaterialGroup.value = { groups: [], materials: { data: [] }, models: { data: [] } }
  }
}

onMounted(() => {
  getMaterialGroup()
})
</script>

<style scoped lang="scss">
.pages {
  padding: 20px;
  .loading, .empty {
    text-align: center;
    padding: 50px;
    color: #999;
  }
}
.material-logo{
  width: 60px;
  height: 60px;
}
</style>