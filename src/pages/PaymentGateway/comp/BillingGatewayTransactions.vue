<template>
  <section>
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2>Transaksi Billing</h2>
        <p class="section-description">
          Monitoring read-only pembayaran invoice DANA Sandbox. Status lunas
          hanya berasal dari rekonsiliasi gateway yang sah.
        </p>
      </div>
      <div class="col-12 col-md-auto">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat ulang"
          no-caps
          :loading="loading"
          @click="loadTransactions(1)"
        />
      </div>
    </div>

    <FilterPanel class="q-mb-md">
      <div class="col-12 col-md-3">
        <q-select
          v-model="filters.application_id"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Aplikasi"
          :options="applicationOptions"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="filters.customer"
          outlined
          dense
          clearable
          debounce="350"
          label="Pelanggan / warung"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="filters.invoice_number"
          outlined
          dense
          clearable
          debounce="350"
          label="Nomor invoice"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="filters.status"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Status pembayaran / gateway"
          :options="statusOptions"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="filters.provider"
          outlined
          dense
          emit-value
          map-options
          label="Provider"
          :options="providerOptions"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="filters.date_from"
          outlined
          dense
          type="date"
          label="Tanggal dari"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="filters.date_to"
          outlined
          dense
          type="date"
          label="Tanggal sampai"
          bg-color="white"
          @update:model-value="loadTransactions(1)"
        />
      </div>
    </FilterPanel>

    <q-banner v-if="error" rounded class="error-banner q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ error }}
      <template #action>
        <q-btn
          flat
          color="negative"
          label="Coba lagi"
          no-caps
          @click="loadTransactions()"
        />
      </template>
    </q-banner>

    <q-card flat bordered class="table-card">
      <q-table
        :rows="items"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        flat
        binary-state-sort
        :rows-per-page-options="[10, 15, 25, 50]"
        no-data-label="Belum ada transaksi billing DANA Sandbox yang sesuai."
        @request="onRequest"
      >
        <template #body-cell-application="props">
          <q-td :props="props">{{ props.row.application.name }}</q-td>
        </template>
        <template #body-cell-customer="props">
          <q-td :props="props">{{ props.row.customer.name }}</q-td>
        </template>
        <template #body-cell-invoice="props">
          <q-td :props="props">{{ props.row.invoice.number }}</q-td>
        </template>
        <template #body-cell-attempt="props">
          <q-td :props="props">#{{ props.row.payment_attempt.number }}</q-td>
        </template>
        <template #body-cell-provider="props">
          <q-td :props="props">
            {{ props.row.gateway.provider.toUpperCase() }} ·
            {{ props.row.gateway.environment }}
          </q-td>
        </template>
        <template #body-cell-amount="props">
          <q-td :props="props" class="text-right">
            {{ formatAmount(props.row.amount, props.row.currency) }}
          </q-td>
        </template>
        <template #body-cell-gateway_status="props">
          <q-td :props="props">
            <q-badge
              rounded
              :color="gatewayStatusColor(props.row.gateway.status)"
            >
              {{ label(props.row.gateway.status) }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-sync="props">
          <q-td :props="props">
            <q-badge
              rounded
              outline
              :color="syncColor(props.row.billing_sync.status)"
            >
              {{ props.row.billing_sync.label }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-references="props">
          <q-td :props="props">
            <div>{{ props.row.references.merchant || '—' }}</div>
            <small>{{ props.row.references.provider || '—' }}</small>
          </q-td>
        </template>
        <template #body-cell-times="props">
          <q-td :props="props">
            <div>{{ formatDate(props.row.payment_attempt.requested_at) }}</div>
            <small
              >Dibayar:
              {{ formatDate(props.row.payment_attempt.completed_at) }}</small
            >
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
              aria-label="Detail transaksi billing"
              @click="openDetail(props.row.id)"
            >
              <q-tooltip>Detail hubungan pembayaran</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="detailOpen">
      <q-card class="detail-dialog">
        <q-card-section class="row items-center justify-between dialog-header">
          <div>
            <p class="eyebrow">DETAIL TRANSAKSI BILLING</p>
            <h3>{{ detail?.invoice?.number || 'Transaksi billing' }}</h3>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            aria-label="Tutup"
            v-close-popup
          />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="detailLoading" class="q-pa-xl text-center">
          <q-spinner color="warning" size="32px" />
        </q-card-section>
        <q-card-section v-else-if="detail" class="q-gutter-y-md">
          <q-banner v-if="detail.anomaly" rounded class="warning-banner">
            <template #avatar><q-icon name="warning_amber" /></template>
            {{ detail.anomaly.message }} Ditampilkan sebagai anomali dan tidak
            diperbaiki otomatis.
          </q-banner>
          <div class="relationship-flow">
            <article>
              <q-icon name="receipt_long" />
              <strong>Invoice</strong>
              <span
                >{{ detail.invoice.number }} ·
                {{ label(detail.invoice.status) }}</span
              >
            </article>
            <q-icon class="flow-arrow" name="arrow_forward" />
            <article>
              <q-icon name="payments" />
              <strong>Percobaan pembayaran</strong>
              <span
                >#{{ detail.payment_attempt.number }} ·
                {{ label(detail.payment_attempt.status) }}</span
              >
            </article>
            <q-icon class="flow-arrow" name="arrow_forward" />
            <article>
              <q-icon name="account_balance_wallet" />
              <strong>Transaksi gateway</strong>
              <span>{{
                detail.gateway.transaction_id || 'Belum ditemukan'
              }}</span>
            </article>
            <q-icon class="flow-arrow" name="arrow_forward" />
            <article>
              <q-icon name="verified" />
              <strong>Konfirmasi</strong>
              <span>{{ detail.billing_sync.label }}</span>
            </article>
            <q-icon class="flow-arrow" name="arrow_forward" />
            <article>
              <q-icon name="autorenew" />
              <strong>Langganan</strong>
              <span>{{
                detail.settlement.subscription?.status || 'Belum diperbarui'
              }}</span>
            </article>
          </div>

          <div class="detail-grid">
            <div
              ><span>Aplikasi</span
              ><strong>{{ detail.application.name }}</strong></div
            >
            <div
              ><span>Pelanggan / warung</span
              ><strong>{{ detail.customer.name }}</strong></div
            >
            <div
              ><span>Provider dan environment</span
              ><strong
                >{{ detail.gateway.provider.toUpperCase() }} ·
                {{ detail.gateway.environment }}</strong
              ></div
            >
            <div
              ><span>Nominal</span
              ><strong>{{
                formatAmount(detail.amount, detail.currency)
              }}</strong></div
            >
            <div
              ><span>Referensi merchant</span
              ><strong>{{ detail.references.merchant || '—' }}</strong></div
            >
            <div
              ><span>Referensi provider</span
              ><strong>{{ detail.references.provider || '—' }}</strong></div
            >
            <div
              ><span>Waktu transaksi</span
              ><strong>{{
                formatDate(detail.payment_attempt.requested_at)
              }}</strong></div
            >
            <div
              ><span>Waktu pembayaran</span
              ><strong>{{
                formatDate(detail.payment_attempt.completed_at)
              }}</strong></div
            >
            <div
              ><span>Status gateway</span
              ><strong>{{ label(detail.gateway.status) }}</strong></div
            >
            <div
              ><span>Konfirmasi terakhir</span
              ><strong>{{
                formatDate(detail.confirmation.last_checked_at)
              }}</strong></div
            >
          </div>

          <section>
            <h4>Konfirmasi pembayaran</h4>
            <p class="section-description">
              Bukti pembayaran valid:
              {{ detail.confirmation.payment_proof_valid ? 'ya' : 'belum' }}.
              Gateway tidak dihubungi saat membuka halaman ini.
            </p>
          </section>
          <section>
            <h4>Pembaruan langganan</h4>
            <p
              class="section-description"
              v-if="detail.settlement.subscription"
            >
              {{ detail.settlement.subscription.status }} · berlaku hingga
              {{ formatDate(detail.settlement.subscription.expires_at) }}.
            </p>
            <p v-else class="section-description"
              >Belum ada pembaruan langganan tercatat.</p
            >
          </section>
        </q-card-section>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FilterPanel from '@/components/FilterPanel.vue'
import { paymentGatewayService } from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'

const props = defineProps({ applications: { type: Array, default: () => [] } })
const route = useRoute()
const items = ref([])
const loading = ref(false)
const error = ref(null)
const detail = ref(null)
const detailLoading = ref(false)
const detailOpen = ref(false)
const requestId = ref(0)
const filters = ref({
  application_id: null,
  customer: null,
  invoice_number: null,
  provider: 'dana',
  status: null,
  date_from: null,
  date_to: null
})
const pagination = ref({
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true
})
const applicationOptions = computed(() =>
  props.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const providerOptions = [{ label: 'DANA Sandbox', value: 'dana' }]
const statusOptions = [
  { label: 'Dimulai', value: 'initiated' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Berhasil', value: 'succeeded' },
  { label: 'Lunas di gateway', value: 'paid' },
  { label: 'Gagal', value: 'failed' },
  { label: 'Kedaluwarsa', value: 'expired' },
  { label: 'Dibatalkan', value: 'cancelled' }
]
const columns = [
  {
    name: 'application',
    label: 'Aplikasi',
    field: 'application',
    align: 'left'
  },
  {
    name: 'customer',
    label: 'Pelanggan / warung',
    field: 'customer',
    align: 'left'
  },
  { name: 'invoice', label: 'Nomor invoice', field: 'invoice', align: 'left' },
  { name: 'attempt', label: 'Percobaan', field: 'attempt', align: 'center' },
  {
    name: 'provider',
    label: 'Provider / env.',
    field: 'provider',
    align: 'left'
  },
  { name: 'amount', label: 'Nominal', field: 'amount', align: 'right' },
  {
    name: 'gateway_status',
    label: 'Status gateway',
    field: 'gateway_status',
    align: 'left'
  },
  { name: 'sync', label: 'Sinkronisasi billing', field: 'sync', align: 'left' },
  {
    name: 'references',
    label: 'Referensi merchant / provider',
    field: 'references',
    align: 'left'
  },
  {
    name: 'times',
    label: 'Waktu transaksi / bayar',
    field: 'times',
    align: 'left'
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

function query(page = pagination.value.page) {
  return Object.fromEntries(
    Object.entries({
      ...filters.value,
      page,
      per_page: pagination.value.rowsPerPage,
      sort: pagination.value.sortBy || 'created_at',
      direction: pagination.value.descending ? 'desc' : 'asc'
    }).filter(([, value]) => value !== null && value !== '')
  )
}

async function loadTransactions(page = pagination.value.page) {
  const id = ++requestId.value
  loading.value = true
  error.value = null
  try {
    const response = await paymentGatewayService.billingTransactions(
      query(page)
    )
    if (id !== requestId.value) return
    items.value = response.data.data || []
    const meta = response.data.meta || {}
    pagination.value = {
      ...pagination.value,
      page: meta.current_page || page,
      rowsPerPage: meta.per_page || pagination.value.rowsPerPage,
      rowsNumber: meta.total || 0
    }
  } catch (exception) {
    if (id === requestId.value) {
      items.value = []
      error.value = getApiErrorMessage(exception)
    }
  } finally {
    if (id === requestId.value) loading.value = false
  }
}

function onRequest(next) {
  pagination.value = { ...pagination.value, ...next.pagination }
  loadTransactions(next.pagination.page)
}

async function openDetail(id) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const response = await paymentGatewayService.billingTransaction(id)
    detail.value = response.data.data
  } catch (exception) {
    error.value = getApiErrorMessage(exception)
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

function label(value) {
  return value ? String(value).replaceAll('_', ' ') : 'Belum ada status'
}

function gatewayStatusColor(status) {
  if (status === 'paid') return 'positive'
  if (['failed', 'expired', 'cancelled'].includes(status)) return 'negative'
  return 'warning'
}

function syncColor(status) {
  if (status === 'synchronized') return 'positive'
  if (
    ['gateway_not_found', 'sync_failed', 'billing_update_pending'].includes(
      status
    )
  )
    return 'negative'
  return 'warning'
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '—'
}

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency || 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

function openRequestedDetail(value) {
  if (typeof value === 'string' && /^\d+$/.test(value)) openDetail(value)
}

onMounted(() => {
  loadTransactions(1)
  openRequestedDetail(route.query.billing_transaction)
})

watch(() => route.query.billing_transaction, openRequestedDetail)
</script>

<style scoped>
h2,
h3,
h4 {
  margin: 0;
  color: #20180b;
}
h2 {
  font-size: 1.15rem;
}
h4 {
  font-size: 0.92rem;
}
.section-description {
  margin: 4px 0 0;
  color: #716a5d;
  font-size: 0.82rem;
  line-height: 1.5;
}
.table-card {
  border-color: #e0d7c6;
  border-radius: 14px;
  overflow: hidden;
}
small {
  color: #746b5c;
  font-size: 0.72rem;
  overflow-wrap: anywhere;
}
.error-banner {
  border: 1px solid #e8b4ad;
  background: #fff2f0;
  color: #9f2419;
}
.warning-banner {
  border: 1px solid #e4c56c;
  background: #fff8dc;
  color: #5d4710;
}
.detail-dialog {
  width: min(1000px, 96vw);
  border-radius: 16px;
  overflow: hidden;
}
.dialog-header {
  background: linear-gradient(135deg, #16120d, #3c2c12);
  color: #fff;
}
.dialog-header h3 {
  color: #fff;
}
.eyebrow {
  margin: 0 0 4px;
  color: #f6c65d;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.relationship-flow {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 12px;
}
.relationship-flow article {
  display: grid;
  gap: 5px;
  min-width: 155px;
  padding: 12px;
  border: 1px solid #eadfc9;
  border-radius: 10px;
  background: #fffaf0;
}
.relationship-flow article > .q-icon {
  color: #b88924;
}
.relationship-flow strong {
  font-size: 0.78rem;
  color: #342918;
}
.relationship-flow span {
  color: #746b5c;
  font-size: 0.72rem;
  overflow-wrap: anywhere;
}
.flow-arrow {
  align-self: center;
  color: #b88924;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.detail-grid > div {
  padding: 10px;
  border: 1px solid #eee6d9;
  border-radius: 10px;
}
.detail-grid span,
.detail-grid strong {
  display: block;
  overflow-wrap: anywhere;
}
.detail-grid span {
  color: #746b5c;
  font-size: 0.7rem;
}
.detail-grid strong {
  margin-top: 3px;
  color: #342918;
  font-size: 0.82rem;
}
@media (max-width: 599px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
