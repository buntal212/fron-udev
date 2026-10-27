<template>
  <q-dialog
    v-model="store.detailDialogOpen"
    @before-hide="store.closeDetailDialog"
  >
    <q-card class="detail-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">DETAIL INVOICE</p>
          <h2>{{ invoice.invoice_number || 'Invoice' }}</h2>
        </div>
        <q-btn flat round dense icon="close" aria-label="Tutup" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="store.detailLoading" class="q-pa-xl text-center">
        <q-spinner color="warning" size="32px" />
      </q-card-section>
      <q-card-section v-else-if="store.selectedInvoice" class="q-gutter-y-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6"
            ><p class="label">Aplikasi</p
            ><p class="value">{{ store.applicationName(invoice) }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Pelanggan</p
            ><p class="value">{{ invoice.customer?.name || '—' }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Paket</p
            ><p class="value">{{ invoice.plan?.name || '—' }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Jumlah periode</p
            ><p class="value"
              >{{ invoice.period_count || 1 }} periode ({{
                invoice.duration_days
              }}
              hari)</p
            ></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Durasi snapshot</p
            ><p class="value">{{ invoice.duration_days }} hari</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Harga sebelum potongan</p
            ><p class="value">{{
              formatSubscriptionPrice(
                invoice.pricing?.normal_price ?? invoice.amount,
                invoice.currency
              )
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Potongan</p
            ><p class="value">{{
              formatSubscriptionPrice(
                invoice.pricing?.discount_amount ?? '0.00',
                invoice.currency
              )
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Harga setelah potongan</p
            ><p class="value">{{
              formatSubscriptionPrice(
                invoice.pricing?.final_price ?? invoice.amount,
                invoice.currency
              )
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Referral</p
            ><p class="value">{{ referralName }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Tanggal terbit</p
            ><p class="value">{{
              formatSubscriptionDate(invoice.issued_at)
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Jatuh tempo</p
            ><p class="value">{{
              formatSubscriptionDate(invoice.due_at)
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Tanggal pembayaran</p
            ><p class="value">{{
              formatSubscriptionDate(invoice.paid_at)
            }}</p></div
          >
          <div v-if="invoice.subscription" class="col-12 col-sm-6">
            <p class="label">Masa aktif langganan</p>
            <p class="value">
              Berakhir
              {{ formatSubscriptionDate(invoice.subscription.expires_at) }}
              <q-badge
                rounded
                class="q-ml-xs"
                :color="
                  invoice.subscription.status === 'active'
                    ? 'positive'
                    : 'grey-7'
                "
                :label="invoice.subscription.status"
              />
            </p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status</p>
            <q-badge
              rounded
              :color="getInvoiceStatus(invoice.status).color"
              :label="getInvoiceStatus(invoice.status).label"
            />
          </div>
        </div>
        <q-banner
          v-if="store.checkoutError"
          rounded
          class="checkout-banner checkout-banner--error"
        >
          <template #avatar><q-icon name="error_outline" /></template>
          {{ store.checkoutError }}
        </q-banner>
        <!-- Pilihan Metode Pembayaran & Tombol Bayar -->
        <q-card
          v-if="canStartCheckout"
          flat
          bordered
          class="q-pa-md checkout-method-card rounded-borders"
        >
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-12 col-sm">
              <div class="text-weight-bold text-brown-9 row items-center">
                <q-icon
                  name="payment"
                  class="q-mr-xs text-warning"
                  size="20px"
                />
                Pilih Metode Pembayaran (DANA Sandbox)
              </div>
              <div class="text-caption text-grey-8 q-mt-xs">
                Pilih QRIS, DANA Wallet, atau Virtual Account bank yang tersedia
                di DANA Sandbox.
              </div>
            </div>
            <div class="col-12 col-sm-auto">
              <q-btn-toggle
                v-model="store.checkoutPaymentMethod"
                push
                glossy
                dense
                toggle-color="warning"
                toggle-text-color="dark"
                text-color="brown-9"
                :options="[
                  { label: 'QRIS DANA', value: 'qris', icon: 'qr_code_2' },
                  {
                    label: 'DANA Wallet',
                    value: 'dana_wallet',
                    icon: 'account_balance_wallet'
                  },
                  { label: 'VA BRI', value: 'va_bri', icon: 'account_balance' },
                  {
                    label: 'VA PANI',
                    value: 'va_pani',
                    icon: 'account_balance'
                  },
                  {
                    label: 'VA CIMB',
                    value: 'va_cimb',
                    icon: 'account_balance'
                  },
                  {
                    label: 'VA BTPN',
                    value: 'va_btpn',
                    icon: 'account_balance'
                  }
                ]"
              />
            </div>
          </div>

          <div class="row items-center justify-end q-mt-md">
            <q-btn
              color="warning"
              text-color="dark"
              :icon="
                store.checkoutPaymentMethod === 'qris'
                  ? 'qr_code_2'
                  : isVirtualAccountMethod(store.checkoutPaymentMethod)
                    ? 'account_balance'
                    : 'payments'
              "
              :label="
                store.checkoutPaymentMethod === 'qris'
                  ? 'Bayar dengan QRIS'
                  : isVirtualAccountMethod(store.checkoutPaymentMethod)
                    ? `Buat ${paymentMethodLabel(store.checkoutPaymentMethod)}`
                    : 'Bayar melalui DANA Sandbox'
              "
              no-caps
              :loading="store.checkoutLoading"
              :disable="store.checkoutLoading"
              @click="store.startCheckout()"
            />
          </div>
        </q-card>

        <q-card
          v-if="isCurrentAttemptVirtualAccount"
          flat
          bordered
          class="q-pa-md va-panel rounded-borders"
        >
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-weight-bold text-brown-9 row items-center">
              <q-icon
                name="account_balance"
                class="q-mr-xs text-warning"
                size="22px"
              />
              {{ paymentMethodLabel(currentAttemptMethod) }} DANA Sandbox
            </div>
            <q-badge
              rounded
              :color="
                isCheckoutExpired
                  ? 'negative'
                  : invoice.status === 'paid'
                    ? 'positive'
                    : 'warning'
              "
              :label="
                isCheckoutExpired
                  ? 'Kedaluwarsa'
                  : invoice.status === 'paid'
                    ? 'Lunas'
                    : 'Menunggu Pembayaran'
              "
            />
          </div>
          <div
            v-if="!isCheckoutExpired && invoice.status === 'pending'"
            class="text-caption text-grey-8 q-mb-sm row items-center"
          >
            <q-icon name="schedule" size="16px" class="q-mr-xs text-warning" />
            <span
              >Sisa waktu berlaku:
              <strong>{{ formattedCountdown }}</strong></span
            >
          </div>
          <q-banner
            v-else-if="isCheckoutExpired"
            rounded
            dense
            class="bg-negative text-white q-mb-sm"
          >
            Nomor Virtual Account telah kedaluwarsa. Buat ulang checkout untuk
            memperoleh instruksi baru dari gateway.
          </q-banner>
          <div class="va-code q-pa-md text-center">
            <div class="text-caption text-grey-8">Nomor Virtual Account</div>
            <div class="text-h6 text-weight-bold text-brown-9 q-mt-xs">{{
              currentPaymentCode
            }}</div>
            <div class="text-caption text-grey-7 q-mt-sm">
              {{
                currentPaymentInstruction?.message ||
                'Bayar sesuai instruksi bank sebelum masa berlaku berakhir.'
              }}
            </div>
          </div>
          <div class="row justify-center q-gutter-sm q-mt-sm">
            <q-btn
              outline
              dense
              no-caps
              color="brown-9"
              icon="content_copy"
              label="Salin Nomor VA"
              @click="copyPayload(currentPaymentCode)"
            />
            <q-btn
              v-if="isCheckoutExpired || isLatestAttemptFailed"
              color="negative"
              unelevated
              dense
              no-caps
              icon="replay"
              label="Ulangi Pembayaran (Retry)"
              :loading="store.checkoutLoading"
              @click="store.retryCheckout()"
            />
          </div>
        </q-card>

        <!-- Tampilan QRIS & Status Pembayaran QR -->
        <q-card
          v-if="
            isCurrentAttemptQris ||
            (store.checkoutPaymentMethod === 'qris' &&
              (store.checkoutQrPayload ||
                store.checkoutQrDataUrl ||
                store.checkoutPaymentCode))
          "
          flat
          bordered
          class="q-pa-md qris-panel rounded-borders"
        >
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-weight-bold text-brown-9 row items-center">
              <q-icon
                name="qr_code_scanner"
                class="q-mr-xs text-warning"
                size="22px"
              />
              Kode QRIS DANA Sandbox
            </div>
            <div class="row items-center q-gutter-xs">
              <q-badge
                rounded
                :color="
                  isQrisExpired
                    ? 'negative'
                    : invoice.status === 'paid'
                      ? 'positive'
                      : 'warning'
                "
                :label="
                  isQrisExpired
                    ? 'Kedaluwarsa'
                    : invoice.status === 'paid'
                      ? 'Lunas'
                      : 'Menunggu Pembayaran'
                "
              />
            </div>
          </div>

          <div
            v-if="!isCheckoutExpired && invoice.status === 'pending'"
            class="text-caption text-grey-8 q-mb-sm row items-center"
          >
            <q-icon name="schedule" size="16px" class="q-mr-xs text-warning" />
            <span
              >Sisa waktu berlaku:
              <strong>{{ formattedCountdown }}</strong></span
            >
            <q-spinner-dots color="warning" size="18px" class="q-ml-sm" />
          </div>
          <div
            v-else-if="isCheckoutExpired"
            class="text-caption text-negative q-mb-sm row items-center"
          >
            <q-icon name="warning" size="16px" class="q-mr-xs" />
            <span
              >Kode QRIS telah kedaluwarsa. Silakan lakukan retry untuk membuat
              kode baru.</span
            >
          </div>

          <div class="qris-container q-pa-sm text-center">
            <div v-if="store.checkoutQrLoading" class="q-pa-lg">
              <q-spinner color="warning" size="36px" />
              <div class="text-caption q-mt-xs">Membuat gambar QRIS...</div>
            </div>
            <div
              v-else-if="store.checkoutQrDataUrl"
              class="column items-center"
            >
              <img
                :src="store.checkoutQrDataUrl"
                alt="QRIS DANA Sandbox"
                class="qris-img"
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                Scan kode QRIS melalui aplikasi DANA atau e-wallet sandbox Anda.
              </div>
            </div>
            <div
              v-else-if="store.checkoutPaymentCode"
              class="column items-center q-pa-md"
            >
              <div class="text-caption text-grey-8 q-mb-xs">
                Kode Pembayaran DANA Sandbox:
              </div>
              <div class="text-h6 text-weight-bold text-brown-9 q-mb-xs">
                {{ store.checkoutPaymentCode }}
              </div>
              <div class="text-caption text-grey-7">
                Gunakan kode bayar ini pada aplikasi atau simulator DANA
                Sandbox.
              </div>
            </div>
            <q-banner
              v-if="store.checkoutQrError"
              rounded
              dense
              class="bg-negative text-white q-mt-xs"
            >
              {{ store.checkoutQrError }}
            </q-banner>
          </div>

          <div class="row q-gutter-sm items-center justify-center q-mt-sm">
            <q-btn
              v-if="store.checkoutQrDataUrl"
              outline
              dense
              no-caps
              color="brown-9"
              icon="download"
              label="Unduh QRIS"
              @click="downloadQrisPng"
            />
            <q-btn
              v-if="store.checkoutQrPayload"
              outline
              dense
              no-caps
              color="brown-9"
              icon="content_copy"
              label="Salin Payload QRIS"
              @click="copyPayload(store.checkoutQrPayload)"
            />
            <q-btn
              v-if="store.checkoutPaymentCode && !store.checkoutQrPayload"
              outline
              dense
              no-caps
              color="brown-9"
              icon="content_copy"
              label="Salin Kode Pembayaran"
              @click="copyPayload(store.checkoutPaymentCode)"
            />
            <q-btn
              v-if="isCheckoutExpired || isLatestAttemptFailed"
              color="negative"
              unelevated
              dense
              no-caps
              icon="replay"
              label="Ulangi Pembayaran (Retry)"
              :loading="store.checkoutLoading"
              @click="store.retryCheckout()"
            />
          </div>
        </q-card>

        <!-- Admin Sandbox Testing & Controls Panel -->
        <q-card
          flat
          bordered
          class="q-pa-md test-panel rounded-borders q-mt-sm"
        >
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-weight-bold text-brown-9 row items-center">
              <q-icon name="science" class="q-mr-xs text-warning" size="20px" />
              Kontrol Pengujian Admin UDEV (DANA Sandbox)
            </div>
            <q-badge color="dark" text-color="warning" label="Sandbox UAT" />
          </div>
          <p class="section-description q-mb-sm">
            Kontrol pengujian end-to-end: Lakukan checkout dan bayar melalui
            DANA Sandbox, lalu sinkronkan status untuk verifikasi gateway resmi.
            Settlement operasional hanya diproses dari konfirmasi gateway DANA
            yang valid.
          </p>
          <div class="row q-gutter-sm items-center">
            <q-btn
              v-if="invoice.payment_attempts?.length"
              color="primary"
              unelevated
              icon="sync"
              label="Sinkronkan Status Gateway"
              no-caps
              dense
              class="q-px-sm"
              :loading="store.reconcileLoading"
              :disable="store.reconcileLoading"
              @click="store.reconcileInvoice()"
            />
            <q-btn
              v-if="invoice.status === 'pending'"
              color="negative"
              outline
              icon="cancel"
              label="Simulasi Gagal (Sandbox)"
              no-caps
              dense
              class="q-px-sm"
              :loading="store.simulateLoading"
              :disable="store.simulateLoading"
              @click="store.simulateSandboxPayment('failed')"
            />
            <q-btn
              v-if="store.checkoutUrl"
              outline
              color="warning"
              icon="open_in_new"
              label="Buka Checkout DANA Sandbox"
              no-caps
              dense
              class="q-px-sm"
              :href="store.checkoutUrl"
              target="_blank"
            />
          </div>
          <q-banner
            v-if="store.simulateMessage"
            rounded
            dense
            class="bg-positive text-white q-mt-sm"
          >
            {{ store.simulateMessage }}
          </q-banner>
          <q-banner
            v-if="store.simulateError || store.reconcileError"
            rounded
            dense
            class="bg-negative text-white q-mt-sm"
          >
            {{ store.simulateError || store.reconcileError }}
          </q-banner>
        </q-card>
        <q-separator />
        <div>
          <p class="section-title">Riwayat percobaan pembayaran</p>
          <q-list
            v-if="invoice.payment_attempts?.length"
            bordered
            separator
            class="attempt-list"
          >
            <q-item
              v-for="attempt in invoice.payment_attempts"
              :key="attempt.id"
            >
              <q-item-section>
                <q-item-label
                  >{{ attempt.provider }} · Percobaan #{{
                    attempt.attempt_number
                  }}</q-item-label
                >
                <q-item-label caption>{{
                  formatSubscriptionDate(attempt.requested_at)
                }}</q-item-label>
                <q-item-label caption>
                  {{
                    formatSubscriptionPrice(attempt.amount, attempt.currency)
                  }}
                  <span v-if="attemptPaymentMethod(attempt)">
                    Â· {{ paymentMethodLabel(attemptPaymentMethod(attempt)) }}
                  </span>
                  <span v-if="attempt.checkout_expires_at">
                    Â· Berlaku s.d.
                    {{ formatSubscriptionDate(attempt.checkout_expires_at) }}
                  </span>
                  <span v-if="attempt.reconciliation">
                    ·
                    {{
                      reconciliationLabel(attempt.reconciliation.status).label
                    }}
                  </span>
                </q-item-label>
                <q-item-label v-if="attempt.settlement" caption>
                  Settlement
                  {{ formatSubscriptionDate(attempt.settlement.allocated_at) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="column items-end q-gutter-y-xs">
                  <q-badge
                    rounded
                    :color="getPaymentAttemptStatus(attempt.status).color"
                    :label="getPaymentAttemptStatus(attempt.status).label"
                  />
                  <q-badge
                    v-if="attempt.reconciliation"
                    rounded
                    outline
                    :color="
                      reconciliationLabel(attempt.reconciliation.status).color
                    "
                    :label="
                      reconciliationLabel(attempt.reconciliation.status).label
                    "
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
          <p v-else class="empty-history">Belum ada percobaan pembayaran.</p>
        </div>
        <q-separator v-if="invoice.subscription?.period_events?.length" />
        <div v-if="invoice.subscription?.period_events?.length">
          <p class="section-title"
            >Riwayat aktivasi dan perpanjangan langganan</p
          >
          <q-list bordered separator class="attempt-list">
            <q-item
              v-for="evt in invoice.subscription.period_events"
              :key="evt.id"
            >
              <q-item-section>
                <q-item-label class="text-weight-bold">
                  {{
                    evt.event_type === 'activation'
                      ? 'Aktivasi Awal Langganan'
                      : 'Perpanjangan Masa Aktif'
                  }}
                </q-item-label>
                <q-item-label caption>
                  <span v-if="evt.previous_expires_at">
                    {{ formatSubscriptionDate(evt.previous_expires_at) }} &rarr;
                    {{ formatSubscriptionDate(evt.new_expires_at) }}
                  </span>
                  <span v-else>
                    Masa aktif berakhir:
                    {{ formatSubscriptionDate(evt.new_expires_at) }}
                  </span>
                </q-item-label>
                <q-item-label v-if="evt.notes" caption class="text-grey-7">
                  {{ evt.notes }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="column items-end q-gutter-y-xs">
                  <q-badge
                    rounded
                    :color="
                      evt.event_type === 'activation' ? 'positive' : 'warning'
                    "
                    :text-color="
                      evt.event_type === 'activation' ? 'white' : 'dark'
                    "
                    :label="
                      evt.event_type === 'activation'
                        ? 'Aktivasi'
                        : 'Perpanjangan'
                    "
                  />
                  <span class="text-caption text-grey-7">
                    {{ formatSubscriptionDate(evt.created_at) }}
                  </span>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useInvoiceStore } from '@/stores/invoice'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice,
  getInvoiceStatus,
  getPaymentAttemptStatus,
  getReconciliationStatus
} from '@/utils/subscription'

const store = useInvoiceStore()
const invoice = computed(() => store.selectedInvoice || {})
const referralName = computed(() => {
  const { referral_partner_name: partnerName, referral_code: referralCode } =
    invoice.value.pricing || {}

  if (partnerName && referralCode) return `${partnerName} (${referralCode})`
  return partnerName || referralCode || '—'
})
const reconciliationLabel = status => getReconciliationStatus(status)
const virtualAccountMethods = ['va_bri', 'va_pani', 'va_cimb', 'va_btpn']
const paymentMethodLabels = {
  dana_wallet: 'DANA Wallet',
  qris: 'QRIS DANA',
  va_bri: 'Virtual Account BRI',
  va_pani: 'Virtual Account PANI',
  va_cimb: 'Virtual Account CIMB',
  va_btpn: 'Virtual Account BTPN'
}
const isVirtualAccountMethod = method => virtualAccountMethods.includes(method)
const paymentMethodLabel = method =>
  paymentMethodLabels[method] || 'Pembayaran DANA'
const attemptPaymentMethod = attempt =>
  attempt?.metadata?.payment_method || attempt?.payment_method || null
const canStartCheckout = computed(
  () =>
    invoice.value.status === 'pending' &&
    !invoice.value.payment_attempts?.some(
      attempt => attempt.status === 'succeeded'
    )
)

const latestAttempt = computed(() => {
  const attempts = invoice.value.payment_attempts
  if (!Array.isArray(attempts) || attempts.length === 0) return null
  return [...attempts].sort((a, b) => b.attempt_number - a.attempt_number)[0]
})

const isCurrentAttemptQris = computed(() => {
  const method = attemptPaymentMethod(latestAttempt.value)
  return (
    method === 'qris' &&
    (store.checkoutQrPayload ||
      store.checkoutPaymentCode ||
      latestAttempt.value?.qr_content ||
      latestAttempt.value?.metadata?.qr_content ||
      latestAttempt.value?.metadata?.payment_code)
  )
})

const currentAttemptMethod = computed(
  () => attemptPaymentMethod(latestAttempt.value) || store.checkoutPaymentMethod
)
const currentPaymentInstruction = computed(
  () =>
    latestAttempt.value?.metadata?.payment_instruction ||
    store.checkoutAttempt?.payment_instruction ||
    null
)
const currentPaymentCode = computed(
  () =>
    store.checkoutPaymentCode ||
    latestAttempt.value?.metadata?.payment_code ||
    latestAttempt.value?.metadata?.qr_content ||
    currentPaymentInstruction.value?.payment_code ||
    ''
)
const isCurrentAttemptVirtualAccount = computed(
  () =>
    isVirtualAccountMethod(currentAttemptMethod.value) &&
    Boolean(currentPaymentCode.value)
)

const isQrisExpired = computed(() => {
  return isCheckoutExpired.value
})

const isCheckoutExpired = computed(() => {
  if (latestAttempt.value?.status === 'expired') return true
  if (
    store.checkoutExpiresAt &&
    new Date(store.checkoutExpiresAt).getTime() <= Date.now()
  ) {
    return true
  }
  return false
})

const isLatestAttemptFailed = computed(() => {
  return (
    latestAttempt.value?.status === 'failed' ||
    latestAttempt.value?.status === 'expired'
  )
})

const formattedCountdown = computed(() => {
  const s = store.checkoutRemainingSeconds
  if (s <= 0) return 'Kedaluwarsa'
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
})

const downloadQrisPng = () => {
  if (!store.checkoutQrDataUrl) return
  const a = document.createElement('a')
  a.href = store.checkoutQrDataUrl
  a.download = `qris-${invoice.value.invoice_number || 'dana-sandbox'}.png`
  a.click()
}

const copyPayload = async text => {
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  } catch {
    // ignore
  }
}

onBeforeUnmount(() => {
  store.stopCheckoutSession()
})
</script>

<style scoped>
.checkout-method-card {
  border-color: #ecd29b;
  background: #fffdf5;
}
.qris-panel {
  border-color: #e0c37c;
  background: #fffbf0;
}
.va-panel {
  border-color: #e0c37c;
  background: #fffbf0;
}
.va-code {
  border: 1px solid #ebd9b5;
  border-radius: 8px;
  background: #ffffff;
  letter-spacing: 0.04em;
}
.qris-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #ebd9b5;
}
.qris-img {
  max-width: 260px;
  width: 100%;
  height: auto;
  border-radius: 4px;
}
.detail-dialog {
  width: min(720px, 96vw);
  border-radius: 14px;
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
h2 {
  margin: 0;
  color: #20180b;
  font-size: 1.15rem;
}
.label,
.section-title {
  margin: 0 0 4px;
  color: #746b5c;
  font-size: 0.75rem;
  font-weight: 700;
}
.value {
  margin: 0;
  color: #20180b;
  font-size: 0.92rem;
}
.attempt-list {
  border-color: #e0d7c6;
  border-radius: 10px;
}
.empty-history {
  margin: 0;
  color: #746b5c;
  font-size: 0.85rem;
}
.checkout-banner {
  border: 1px solid #e0c37c;
  background: #fff8e4;
  color: #4b3813;
}
.checkout-banner--error {
  border-color: #e8b4ad;
  background: #fff1f1;
  color: #7b2222;
}
.test-panel {
  border-color: #ecd29b;
  background: #fffdf5;
}
.section-description {
  margin: 0;
  color: #746b5c;
  font-size: 0.8rem;
}
</style>
