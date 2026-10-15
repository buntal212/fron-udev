<template>
  <q-header class="app-header">
    <q-toolbar class="q-px-md">
      <q-btn
        flat
        round
        dense
        icon="menu"
        aria-label="Buka menu"
        @click="$emit('toggle-sidebar')"
      />

      <q-toolbar-title class="brand-title"
        >UDEV <span>Centralized Billing</span></q-toolbar-title
      >

      <q-btn
        flat
        round
        dense
        icon="notifications_none"
        aria-label="Notifikasi"
      />

      <div class="user-info q-ml-sm gt-xs">
        <span>{{ loginStore.user?.name || 'Administrator' }}</span>
        <small>{{ loginStore.user?.username || '-' }}</small>
      </div>

      <q-avatar class="q-ml-sm" color="amber-5" text-color="dark" size="34px">
        {{ userInitials }}
      </q-avatar>

      <q-btn
        class="q-ml-sm"
        flat
        dense
        no-caps
        icon="logout"
        label="Keluar"
        :loading="loginStore.logoutLoading"
        @click="handleLogout"
      />
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginStore } from '@/stores/login'

defineEmits(['toggle-sidebar'])

const loginStore = useLoginStore()
const router = useRouter()
const userInitials = computed(() =>
  (loginStore.user?.name || 'Administrator')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(name => name[0])
    .join('')
    .toUpperCase()
)

async function handleLogout() {
  await loginStore.logout()
  await router.replace('/login')
}
</script>

<style scoped>
.app-header {
  background: #0c0c0d;
  color: #fff;
}

.brand-title {
  font-weight: 800;
  letter-spacing: 0.05em;
}
.brand-title span {
  margin-left: 7px;
  color: #d6ad4d;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.user-info {
  display: grid;
  justify-items: end;
  line-height: 1.2;
}

.user-info span {
  font-size: 0.8rem;
  font-weight: 600;
}

.user-info small {
  color: #b7afa3;
  font-size: 0.68rem;
}
</style>
