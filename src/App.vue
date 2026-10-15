<template>
  <router-view />
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginStore } from '@/stores/login'

const router = useRouter()
const loginStore = useLoginStore()

async function handleSessionExpired() {
  loginStore.clearSession()

  if (router.currentRoute.value.path !== '/login') {
    await router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
  }
}

onMounted(() => {
  window.addEventListener('udev:session-expired', handleSessionExpired)
})

onBeforeUnmount(() => {
  window.removeEventListener('udev:session-expired', handleSessionExpired)
})
</script>
