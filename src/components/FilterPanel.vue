<template>
  <q-card flat bordered class="filter-panel"
    ><q-card-section class="q-pa-md"
      ><div class="row q-col-gutter-md items-end"><slot /></div></q-card-section
  ></q-card>
</template>
<script setup></script>
<style scoped>
.filter-panel {
  border-radius: 12px;
}
</style>
