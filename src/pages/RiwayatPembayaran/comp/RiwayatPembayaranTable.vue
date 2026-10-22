<template>
  <q-card flat bordered class="table-card">
    <q-card-section
      ><h2>Riwayat pembayaran</h2
      ><p
        >{{ pagination.rowsNumber }} percobaan pembayaran ditemukan.</p
      ></q-card-section
    >
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
      no-data-label="Belum ada riwayat pembayaran yang sesuai."
      @request="$emit('request', $event.pagination)"
    >
      <template #body-cell-invoice="props"
        ><q-td :props="props">{{
          props.row.invoice?.invoice_number || '—'
        }}</q-td></template
      >
      <template #body-cell-amount="props"
        ><q-td :props="props">{{
          formatSubscriptionPrice(props.value, props.row.currency)
        }}</q-td></template
      >
      <template #body-cell-requested_at="props"
        ><q-td :props="props">{{
          formatSubscriptionDate(props.value)
        }}</q-td></template
      >
      <template #body-cell-completed_at="props"
        ><q-td :props="props">{{
          formatSubscriptionDate(props.value)
        }}</q-td></template
      >
      <template #body-cell-status="props"
        ><q-td :props="props"
          ><q-badge
            rounded
            :color="getPaymentAttemptStatus(props.value).color"
            :label="getPaymentAttemptStatus(props.value).label" /></q-td
      ></template>
      <template #body-cell-reconciliation="props">
        <q-td :props="props">
          <q-badge
            rounded
            outline
            :color="
              getReconciliationStatus(props.row.reconciliation?.status).color
            "
            :label="
              getReconciliationStatus(props.row.reconciliation?.status).label
            "
          />
        </q-td>
      </template>
      <template #body-cell-synced_at="props">
        <q-td :props="props">
          {{ formatSubscriptionDate(props.row.reconciliation?.last_synced_at) }}
        </q-td>
      </template>
      <template #body-cell-actions="props"
        ><q-td :props="props" class="text-right"
          ><q-btn
            flat
            round
            dense
            icon="visibility"
            color="brown-7"
            aria-label="Detail percobaan pembayaran"
            @click="$emit('detail', props.row)"
            ><q-tooltip>Detail</q-tooltip></q-btn
          ></q-td
        ></template
      >
      <template #no-data
        ><div class="full-width row flex-center q-pa-lg"
          ><EmptyState
            icon="payments"
            title="Belum ada riwayat pembayaran"
            message="Riwayat akan muncul setelah payment gateway memproses pembayaran." /></div
      ></template>
    </q-table>
  </q-card>
</template>

<script setup>
import EmptyState from '@/components/EmptyState.vue'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice,
  getPaymentAttemptStatus,
  getReconciliationStatus
} from '@/utils/subscription'

defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true }
})
defineEmits(['request', 'detail'])

const columns = [
  { name: 'invoice', label: 'Nomor invoice', field: 'invoice', align: 'left' },
  {
    name: 'provider',
    label: 'Provider',
    field: 'provider',
    align: 'left',
    sortable: true
  },
  {
    name: 'attempt_number',
    label: 'Percobaan',
    field: 'attempt_number',
    align: 'center',
    sortable: true
  },
  { name: 'amount', label: 'Nominal', field: 'amount', align: 'right' },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left',
    sortable: true
  },
  {
    name: 'reconciliation',
    label: 'Sinkronisasi',
    field: row => row.reconciliation?.status,
    align: 'left'
  },
  {
    name: 'synced_at',
    label: 'Sinkron terakhir',
    field: row => row.reconciliation?.last_synced_at,
    align: 'left'
  },
  {
    name: 'requested_at',
    label: 'Diminta',
    field: 'requested_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'completed_at',
    label: 'Selesai',
    field: 'completed_at',
    align: 'left',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]
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
