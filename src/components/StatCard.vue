<template>
  <q-card flat bordered class="stat-card"
    ><q-card-section class="row no-wrap items-start"
      ><div
        ><div class="text-caption text-grey-7">{{ label }}</div
        ><div class="stat-value">{{ value }}</div
        ><div v-if="caption" class="text-caption text-grey-6">{{
          caption
        }}</div></div
      ><q-avatar
        :color="color"
        text-color="white"
        :icon="icon" /></q-card-section
  ></q-card>
</template>
<script setup>
defineProps({
  label: String,
  value: { type: String, default: '—' },
  caption: String,
  icon: String,
  color: { type: String, default: 'blue-8' }
})
</script>
<style scoped>
.stat-card {
  border-radius: 12px;
}
.stat-value {
  margin: 8px 0 4px;
  color: #17283a;
  font-size: 1.45rem;
  font-weight: 700;
}
.q-avatar {
  margin-left: auto;
}
</style>
