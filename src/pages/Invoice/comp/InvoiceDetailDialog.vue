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
            ><p class="value">{{ invoice.duration_months }} bulan</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Nominal snapshot</p
            ><p class="value">{{
              formatSubscriptionPrice(invoice.amount, invoice.currency)
            }}</p></div
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
              </q-item-section>
              <q-item-section side>
                <q-badge
                  rounded
                  :color="getPaymentAttemptStatus(attempt.status).color"
                  :label="getPaymentAttemptStatus(attempt.status).label"
                />
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
  getPaymentAttemptStatus
} from '@/utils/subscription'

const store = useInvoiceStore()
const invoice = computed(() => store.selectedInvoice || {})
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
</style>
