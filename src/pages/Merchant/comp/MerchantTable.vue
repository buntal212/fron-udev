<template>
  <DataTable
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :pagination="pagination"
    @request="$emit('request', $event)"
  >
    <template #body="props">
      <q-tr :props="props">
        <q-td key="name" :props="props">{{ props.row.name }}</q-td>
        <q-td key="code" :props="props">{{ props.row.code }}</q-td>
        <q-td key="status" :props="props">
          <StatusBadge :status="props.row.status" />
        </q-td>
        <q-td key="total_transactions" :props="props" class="text-right">
          {{ props.row.total_transactions.toLocaleString('id-ID') }}
        </q-td>
        <q-td key="registered_at" :props="props">
          {{ formatDate(props.row.registered_at) }}
        </q-td>
        <q-td key="action" :props="props" class="text-right">
          <q-btn
            flat
            dense
            color="primary"
            icon="visibility"
            label="Detail"
            no-caps
            @click="$emit('detail', props.row.id)"
          />
        </q-td>
      </q-tr>
    </template>
  </DataTable>
</template>

<script setup>
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  pagination: { type: Object, required: true }
})
defineEmits(['detail', 'request'])

const columns = [
  {
    name: 'name',
    label: 'Nama aplikasi',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'code',
    label: 'Kode aplikasi',
    field: 'code',
    align: 'left',
    sortable: true
  },
  { name: 'status', label: 'Status aktif', field: 'status', align: 'left' },
  {
    name: 'total_transactions',
    label: 'Total transaksi',
    field: 'total_transactions',
    align: 'right'
  },
  {
    name: 'registered_at',
    label: 'Tanggal terdaftar',
    field: 'registered_at',
    align: 'left'
  },
  { name: 'action', label: 'Detail merchant', field: 'action', align: 'right' }
]

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>
