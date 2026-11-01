<template>
  <q-card flat bordered class="table-card bg-surface">
    <!-- Header Toolbar: Title, Counter, and Sorting -->
    <q-card-section class="q-pa-md bg-dark-toolbar text-white">
      <div class="row items-center justify-between q-col-gutter-sm">
        <div class="col-12 col-sm">
          <div class="row items-center">
            <q-icon
              name="receipt_long"
              class="q-mr-sm text-warning"
              size="24px"
            />
            <h2 class="text-h6 text-weight-bolder text-white q-ma-none">
              Daftar Invoice
            </h2>
            <q-badge
              color="warning"
              text-color="dark"
              class="q-ml-sm text-bold"
            >
              {{ store.items.length }} dimuat /
              {{ store.totalRows || store.items.length }} total
            </q-badge>
          </div>
          <p class="text-caption text-grey-4 q-mb-none q-mt-xs">
            Daftar tagihan langganan dengan status transaksi gateway aktual.
          </p>
        </div>

        <!-- Sorting Controls -->
        <div class="col-12 col-sm-auto row items-center q-gutter-sm">
          <span class="text-caption text-grey-4">Urutkan:</span>
          <q-select
            v-model="currentSortOption"
            :options="sortOptions"
            dense
            outlined
            dark
            color="warning"
            bg-color="dark"
            options-dense
            emit-value
            map-options
            class="sort-select"
            @update:model-value="onSortChange"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator color="amber-9" />

    <!-- Initial Loading State -->
    <div v-if="store.loading" class="q-pa-xl text-center">
      <q-spinner-dots color="warning" size="48px" />
      <div class="text-caption text-grey-7 q-mt-sm">
        Memuat daftar invoice...
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.items || store.items.length === 0"
      class="full-width row flex-center q-pa-xl"
    >
      <EmptyState
        icon="receipt_long"
        title="Belum ada invoice"
        message="Tidak ada data invoice yang sesuai dengan kriteria pencarian dan filter."
      />
    </div>

    <!-- Card List Item Responsif dengan QInfiniteScroll -->
    <div v-else class="q-pa-md">
      <q-infinite-scroll
        ref="infiniteScrollRef"
        :offset="250"
        :disable="!store.hasMore || store.loading"
        class="invoice-infinite-scroll"
        @load="onInfiniteLoad"
      >
        <q-card
          v-for="invoice in store.items"
          :key="invoice.id"
          flat
          bordered
          class="invoice-item-card q-mb-md"
        >
          <!-- Card Header Bar: Black & Gold Theme -->
          <div
            class="card-header-bar q-px-md q-py-sm row items-center justify-between"
          >
            <div class="row items-center q-gutter-xs">
              <span class="invoice-number text-weight-bolder text-warning">
                {{ invoice.invoice_number }}
              </span>
              <q-badge
                color="dark"
                text-color="amber-3"
                class="q-ml-xs text-weight-bold"
              >
                <q-icon name="apps" size="13px" class="q-mr-xs" />
                {{ applicationName(invoice) }}
              </q-badge>
            </div>

            <div class="row items-center q-gutter-xs">
              <q-badge
                rounded
                :color="getInvoiceStatus(invoice.status).color"
                :label="getInvoiceStatus(invoice.status).label"
                class="text-weight-bold q-px-sm"
              />
              <q-btn
                flat
                round
                dense
                color="warning"
                icon="visibility"
                aria-label="Detail invoice"
                @click="$emit('detail', invoice)"
              >
                <q-tooltip>Lihat Detail & Checkout</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Card Content Body (Grid Responsif 4 Kolom) -->
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
              <!-- Kolom 1: Pelanggan & Paket -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="field-label">PELANGGAN</div>
                <div
                  class="field-value text-weight-bold text-brown-9 row items-center"
                >
                  <q-icon
                    name="person"
                    size="16px"
                    class="q-mr-xs text-grey-7"
                  />
                  {{ invoice.customer?.name || '—' }}
                </div>

                <div class="field-label q-mt-sm">PAKET LANGGANAN</div>
                <div class="field-value row items-center text-weight-medium">
                  <q-icon
                    name="inventory_2"
                    size="15px"
                    class="q-mr-xs text-warning"
                  />
                  {{ invoice.plan?.name || '—' }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ invoice.period_count || 1 }} periode ({{
                    invoice.duration_days
                  }}
                  hari)
                </div>
              </div>

              <!-- Kolom 2: Nominal, Diskon & Referral -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="field-label">TOTAL TAGIHAN</div>
                <div class="text-h6 text-weight-bolder text-brown-9">
                  {{
                    formatSubscriptionPrice(
                      invoice.pricing?.final_price ?? invoice.amount,
                      invoice.currency
                    )
                  }}
                </div>
                <div
                  v-if="
                    invoice.pricing?.normal_price &&
                    invoice.pricing?.normal_price !==
                      (invoice.pricing?.final_price ?? invoice.amount)
                  "
                  class="text-caption text-grey-6 text-strike"
                >
                  Normal:
                  {{
                    formatSubscriptionPrice(
                      invoice.pricing?.normal_price,
                      invoice.currency
                    )
                  }}
                </div>
                <div
                  v-if="
                    invoice.pricing?.discount_amount &&
                    parseFloat(invoice.pricing?.discount_amount) > 0
                  "
                  class="text-caption text-positive text-weight-bold row items-center"
                >
                  <q-icon name="local_offer" size="13px" class="q-mr-xs" />
                  Diskon:
                  {{
                    formatSubscriptionPrice(
                      invoice.pricing?.discount_amount,
                      invoice.currency
                    )
                  }}
                </div>
                <div
                  v-if="referralName(invoice) !== '—'"
                  class="text-caption text-grey-8 q-mt-xs"
                >
                  <q-icon
                    name="loyalty"
                    size="13px"
                    class="q-mr-xs text-amber-9"
                  />
                  Ref: {{ referralName(invoice) }}
                </div>
              </div>

              <!-- Kolom 3: Tanggal (Issued, Due, Paid) -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="field-label">TANGGAL</div>
                <div class="text-caption text-grey-8">
                  Diterbitkan:
                  <strong>{{
                    formatSubscriptionDate(invoice.issued_at)
                  }}</strong>
                </div>
                <div class="text-caption text-grey-8 q-mt-xs">
                  Jatuh tempo:
                  <strong>{{ formatSubscriptionDate(invoice.due_at) }}</strong>
                </div>
                <div
                  v-if="invoice.paid_at"
                  class="text-caption text-positive text-weight-bold q-mt-xs"
                >
                  Dibayar: {{ formatSubscriptionDate(invoice.paid_at) }}
                </div>
              </div>

              <!-- Kolom 4: Provider & Transaksi Checkout Aktual -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="field-label">PROVIDER & TRANSAKSI AKTUAL</div>

                <!-- Jika belum checkout -->
                <div v-if="!getLatestAttempt(invoice)" class="q-mt-xs">
                  <q-badge
                    color="grey-3"
                    text-color="grey-8"
                    class="q-pa-xs text-weight-medium"
                  >
                    <q-icon name="help_outline" size="14px" class="q-mr-xs" />
                    Belum memilih gateway
                  </q-badge>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    Transaksi checkout belum dibuat.
                  </div>
                </div>

                <!-- Jika sudah pernah checkout -->
                <div v-else class="q-mt-xs">
                  <div class="row items-center q-gutter-xs">
                    <!-- Badge Provider Aktual -->
                    <q-badge
                      v-if="getLatestAttempt(invoice).provider === 'midtrans'"
                      color="brown-9"
                      text-color="warning"
                      class="text-weight-bold"
                    >
                      <q-icon name="payments" size="13px" class="q-mr-xs" />
                      Midtrans Sandbox
                    </q-badge>
                    <q-badge
                      v-else-if="getLatestAttempt(invoice).provider === 'dana'"
                      color="primary"
                      text-color="white"
                      class="text-weight-bold"
                    >
                      <q-icon
                        name="account_balance_wallet"
                        size="13px"
                        class="q-mr-xs"
                      />
                      DANA Sandbox
                    </q-badge>
                    <q-badge
                      v-else-if="getLatestAttempt(invoice).provider === 'doku'"
                      color="dark"
                      text-color="warning"
                      class="text-weight-bold"
                    >
                      <q-icon
                        name="account_balance"
                        size="13px"
                        class="q-mr-xs"
                      />
                      DOKU Sandbox
                    </q-badge>
                    <q-badge v-else color="grey-7">
                      {{ getLatestAttempt(invoice).provider }}
                    </q-badge>

                    <!-- Status Percobaan Terkini -->
                    <q-badge
                      rounded
                      outline
                      :color="
                        getPaymentAttemptStatus(
                          getLatestAttempt(invoice).status
                        ).color
                      "
                      :label="
                        getPaymentAttemptStatus(
                          getLatestAttempt(invoice).status
                        ).label
                      "
                    />
                  </div>

                  <!-- Metode Pembayaran Aktual -->
                  <div
                    class="text-caption text-weight-bold text-brown-9 q-mt-xs"
                  >
                    Metode: {{ formatPaymentMethod(getLatestAttempt(invoice)) }}
                  </div>

                  <!-- Indikator Percobaan -->
                  <div
                    v-if="invoice.payment_attempts?.length > 1"
                    class="text-caption text-grey-7 q-mt-xs"
                  >
                    Percobaan #{{
                      getLatestAttempt(invoice).attempt_number
                    }}
                    (total {{ invoice.payment_attempts.length }} transaksi)
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Riwayat Percobaan Pembayaran Lengkap jika ada > 1 attempt -->
          <q-separator
            v-if="invoice.payment_attempts?.length > 1"
            color="amber-2"
          />
          <q-expansion-item
            v-if="invoice.payment_attempts?.length > 1"
            dense
            dense-toggle
            expand-separator
            class="history-expansion"
            :label="`Lihat Riwayat Lengkap (${invoice.payment_attempts.length} Percobaan)`"
            header-class="text-caption text-brown-9 text-weight-bold"
          >
            <q-list dense separator class="q-pa-xs bg-grey-1 rounded-borders">
              <q-item
                v-for="att in invoice.payment_attempts"
                :key="att.id"
                class="q-py-xs"
              >
                <q-item-section>
                  <q-item-label class="text-caption text-weight-bold">
                    Percobaan #{{ att.attempt_number }} ·
                    {{
                      att.provider === 'midtrans'
                        ? 'Midtrans'
                        : att.provider === 'dana'
                          ? 'DANA'
                          : att.provider || '—'
                    }}
                    · {{ formatPaymentMethod(att) }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ formatSubscriptionDate(att.requested_at) }} ·
                    {{ formatSubscriptionPrice(att.amount, att.currency) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    rounded
                    :color="getPaymentAttemptStatus(att.status).color"
                    :label="getPaymentAttemptStatus(att.status).label"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-card>

        <!-- Loading Slot saat Infinite Scroll Mengambil Halaman Berikutnya -->
        <template #loading>
          <div class="row justify-center items-center q-py-md">
            <q-spinner-dots color="warning" size="36px" />
            <span class="text-caption text-grey-7 q-ml-sm">
              Memuat invoice selanjutnya...
            </span>
          </div>
        </template>
      </q-infinite-scroll>

      <!-- Indikator Semua Data Telah Dimuat -->
      <div
        v-if="!store.hasMore && store.items.length > 0"
        class="end-indicator text-center q-py-md text-caption text-grey-7"
      >
        <q-icon
          name="check_circle"
          color="warning"
          size="18px"
          class="q-mr-xs"
        />
        Semua data invoice telah ditampilkan ({{ store.items.length }} dari
        {{ store.totalRows || store.items.length }} invoice).
      </div>

      <!-- Banner Retry jika terjadi error saat load more -->
      <div
        v-if="store.error && store.items.length > 0"
        class="row justify-center q-my-md"
      >
        <q-banner rounded dense class="bg-negative text-white">
          {{ store.error }}
          <template #action>
            <q-btn
              flat
              dense
              no-caps
              label="Coba Lagi (Retry)"
              @click="store.loadMoreInvoices()"
            />
          </template>
        </q-banner>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { useInvoiceStore } from '@/stores/invoice'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice,
  getInvoiceStatus,
  getPaymentAttemptStatus
} from '@/utils/subscription'

const props = defineProps({
  applications: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] }
})

defineEmits(['detail'])

const store = useInvoiceStore()
const infiniteScrollRef = ref(null)

const sortOptions = [
  {
    label: 'Terbaru Dibuat',
    value: 'created_at_desc',
    sortBy: 'created_at',
    descending: true
  },
  {
    label: 'Terlama Dibuat',
    value: 'created_at_asc',
    sortBy: 'created_at',
    descending: false
  },
  {
    label: 'Jatuh Tempo Terdekat',
    value: 'due_at_asc',
    sortBy: 'due_at',
    descending: false
  },
  {
    label: 'Nominal Tertinggi',
    value: 'amount_desc',
    sortBy: 'amount',
    descending: true
  },
  {
    label: 'Nominal Terendah',
    value: 'amount_asc',
    sortBy: 'amount',
    descending: false
  },
  {
    label: 'Nomor Invoice (A-Z)',
    value: 'invoice_number_asc',
    sortBy: 'invoice_number',
    descending: false
  },
  {
    label: 'Nomor Invoice (Z-A)',
    value: 'invoice_number_desc',
    sortBy: 'invoice_number',
    descending: true
  }
]

const currentSortOption = computed({
  get() {
    const key = `${store.sortBy || 'created_at'}_${store.descending ? 'desc' : 'asc'}`
    const match = sortOptions.find(o => o.value === key)
    return match ? match.value : 'created_at_desc'
  },
  set(val) {
    const opt = sortOptions.find(o => o.value === val)
    if (opt) {
      store.sortBy = opt.sortBy
      store.descending = opt.descending
      resetScroll()
      store.resetAndFetchInvoices()
    }
  }
})

const onSortChange = val => {
  const opt = sortOptions.find(o => o.value === val)
  if (opt) {
    store.sortBy = opt.sortBy
    store.descending = opt.descending
    resetScroll()
    store.resetAndFetchInvoices()
  }
}

const onInfiniteLoad = (index, done) => {
  store.loadMoreInvoices(done)
}

const resetScroll = () => {
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
    infiniteScrollRef.value.resume()
  }
}

defineExpose({
  resetScroll
})

const applicationName = invoice => {
  const applicationId =
    invoice.customer?.application_id || invoice.plan?.application_id
  return (
    props.applications.find(application => application.id === applicationId)
      ?.name || '—'
  )
}

const referralName = invoice => {
  const { referral_partner_name: partnerName, referral_code: referralCode } =
    invoice.pricing || {}

  if (partnerName && referralCode) return `${partnerName} (${referralCode})`
  return partnerName || referralCode || '—'
}

const getLatestAttempt = invoice => {
  const attempts = invoice.payment_attempts
  if (!Array.isArray(attempts) || attempts.length === 0) return null
  return [...attempts].sort((a, b) => b.attempt_number - a.attempt_number)[0]
}

const paymentMethodLabels = {
  dana_wallet: 'DANA Wallet',
  qris: 'QRIS',
  va_bca: 'VA BCA',
  va_bni: 'VA BNI',
  va_bri: 'VA BRI',
  va_permata: 'VA Permata',
  va_mandiri: 'Mandiri Bill',
  echannel: 'Mandiri Bill',
  bank_transfer: 'Virtual Account',
  gopay: 'GoPay',
  va_pani: 'VA PANI',
  va_cimb: 'VA CIMB',
  va_btpn: 'VA BTPN'
}

const formatPaymentMethod = attempt => {
  if (!attempt) return '—'
  const method =
    attempt.metadata?.payment_method || attempt.payment_method || ''
  return paymentMethodLabels[method] || method || '—'
}
</script>

<style scoped>
.table-card {
  border-color: #ecd29b;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(32, 24, 11, 0.04);
}
.bg-dark-toolbar {
  background: linear-gradient(135deg, #1b1610 0%, #282015 100%);
}
.invoice-infinite-scroll {
  border-radius: 8px;
}
.invoice-item-card {
  border: 1px solid #ebd9b5;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.2s ease;
}
.invoice-item-card:hover {
  border-color: #e5b842;
  box-shadow: 0 4px 12px rgba(184, 137, 36, 0.08);
}
.card-header-bar {
  background: linear-gradient(90deg, #1f1a14 0%, #2c241a 100%);
  border-left: 4px solid #f2c037;
  border-top-left-radius: 11px;
  border-top-right-radius: 11px;
}
.invoice-number {
  font-family: monospace;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
}
.field-label {
  color: #8c7853;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 2px;
}
.field-value {
  color: #20180b;
  font-size: 0.88rem;
}
.history-expansion {
  background: #fffdf9;
  border-top: 1px solid #faedd5;
}
.sort-select {
  min-width: 190px;
}
.end-indicator {
  border-top: 1px dashed #ebd9b5;
  margin-top: 8px;
}
</style>
