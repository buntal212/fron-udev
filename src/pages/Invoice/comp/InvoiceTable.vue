<template>
  <q-card flat bordered class="table-card">
    <q-card-section>
      <h2>Daftar invoice</h2>
      <p>{{ pagination.rowsNumber }} invoice ditemukan.</p>
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
      no-data-label="Belum ada invoice yang sesuai."
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
      <template #body-cell-amount="props">
        <q-td :props="props">{{
          formatSubscriptionPrice(props.value, props.row.currency)
        }}</q-td>
      </template>
      <template #body-cell-issued_at="props">
        <q-td :props="props">{{ formatSubscriptionDate(props.value) }}</q-td>
      </template>
      <template #body-cell-due_at="props">
        <q-td :props="props">{{ formatSubscriptionDate(props.value) }}</q-td>
      </template>
      <template #body-cell-paid_at="props">
        <q-td :props="props">{{ formatSubscriptionDate(props.value) }}</q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            rounded
            :color="getInvoiceStatus(props.value).color"
            :label="getInvoiceStatus(props.value).label"
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
            aria-label="Detail invoice"
            @click="$emit('detail', props.row)"
          >
            <q-tooltip>Detail</q-tooltip>
          </q-btn>
        </q-td>
      </template>
      <template #no-data>
        <div class="full-width row flex-center q-pa-lg">
          <EmptyState
            icon="receipt_long"
            title="Belum ada invoice"
            message="Invoice akan muncul setelah dibuat untuk pelanggan."
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
  formatSubscriptionPrice,
  getInvoiceStatus
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
    name: 'invoice_number',
    label: 'Nomor invoice',
    field: 'invoice_number',
    align: 'left',
    sortable: true
  },
  {
    name: 'application',
    label: 'Aplikasi',
    field: 'application',
    align: 'left'
  },
  { name: 'customer', label: 'Pelanggan', field: 'customer', align: 'left' },
  { name: 'plan', label: 'Paket', field: 'plan', align: 'left' },
  {
    name: 'amount',
    label: 'Nominal',
    field: 'amount',
    align: 'right',
    sortable: true
  },
  {
    name: 'issued_at',
    label: 'Diterbitkan',
    field: 'issued_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'due_at',
    label: 'Jatuh tempo',
    field: 'due_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'paid_at',
    label: 'Dibayar',
    field: 'paid_at',
    align: 'left',
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

const applicationName = invoice => {
  const applicationId =
    invoice.customer?.application_id || invoice.plan?.application_id
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
