<template>
  <q-card flat bordered class="table-card"
    ><q-card-section
      ><h2>Daftar pelanggan</h2
      ><p>{{ pagination.rowsNumber }} data terdaftar.</p></q-card-section
    ><q-separator /><q-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      flat
      binary-state-sort
      :rows-per-page-options="[10, 15, 25, 50]"
      no-data-label="Tidak ada pelanggan yang sesuai."
      @request="$emit('request', $event.pagination)"
      ><template #body-cell-application="props"
        ><q-td :props="props">{{ props.value?.name || '-' }}</q-td></template
      ><template #body-cell-is_active="props"
        ><q-td :props="props"
          ><q-badge
            rounded
            :color="props.value ? 'positive' : 'grey-7'"
            :label="props.value ? 'Aktif' : 'Tidak aktif'" /></q-td></template
      ><template #body-cell-created_at="props"
        ><q-td :props="props">{{ formatDate(props.value) }}</q-td></template
      ><template #body-cell-actions="props"
        ><q-td :props="props" class="text-right"
          ><q-btn
            flat
            round
            dense
            icon="visibility"
            color="brown-7"
            aria-label="Detail pelanggan"
            @click="$emit('detail', props.row)" /><q-btn
            flat
            round
            dense
            icon="edit"
            color="warning"
            aria-label="Ubah pelanggan"
            @click="$emit('edit', props.row)" /></q-td></template></q-table
  ></q-card>
</template>
<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true }
})
defineEmits(['request', 'edit', 'detail'])
const columns = [
  {
    name: 'name',
    label: 'Nama pelanggan',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'application',
    label: 'Aplikasi',
    field: 'application',
    align: 'left'
  },
  {
    name: 'external_customer_id',
    label: 'ID eksternal',
    field: 'external_customer_id',
    align: 'left',
    sortable: true
  },
  {
    name: 'email',
    label: 'Email',
    field: 'email',
    align: 'left',
    sortable: true
  },
  { name: 'is_active', label: 'Status', field: 'is_active', align: 'left' },
  {
    name: 'created_at',
    label: 'Terdaftar',
    field: 'created_at',
    align: 'left',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]
const formatDate = value =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
    new Date(value)
  )
</script>
<style scoped>
.table-card {
  border-color: #e0d7c6;
  border-radius: 14px;
}
h2 {
  margin: 0 0 4px;
  color: #20180b;
  font-size: 1.02rem;
}
p {
  margin: 0;
  color: #746b5c;
  font-size: 0.82rem;
}
</style>
