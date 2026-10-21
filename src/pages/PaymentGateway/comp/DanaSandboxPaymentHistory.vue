<template>
  <q-separator class="q-my-lg" />
  <section aria-labelledby="sandbox-payment-history-heading">
    <div class="row items-center justify-between q-col-gutter-sm">
      <div class="col-12 col-sm"
        ><h3 id="sandbox-payment-history-heading">Audit Pembayaran Sandbox</h3
        ><p class="section-description"
          >Status dan waktu lunas hanya berasal dari catatan gateway yang telah
          diverifikasi.</p
        ></div
      >
      <div class="col-12 col-sm-auto"
        ><q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh"
          no-caps
          :loading="loading"
          @click="refreshPayments(1)"
      /></div>
    </div>
    <div class="row q-col-gutter-sm q-mt-xs">
      <div class="col-12 col-sm-4"
        ><q-select
          v-model="filters.status"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Status"
          :options="statusOptions"
          @update:model-value="refreshPayments(1)"
      /></div>
      <div class="col-6 col-sm-3"
        ><q-input
          v-model="filters.from"
          outlined
          dense
          type="date"
          label="Dari"
          @update:model-value="refreshPayments(1)"
      /></div>
      <div class="col-6 col-sm-3"
        ><q-input
          v-model="filters.to"
          outlined
          dense
          type="date"
          label="Sampai"
          @update:model-value="refreshPayments(1)"
      /></div>
      <div class="col-12 col-sm-2"
        ><q-input
          v-model="filters.merchant_order_id"
          outlined
          dense
          clearable
          label="Referensi"
          @keyup.enter="refreshPayments(1)"
      /></div>
    </div>
    <div class="summary-grid q-mt-md">
      <q-card v-for="item in summaryCards" :key="item.label" flat bordered
        ><q-card-section class="q-pa-sm"
          ><div class="text-caption text-grey-7">{{ item.label }}</div
          ><div class="text-h6">{{ item.value }}</div></q-card-section
        ></q-card
      >
      <q-card flat bordered
        ><q-card-section class="q-pa-sm"
          ><div class="text-caption text-grey-7">Nilai dibayar</div
          ><div class="text-body2">{{ paidAmounts }}</div></q-card-section
        ></q-card
      >
    </div>
    <q-banner v-if="error" rounded class="error-banner q-mt-sm"
      ><template #avatar><q-icon name="error_outline" /></template
      >{{ error }}</q-banner
    >
    <div class="payment-history q-mt-sm"
      ><q-inner-loading :showing="loading" color="warning" />
      <q-table
        v-if="payments.length && $q.screen.gt.sm"
        flat
        bordered
        hide-bottom
        row-key="id"
        :rows="payments"
        :columns="columns"
        :pagination="{ rowsPerPage: 0 }"
      >
        <template #body-cell-amount="props"
          ><q-td :props="props">{{ formatAmount(props.row) }}</q-td></template
        >
        <template #body-cell-status="props"
          ><q-td :props="props"
            ><q-badge :color="statusColor(props.row.status)">{{
              labelFor(props.row.status)
            }}</q-badge></q-td
          ></template
        >
        <template #body-cell-actions="props"
          ><q-td :props="props"
            ><q-btn
              flat
              round
              dense
              color="warning"
              icon="visibility"
              aria-label="Detail pembayaran"
              @click="openDetail(props.row)" /></q-td
        ></template>
      </q-table>
      <div v-else-if="payments.length" class="q-gutter-y-sm"
        ><q-card v-for="payment in payments" :key="payment.id" flat bordered
          ><q-card-section class="q-pa-sm"
            ><div class="row justify-between no-wrap q-col-gutter-sm"
              ><div class="col"
                ><div class="text-caption text-grey-7">{{
                  formatDate(payment.created_at)
                }}</div
                ><div class="text-weight-medium">{{
                  payment.merchant_reference
                }}</div
                ><div class="text-caption"
                  >{{ formatAmount(payment) }} ·
                  {{
                    payment.provider_order_reference ||
                    'Referensi provider belum ada'
                  }}</div
                ></div
              ><div class="col-auto"
                ><q-badge :color="statusColor(payment.status)">{{
                  labelFor(payment.status)
                }}</q-badge></div
              ></div
            ><q-btn
              flat
              dense
              color="warning"
              icon="visibility"
              label="Detail audit"
              no-caps
              class="q-mt-sm"
              @click="openDetail(payment)" /></q-card-section></q-card
      ></div>
      <q-banner v-else-if="!loading && !error" rounded class="warning-banner"
        >Belum ada transaksi Sandbox yang sesuai untuk akun admin ini.</q-banner
      >
      <q-pagination
        v-if="meta.last_page > 1"
        class="q-mt-md justify-center"
        color="warning"
        :model-value="meta.current_page"
        :max="meta.last_page"
        :max-pages="6"
        :disable="loading"
        @update:model-value="refreshPayments"
      />
    </div>
  </section>
  <q-dialog v-model="detailOpen"
    ><q-card class="payment-detail-dialog"
      ><q-card-section class="row items-center justify-between"
        ><div
          ><p class="eyebrow">DANA SANDBOX</p
          ><h3>Detail Audit Pembayaran</h3></div
        ><q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          v-close-popup /></q-card-section
      ><q-separator />
      <q-card-section v-if="detail" class="q-gutter-y-md"
        ><div
          ><h4>Transaksi</h4
          ><dl
            ><dt>Referensi merchant</dt><dd>{{ detail.merchant_reference }}</dd
            ><dt>Referensi pembayaran</dt><dd>{{ detail.id }}</dd
            ><dt>Referensi provider</dt
            ><dd>{{ detail.provider_order_reference || '—' }}</dd
            ><dt>Nominal</dt><dd>{{ formatAmount(detail) }}</dd
            ><dt>Status</dt
            ><dd
              ><q-badge :color="statusColor(detail.status)">{{
                labelFor(detail.status)
              }}</q-badge></dd
            ><dt>Terverifikasi gateway</dt
            ><dd>{{ formatDate(detail.gateway_verified_at) }}</dd></dl
          ></div
        >
        <div
          ><h4>Timeline status</h4
          ><q-list v-if="detail.timeline?.length" dense bordered separator
            ><q-item v-for="(event, index) in detail.timeline" :key="index"
              ><q-item-section
                ><q-item-label
                  >{{ event.event_type }} · {{ event.source }}</q-item-label
                ><q-item-label caption
                  >{{ event.old_status || '—' }} →
                  {{ event.new_status || '—' }} ·
                  {{ formatDate(event.created_at) }}</q-item-label
                ></q-item-section
              ></q-item
            ></q-list
          ><p v-else class="detail-note"
            >Belum ada event status yang aman untuk ditampilkan.</p
          ></div
        >
        <div
          ><h4>Webhook</h4
          ><q-list v-if="webhooks.length" dense bordered separator
            ><q-item v-for="(webhook, index) in webhooks" :key="index"
              ><q-item-section
                ><q-item-label
                  >{{ webhook.processing_status }} · signature
                  {{
                    webhook.signature_valid ? 'valid' : 'invalid'
                  }}</q-item-label
                ><q-item-label caption
                  >{{ formatDate(webhook.received_at)
                  }}<span v-if="webhook.error_code">
                    · {{ webhook.error_code }}</span
                  ></q-item-label
                ></q-item-section
              ></q-item
            ></q-list
          ><p v-else class="detail-note"
            >Belum ada webhook tercatat untuk transaksi ini.</p
          ></div
        ></q-card-section
      >
      <q-card-section v-else class="text-center q-pa-xl"
        ><q-spinner color="warning" size="32px" /></q-card-section></q-card
  ></q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'
const props = defineProps({ merchant: { type: Object, required: true } })
const $q = useQuasar()
const payments = ref([])
const loading = ref(false)
const error = ref(null)
const detail = ref(null)
const webhooks = ref([])
const detailOpen = ref(false)
const requestId = ref(0)
const filters = ref({
  status: null,
  from: null,
  to: null,
  merchant_order_id: null
})
const meta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const summary = ref({
  total: 0,
  paid: 0,
  pending: 0,
  failed_or_expired: 0,
  paid_amounts: []
})
const merchantId = computed(() => props.merchant?.merchant_id)
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Failed', value: 'failed' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' }
]
const summaryCards = computed(() => [
  { label: 'Total', value: summary.value.total },
  { label: 'Paid', value: summary.value.paid },
  { label: 'Pending', value: summary.value.pending },
  { label: 'Gagal/kedaluwarsa', value: summary.value.failed_or_expired }
])
const paidAmounts = computed(
  () =>
    summary.value.paid_amounts
      ?.map(item =>
        formatAmount({
          amount_minor: item.paid_amount_minor,
          currency: item.currency
        })
      )
      .join(' · ') || '—'
)
const columns = [
  {
    name: 'created_at',
    label: 'Tanggal',
    field: row => formatDate(row.created_at),
    align: 'left'
  },
  {
    name: 'reference',
    label: 'Referensi merchant',
    field: 'merchant_reference',
    align: 'left'
  },
  {
    name: 'provider',
    label: 'Referensi provider',
    field: row => row.provider_order_reference || '—',
    align: 'left'
  },
  { name: 'amount', label: 'Nominal', align: 'right' },
  { name: 'status', label: 'Status', align: 'left' },
  { name: 'actions', label: 'Aksi', align: 'right' }
]
watch(
  merchantId,
  value => {
    payments.value = []
    error.value = null
    if (value) refreshPayments(1)
  },
  { immediate: true }
)
function labelFor(value) {
  return value ? String(value).replaceAll('_', ' ') : 'Tidak diketahui'
}
function statusColor(status) {
  return status === 'paid'
    ? 'positive'
    : ['failed', 'expired', 'cancelled'].includes(status)
      ? 'negative'
      : 'warning'
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '—'
}
function formatAmount(payment) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: payment?.currency || 'IDR',
    maximumFractionDigits: 0
  }).format(payment?.amount_minor || 0)
}
function params(page) {
  return {
    page,
    per_page: 15,
    ...Object.fromEntries(
      Object.entries(filters.value).filter(([, value]) => value)
    )
  }
}
async function refreshPayments(page = meta.value.current_page) {
  if (!merchantId.value) return
  const id = ++requestId.value
  loading.value = true
  error.value = null
  try {
    const query = params(page)
    const [listResponse, summaryResponse] = await Promise.all([
      danaGatewayMerchantService.sandboxPayments(merchantId.value, query),
      danaGatewayMerchantService.sandboxPaymentSummary(merchantId.value, query)
    ])
    if (id !== requestId.value) return
    payments.value = listResponse.data?.data ?? []
    meta.value = listResponse.data?.meta ?? meta.value
    summary.value = summaryResponse.data?.data ?? summary.value
  } catch (exception) {
    if (id === requestId.value) {
      error.value = getApiErrorMessage(exception)
      payments.value = []
    }
  } finally {
    if (id === requestId.value) loading.value = false
  }
}
async function openDetail(payment) {
  detailOpen.value = true
  detail.value = null
  webhooks.value = []
  try {
    const [detailResponse, webhookResponse] = await Promise.all([
      danaGatewayMerchantService.sandboxPaymentDetail(
        merchantId.value,
        payment.id
      ),
      danaGatewayMerchantService.sandboxPaymentWebhooks(
        merchantId.value,
        payment.id,
        { per_page: 25 }
      )
    ])
    detail.value = detailResponse.data?.data ?? null
    webhooks.value = webhookResponse.data?.data ?? []
  } catch (exception) {
    detailOpen.value = false
    error.value = getApiErrorMessage(exception)
  }
}
</script>
<style scoped>
h3,
h4 {
  margin: 0;
  color: #20180b;
}
.section-description,
.detail-note {
  margin: 4px 0 0;
  color: #746b5c;
  font-size: 0.82rem;
  line-height: 1.5;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.payment-history {
  position: relative;
  min-height: 64px;
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
.payment-detail-dialog {
  width: min(700px, 94vw);
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
dl {
  display: grid;
  grid-template-columns: minmax(145px, 0.7fr) minmax(0, 1.3fr);
  gap: 8px 16px;
  margin: 8px 0 0;
  font-size: 0.83rem;
}
dt {
  color: #746b5c;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #302619;
}
@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 599px) {
  dl {
    grid-template-columns: 1fr;
    gap: 2px;
  }
  dd {
    margin-bottom: 8px;
  }
}
</style>
