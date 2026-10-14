<template>
  <q-banner rounded class="demo-notice">
    <template #avatar><q-icon name="science" /></template>
    <strong>Mode demo.</strong> {{ message }} Perubahan hanya berlaku selama
    sesi browser ini.
  </q-banner>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Backend UDEV Billing belum tersedia.'
  }
})
</script>

<style scoped>
.demo-notice {
  border: 1px solid rgba(210, 167, 67, 0.42);
  background: #fff9ea;
  color: #5b4210;
  font-size: 0.82rem;
}
</style>
