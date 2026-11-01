<template>
  <div>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Audit Trail Keamanan & Aktivitas Midtrans
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Catatan riwayat seluruh aktivitas operasional gateway, mutasi
          konfigurasi, dan simulasi pembayaran.
        </p>
      </div>

      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat Ulang"
          no-caps
          :loading="store.auditsLoading"
          @click="store.fetchAudits"
        />
      </div>
    </div>

    <!-- Filter Panel -->
    <FilterPanel class="q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-input
          v-model="store.auditFilter.search"
          outlined
          dense
          clearable
          label="Cari aksi audit atau aktivitas"
          debounce="300"
          bg-color="white"
          @update:model-value="store.fetchAudits"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-select
          v-model="store.auditFilter.status"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Status Aksi"
          :options="statusOptions"
          bg-color="white"
          @update:model-value="store.fetchAudits"
        />
      </div>
    </FilterPanel>

    <!-- Table -->
    <q-table
      flat
      bordered
      :rows="store.audits"
      :columns="columns"
      :loading="store.auditsLoading"
      :pagination="store.auditPagination"
      row-key="id"
      no-data-label="Belum ada catatan audit log Midtrans."
      class="audit-table"
      @request="store.fetchAudits"
    >
      <!-- Timestamp -->
      <template #body-cell-created_at="props">
        <q-td :props="props">
          <div class="text-caption font-mono">{{
            formatDate(props.row.created_at)
          }}</div>
        </q-td>
      </template>

      <!-- Action -->
      <template #body-cell-action="props">
        <q-td :props="props">
          <div class="text-weight-bold font-mono text-dark">{{
            props.row.action
          }}</div>
          <div class="text-caption text-grey-6"
            >Merchant: {{ props.row.merchant_code }}</div
          >
        </q-td>
      </template>

      <!-- Status -->
      <template #body-cell-status="props">
        <q-td :props="props" class="text-center">
          <q-badge
            :color="getMidtransStatusColor(props.row.status)"
            class="text-weight-bold"
          >
            {{ getMidtransStatusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Response Code -->
      <template #body-cell-response_code="props">
        <q-td :props="props" class="text-center">
          <span
            v-if="props.row.response_code"
            class="font-mono text-caption text-weight-bold"
          >
            {{ props.row.response_code }}
          </span>
          <span v-else class="text-caption text-grey-5">—</span>
        </q-td>
      </template>

      <!-- Latency -->
      <template #body-cell-latency_ms="props">
        <q-td :props="props" class="text-center">
          <span
            v-if="props.row.latency_ms !== null"
            class="font-mono text-caption"
          >
            {{ props.row.latency_ms }} ms
          </span>
          <span v-else class="text-caption text-grey-5">—</span>
        </q-td>
      </template>

      <!-- User / IP -->
      <template #body-cell-user_ip="props">
        <q-td :props="props">
          <div class="text-caption text-weight-medium">
            {{ props.row.admin_user?.name || 'Sistem / Service' }}
          </div>
          <div class="text-caption text-grey-6 font-mono">
            IP: {{ props.row.ip_address || '—' }}
          </div>
        </q-td>
      </template>

      <!-- Actions -->
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="warning"
            @click="store.viewAuditDetail(props.row)"
          >
            <q-tooltip>Lihat Metadata Audit</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Detail Dialog -->
    <q-dialog v-model="store.auditDetailDialogOpen">
      <q-card style="min-width: 480px; max-width: 650px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-caption text-weight-bold text-amber-9"
              >DETAIL AUDIT LOG</div
            >
            <div class="text-h6 text-weight-bold font-mono">
              {{ store.selectedAudit?.action }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator class="q-my-sm" />

        <q-card-section class="q-gutter-y-xs">
          <div class="row justify-between">
            <span class="text-caption text-grey-7">Merchant:</span>
            <span class="text-weight-bold font-mono">{{
              store.selectedAudit?.merchant_code
            }}</span>
          </div>
          <div class="row justify-between">
            <span class="text-caption text-grey-7">Status:</span>
            <q-badge
              :color="getMidtransStatusColor(store.selectedAudit?.status)"
              class="text-weight-bold"
            >
              {{ getMidtransStatusLabel(store.selectedAudit?.status) }}
            </q-badge>
          </div>
          <div class="row justify-between">
            <span class="text-caption text-grey-7">Waktu:</span>
            <span class="font-mono text-caption">{{
              formatDate(store.selectedAudit?.created_at)
            }}</span>
          </div>
          <div class="row justify-between">
            <span class="text-caption text-grey-7">Admin User:</span>
            <span>{{ store.selectedAudit?.admin_user?.name || 'Sistem' }}</span>
          </div>
          <div class="row justify-between">
            <span class="text-caption text-grey-7">IP Address:</span>
            <span class="font-mono">{{
              store.selectedAudit?.ip_address || '—'
            }}</span>
          </div>

          <div class="q-mt-md">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs"
              >Metadata Tersanitasi:</div
            >
            <pre
              class="bg-grey-2 q-pa-sm rounded-borders text-caption font-mono overflow-auto"
              style="max-height: 200px"
              >{{
                JSON.stringify(store.selectedAudit?.metadata, null, 2)
              }}</pre>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Tutup" color="grey-8" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import FilterPanel from '@/components/FilterPanel.vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'
import {
  getMidtransStatusColor,
  getMidtransStatusLabel
} from '@/utils/midtrans-status'

const store = usePaymentGatewayMidtransStore()

const statusOptions = [
  { label: 'Semua Status', value: null },
  { label: 'Berhasil (Success)', value: 'success' },
  { label: 'Gagal (Failed)', value: 'failed' }
]

const columns = [
  { name: 'created_at', label: 'WAKTU', align: 'left', field: 'created_at' },
  { name: 'action', label: 'AKSI & MERCHANT', align: 'left', field: 'action' },
  { name: 'status', label: 'STATUS', align: 'center', field: 'status' },
  {
    name: 'response_code',
    label: 'KODE',
    align: 'center',
    field: 'response_code'
  },
  {
    name: 'latency_ms',
    label: 'LATENSI',
    align: 'center',
    field: 'latency_ms'
  },
  { name: 'user_ip', label: 'USER / IP', align: 'left' },
  { name: 'actions', label: 'DETAIL', align: 'right' }
]

function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'medium'
  })
}
</script>

<style scoped>
.audit-table {
  background: #ffffff;
  border-radius: 12px;
}
.font-mono {
  font-family: monospace;
}
</style>
