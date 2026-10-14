<template>
  <q-breadcrumbs class="app-breadcrumbs"
    ><q-breadcrumbs-el icon="home" label="Dashboard" to="/" /><q-breadcrumbs-el
      v-if="title !== 'Dashboard'"
      :label="title"
  /></q-breadcrumbs>
</template>
<script setup>
defineProps({ title: { type: String, required: true } })
</script>
<style scoped>
.app-breadcrumbs {
  color: #68778a;
  font-size: 0.78rem;
}
</style>
