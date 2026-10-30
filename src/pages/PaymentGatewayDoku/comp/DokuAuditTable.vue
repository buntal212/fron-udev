<template>
  <div class="audit-table-wrap">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <h2 class="section-title">Audit Trail & Riwayat Operasi</h2>
        <p class="section-desc">
          Seluruh aktivitas konfigurasi dan pengujian token dicatat secara
          transparan tanpa memuat data rahasia.
        </p>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat Ulang"
          no-caps
          :loading="store.auditsLoading"
          @click="store.fetchAudits(1)"
        />
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-input
          v-model="store.auditFilter.search"
          outlined
          dense
          clearable
          debounce="300"
          placeholder="Cari aksi atau response code..."
          bg-color="white"
          @update:model-value="store.fetchAudits(1)"
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
          placeholder="Semua Status"
          :options="[
            { label: 'Semua Status', value: null },
            { label: 'Berhasil (Success)', value: 'success' },
            { label: 'Gagal (Failed)', value: 'failed' }
          ]"
          bg-color="white"
          @update:model-value="store.fetchAudits(1)"
        />
      </div>
    </div>

    <!-- Table -->
    <q-card flat bordered class="table-card">
      <q-table
        flat
        :rows="store.audits"
        :columns="columns"
        row-key="id"
        :loading="store.auditsLoading"
        v-model:pagination="store.auditPagination"
        :rows-per-page-options="[15, 30, 50]"
        no-data-label="Belum ada riwayat audit untuk merchant ini."
        @request="onRequest"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.status === 'success' ? 'positive' : 'negative'"
              :label="props.row.status"
              class="text-uppercase"
            />
          </q-td>
        </template>

        <template #body-cell-response_code="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.response_code"
              :color="
                props.row.response_code === '2007300' ? 'amber-8' : 'grey-8'
              "
              :label="props.row.response_code"
              class="font-mono"
            />
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>

        <template #body-cell-latency_ms="props">
          <q-td :props="props" class="font-mono">
            {{
              props.row.latency_ms !== null &&
              props.row.latency_ms !== undefined
                ? props.row.latency_ms + ' ms'
                : '—'
            }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              dense
              round
              color="grey-8"
              icon="visibility"
              @click="openDetail(props.row)"
            >
              <q-tooltip>Lihat Detail Aman</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Modal Detail Audit Aman -->
    <q-dialog v-model="detailDialogOpen">
      <q-card style="min-width: 480px; max-width: 600px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-h6 text-dark">Detail Audit Log</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedAudit">
          <div class="row q-col-gutter-sm text-caption q-mb-md">
            <div class="col-6"
              ><strong>Waktu:</strong> {{ selectedAudit.created_at }}</div
            >
            <div class="col-6"
              ><strong>Admin:</strong>
              {{ selectedAudit.admin_user?.name || 'Sistem' }}</div
            >
            <div class="col-6"
              ><strong>Merchant:</strong> {{ selectedAudit.merchant_code }}</div
            >
            <div class="col-6"
              ><strong>Aksi:</strong> {{ selectedAudit.action }}</div
            >
            <div class="col-6"
              ><strong>Status:</strong> {{ selectedAudit.status }}</div
            >
            <div class="col-6"
              ><strong>Response Code:</strong>
              {{ selectedAudit.response_code || '—' }}</div
            >
            <div class="col-6"
              ><strong>IP Address:</strong>
              {{ selectedAudit.ip_address || '—' }}</div
            >
            <div class="col-6"
              ><strong>Latensi:</strong>
              {{
                selectedAudit.latency_ms
                  ? selectedAudit.latency_ms + ' ms'
                  : '—'
              }}</div
            >
          </div>

          <div class="text-subtitle2 text-grey-8 q-mb-xs">Metadata Aman:</div>
          <pre
            class="bg-grey-2 q-pa-sm rounded-borders font-mono text-caption"
            style="max-height: 200px; overflow: auto"
            >{{
              JSON.stringify(selectedAudit.metadata, null, 2) ||
              'Tidak ada metadata tambahan'
            }}</pre>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Tutup" color="dark" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()
const detailDialogOpen = ref(false)
const selectedAudit = ref(null)

const columns = [
  {
    name: 'created_at',
    label: 'Waktu',
    field: 'created_at',
    align: 'left',
    sortable: false
  },
  {
    name: 'admin_user',
    label: 'Admin',
    field: row => row.admin_user?.name || 'Sistem',
    align: 'left'
  },
  { name: 'action', label: 'Aktivitas', field: 'action', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  {
    name: 'response_code',
    label: 'Code',
    field: 'response_code',
    align: 'center'
  },
  { name: 'latency_ms', label: 'Latensi', field: 'latency_ms', align: 'right' },
  { name: 'ip_address', label: 'IP', field: 'ip_address', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
]

function onRequest(props) {
  const { page, rowsPerPage } = props.pagination
  store.auditPagination.rowsPerPage = rowsPerPage
  store.fetchAudits(page)
}

function openDetail(audit) {
  selectedAudit.value = audit
  detailDialogOpen.value = true
}
</script>

<style scoped>
.section-title {
  margin: 0 0 4px;
  color: #17130c;
  font-size: 1.15rem;
  font-weight: 700;
}
.section-desc {
  margin: 0;
  color: #716a5d;
  font-size: 0.85rem;
}
.table-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.font-mono {
  font-family:
    SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}
</style>
