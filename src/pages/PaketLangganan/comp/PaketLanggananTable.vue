<template>
  <q-card flat bordered class="table-card">
    <q-card-section>
      <h2>Daftar paket langganan</h2>
      <p>{{ pagination.rowsNumber }} paket terdaftar.</p>
    </q-card-section>
    <q-separator />
    <q-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      flat
      binary-state-sort
      :rows-per-page-options="[10, 15, 25, 50]"
      no-data-label="Tidak ada paket yang sesuai."
      @request="$emit('request', $event.pagination)"
    >
      <template #body-cell-application_id="props">
        <q-td :props="props">{{ applicationName(props.value) }}</q-td>
      </template>
      <template #body-cell-duration_days="props">
        <q-td :props="props">{{ props.value }} hari</q-td>
      </template>
      <template #body-cell-price="props">
        <q-td :props="props">{{
          formatSubscriptionPrice(props.value, props.row.currency)
        }}</q-td>
      </template>
      <template #body-cell-is_active="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.value"
            color="warning"
            aria-label="Ubah status paket"
            @update:model-value="$emit('change-status', props.row, $event)"
          >
            <q-tooltip>{{
              props.value ? 'Nonaktifkan paket' : 'Aktifkan paket'
            }}</q-tooltip>
          </q-toggle>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="warning"
            aria-label="Ubah paket"
            @click="$emit('edit', props.row)"
          >
            <q-tooltip>Ubah</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="delete_outline"
            color="negative"
            aria-label="Hapus paket"
            @click="$emit('delete', props.row)"
          >
            <q-tooltip>Hapus</q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <template #no-data>
        <div class="full-width row flex-center q-pa-lg">
          <EmptyState
            icon="workspace_premium"
            title="Belum ada paket langganan"
            message="Tambahkan paket setelah aplikasi tersedia."
          />
        </div>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import EmptyState from '@/components/EmptyState.vue'
import { formatSubscriptionPrice } from '@/utils/subscription'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  applications: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true }
})
defineEmits(['request', 'edit', 'delete', 'change-status'])

const columns = [
  { name: 'code', label: 'Kode', field: 'code', align: 'left', sortable: true },
  {
    name: 'name',
    label: 'Nama paket',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'application_id',
    label: 'Aplikasi',
    field: 'application_id',
    align: 'left'
  },
  {
    name: 'duration_days',
    label: 'Durasi',
    field: 'duration_days',
    align: 'left',
    sortable: true
  },
  {
    name: 'price',
    label: 'Harga',
    field: 'price',
    align: 'right',
    sortable: true
  },
  { name: 'is_active', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

const applicationName = applicationId =>
  props.applications.find(application => application.id === applicationId)
    ?.name || '—'
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
