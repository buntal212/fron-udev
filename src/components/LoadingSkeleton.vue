<template>
  <div class="q-gutter-y-sm"
    ><q-skeleton v-for="item in rows" :key="item" type="rect" height="38px"
  /></div>
</template>
<script setup>
defineProps({ rows: { type: Number, default: 4 } })
</script>
