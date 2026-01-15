<template>
  <div class="pages">
    <div>订单信息</div>
    <div>推广</div>
    <div>招聘</div>
    <div>客服助手</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Operation } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
import { apiMeInfo } from '@/api/user'

</script>

<style scoped lang="scss">

</style>