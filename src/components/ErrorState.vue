<template>
  <div class="error-state"
    ><q-icon name="error_outline" color="negative" size="38px" /><h3>{{
      title
    }}</h3
    ><p>{{ message }}</p
    ><q-btn
      flat
      color="primary"
      label="Coba lagi"
      no-caps
      @click="$emit('retry')"
  /></div>
</template>
<script setup>
defineProps({
  title: { type: String, default: 'Data tidak dapat dimuat' },
  message: { type: String, default: 'Periksa koneksi API kemudian coba lagi.' }
})
defineEmits(['retry'])
</script>
<style scoped>
.error-state {
  padding: 36px 20px;
  text-align: center;
}
.error-state h3 {
  margin: 10px 0 5px;
  font-size: 1rem;
}
.error-state p {
  color: #7b8895;
  font-size: 0.82rem;
}
</style>
