<template>
  <q-dialog v-model="store.detailDialogOpen">
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
            ><p class="value">{{ invoice.period_count || 1 }} periode ({{ invoice.duration_days }} hari)</p></div
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
              Berakhir {{ formatSubscriptionDate(invoice.subscription.expires_at) }}
              <q-badge
                rounded
                class="q-ml-xs"
                :color="invoice.subscription.status === 'active' ? 'positive' : 'grey-7'"
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
        <q-banner v-if="canStartCheckout" rounded class="checkout-banner">
          <template #avatar><q-icon name="account_balance_wallet" /></template>
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-12 col-sm">
              <strong>Siap membayar melalui DANA Sandbox?</strong>
              <div class="text-caption q-mt-xs">
                Tautan checkout berasal dari backend. Status lunas hanya berubah
                setelah pembayaran diverifikasi.
              </div>
            </div>
            <div class="col-12 col-sm-auto">
              <q-btn
                color="warning"
                text-color="dark"
                icon="payments"
                label="Bayar melalui DANA Sandbox"
                no-caps
                :loading="store.checkoutLoading"
                :disable="store.checkoutLoading"
                @click="store.startCheckout"
              />
            </div>
          </div>
        </q-banner>

        <!-- Admin Sandbox Testing & Controls Panel -->
        <q-card flat bordered class="q-pa-md test-panel rounded-borders q-mt-sm">
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-weight-bold text-brown-9 row items-center">
              <q-icon name="science" class="q-mr-xs text-warning" size="20px" />
              Kontrol Pengujian Admin UDEV (DANA Sandbox)
            </div>
            <q-badge color="dark" text-color="warning" label="Sandbox UAT" />
          </div>
          <p class="section-description q-mb-sm">
            Kontrol pengujian end-to-end: Lakukan checkout dan bayar melalui DANA Sandbox, lalu sinkronkan status untuk verifikasi gateway resmi. Settlement operasional hanya diproses dari konfirmasi gateway DANA yang valid.
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
          <q-banner v-if="store.simulateMessage" rounded dense class="bg-positive text-white q-mt-sm">
            {{ store.simulateMessage }}
          </q-banner>
          <q-banner v-if="store.simulateError || store.reconcileError" rounded dense class="bg-negative text-white q-mt-sm">
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
          <p class="section-title">Riwayat aktivasi dan perpanjangan langganan</p>
          <q-list bordered separator class="attempt-list">
            <q-item
              v-for="evt in invoice.subscription.period_events"
              :key="evt.id"
            >
              <q-item-section>
                <q-item-label class="text-weight-bold">
                  {{ evt.event_type === 'activation' ? 'Aktivasi Awal Langganan' : 'Perpanjangan Masa Aktif' }}
                </q-item-label>
                <q-item-label caption>
                  <span v-if="evt.previous_expires_at">
                    {{ formatSubscriptionDate(evt.previous_expires_at) }} &rarr; {{ formatSubscriptionDate(evt.new_expires_at) }}
                  </span>
                  <span v-else>
                    Masa aktif berakhir: {{ formatSubscriptionDate(evt.new_expires_at) }}
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
                    :color="evt.event_type === 'activation' ? 'positive' : 'warning'"
                    :text-color="evt.event_type === 'activation' ? 'white' : 'dark'"
                    :label="evt.event_type === 'activation' ? 'Aktivasi' : 'Perpanjangan'"
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
import { computed } from 'vue'
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
const canStartCheckout = computed(
  () =>
    invoice.value.status === 'pending' &&
    !invoice.value.payment_attempts?.some(
      attempt => attempt.status === 'succeeded'
    )
)
</script>

<style scoped>
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
