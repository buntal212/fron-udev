<template>
  <q-separator class="q-my-lg" />
  <section aria-labelledby="sandbox-payment-history-heading">
    <div class="row items-center justify-between q-col-gutter-sm">
      <div class="col-12 col-sm">
        <h3 id="sandbox-payment-history-heading">Riwayat Pembayaran</h3>
        <p class="section-description">
          Status adalah status pembayaran aktual dari catatan gateway yang
          terverifikasi, bukan hasil aktivitas teknis.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh pembayaran"
          no-caps
          :loading="loading"
          @click="refreshPayments"
        />
      </div>
    </div>

    <q-banner v-if="error" rounded class="error-banner q-mt-sm">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ error }}
      <template #action>
        <q-btn
          flat
          color="negative"
          label="Coba lagi"
          no-caps
          @click="refreshPayments"
        />
      </template>
    </q-banner>

    <div class="payment-history q-mt-sm">
      <q-inner-loading :showing="loading" color="warning" />
      <q-table
        v-if="payments.length && $q.screen.gt.sm"
        flat
        bordered
        hide-bottom
        row-key="transaction.id"
        :rows="payments"
        :columns="columns"
        :pagination="{ rowsPerPage: 0 }"
      >
        <template #body-cell-amount="props">
          <q-td :props="props">{{ formatAmount(props.row.transaction) }}</q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props"
            ><q-badge :color="statusColor(props.row.transaction.status)">{{
              labelFor(props.row.transaction.status)
            }}</q-badge></q-td
          >
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              color="warning"
              icon="visibility"
              aria-label="Detail pembayaran"
              @click="openDetail(props.row)"
            />
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="refresh"
              aria-label="Cek status pembayaran"
              :loading="checkingPaymentId === props.row.transaction.id"
              @click="checkStatus(props.row)"
            />
          </q-td>
        </template>
      </q-table>
      <div v-else-if="payments.length" class="q-gutter-y-sm">
        <q-card
          v-for="payment in payments"
          :key="payment.transaction.id"
          flat
          bordered
        >
          <q-card-section class="q-pa-sm">
            <div
              class="row items-start justify-between no-wrap q-col-gutter-sm"
            >
              <div class="col">
                <div class="text-caption text-grey-7"
                  >{{ formatDate(payment.transaction.created_at) }} ·
                  {{ payment.merchant }}</div
                >
                <div class="text-weight-medium">{{
                  payment.transaction.merchant_order_id
                }}</div>
                <div class="text-caption q-mt-xs"
                  >{{ formatAmount(payment.transaction) }} · DANA Sandbox</div
                >
              </div>
              <div class="col-auto"
                ><q-badge :color="statusColor(payment.transaction.status)">{{
                  labelFor(payment.transaction.status)
                }}</q-badge></div
              >
            </div>
            <div class="q-mt-sm q-gutter-sm">
              <q-btn
                flat
                dense
                color="warning"
                icon="visibility"
                label="Detail"
                no-caps
                @click="openDetail(payment)"
              />
              <q-btn
                flat
                dense
                color="primary"
                icon="refresh"
                label="Cek status"
                no-caps
                :loading="checkingPaymentId === payment.transaction.id"
                @click="checkStatus(payment)"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
      <q-banner v-else-if="!loading && !error" rounded class="warning-banner">
        Belum ada transaksi Sandbox yang dibuat oleh akun admin ini untuk
        merchant ini.
      </q-banner>
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
      <q-card-section class="row items-center justify-between">
        <div><p class="eyebrow">DANA SANDBOX</p><h3>Detail Pembayaran</h3></div>
        <q-btn flat round dense icon="close" aria-label="Tutup" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="detail" class="q-gutter-y-md">
        <div
          ><h4>Informasi transaksi</h4
          ><dl
            ><dt>Merchant</dt><dd>{{ detail.merchant }}</dd
            ><dt>Aplikasi asal</dt
            ><dd>{{
              detail.application || 'Belum tersedia dari kontrak gateway.'
            }}</dd
            ><dt>Referensi internal</dt
            ><dd>{{ detail.transaction.merchant_order_id }}</dd
            ><dt>Referensi pembayaran</dt><dd>{{ detail.transaction.id }}</dd
            ><dt>Nominal</dt><dd>{{ formatAmount(detail.transaction) }}</dd
            ><dt>Dibuat</dt
            ><dd>{{ formatDate(detail.transaction.created_at) }}</dd
            ><dt>Status aktual</dt
            ><dd
              ><q-badge :color="statusColor(detail.transaction.status)">{{
                labelFor(detail.transaction.status)
              }}</q-badge></dd
            ><dt>Waktu pembayaran sukses</dt
            ><dd>Belum tersedia dari kontrak gateway.</dd></dl
          ></div
        >
        <div
          ><h4>Informasi gateway</h4
          ><dl
            ><dt>Provider</dt><dd>DANA</dd><dt>Environment</dt><dd>Sandbox</dd
            ><dt>Referensi provider</dt
            ><dd>Belum tersedia dari kontrak gateway.</dd
            ><dt>Sumber konfirmasi</dt
            ><dd
              >Status pembayaran tersimpan yang dibaca dari gateway
              terverifikasi.</dd
            ></dl
          ></div
        >
        <div
          ><h4>Riwayat status</h4
          ><p class="detail-note"
            >Kontrak gateway saat ini hanya menyediakan status aktual dan waktu
            pembaruan terakhir ({{
              formatDate(detail.transaction.updated_at)
            }}). Riwayat perubahan, event webhook, dan ID audit tidak
            dibuat-buat bila belum tersedia.</p
          ></div
        >
      </q-card-section>
      <q-card-section v-else class="text-center q-pa-xl"
        ><q-spinner color="warning" size="32px"
      /></q-card-section>
    </q-card>
  </q-dialog>
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
const meta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const detail = ref(null)
const detailOpen = ref(false)
const checkingPaymentId = ref(null)
const requestId = ref(0)
const merchantId = computed(() => props.merchant?.merchant_id)
const columns = [
  {
    name: 'created_at',
    label: 'Tanggal',
    field: row => formatDate(row.transaction.created_at),
    align: 'left'
  },
  { name: 'merchant', label: 'Merchant', field: 'merchant', align: 'left' },
  {
    name: 'reference',
    label: 'Referensi internal',
    field: row => row.transaction.merchant_order_id,
    align: 'left'
  },
  {
    name: 'payment_id',
    label: 'Referensi pembayaran',
    field: row => row.transaction.id,
    align: 'left'
  },
  { name: 'amount', label: 'Nominal', field: 'amount', align: 'right' },
  {
    name: 'environment',
    label: 'Environment',
    field: 'environment',
    align: 'left'
  },
  {
    name: 'status',
    label: 'Status pembayaran',
    field: 'status',
    align: 'left'
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

watch(
  merchantId,
  value => {
    payments.value = []
    meta.value = { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    error.value = null
    if (value) refreshPayments(1)
  },
  { immediate: true }
)

function labelFor(value) {
  return value ? String(value).replaceAll('_', ' ') : 'Tidak diketahui'
}
function statusColor(status) {
  if (status === 'paid') return 'positive'
  if (['failed', 'expired', 'cancelled'].includes(status)) return 'negative'
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
function formatAmount(transaction) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: transaction?.currency || 'IDR',
    maximumFractionDigits: 0
  }).format(transaction?.amount_minor || 0)
}

async function refreshPayments(page = meta.value.current_page) {
  if (!merchantId.value) return
  const requestedPage = Number.isInteger(page) && page > 0 ? page : 1
  const currentRequest = ++requestId.value
  loading.value = true
  error.value = null
  try {
    const response = await danaGatewayMerchantService.sandboxPayments(
      merchantId.value,
      { page: requestedPage, per_page: 15 }
    )
    if (currentRequest !== requestId.value) return
    payments.value = response.data?.data ?? []
    meta.value = response.data?.meta ?? meta.value
    if (meta.value.last_page < requestedPage)
      await refreshPayments(meta.value.last_page)
  } catch (requestError) {
    if (currentRequest !== requestId.value) return
    error.value = getApiErrorMessage(requestError)
    payments.value = []
  } finally {
    if (currentRequest === requestId.value) loading.value = false
  }
}

async function openDetail(payment) {
  detailOpen.value = true
  detail.value = null
  try {
    const response = await danaGatewayMerchantService.sandboxPaymentDetail(
      merchantId.value,
      payment.transaction.id
    )
    detail.value = response.data?.data ?? null
  } catch (requestError) {
    detailOpen.value = false
    error.value = getApiErrorMessage(requestError)
  }
}

async function checkStatus(payment) {
  const paymentId = payment.transaction.id
  checkingPaymentId.value = paymentId
  try {
    const response = await danaGatewayMerchantService.sandboxPaymentDetail(
      merchantId.value,
      paymentId
    )
    const updated = response.data?.data
    const index = payments.value.findIndex(
      item => item.transaction.id === paymentId
    )
    if (updated && index !== -1) payments.value.splice(index, 1, updated)
  } catch (requestError) {
    error.value = getApiErrorMessage(requestError)
  } finally {
    checkingPaymentId.value = null
  }
}
</script>

<style scoped>
h3,
h4 {
  margin: 0;
  color: #20180b;
}
h4 {
  font-size: 0.9rem;
}
.section-description,
.detail-note {
  margin: 4px 0 0;
  color: #746b5c;
  font-size: 0.82rem;
  line-height: 1.5;
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
  width: min(680px, 94vw);
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
  grid-template-columns: minmax(135px, 0.7fr) minmax(0, 1.3fr);
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
