<script setup>
import { useUserStore } from '@/stores/user'

// 初始化用户状态
const userStore = useUserStore()
</script>

<template>
  <router-view />
</template>

<style scoped></style>
