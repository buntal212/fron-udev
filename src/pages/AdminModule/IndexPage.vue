<template>
  <AdminModulePage
    :title="route.meta.title"
    :description="route.meta.description"
    :columns="route.meta.columns"
    :show-status="route.meta.showStatus"
    :show-merchant="route.meta.showMerchant"
    :action-label="route.meta.actionLabel"
    :store="store"
  />
</template>
<script setup>
import { useRoute } from 'vue-router'
import AdminModulePage from '@/components/AdminModulePage.vue'
import { useAdminModuleStore } from '@/stores/admin-module'
const route = useRoute()
const store = useAdminModuleStore(route.meta.key)
</script>
