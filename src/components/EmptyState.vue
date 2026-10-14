<template>
  <div class="empty-state"
    ><q-icon :name="icon" size="42px" /><h3>{{ title }}</h3
    ><p>{{ message }}</p></div
  >
</template>
<script setup>
defineProps({
  icon: { type: String, default: 'inbox' },
  title: { type: String, default: 'Belum ada data' },
  message: {
    type: String,
    default: 'Data akan muncul saat API monitoring tersedia.'
  }
})
</script>
<style scoped>
.empty-state {
  padding: 36px 20px;
  color: #7b8895;
  text-align: center;
}
.empty-state h3 {
  margin: 12px 0 5px;
  color: #314255;
  font-size: 1rem;
}
.empty-state p {
  margin: 0;
  font-size: 0.82rem;
}
</style>
