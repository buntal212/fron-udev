<template>
  <q-card flat bordered class="table-card">
    <q-card-section>
      <h2>Daftar langganan pelanggan</h2>
      <p>{{ pagination.rowsNumber }} langganan ditemukan.</p>
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
      no-data-label="Belum ada langganan yang sesuai."
      @request="$emit('request', $event.pagination)"
    >
      <template #body-cell-application="props">
        <q-td :props="props">{{ applicationName(props.row) }}</q-td>
      </template>
      <template #body-cell-customer="props">
        <q-td :props="props">{{ props.row.customer?.name || '—' }}</q-td>
      </template>
      <template #body-cell-plan="props">
        <q-td :props="props">{{ props.row.plan?.name || '—' }}</q-td>
      </template>
      <template #body-cell-starts_at="props">
        <q-td :props="props">{{ formatSubscriptionDate(props.value) }}</q-td>
      </template>
      <template #body-cell-expires_at="props">
        <q-td :props="props">{{ formatSubscriptionDate(props.value) }}</q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            rounded
            :color="getDatabaseStatus(props.value).color"
            :label="getDatabaseStatus(props.value).label"
          />
        </q-td>
      </template>
      <template #body-cell-period_status="props">
        <q-td :props="props">
          <q-badge
            rounded
            :color="getPeriodStatus(props.row.expires_at).color"
            :label="getPeriodStatus(props.row.expires_at).label"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="brown-7"
            aria-label="Detail langganan"
            @click="$emit('detail', props.row)"
          >
            <q-tooltip>Detail</q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <template #no-data>
        <div class="full-width row flex-center q-pa-lg">
          <EmptyState
            icon="event_available"
            title="Belum ada langganan pelanggan"
            message="Data langganan akan tampil ketika tersedia dari backend."
          />
        </div>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import EmptyState from '@/components/EmptyState.vue'
import {
  formatSubscriptionDate,
  getDatabaseStatus,
  getPeriodStatus
} from '@/utils/subscription'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  applications: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true }
})
defineEmits(['request', 'detail'])

const columns = [
  {
    name: 'application',
    label: 'Aplikasi',
    field: 'application',
    align: 'left'
  },
  { name: 'customer', label: 'Pelanggan', field: 'customer', align: 'left' },
  { name: 'plan', label: 'Paket', field: 'plan', align: 'left' },
  {
    name: 'starts_at',
    label: 'Mulai',
    field: 'starts_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'expires_at',
    label: 'Berakhir',
    field: 'expires_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'status',
    label: 'Status data',
    field: 'status',
    align: 'left',
    sortable: true
  },
  {
    name: 'period_status',
    label: 'Masa aktif',
    field: 'period_status',
    align: 'left'
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

const applicationName = subscription => {
  const applicationId =
    subscription.customer?.application_id || subscription.plan?.application_id
  return (
    props.applications.find(application => application.id === applicationId)
      ?.name || '—'
  )
}
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
