<template>
  <q-card flat bordered class="table-card">
    <q-card-section class="row items-center justify-between">
      <div>
        <h2>Daftar aplikasi</h2>
        <p>{{ rows.length }} data demo ditampilkan.</p>
      </div>
      <q-badge outline color="warning" label="DEMO" />
    </q-card-section>
    <q-separator />
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      flat
      :rows-per-page-options="[5, 10, 20]"
      no-data-label="Tidak ada aplikasi yang sesuai."
    >
      <template #body-cell-status="props">
        <q-td :props="props"
          ><q-badge
            rounded
            :color="props.value === 'active' ? 'positive' : 'grey-7'"
            :label="props.value === 'active' ? 'Aktif' : 'Tidak aktif'"
        /></q-td>
      </template>
      <template #body-cell-createdAt="props">
        <q-td :props="props">{{ formatDate(props.value) }}</q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="brown-7"
            aria-label="Detail aplikasi"
            @click="$emit('detail', props.row)"
            ><q-tooltip>Detail</q-tooltip></q-btn
          >
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="warning"
            aria-label="Ubah aplikasi"
            @click="$emit('edit', props.row)"
            ><q-tooltip>Ubah demo</q-tooltip></q-btn
          >
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['edit', 'detail'])

const columns = [
  { name: 'code', label: 'Kode', field: 'code', align: 'left', sortable: true },
  {
    name: 'name',
    label: 'Nama aplikasi',
    field: 'name',
    align: 'left',
    sortable: true
  },
  { name: 'url', label: 'URL aplikasi', field: 'url', align: 'left' },
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
