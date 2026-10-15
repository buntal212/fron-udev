<template>
  <q-dialog v-model="store.detailDialogOpen">
    <q-card class="detail-dialog">
      <q-card-section class="row items-center justify-between"
        ><div
          ><p class="eyebrow">DETAIL PEMBAYARAN</p
          ><h2>Percobaan #{{ attempt.attempt_number || '—' }}</h2></div
        ><q-btn flat round dense icon="close" aria-label="Tutup" v-close-popup
      /></q-card-section>
      <q-separator />
      <q-card-section v-if="store.detailLoading" class="q-pa-xl text-center"
        ><q-spinner color="warning" size="32px"
      /></q-card-section>
      <q-card-section v-else-if="store.selectedAttempt" class="q-gutter-y-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6"
            ><p class="label">Nomor invoice</p
            ><p class="value">{{
              attempt.invoice?.invoice_number || '—'
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Provider</p
            ><p class="value">{{ attempt.provider || '—' }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Nominal</p
            ><p class="value">{{
              formatSubscriptionPrice(attempt.amount, attempt.currency)
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Referensi merchant</p
            ><p class="value">{{ attempt.merchant_reference || '—' }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Referensi provider</p
            ><p class="value">{{ attempt.provider_reference || '—' }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Diminta</p
            ><p class="value">{{
              formatSubscriptionDate(attempt.requested_at)
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Selesai</p
            ><p class="value">{{
              formatSubscriptionDate(attempt.completed_at)
            }}</p></div
          >
          <div class="col-12 col-sm-6"
            ><p class="label">Status</p
            ><q-badge
              rounded
              :color="getPaymentAttemptStatus(attempt.status).color"
              :label="getPaymentAttemptStatus(attempt.status).label"
          /></div>
          <div v-if="attempt.failure_message" class="col-12"
            ><p class="label">Keterangan kegagalan</p
            ><p class="value">{{ attempt.failure_message }}</p></div
          >
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRiwayatPembayaranStore } from '@/stores/riwayatpembayaran'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice,
  getPaymentAttemptStatus
} from '@/utils/subscription'

const store = useRiwayatPembayaranStore()
const attempt = computed(() => store.selectedAttempt || {})
</script>

<style scoped>
.detail-dialog {
  width: min(680px, 96vw);
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
.label {
  margin: 0 0 4px;
  color: #746b5c;
  font-size: 0.75rem;
  font-weight: 700;
}
.value {
  margin: 0;
  color: #20180b;
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}
</style>
