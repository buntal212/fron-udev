<template>
  <q-page class="payment-result-page flex flex-center q-pa-md">
    <main class="result-shell" aria-live="polite">
      <section class="result-card" aria-labelledby="payment-result-title">
        <div class="brand">
          <q-icon name="account_balance_wallet" size="24px" />
          <span>UDEV Billing</span>
        </div>

        <div v-if="state === 'loading'" class="result-state">
          <q-spinner color="warning" size="42px" />
          <h1 id="payment-result-title"
            >Sedang memeriksa status pembayaran...</h1
          >
          <p
            >Mohon tunggu sebentar. Status dikonfirmasi oleh sistem
            pembayaran.</p
          >
        </div>

        <div v-else-if="state === 'paid'" class="result-state">
          <q-icon name="check_circle" color="positive" size="54px" />
          <h1 id="payment-result-title">Pembayaran Berhasil</h1>
          <p>Pembayaran Anda telah dikonfirmasi.</p>
          <PaymentDetails :result="result" />
          <q-btn
            class="full-width q-mt-lg"
            color="warning"
            text-color="dark"
            icon-right="arrow_forward"
            label="Kembali ke aplikasi"
            no-caps
            @click="returnToApplication"
          />
        </div>

        <div v-else-if="state === 'pending'" class="result-state">
          <q-icon name="hourglass_top" color="warning" size="54px" />
          <h1 id="payment-result-title">Menunggu Konfirmasi Pembayaran</h1>
          <p>
            Pembayaran sedang diverifikasi. Halaman ini akan memeriksa ulang
            secara otomatis untuk beberapa saat.
          </p>
          <PaymentDetails :result="result" />
          <div class="row q-col-gutter-sm q-mt-lg">
            <div class="col-12 col-sm">
              <q-btn
                class="full-width"
                outline
                color="warning"
                icon="refresh"
                label="Cek Status"
                no-caps
                :loading="state === 'loading'"
                @click="checkManually"
              />
            </div>
            <div class="col-12 col-sm">
              <q-btn
                class="full-width"
                flat
                color="grey-5"
                label="Kembali"
                no-caps
                @click="returnToApplication"
              />
            </div>
          </div>
        </div>

        <div
          v-else-if="state === 'failed' || state === 'cancelled'"
          class="result-state"
        >
          <q-icon name="cancel" color="negative" size="54px" />
          <h1 id="payment-result-title">Pembayaran Belum Berhasil</h1>
          <p
            >Pembayaran belum dapat dikonfirmasi. Anda dapat kembali ke aplikasi
            untuk bantuan atau pembayaran ulang.</p
          >
          <PaymentDetails :result="result" />
          <q-btn
            class="full-width q-mt-lg"
            outline
            color="warning"
            label="Kembali ke aplikasi"
            no-caps
            @click="returnToApplication"
          />
        </div>

        <div v-else-if="state === 'expired'" class="result-state">
          <q-icon name="timer_off" color="warning" size="54px" />
          <h1 id="payment-result-title">Waktu Pembayaran Habis</h1>
          <p>Waktu untuk menyelesaikan pembayaran ini telah berakhir.</p>
          <PaymentDetails :result="result" />
          <q-btn
            class="full-width q-mt-lg"
            outline
            color="warning"
            label="Kembali ke aplikasi"
            no-caps
            @click="returnToApplication"
          />
        </div>

        <div v-else-if="state === 'not-found'" class="result-state">
          <q-icon name="receipt_long" color="grey-5" size="54px" />
          <h1 id="payment-result-title">Pembayaran Tidak Ditemukan</h1>
          <p
            >Informasi pembayaran tidak tersedia atau tautan ini sudah tidak
            valid.</p
          >
          <q-btn flat color="grey-5" label="Kembali" no-caps @click="goBack" />
        </div>

        <div v-else class="result-state">
          <q-icon name="cloud_off" color="warning" size="54px" />
          <h1 id="payment-result-title">Status Belum Dapat Diperiksa</h1>
          <p
            >Status pembayaran belum dapat diperiksa. Silakan coba beberapa saat
            lagi.</p
          >
          <q-btn
            class="full-width q-mt-lg"
            outline
            color="warning"
            icon="refresh"
            label="Coba Lagi"
            no-caps
            @click="checkManually"
          />
        </div>
      </section>
    </main>
  </q-page>
</template>

<script setup>
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'
import { useRoute } from 'vue-router'
import { paymentResultService } from '@/services/udev-billing'

const POLL_INTERVAL = 5000
const MAX_POLL_ATTEMPTS = 24

const route = useRoute()
const result = ref(null)
const state = ref('loading')
const pollAttempts = ref(0)
let pollTimer = null

const reference = computed(() => {
  const value = route.query.reference

  return typeof value === 'string' && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(value)
    ? value
    : null
})

const PaymentDetails = defineComponent({
  props: {
    result: { type: Object, default: null }
  },
  setup(props) {
    const currencyFormatter = computed(
      () =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: props.result?.currency || 'IDR',
          maximumFractionDigits: 0
        })
    )

    const formattedDate = computed(() => {
      if (!props.result?.paid_at) return null

      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short'
      }).format(new Date(props.result.paid_at))
    })

    return () =>
      props.result
        ? h('dl', { class: 'payment-details' }, [
            props.result.application_name
              ? h('div', [
                  h('dt', 'Layanan'),
                  h('dd', props.result.application_name)
                ])
              : null,
            h('div', [
              h('dt', 'Nominal'),
              h(
                'dd',
                currencyFormatter.value.format(Number(props.result.amount))
              )
            ]),
            h('div', [
              h('dt', 'Nomor referensi'),
              h('dd', props.result.reference)
            ]),
            formattedDate.value
              ? h('div', [
                  h('dt', 'Tanggal pembayaran'),
                  h('dd', formattedDate.value)
                ])
              : null
          ])
        : null
  }
})

const stopPolling = () => {
  if (pollTimer !== null) {
    window.clearTimeout(pollTimer)
    pollTimer = null
  }
}

const schedulePolling = () => {
  stopPolling()

  if (
    state.value !== 'pending' ||
    pollAttempts.value >= MAX_POLL_ATTEMPTS ||
    document.visibilityState !== 'visible'
  ) {
    return
  }

  pollTimer = window.setTimeout(async () => {
    pollAttempts.value += 1
    await loadStatus()
  }, POLL_INTERVAL)
}

const loadStatus = async () => {
  stopPolling()

  if (!reference.value) {
    state.value = 'not-found'
    return
  }

  state.value = 'loading'

  try {
    const response = await paymentResultService.get(reference.value)
    result.value = response.data.data
    state.value = result.value.status
  } catch (error) {
    state.value = error.response?.status === 404 ? 'not-found' : 'network-error'
  }

  schedulePolling()
}

const checkManually = async () => {
  pollAttempts.value = 0
  await loadStatus()
}

const goBack = () => window.history.back()

const returnToApplication = () => {
  if (result.value?.return_url) {
    window.location.assign(result.value.return_url)
    return
  }

  goBack()
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible' && state.value === 'pending') {
    schedulePolling()
  } else if (document.visibilityState !== 'visible') {
    stopPolling()
  }
}

watch(reference, () => {
  pollAttempts.value = 0
  loadStatus()
})

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  loadStatus()
})

onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped lang="scss">
.payment-result-page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 80% 8%,
      rgba(214, 173, 77, 0.15),
      transparent 28%
    ),
    radial-gradient(
      circle at 5% 90%,
      rgba(214, 173, 77, 0.08),
      transparent 30%
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
  letter-spacing: 0.04em;
}

.result-state {
  padding: 36px 24px 28px;
  text-align: center;
}

h1 {
  margin: 18px 0 9px;
  color: #fffaf0;
  font-size: clamp(1.35rem, 5vw, 1.75rem);
  font-weight: 750;
  line-height: 1.2;
}

p {
  margin: 0;
  color: #c9c3b8;
  font-size: 0.93rem;
  line-height: 1.65;
}

:deep(.payment-details) {
  display: grid;
  gap: 12px;
  margin: 26px 0 0;
  padding: 18px;
  border: 1px solid rgba(214, 173, 77, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  text-align: left;
}

:deep(.payment-details div) {
  display: grid;
  gap: 3px;
}

:deep(dt) {
  color: #ab9f8c;
  font-size: 0.71rem;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

:deep(dd) {
  margin: 0;
  color: #fffaf0;
  font-size: 0.93rem;
  overflow-wrap: anywhere;
}

@media (max-width: 400px) {
  .result-state {
    padding: 31px 18px 22px;
  }
}
</style>
