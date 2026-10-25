<template>
  <q-card flat bordered class="table-card">
    <q-card-section>
      <h2>Daftar pelanggan</h2>
      <p>{{ pagination.rowsNumber }} data terdaftar.</p>
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
      no-data-label="Tidak ada pelanggan yang sesuai."
      @request="$emit('request', $event.pagination)"
    >
      <template #body-cell-customer="props">
        <q-td :props="props" class="customer-cell">
          <div class="customer-name">{{ props.row.name }}</div>
          <div class="muted truncate">{{
            props.row.application?.name || '-'
          }}</div>
          <div
            class="external-id truncate"
            :title="props.row.external_customer_id"
          >
            {{ props.row.external_customer_id }}
          </div>
        </q-td>
      </template>
      <template #body-cell-referral="props">
        <q-td :props="props">
          <template v-if="props.row.referral">
            <div>{{
              props.row.referral.partner_name || 'Mitra tidak tersedia'
            }}</div>
            <q-badge
              outline
              color="brown-7"
              class="q-my-xs"
              :label="referralType(props.row.referral.type)"
            />
            <div class="external-id">{{ props.row.referral.code }}</div>
          </template>
          <span v-else class="muted">Tanpa referral</span>
        </q-td>
      </template>
      <template #body-cell-package="props">
        <q-td :props="props" class="package-cell">
          <template v-if="props.row.package">
            <div>{{ props.row.package.name }}</div>
            <div class="muted"
              >Normal {{ money(props.row.package.normal_price) }}</div
            >
            <div class="muted"
              >Potongan {{ money(props.row.package.referral_discount) }}</div
            >
            <div class="final-price"
              >{{ money(props.row.package.final_price) }}
              <span>/ periode</span></div
            >
          </template>
          <span v-else class="muted">Belum ada paket</span>
        </q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props" class="status-cell">
          <q-badge
            rounded
            :color="props.row.is_active ? 'positive' : 'grey-7'"
            :label="props.row.is_active ? 'Aktif' : 'Tidak aktif'"
          />
          <div class="muted q-mt-xs"
            >{{ props.row.source === 'integration' ? 'Integrasi' : 'Manual' }} ·
            {{ props.row.is_test ? 'UAT' : 'Produksi' }}</div
          >
          <div class="sync-status">{{ syncLabel(props.row.sync_status) }}</div>
        </q-td>
      </template>
      <template #body-cell-created_at="props">
        <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right no-wrap">
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="brown-7"
            aria-label="Detail pelanggan"
            @click="$emit('detail', props.row)"
          />
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="warning"
            aria-label="Ubah pelanggan"
            @click="$emit('edit', props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
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
    name: 'customer',
    label: 'Pelanggan',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'referral',
    label: 'Referral',
    field: row => row.referral?.code || '',
    align: 'left'
  },
  {
    name: 'package',
    label: 'Paket / Harga',
    field: row => row.package?.final_price || '',
    align: 'left'
  },
  { name: 'status', label: 'Status', field: 'is_active', align: 'left' },
  {
    name: 'created_at',
    label: 'Terdaftar',
    field: 'created_at',
    align: 'left',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]
const money = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
const formatDate = value =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
    new Date(value)
  )
const referralType = type => (type === 'khusus' ? 'Khusus' : 'Umum')
const syncLabel = status =>
  status === 'synced' ? 'Tersinkron' : status || 'Belum disinkronkan'
</script>
<style scoped>
.table-card {
  border-color: #e0d7c6;
  border-radius: 14px;
}
.customer-name,
.final-price {
  color: #20180b;
  font-weight: 700;
}
.muted {
  color: #746b5c;
  font-size: 0.76rem;
}
.external-id {
  color: #8a7c68;
  font-family: monospace;
  font-size: 0.72rem;
}
.truncate {
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.package-cell {
  min-width: 185px;
}
.final-price {
  margin-top: 4px;
}
.final-price span {
  color: #746b5c;
  font-size: 0.72rem;
  font-weight: 400;
}
.status-cell {
  min-width: 130px;
}
.sync-status {
  color: #746b5c;
  font-size: 0.72rem;
  margin-top: 2px;
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
@media (max-width: 720px) {
  .truncate {
    max-width: 120px;
  }
  .package-cell {
    min-width: 160px;
  }
}
</style>
