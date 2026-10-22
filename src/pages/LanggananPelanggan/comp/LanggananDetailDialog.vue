<template>
  <q-dialog v-model="store.detailDialogOpen">
    <q-card class="detail-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">DETAIL LANGGANAN</p>
          <h2>Langganan pelanggan</h2>
        </div>
        <q-btn flat round dense icon="close" aria-label="Tutup" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="store.detailLoading" class="q-pa-xl text-center">
        <q-spinner color="warning" size="32px" />
      </q-card-section>
      <q-card-section
        v-else-if="store.selectedSubscription"
        class="q-gutter-y-md"
      >
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <p class="label">Aplikasi</p>
            <p class="value">{{ applicationName }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Pelanggan</p>
            <p class="value">{{ subscription.customer?.name || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Paket</p>
            <p class="value">{{ subscription.plan?.name || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Kode paket</p>
            <p class="value">{{ subscription.plan?.code || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Tanggal mulai</p>
            <p class="value">{{
              formatSubscriptionDate(subscription.starts_at)
            }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Tanggal berakhir</p>
            <p class="value">{{
              formatSubscriptionDate(subscription.expires_at)
            }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status data</p>
            <q-badge
              rounded
              :color="getDatabaseStatus(subscription.status).color"
              :label="getDatabaseStatus(subscription.status).label"
            />
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status masa aktif</p>
            <q-badge
              rounded
              :color="getPeriodStatus(subscription.expires_at).color"
              :label="getPeriodStatus(subscription.expires_at).label"
            />
          </div>
        </div>
        <q-separator />
        <section v-if="subscription.period_events?.length">
          <p class="section-title">Riwayat perpanjangan</p>
          <q-list bordered separator class="history-list">
            <q-item v-for="event in subscription.period_events" :key="event.id">
              <q-item-section>
                <q-item-label>{{
                  event.event_type || 'Perpanjangan'
                }}</q-item-label>
                <q-item-label caption>
                  Sebelumnya
                  {{ formatSubscriptionDate(event.previous_expires_at) }} →
                  terbaru {{ formatSubscriptionDate(event.new_expires_at) }}
                </q-item-label>
                <q-item-label caption>
                  {{ formatSubscriptionDate(event.created_at) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </section>
        <section v-if="subscription.invoices?.length">
          <p class="section-title">Invoice dan pembayaran terkait</p>
          <q-list bordered separator class="history-list">
            <q-item v-for="invoice in subscription.invoices" :key="invoice.id">
              <q-item-section>
                <q-item-label>{{ invoice.invoice_number }}</q-item-label>
                <q-item-label caption>
                  {{
                    formatSubscriptionPrice(invoice.amount, invoice.currency)
                  }}
                  ·
                  {{
                    formatSubscriptionDate(invoice.paid_at || invoice.due_at)
                  }}
                </q-item-label>
                <q-item-label
                  v-for="attempt in invoice.payment_attempts || []"
                  :key="attempt.id"
                  caption
                >
                  {{ attempt.provider }} ·
                  {{ getPaymentAttemptStatus(attempt.status).label }}
                  <span v-if="attempt.reconciliation">
                    ·
                    {{
                      getReconciliationStatus(attempt.reconciliation.status)
                        .label
                    }}
                  </span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  rounded
                  :color="getInvoiceStatus(invoice.status).color"
                  :label="getInvoiceStatus(invoice.status).label"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </section>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useLanggananPelangganStore } from '@/stores/langgananpelanggan'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice,
  getDatabaseStatus,
  getInvoiceStatus,
  getPaymentAttemptStatus,
  getPeriodStatus,
  getReconciliationStatus
} from '@/utils/subscription'

const store = useLanggananPelangganStore()
const subscription = computed(() => store.selectedSubscription || {})
const applicationName = computed(() =>
  store.applicationName(subscription.value)
)
</script>

<style scoped>
.detail-dialog {
  width: min(650px, 96vw);
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
}
.section-title {
  margin: 0 0 6px;
  color: #746b5c;
  font-size: 0.75rem;
  font-weight: 700;
}
.history-list {
  border-color: #e0d7c6;
  border-radius: 10px;
}
</style>
