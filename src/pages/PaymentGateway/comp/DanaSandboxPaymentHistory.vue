<template>
  <q-separator class="q-my-lg" />
  <section aria-labelledby="sandbox-payment-history-heading">
    <div class="row items-center justify-between q-col-gutter-sm">
      <div class="col-12 col-sm">
        <h3 id="sandbox-payment-history-heading">Audit Pembayaran Sandbox</h3>
        <p class="section-description"
          >Status dan waktu lunas hanya berasal dari catatan gateway yang telah
          diverifikasi.</p
        >
      </div>
      <div class="col-12 col-sm-auto"
        ><q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh"
          no-caps
          :loading="loading"
          @click="refreshPayments(1, true)"
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
    <div class="payment-history q-mt-sm">
      <q-inner-loading :showing="loading" color="warning" />
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

  <q-dialog v-model="detailOpen">
    <q-card class="payment-detail-dialog">
      <q-card-section class="dialog-header row items-center justify-between">
        <div
          ><p class="eyebrow">DANA SANDBOX · PAYMENT AUDIT</p
          ><h3>Detail Pembayaran</h3></div
        >
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
      <q-card-section v-if="detailError" class="q-pa-lg">
        <q-banner rounded class="error-banner">
          <template #avatar><q-icon name="error_outline" /></template>
          {{ detailError }}
          <template #action>
            <q-btn
              flat
              color="negative"
              label="Coba lagi"
              no-caps
              :loading="detailLoading || webhookLoading"
              @click="retryDetail"
            />
          </template>
        </q-banner>
      </q-card-section>
      <q-card-section v-else-if="detail" class="dialog-body">
        <div class="payment-overview">
          <div
            ><p class="overview-label">Nominal pembayaran</p
            ><p class="overview-amount">{{ formatAmount(detail) }}</p
            ><p class="overview-reference">{{
              detail.merchant_reference
            }}</p></div
          >
          <div class="overview-status"
            ><q-badge
              rounded
              :color="statusColor(detail.status)"
              class="status-badge"
              ><q-icon name="verified" size="14px" class="q-mr-xs" />{{
                labelFor(detail.status)
              }}</q-badge
            ><span>{{
              detail.gateway_verified_at
                ? 'Terverifikasi gateway'
                : 'Menunggu verifikasi gateway'
            }}</span></div
          >
        </div>
        <div class="audit-meta-grid q-mt-md">
          <div class="audit-meta-item"
            ><q-icon name="tag" /><div
              ><span>Referensi pembayaran</span
              ><strong>{{ detail.id }}</strong></div
            ></div
          >
          <div class="audit-meta-item"
            ><q-icon name="account_balance_wallet" /><div
              ><span>Referensi provider</span
              ><strong>{{
                detail.provider_order_reference || '-'
              }}</strong></div
            ></div
          >
          <div class="audit-meta-item"
            ><q-icon name="payments" /><div
              ><span>Metode pembayaran</span
              ><strong>{{
                paymentMethodLabel(detail.payment_method)
              }}</strong></div
            ></div
          >
          <div class="audit-meta-item"
            ><q-icon name="schedule" /><div
              ><span>Dibuat</span
              ><strong>{{ formatDate(detail.created_at) }}</strong></div
            ></div
          >
          <div class="audit-meta-item"
            ><q-icon name="verified_user" /><div
              ><span>Terverifikasi gateway</span
              ><strong>{{
                formatDate(detail.gateway_verified_at)
              }}</strong></div
            ></div
          >
        </div>
        <section class="audit-section">
          <div class="section-heading"
            ><q-icon name="timeline" color="warning" size="21px" /><div
              ><h4>Timeline status</h4
              ><p>Jejak perubahan status pembayaran yang aman.</p></div
            ></div
          >
          <div v-if="detail.timeline?.length" class="audit-timeline">
            <article
              v-for="(event, index) in detail.timeline"
              :key="index"
              class="timeline-item"
            >
              <div class="timeline-rail"
                ><q-icon :name="eventIcon(event)" :color="eventColor(event)"
              /></div>
              <div class="timeline-content"
                ><div
                  class="row items-start justify-between q-col-gutter-sm no-wrap"
                  ><div class="col"
                    ><strong>{{ eventTitle(event) }}</strong
                    ><span class="timeline-source">{{
                      sourceLabel(event.source)
                    }}</span></div
                  ><time>{{ formatDate(event.created_at) }}</time></div
                ><div class="timeline-transition"
                  ><q-badge outline :color="eventColor(event)">{{
                    labelFor(event.old_status)
                  }}</q-badge
                  ><q-icon name="arrow_forward" size="16px" /><q-badge
                    :color="eventColor(event)"
                    >{{ labelFor(event.new_status) }}</q-badge
                  ></div
                ></div
              >
            </article>
          </div>
          <div v-else class="empty-audit"
            ><q-icon name="timeline" size="22px" /><span
              >Belum ada event status yang aman untuk ditampilkan.</span
            ></div
          >
        </section>
        <section class="audit-section">
          <div class="section-heading"
            ><q-icon name="webhook" color="warning" size="21px" /><div
              ><h4>Webhook</h4
              ><p>Riwayat notifikasi DANA, tanpa payload sensitif.</p></div
            ></div
          >
          <div v-if="webhookLoading" class="empty-audit"
            ><q-spinner color="warning" size="22px" /><span
              >Memuat metadata webhook...</span
            ></div
          >
          <q-banner v-else-if="webhookError" rounded class="error-banner"
            ><template #avatar><q-icon name="error_outline" /></template
            >{{ webhookError
            }}<template #action
              ><q-btn
                flat
                color="negative"
                label="Coba lagi"
                no-caps
                @click="
                  loadWebhooks(webhookMeta.current_page, true)
                " /></template
          ></q-banner>
          <div v-else-if="webhooks.length" class="webhook-list"
            ><article
              v-for="(webhook, index) in webhooks"
              :key="index"
              class="webhook-row"
              ><q-avatar
                :color="webhookColor(webhook)"
                text-color="white"
                size="34px"
                ><q-icon
                  :name="
                    webhook.signature_valid ? 'verified' : 'gpp_maybe'
                  " /></q-avatar
              ><div class="webhook-content"
                ><div class="row items-center justify-between q-col-gutter-sm"
                  ><strong>{{ webhookLabel(webhook) }}</strong
                  ><q-badge outline :color="webhookColor(webhook)">{{
                    webhook.signature_valid
                      ? 'Signature valid'
                      : 'Signature invalid'
                  }}</q-badge></div
                ><span>{{ formatDate(webhook.received_at) }}</span
                ><small v-if="webhook.error_code"
                  >Kode: {{ webhook.error_code }}</small
                ></div
              ></article
            ></div
          >
          <div v-else class="empty-audit"
            ><q-icon name="webhook" size="22px" /><span
              >Belum ada webhook tercatat untuk transaksi ini.</span
            ></div
          >
          <q-pagination
            v-if="webhookMeta.last_page > 1"
            class="q-mt-md justify-center"
            color="warning"
            :model-value="webhookMeta.current_page"
            :max="webhookMeta.last_page"
            :max-pages="6"
            :disable="webhookLoading"
            @update:model-value="loadWebhooks"
          />
        </section>
      </q-card-section>
      <q-card-section v-else class="text-center q-pa-xl"
        ><q-spinner color="warning" size="32px" /><p class="q-mt-sm text-grey-7"
          >Memuat detail audit...</p
        ></q-card-section
      >
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'

const AUDIT_CACHE_TTL_MS = 10_000
const pendingAuditRequests = new Map()
const auditResponseCache = new Map()
const pendingHistoryRequests = new Map()
const historyResponseCache = new Map()

function deduplicatedRequest(cache, pending, key, request, force = false) {
  if (force) cache.delete(key)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value)
  }

  if (pending.has(key)) return pending.get(key)

  const promise = request()
    .then(value => {
      cache.set(key, { value, expiresAt: Date.now() + AUDIT_CACHE_TTL_MS })
      while (cache.size > 100) cache.delete(cache.keys().next().value)
      return value
    })
    .finally(() => pending.delete(key))

  pending.set(key, promise)
  return promise
}

function retryAfterMilliseconds(error) {
  const headers = error?.response?.headers
  const retryAfter =
    headers?.['retry-after'] ??
    (typeof headers?.get === 'function' ? headers.get('retry-after') : null)
  if (typeof retryAfter !== 'string' && typeof retryAfter !== 'number') return 0

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000)

  const retryAt = Date.parse(retryAfter)
  return Number.isNaN(retryAt) ? 0 : Math.max(0, retryAt - Date.now())
}

function isRateLimitError(error) {
  return (
    error?.response?.status === 429 ||
    (error?.response?.status >= 500 && retryAfterMilliseconds(error) > 0)
  )
}

function rateLimitMessage(milliseconds) {
  const seconds = Math.max(1, Math.ceil(milliseconds / 1000))
  return `Terlalu banyak permintaan. Tunggu sekitar ${seconds} detik sebelum mencoba lagi.`
}

const props = defineProps({ merchant: { type: Object, required: true } })
const $q = useQuasar()
const payments = ref([])
const loading = ref(false)
const error = ref(null)
const detail = ref(null)
const detailError = ref(null)
const detailLoading = ref(false)
const webhooks = ref([])
const webhookError = ref(null)
const webhookLoading = ref(false)
const webhookMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0
})
const detailOpen = ref(false)
const requestId = ref(0)
const detailRequestId = ref(0)
const webhookRequestId = ref(0)
const selectedPayment = ref(null)
const detailLoadedAt = ref(0)
const webhookLoadedAt = ref(0)
const rateLimitedUntil = ref(0)
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
      .join(' · ') || '-'
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
    field: row => row.provider_order_reference || '-',
    align: 'left'
  },
  {
    name: 'payment_method',
    label: 'Metode',
    field: row => paymentMethodLabel(row.payment_method),
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
    detail.value = null
    detailError.value = null
    webhooks.value = []
    webhookError.value = null
    selectedPayment.value = null
    detailLoadedAt.value = 0
    webhookLoadedAt.value = 0
    requestId.value++
    detailRequestId.value++
    webhookRequestId.value++
    loading.value = false
    detailLoading.value = false
    webhookLoading.value = false
    if (value) refreshPayments(1)
  },
  { immediate: true }
)
function labelFor(value) {
  return value ? String(value).replaceAll('_', ' ') : 'Belum ada status'
}
function paymentMethodLabel(method) {
  return (
    {
      dana_wallet: 'DANA Wallet',
      qris: 'QRIS',
      va_bri: 'VA BRI',
      va_pani: 'VA PANI',
      va_cimb: 'VA CIMB',
      va_btpn: 'VA BTPN'
    }[method] || 'Hosted Checkout'
  )
}
function statusColor(status) {
  return status === 'paid'
    ? 'positive'
    : ['failed', 'expired', 'cancelled'].includes(status)
      ? 'negative'
      : 'warning'
}
function eventColor(event) {
  return statusColor(event.new_status)
}
function eventIcon(event) {
  return event.new_status === 'paid'
    ? 'check_circle'
    : event.new_status === 'pending'
      ? 'hourglass_top'
      : 'receipt_long'
}
function eventTitle(event) {
  return event.event_type
    ? String(event.event_type).replaceAll('.', ' ').replaceAll('_', ' ')
    : 'Perubahan pembayaran'
}
function sourceLabel(source) {
  return (
    { merchant: 'Admin', provider: 'DANA gateway', system: 'Sistem' }[source] ||
    source ||
    'Sistem'
  )
}
function webhookColor(webhook) {
  return webhook.processing_status === 'processed' && webhook.signature_valid
    ? 'positive'
    : 'negative'
}
function webhookLabel(webhook) {
  return webhook.processing_status === 'processed'
    ? 'Webhook berhasil diproses'
    : 'Webhook ditolak'
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '-'
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
function auditAvailable(target) {
  if (rateLimitedUntil.value <= Date.now()) return true

  target.value = rateLimitMessage(rateLimitedUntil.value - Date.now())
  return false
}
function rememberRateLimit(error) {
  if (!isRateLimitError(error)) return

  const retryAfter = retryAfterMilliseconds(error)
  if (retryAfter > 0) {
    rateLimitedUntil.value = Math.max(
      rateLimitedUntil.value,
      Date.now() + retryAfter
    )
  }
}
function auditErrorMessage(exception) {
  const retryAfter = retryAfterMilliseconds(exception)
  if (retryAfter > 0) return rateLimitMessage(retryAfter)
  return getApiErrorMessage(exception)
}
async function refreshPayments(page = meta.value.current_page, force = false) {
  if (!merchantId.value) return
  if (!auditAvailable(error)) return

  const query = params(page)
  const requestKey = `${merchantId.value}:history:${JSON.stringify(query)}`
  const id = ++requestId.value
  loading.value = true
  error.value = null
  try {
    const [listResponse, summaryResponse] = await deduplicatedRequest(
      historyResponseCache,
      pendingHistoryRequests,
      requestKey,
      () =>
        Promise.all([
          danaGatewayMerchantService.sandboxPayments(merchantId.value, query),
          danaGatewayMerchantService.sandboxPaymentSummary(
            merchantId.value,
            query
          )
        ]),
      force
    )
    if (id !== requestId.value) return
    payments.value = listResponse.data?.data ?? []
    meta.value = listResponse.data?.meta ?? meta.value
    summary.value = summaryResponse.data?.data ?? summary.value
  } catch (exception) {
    if (id === requestId.value) {
      rememberRateLimit(exception)
      error.value = auditErrorMessage(exception)
      payments.value = []
    }
  } finally {
    if (id === requestId.value) loading.value = false
  }
}
function webhookRequestKey(paymentId, page) {
  return `${merchantId.value}:webhooks:${paymentId}:${page}:25`
}
async function loadWebhooks(
  page = webhookMeta.value.current_page,
  force = false
) {
  if (!merchantId.value || !selectedPayment.value?.id) return
  if (!auditAvailable(webhookError)) return

  const paymentId = selectedPayment.value.id
  const id = ++webhookRequestId.value
  webhookLoading.value = true
  webhookError.value = null

  try {
    const response = await deduplicatedRequest(
      auditResponseCache,
      pendingAuditRequests,
      webhookRequestKey(paymentId, page),
      () =>
        danaGatewayMerchantService.sandboxPaymentWebhooks(
          merchantId.value,
          paymentId,
          { page, per_page: 25 }
        ),
      force
    )
    if (id !== webhookRequestId.value) return
    webhooks.value = response.data?.data ?? []
    webhookMeta.value = response.data?.meta ?? webhookMeta.value
    webhookLoadedAt.value = Date.now()
  } catch (exception) {
    if (id === webhookRequestId.value) {
      rememberRateLimit(exception)
      webhookError.value = auditErrorMessage(exception)
    }
  } finally {
    if (id === webhookRequestId.value) webhookLoading.value = false
  }
}
async function openDetail(payment, force = false) {
  if (!merchantId.value || !payment?.id) return
  detailOpen.value = true
  if (!auditAvailable(detailError)) return

  const sameLoadedPayment =
    !force &&
    selectedPayment.value?.id === payment.id &&
    detail.value &&
    detailLoadedAt.value + AUDIT_CACHE_TTL_MS > Date.now() &&
    webhookLoadedAt.value + AUDIT_CACHE_TTL_MS > Date.now()
  if (sameLoadedPayment) return

  selectedPayment.value = payment
  detail.value = null
  detailError.value = null
  webhooks.value = []
  webhookError.value = null
  webhookMeta.value = {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0
  }
  detailLoadedAt.value = 0
  webhookLoadedAt.value = 0

  const detailRequest = ++detailRequestId.value
  const webhookRequest = ++webhookRequestId.value
  detailLoading.value = true
  webhookLoading.value = true

  const detailPromise = deduplicatedRequest(
    auditResponseCache,
    pendingAuditRequests,
    `${merchantId.value}:detail:${payment.id}`,
    () =>
      danaGatewayMerchantService.sandboxPaymentDetail(
        merchantId.value,
        payment.id
      ),
    force
  )
  const webhookPromise = deduplicatedRequest(
    auditResponseCache,
    pendingAuditRequests,
    webhookRequestKey(payment.id, 1),
    () =>
      danaGatewayMerchantService.sandboxPaymentWebhooks(
        merchantId.value,
        payment.id,
        { page: 1, per_page: 25 }
      ),
    force
  )

  const [detailResult, webhookResult] = await Promise.allSettled([
    detailPromise,
    webhookPromise
  ])
  if (detailRequest !== detailRequestId.value) return

  if (detailResult.status === 'fulfilled') {
    detail.value = detailResult.value.data?.data ?? null
    detailLoadedAt.value = Date.now()
  } else {
    rememberRateLimit(detailResult.reason)
    detailError.value = auditErrorMessage(detailResult.reason)
  }

  if (webhookRequest === webhookRequestId.value) {
    if (webhookResult.status === 'fulfilled') {
      webhooks.value = webhookResult.value.data?.data ?? []
      webhookMeta.value = webhookResult.value.data?.meta ?? webhookMeta.value
      webhookLoadedAt.value = Date.now()
      webhookError.value = null
    } else {
      rememberRateLimit(webhookResult.reason)
      webhookError.value = auditErrorMessage(webhookResult.reason)
    }
  }

  detailLoading.value = false
  webhookLoading.value = false
}
function retryDetail() {
  if (selectedPayment.value) openDetail(selectedPayment.value, true)
}
</script>

<style scoped>
h3,
h4 {
  margin: 0;
  color: #20180b;
}
.section-description {
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
  width: min(760px, 94vw);
  border-radius: 18px;
  overflow: hidden;
}
.dialog-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #16120d, #3c2c12);
  color: #fff;
}
.dialog-header h3 {
  color: #fff;
  font-size: 1.32rem;
}
.eyebrow {
  margin: 0 0 4px;
  color: #f6c65d;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.dialog-body {
  padding: 20px 24px 26px;
}
.payment-overview {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid #ebd18d;
  border-radius: 14px;
  background: linear-gradient(125deg, #fffaf0, #fff);
}
.overview-label,
.overview-reference {
  margin: 0;
  color: #746b5c;
  font-size: 0.76rem;
}
.overview-amount {
  margin: 4px 0;
  color: #281d0c;
  font-size: 1.55rem;
  font-weight: 800;
}
.overview-status {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 7px;
  text-align: right;
  color: #746b5c;
  font-size: 0.75rem;
}
.status-badge {
  padding: 7px 10px;
  font-weight: 700;
}
.audit-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.audit-meta-item {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 11px;
  border: 1px solid #eee6d9;
  border-radius: 10px;
  background: #fff;
}
.audit-meta-item > .q-icon {
  margin-top: 2px;
  color: #b88924;
}
.audit-meta-item span,
.webhook-content span {
  display: block;
  color: #817866;
  font-size: 0.72rem;
}
.audit-meta-item strong {
  display: block;
  overflow-wrap: anywhere;
  color: #342918;
  font-size: 0.79rem;
  font-weight: 600;
}
.audit-section {
  margin-top: 24px;
}
.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 11px;
}
.section-heading h4 {
  font-size: 0.95rem;
}
.section-heading p {
  margin: 2px 0 0;
  color: #817866;
  font-size: 0.76rem;
}
.audit-timeline {
  padding: 4px 0;
}
.timeline-item {
  position: relative;
  display: flex;
  gap: 12px;
  min-height: 70px;
}
.timeline-item:not(:last-child)::before {
  position: absolute;
  top: 27px;
  bottom: 0;
  left: 11px;
  width: 2px;
  background: #eadfc9;
  content: '';
}
.timeline-rail {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff8e8;
}
.timeline-content {
  flex: 1;
  min-width: 0;
  padding: 1px 0 12px;
}
.timeline-content strong {
  display: block;
  color: #362a18;
  font-size: 0.83rem;
  text-transform: capitalize;
}
.timeline-source {
  display: block;
  margin-top: 2px;
  color: #8b6e2f;
  font-size: 0.71rem;
}
.timeline-content time {
  color: #817866;
  font-size: 0.71rem;
  white-space: nowrap;
}
.timeline-transition {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.timeline-transition .q-badge {
  font-size: 0.68rem;
}
.webhook-list {
  overflow: hidden;
  border: 1px solid #eee6d9;
  border-radius: 12px;
}
.webhook-row {
  display: flex;
  gap: 11px;
  padding: 11px 12px;
  background: #fff;
}
.webhook-row + .webhook-row {
  border-top: 1px solid #f0eadf;
}
.webhook-content {
  flex: 1;
  min-width: 0;
}
.webhook-content strong {
  color: #352918;
  font-size: 0.82rem;
}
.webhook-content small {
  display: block;
  margin-top: 3px;
  color: #a13d2e;
  font-size: 0.7rem;
}
.empty-audit {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px;
  border: 1px dashed #dfd2bb;
  border-radius: 10px;
  color: #817866;
  font-size: 0.78rem;
}
@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 599px) {
  .dialog-header,
  .dialog-body {
    padding-right: 16px;
    padding-left: 16px;
  }
  .payment-overview {
    flex-direction: column;
  }
  .overview-status {
    align-items: flex-start;
    text-align: left;
  }
  .audit-meta-grid {
    grid-template-columns: 1fr;
  }
  .timeline-content time {
    white-space: normal;
    text-align: right;
  }
  .webhook-content .q-badge {
    margin-top: 4px;
  }
}
</style>
