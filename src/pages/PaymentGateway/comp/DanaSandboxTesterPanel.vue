<template>
  <q-separator />
  <q-card-section class="sandbox-tester">
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-sm">
        <p class="eyebrow">ADMIN ONLY</p>
        <h3>DANA Sandbox Tester</h3>
        <p class="section-description">
          Validasi format konfigurasi dan buat checkout Sandbox melalui layanan
          DANA yang sama. Pembayaran tidak pernah ditandai lunas dari panel ini.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          color="warning"
          icon="fact_check"
          label="Validasi Konfigurasi"
          no-caps
          :loading="validating"
          @click="validateConfiguration"
        />
      </div>
      <div v-if="sandboxResultContext" class="col-12 col-sm-auto">
        <q-btn
          outline
          color="warning"
          icon="open_in_new"
          label="Lihat Hasil"
          no-caps
          @click="viewResult(sandboxResultContext)"
        />
      </div>
    </div>

    <q-banner v-if="error" rounded class="error-banner q-mt-md">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ error }}
    </q-banner>

    <div v-if="validation" class="q-mt-md q-gutter-y-sm">
      <div class="tester-status-grid">
        <div class="tester-status-item">
          <span>Konfigurasi Sandbox</span>
          <q-badge
            :color="validation.configuration_exists ? 'positive' : 'warning'"
          >
            {{
              validation.configuration_exists ? 'Tersedia' : 'Belum tersedia'
            }}
          </q-badge>
        </div>
        <div class="tester-status-item">
          <span>Konfigurasi aktif</span>
          <q-badge :color="validation.enabled ? 'positive' : 'grey-7'">
            {{ validation.enabled ? 'Aktif' : 'Nonaktif' }}
          </q-badge>
        </div>
        <div class="tester-status-item">
          <span>Private key</span>
          <q-badge :color="keyStatusColor(validation.private_key)">
            {{ keyStatusLabel(validation.private_key) }}
          </q-badge>
        </div>
        <div class="tester-status-item">
          <span>Public key webhook DANA</span>
          <q-badge :color="keyStatusColor(validation.dana_webhook_public_key)">
            {{ keyStatusLabel(validation.dana_webhook_public_key) }}
          </q-badge>
        </div>
        <div class="tester-status-item">
          <span>Format konfigurasi</span>
          <q-badge :color="validation.format_valid ? 'positive' : 'negative'">
            {{ validation.format_valid ? 'Valid' : 'Perlu diperbaiki' }}
          </q-badge>
        </div>
        <div class="tester-status-item">
          <span>Autentikasi DANA</span>
          <q-badge color="blue-grey">
            {{ authenticationLabel(validation.authentication?.status) }}
          </q-badge>
        </div>
      </div>
      <q-banner rounded class="transport-notice">
        <template #avatar><q-icon name="shield" /></template>
        {{ validation.authentication?.message }}
      </q-banner>
      <div class="tester-field-list">
        <span
          v-for="field in requiredFieldLabels"
          :key="field.key"
          :class="
            validation.required_fields?.[field.key] ? 'is-valid' : 'is-missing'
          "
        >
          <q-icon
            :name="
              validation.required_fields?.[field.key]
                ? 'check_circle'
                : 'cancel'
            "
          />
          {{ field.label }}
        </span>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-md items-end">
      <div class="col-12 col-sm-4">
        <q-input
          v-model.number="amountMinor"
          outlined
          dense
          type="number"
          min="1"
          label="Nominal Sandbox (IDR)"
          hint="Nominal rupiah utuh"
          bg-color="white"
        />
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          color="warning"
          text-color="dark"
          icon="receipt_long"
          label="Buat Transaksi Sandbox"
          no-caps
          :loading="creatingTransaction"
          @click="createTransaction"
        />
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          v-if="transaction?.checkout_available && transaction.checkout_url"
          outline
          color="primary"
          icon="open_in_new"
          label="Buka Checkout Sandbox"
          no-caps
          @click="openCheckout"
        />
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          v-if="transaction?.id"
          outline
          color="warning"
          icon="refresh"
          label="Periksa Status Transaksi"
          no-caps
          :loading="checkingStatus"
          @click="checkTransactionStatus"
        />
      </div>
    </div>

    <q-banner v-if="transaction" rounded class="tester-transaction q-mt-md">
      <template #avatar><q-icon name="receipt" /></template>
      <div class="row items-center q-col-gutter-sm">
        <div class="col-12 col-sm">
          Transaksi <strong>{{ transaction.merchant_order_id }}</strong> ·
          {{ formatRupiah(transaction.amount_minor) }}
        </div>
        <div class="col-12 col-sm-auto">
          <q-badge :color="paymentStatusColor(transaction.status)">
            {{ labelFor(transaction.status) }}
          </q-badge>
        </div>
      </div>
      <div class="q-mt-xs text-caption">
        Status dibaca dari pembayaran tersimpan; status <strong>paid</strong>
        hanya berasal dari webhook DANA yang tervalidasi.
      </div>
    </q-banner>

    <q-separator class="q-my-lg" />
    <div class="row items-center justify-between q-col-gutter-sm">
      <div class="col-12 col-sm">
        <h3>Riwayat pengujian Sandbox</h3>
        <p class="section-description">
          Riwayat hanya berisi metadata dan pesan aman; credential tidak
          dicatat.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh riwayat"
          no-caps
          :loading="historyLoading"
          @click="refreshHistory"
        />
      </div>
    </div>
    <div class="tester-history q-mt-sm">
      <q-inner-loading :showing="historyLoading" color="warning" />
      <q-table
        v-if="history.length && $q.screen.gt.sm"
        flat
        bordered
        hide-bottom
        row-key="id"
        :rows="history"
        :columns="historyColumns"
        :pagination="{ rowsPerPage: 0 }"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="runStatusColor(props.row.status)">
              {{ labelFor(props.row.status) }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="props.row.payment_id"
              flat
              round
              dense
              color="warning"
              icon="visibility"
              aria-label="Lihat hasil transaksi"
              @click="viewHistoryResult(props.row.payment_id)"
            />
          </q-td>
        </template>
      </q-table>
      <div v-else-if="history.length" class="q-gutter-y-sm">
        <q-card v-for="run in history" :key="run.id" flat bordered>
          <q-card-section class="q-pa-sm">
            <div
              class="row items-start justify-between no-wrap q-col-gutter-sm"
            >
              <div class="col">
                <div class="text-caption text-grey-7">
                  {{ formatDate(run.created_at) }} · {{ run.merchant_code }} ·
                  {{ run.environment }}
                </div>
                <div class="text-weight-medium">{{
                  labelFor(run.operation)
                }}</div>
                <div class="text-caption q-mt-xs">{{ run.message }}</div>
                <q-btn
                  v-if="run.payment_id"
                  class="q-mt-sm"
                  flat
                  dense
                  color="warning"
                  icon="visibility"
                  label="Lihat Hasil"
                  no-caps
                  @click="viewHistoryResult(run.payment_id)"
                />
              </div>
              <div class="col-auto">
                <q-badge :color="runStatusColor(run.status)">
                  {{ labelFor(run.status) }}
                </q-badge>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <q-banner v-else-if="!historyLoading" rounded class="warning-banner">
        Belum ada riwayat pengujian Sandbox untuk merchant ini.
      </q-banner>
      <q-pagination
        v-if="historyMeta.last_page > 1"
        class="q-mt-md justify-center"
        color="warning"
        :model-value="historyMeta.current_page"
        :max="historyMeta.last_page"
        :max-pages="6"
        :disable="historyLoading"
        @update:model-value="refreshHistory"
      />
    </div>
  </q-card-section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Notify, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'

const props = defineProps({
  merchant: { type: Object, required: true }
})

const $q = useQuasar()
const router = useRouter()
const validating = ref(false)
const creatingTransaction = ref(false)
const checkingStatus = ref(false)
const historyLoading = ref(false)
const validation = ref(null)
const transaction = ref(null)
const history = ref([])
const error = ref(null)
const amountMinor = ref(10000)
const idempotencyKey = ref(null)
const sandboxResultContext = ref(null)
const historyMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0
})
const requiredFieldLabels = [
  { key: 'merchant_id', label: 'Merchant ID' },
  { key: 'partner_id', label: 'X-PARTNER-ID' },
  { key: 'origin', label: 'Origin' },
  { key: 'channel_id', label: 'CHANNEL-ID' },
  { key: 'notification_url', label: 'Notification URL' },
  { key: 'pay_return_url', label: 'PAY_RETURN URL' },
  { key: 'mcc', label: 'MCC' }
]
const historyColumns = [
  {
    name: 'created_at',
    label: 'Waktu',
    field: row => formatDate(row.created_at),
    align: 'left'
  },
  {
    name: 'merchant_code',
    label: 'Merchant',
    field: 'merchant_code',
    align: 'left'
  },
  {
    name: 'environment',
    label: 'Environment',
    field: 'environment',
    align: 'left'
  },
  {
    name: 'operation',
    label: 'Aktivitas',
    field: row => labelFor(row.operation),
    align: 'left'
  },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' },
  { name: 'message', label: 'Pesan aman', field: 'message', align: 'left' }
]

const merchantId = computed(() => props.merchant?.merchant_id)

watch(
  merchantId,
  async value => {
    reset()
    if (value) await refreshHistory()
  },
  { immediate: true }
)

function reset() {
  validation.value = null
  transaction.value = null
  history.value = []
  error.value = null
  idempotencyKey.value = null
  sandboxResultContext.value = null
  historyMeta.value = { current_page: 1, last_page: 1, per_page: 15, total: 0 }
}

function labelFor(value) {
  return value ? String(value).replaceAll('_', ' ') : 'Tidak diketahui'
}

function keyStatusColor(key) {
  if (!key?.configured) return 'grey-7'
  return key.format_valid ? 'positive' : 'negative'
}

function keyStatusLabel(key) {
  if (!key?.configured) return 'Belum ada'
  return key.format_valid ? 'Valid OpenSSL' : 'Format tidak valid'
}

function authenticationLabel(status) {
  if (status === 'confirmed_by_checkout_response')
    return 'Terkonfirmasi checkout'
  return 'Belum diuji'
}

function paymentStatusColor(status) {
  if (status === 'paid') return 'positive'
  if (['failed', 'expired', 'cancelled'].includes(status)) return 'negative'
  return 'warning'
}

function runStatusColor(status) {
  return status === 'succeeded' ? 'positive' : 'negative'
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '—'
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value || 0)
}

function validCheckoutUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

async function validateConfiguration() {
  if (!merchantId.value || validating.value) return
  validating.value = true
  error.value = null
  try {
    const response = await danaGatewayMerchantService.validateSandboxTester(
      merchantId.value
    )
    validation.value = response.data?.data ?? null
    await refreshHistory()
  } catch (requestError) {
    error.value = getApiErrorMessage(requestError)
  } finally {
    validating.value = false
  }
}

async function createTransaction() {
  if (!merchantId.value || creatingTransaction.value) return
  if (!Number.isInteger(amountMinor.value) || amountMinor.value < 1) {
    error.value = 'Nominal Sandbox harus berupa rupiah utuh minimal Rp1.'
    return
  }
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    error.value =
      'Browser tidak mendukung pembuatan identitas tindakan yang aman.'
    return
  }

  idempotencyKey.value ??= globalThis.crypto.randomUUID()
  creatingTransaction.value = true
  error.value = null
  try {
    const response =
      await danaGatewayMerchantService.createSandboxTestTransaction(
        merchantId.value,
        { amount_minor: amountMinor.value },
        idempotencyKey.value
      )
    transaction.value = response.data?.data?.transaction ?? null
    sandboxResultContext.value = response.data?.data?.result_context ?? null
    idempotencyKey.value = null
    Notify.create({
      message:
        'Transaksi Sandbox dibuat. Pembayaran masih menunggu verifikasi DANA.',
      color: 'positive',
      icon: 'check_circle',
      position: 'top'
    })
    await refreshHistory()
  } catch (requestError) {
    error.value = getApiErrorMessage(requestError)
    await refreshHistory()
  } finally {
    creatingTransaction.value = false
  }
}

function openCheckout() {
  const checkoutUrl = transaction.value?.checkout_url
  if (!validCheckoutUrl(checkoutUrl)) {
    error.value = 'URL checkout Sandbox tidak valid atau tidak tersedia.'
    return
  }

  const checkoutWindow = globalThis.open(
    checkoutUrl,
    '_blank',
    'noopener,noreferrer'
  )
  if (checkoutWindow) checkoutWindow.opener = null
}

function viewResult(context) {
  router.push({ path: '/payment/sandbox-result', query: { context } })
}

function viewHistoryResult(paymentId) {
  if (!merchantId.value || !paymentId) return

  router.push({
    path: '/payment/sandbox-result',
    query: { merchant: merchantId.value, payment: paymentId }
  })
}

async function checkTransactionStatus() {
  if (!merchantId.value || !transaction.value?.id || checkingStatus.value)
    return
  checkingStatus.value = true
  error.value = null
  try {
    const response =
      await danaGatewayMerchantService.sandboxTestTransactionStatus(
        merchantId.value,
        transaction.value.id
      )
    transaction.value = response.data?.data?.transaction ?? transaction.value
    await refreshHistory()
  } catch (requestError) {
    error.value = getApiErrorMessage(requestError)
  } finally {
    checkingStatus.value = false
  }
}

async function refreshHistory(page = historyMeta.value.current_page) {
  if (!merchantId.value || historyLoading.value) return
  historyLoading.value = true
  try {
    const response = await danaGatewayMerchantService.sandboxTestHistory(
      merchantId.value,
      {
        page,
        per_page: 15
      }
    )
    history.value = response.data?.data ?? []
    historyMeta.value = response.data?.meta ?? historyMeta.value
  } catch (requestError) {
    error.value = getApiErrorMessage(requestError)
  } finally {
    historyLoading.value = false
  }
}
</script>

<style scoped>
.sandbox-tester {
  background: #fffdf7;
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
h3 {
  margin: 0;
  color: #20180b;
  font-size: 1rem;
}
.section-description {
  margin: 4px 0 0;
  color: #746b5c;
  font-size: 0.82rem;
}
.tester-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.tester-status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 9px 10px;
  border: 1px solid #e8dfcf;
  border-radius: 8px;
  color: #746b5c;
  font-size: 0.82rem;
}
.tester-field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 0.8rem;
}
.tester-field-list span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tester-field-list .is-valid {
  color: #218739;
}
.tester-field-list .is-missing {
  color: #a62b20;
}
.tester-transaction {
  border: 1px solid #c8d9c6;
  background: #f1fbef;
  color: #315b36;
}
.transport-notice {
  border: 1px solid #cbb57c;
  background: #fff9e6;
  color: #5d4710;
  font-size: 0.82rem;
}
.warning-banner {
  border: 1px solid #e4c56c;
  background: #fff8dc;
  color: #5d4710;
}
.error-banner {
  border: 1px solid #e8b4ad;
  background: #fff2f0;
  color: #9f2419;
}
.tester-history {
  position: relative;
  min-height: 64px;
}
@media (max-width: 599px) {
  .tester-status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
