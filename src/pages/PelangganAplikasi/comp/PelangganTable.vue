<template>
  <q-card flat bordered class="table-card">
    <q-card-section class="row items-center justify-between"
      ><div
        ><h2>Daftar pelanggan</h2
        ><p>{{ rows.length }} data demo ditampilkan.</p></div
      ><q-badge outline color="warning" label="DEMO"
    /></q-card-section>
    <q-separator />
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      flat
      :rows-per-page-options="[5, 10, 20]"
      no-data-label="Tidak ada pelanggan yang sesuai."
    >
      <template #body-cell-status="props"
        ><q-td :props="props"
          ><q-badge
            rounded
            :color="statusColor(props.value)"
            :label="statusLabel(props.value)" /></q-td
      ></template>
      <template #body-cell-createdAt="props"
        ><q-td :props="props">{{ formatDate(props.value) }}</q-td></template
      >
      <template #body-cell-actions="props"
        ><q-td :props="props" class="text-right"
          ><q-btn
            flat
            round
            dense
            icon="visibility"
            color="brown-7"
            aria-label="Detail pelanggan"
            @click="$emit('detail', props.row)"
            ><q-tooltip>Detail</q-tooltip></q-btn
          ><q-btn
            flat
            round
            dense
            icon="edit"
            color="warning"
            aria-label="Ubah pelanggan"
            @click="$emit('edit', props.row)"
            ><q-tooltip>Ubah demo</q-tooltip></q-btn
          ></q-td
        ></template
      >
    </q-table>
  </q-card>
</template>

<script setup>
defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['edit', 'detail'])
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
    align: 'left',
    sortable: true
  },
  {
    name: 'externalId',
    label: 'ID eksternal',
    field: 'externalId',
    align: 'left',
    sortable: true
  },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left',
    sortable: true
  },
  {
    name: 'createdAt',
    label: 'Terdaftar',
    field: 'createdAt',
    align: 'left',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]
const formatDate = value =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
    new Date(value)
  )
const statusColor = value =>
  ({ active: 'positive', pending: 'warning', inactive: 'grey-7' })[value] ||
  'grey-7'
const statusLabel = value =>
  ({ active: 'Aktif', pending: 'Menunggu', inactive: 'Tidak aktif' })[value] ||
  value
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
