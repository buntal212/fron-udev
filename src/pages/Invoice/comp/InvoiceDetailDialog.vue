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
</style>
