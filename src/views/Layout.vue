<template>
  <div class="app-container">
    <Sidebar v-if="$route.name !== 'home'" />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  background-color: #f0f0f0;
  overflow-y: auto;
}
</style>