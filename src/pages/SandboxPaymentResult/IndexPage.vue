<template>
  <q-page class="sandbox-result-page flex flex-center q-pa-md">
    <main class="result-shell" aria-live="polite">
      <section class="result-card">
        <div class="brand"
          ><q-icon name="science" size="24px" /><span
            >DANA Sandbox Tester</span
          ></div
        >
        <div v-if="state === 'loading'" class="result-state">
          <q-spinner color="warning" size="42px" />
          <h1>Memeriksa status pembayaran Sandbox...</h1>
        </div>
        <div v-else-if="state === 'invalid'" class="result-state">
          <q-icon name="link_off" color="negative" size="54px" />
          <h1>Referensi Tidak Valid</h1>
          <p
            >Tautan hasil Sandbox tidak tersedia, tidak valid, atau telah
            kedaluwarsa.</p
          >
          <q-btn
            outline
            color="warning"
            label="Kembali ke Sandbox Tester"
            no-caps
            to="/payment-gateway"
          />
        </div>
        <div v-else-if="state === 'network'" class="result-state">
          <q-icon name="cloud_off" color="warning" size="54px" />
          <h1>Status Belum Dapat Diperiksa</h1>
          <p>Gateway belum dapat dihubungi. Tidak ada status yang diubah.</p>
          <q-btn
            outline
            color="warning"
            icon="refresh"
            label="Cek Status"
            no-caps
            @click="checkManually"
          />
        </div>
        <div v-else class="result-state">
          <q-icon :name="statusIcon" :color="statusColor" size="54px" />
          <h1>{{ statusTitle }}</h1>
          <p>{{ statusMessage }}</p>
          <dl class="details">
            <div
              ><dt>Merchant</dt><dd>{{ result.merchant }}</dd></div
            >
            <div
              ><dt>Referensi</dt><dd>{{ result.transaction.id }}</dd></div
            >
            <div
              ><dt>Nominal</dt
              ><dd>{{ formatRupiah(result.transaction.amount_minor) }}</dd></div
            >
            <div
              ><dt>Status aktual</dt
              ><dd>{{ result.transaction.status }}</dd></div
            >
            <div
              ><dt>Dibuat</dt
              ><dd>{{ formatDate(result.transaction.created_at) }}</dd></div
            >
          </dl>
          <div class="row q-col-gutter-sm q-mt-lg">
            <div class="col-12 col-sm"
              ><q-btn
                class="full-width"
                outline
                color="warning"
                icon="refresh"
                label="Cek Status"
                no-caps
                @click="checkManually"
            /></div>
            <div class="col-12 col-sm"
              ><q-btn
                class="full-width"
                flat
                color="grey-5"
                label="Lihat Riwayat Transaksi"
                no-caps
                to="/payment-gateway"
            /></div>
          </div>
        </div>
      </section>
    </main>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { danaGatewayMerchantService } from '@/services/udev-billing'

const POLL_INTERVAL = 5000
const MAX_POLL_ATTEMPTS = 24
const route = useRoute()
const result = ref(null)
const state = ref('loading')
const polls = ref(0)
let timer = null

const context = computed(() =>
  typeof route.query.context === 'string' &&
  /^[A-Za-z0-9_-]{43}$/.test(route.query.context)
    ? route.query.context
    : null
)
const historyMerchant = computed(() =>
  Number.isSafeInteger(Number(route.query.merchant))
    ? Number(route.query.merchant)
    : null
)
const historyPayment = computed(() =>
  typeof route.query.payment === 'string' &&
  /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(route.query.payment)
    ? route.query.payment
    : null
)
const paymentStatus = computed(
  () => result.value?.transaction?.status ?? 'pending'
)
const statusTitle = computed(
  () =>
    ({
      paid: 'Pembayaran Berhasil',
      pending: 'Menunggu Pembayaran',
      failed: 'Pembayaran Gagal',
      cancelled: 'Pembayaran Dibatalkan',
      expired: 'Pembayaran Kedaluwarsa'
    })[paymentStatus.value] ?? 'Menunggu Pembayaran'
)
const statusMessage = computed(() =>
  paymentStatus.value === 'paid'
    ? 'Status berasal dari pembayaran gateway yang telah terverifikasi.'
    : 'Redirect tidak dianggap sebagai bukti pembayaran berhasil.'
)
const statusColor = computed(() =>
  paymentStatus.value === 'paid'
    ? 'positive'
    : ['failed', 'cancelled', 'expired'].includes(paymentStatus.value)
      ? 'negative'
      : 'warning'
)
const statusIcon = computed(() =>
  paymentStatus.value === 'paid'
    ? 'check_circle'
    : ['failed', 'cancelled', 'expired'].includes(paymentStatus.value)
      ? 'cancel'
      : 'hourglass_top'
)

function stopPolling() {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}
function schedulePolling() {
  stopPolling()
  if (
    paymentStatus.value !== 'pending' ||
    polls.value >= MAX_POLL_ATTEMPTS ||
    document.visibilityState !== 'visible'
  )
    return
  timer = window.setTimeout(async () => {
    polls.value += 1
    await load()
  }, POLL_INTERVAL)
}
async function load() {
  stopPolling()
  if (!context.value && !(historyMerchant.value && historyPayment.value)) {
    state.value = 'invalid'
    return
  }
  state.value = 'loading'
  try {
    const response = context.value
      ? await danaGatewayMerchantService.sandboxPaymentResult(context.value)
      : await danaGatewayMerchantService.sandboxPaymentResultFromHistory(
          historyMerchant.value,
          historyPayment.value
        )
    result.value = response.data.data
    state.value = 'ready'
    schedulePolling()
  } catch (error) {
    state.value =
      error.response?.status === 404 || error.response?.status === 403
        ? 'invalid'
        : 'network'
  }
}
async function checkManually() {
  polls.value = 0
  await load()
}
function onVisibilityChange() {
  if (document.visibilityState === 'visible' && state.value === 'ready')
    schedulePolling()
  else stopPolling()
}
function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value || 0)
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '—'
}
onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  load()
})
onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped lang="scss">
.sandbox-result-page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 80% 8%,
      rgba(214, 173, 77, 0.15),
      transparent 28%
    ),
    #0c0c0d;
}
.result-shell {
  width: min(100%, 520px);
}
.result-card {
  overflow: hidden;
  border: 1px solid rgba(214, 173, 77, 0.36);
  border-radius: 18px;
  background: linear-gradient(145deg, #1a1a1c, #101011);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  color: #f7f4ee;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(214, 173, 77, 0.2);
  color: #d6ad4d;
  font-size: 0.82rem;
  font-weight: 800;
}
.result-state {
  padding: 36px 24px 28px;
  text-align: center;
}
h1 {
  margin: 18px 0 9px;
  color: #fffaf0;
  font-size: clamp(1.35rem, 5vw, 1.75rem);
  line-height: 1.2;
}
p {
  margin: 0;
  color: #c9c3b8;
  line-height: 1.65;
}
.details {
  display: grid;
  gap: 12px;
  margin: 26px 0 0;
  padding: 18px;
  border: 1px solid rgba(214, 173, 77, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  text-align: left;
}
.details div {
  display: grid;
  gap: 3px;
}
dt {
  color: #ab9f8c;
  font-size: 0.71rem;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}
dd {
  margin: 0;
  color: #fffaf0;
  overflow-wrap: anywhere;
}
</style>
