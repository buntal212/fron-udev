<template>
  <q-table
    flat
    bordered
    :rows="rows"
    :columns="columns"
    row-key="id"
    :loading="loading"
    :pagination="pagination"
    :rows-per-page-options="[10, 25, 50]"
    no-data-label="Belum ada data dari API."
    @request="$emit('request', $event)"
    ><template #no-data><EmptyState /></template
    ><template v-if="$slots.body" #body="props"
      ><slot name="body" v-bind="props" /></template
  ></q-table>
</template>
<script setup>
import EmptyState from './EmptyState.vue'
defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  loading: Boolean,
  pagination: { type: Object, default: () => ({ page: 1, rowsPerPage: 10 }) }
})
defineEmits(['request'])
</script>
