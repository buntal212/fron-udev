<template>
  <q-badge rounded :color="color" :label="status || 'Tidak diketahui'" />
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ status: { type: String, default: '' } })
const color = computed(
  () =>
    ({
      paid: 'positive',
      berhasil: 'positive',
      active: 'positive',
      pending: 'warning',
      suspended: 'warning',
      gagal: 'negative',
      failed: 'negative',
      closed: 'grey-7',
      expired: 'grey-7'
    })[props.status.toLowerCase()] || 'grey-7'
)
</script>
