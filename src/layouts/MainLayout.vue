<template>
  <q-layout view="lHh Lpr lFf" class="admin-layout">
    <AppHeader @toggle-sidebar="drawerOpen = !drawerOpen" />
    <AppSidebar v-model="drawerOpen" />
    <q-page-container><router-view /></q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'

const drawerOpen = ref(true)
</script>

<style scoped>
.admin-layout {
  background: #f7f4ee;
}
</style>
