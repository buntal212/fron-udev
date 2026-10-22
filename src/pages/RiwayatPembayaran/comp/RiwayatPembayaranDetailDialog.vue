<template>
  <q-dialog v-model="store.detailDialogOpen">
    <q-card class="detail-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">DETAIL PEMBAYARAN</p>
          <h2>Percobaan #{{ attempt.attempt_number || '—' }}</h2>
        </div>
        <q-btn flat round dense icon="close" aria-label="Tutup" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="store.detailLoading" class="q-pa-xl text-center">
        <q-spinner color="warning" size="32px" />
      </q-card-section>
      <q-card-section v-else-if="store.selectedAttempt" class="q-gutter-y-md">
        <q-banner
          v-if="store.syncError"
          rounded
          class="sync-banner sync-banner--error"
        >
          <template #avatar><q-icon name="error_outline" /></template>
          {{ store.syncError }}
        </q-banner>
        <q-banner
          v-if="store.retryCheckoutError"
          rounded
          class="sync-banner sync-banner--error"
        >
          <template #avatar><q-icon name="error_outline" /></template>
          {{ store.retryCheckoutError }}
        </q-banner>
        <q-banner
          v-if="store.recoverSubscriptionError"
          rounded
          class="sync-banner sync-banner--error"
        >
          <template #avatar><q-icon name="error_outline" /></template>
          {{ store.recoverSubscriptionError }}
        </q-banner>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <p class="label">Nomor invoice</p>
            <p class="value">{{ attempt.invoice?.invoice_number || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Provider</p>
            <p class="value">{{ attempt.provider || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Nominal</p>
            <p class="value">
              {{ formatSubscriptionPrice(attempt.amount, attempt.currency) }}
            </p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Referensi merchant</p>
            <p class="value">{{ attempt.merchant_reference || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Referensi provider</p>
            <p class="value">{{ attempt.provider_reference || '—' }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Diminta</p>
            <p class="value">{{
              formatSubscriptionDate(attempt.requested_at)
            }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Selesai</p>
            <p class="value">{{
              formatSubscriptionDate(attempt.completed_at)
            }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status payment attempt</p>
            <q-badge
              rounded
              :color="getPaymentAttemptStatus(attempt.status).color"
              :label="getPaymentAttemptStatus(attempt.status).label"
            />
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status invoice</p>
            <q-badge
              rounded
              :color="getInvoiceStatus(attempt.invoice?.status).color"
              :label="getInvoiceStatus(attempt.invoice?.status).label"
            />
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status subscription</p>
            <q-badge
              rounded
              :color="
                getDatabaseStatus(attempt.invoice?.subscription?.status).color
              "
              :label="
                getDatabaseStatus(attempt.invoice?.subscription?.status).label
              "
            />
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status rekonsiliasi</p>
            <q-badge
              rounded
              outline
              :color="reconciliationStatus.color"
              :label="reconciliationStatus.label"
            />
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Status outbox checkout</p>
            <p class="value">
              {{ attempt.checkout?.status || 'â€”' }}
              <span v-if="attempt.checkout?.error_code">
                Â· {{ attempt.checkout.error_code }}
              </span>
            </p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Sinkronisasi terakhir</p>
            <p class="value">
              {{
                formatSubscriptionDate(attempt.reconciliation?.last_synced_at)
              }}
            </p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Percobaan sinkronisasi</p>
            <p class="value">{{ attempt.reconciliation?.attempts || 0 }}</p>
          </div>
          <div class="col-12 col-sm-6">
            <p class="label">Kode kesalahan aman</p>
            <p class="value">{{ attempt.reconciliation?.error_code || '—' }}</p>
          </div>
          <div v-if="attempt.failure_message" class="col-12">
            <p class="label">Keterangan kegagalan</p>
            <p class="value">{{ attempt.failure_message }}</p>
          </div>
        </div>

        <q-banner v-if="attempt.settlement" rounded class="sync-banner">
          <template #avatar><q-icon name="verified" /></template>
          Settlement
          {{
            formatSubscriptionPrice(
              attempt.settlement.amount,
              attempt.settlement.currency
            )
          }}
          diterapkan pada
          {{ formatSubscriptionDate(attempt.settlement.allocated_at) }}.
        </q-banner>

        <section v-if="attempt.settlement_history?.length">
          <p class="section-title">Riwayat settlement</p>
          <q-list bordered separator class="history-list">
            <q-item
              v-for="event in attempt.settlement_history"
              :key="`${event.event_type}-${event.processed_at}`"
            >
              <q-item-section>
                <q-item-label>{{
                  event.event_type || 'Settlement pembayaran'
                }}</q-item-label>
                <q-item-label caption>
                  {{ formatSubscriptionDate(event.processed_at) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  rounded
                  :color="
                    event.status === 'completed' ? 'positive' : 'negative'
                  "
                  :label="event.status"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </section>

        <q-card-actions align="between" class="q-px-none">
          <q-btn
            v-if="canRecoverSubscription"
            outline
            color="warning"
            icon="autorenew"
            label="Pulihkan Langganan"
            no-caps
            :loading="store.recoverSubscriptionLoading"
            :disable="
              store.recoverSubscriptionLoading || recoverSubscriptionBlocked
            "
            @click="store.recoverSubscriptionSelected"
          />
          <q-btn
            v-if="canRetryCheckout"
            outline
            color="warning"
            icon="replay"
            label="Coba Checkout Lagi"
            no-caps
            :loading="store.retryCheckoutLoading"
            :disable="store.retryCheckoutLoading || retryCheckoutBlocked"
            @click="store.retryCheckoutSelected"
          />
          <q-btn
            v-if="canSynchronize"
            outline
            color="warning"
            icon="sync"
            label="Sinkronkan Ulang"
            no-caps
            :loading="store.syncLoading"
            :disable="store.syncLoading || syncBlocked"
            @click="store.synchronizeSelected"
          />
          <q-space v-else />
          <q-btn flat color="grey-7" label="Tutup" no-caps v-close-popup />
        </q-card-actions>
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
  getDatabaseStatus,
  getInvoiceStatus,
  getPaymentAttemptStatus,
  getReconciliationStatus
} from '@/utils/subscription'

const store = useRiwayatPembayaranStore()
const attempt = computed(() => store.selectedAttempt || {})
const reconciliationStatus = computed(() =>
  getReconciliationStatus(attempt.value.reconciliation?.status)
)
const canSynchronize = computed(
  () =>
    ['initiated', 'pending'].includes(attempt.value.status) ||
    ['retryable', 'failed'].includes(attempt.value.reconciliation?.status)
)
const canRetryCheckout = computed(
  () =>
    ['initiated', 'pending'].includes(attempt.value.status) &&
    attempt.value.invoice?.status === 'pending' &&
    attempt.value.checkout?.status === 'failed'
)
const canRecoverSubscription = computed(
  () =>
    attempt.value.invoice?.status === 'paid' &&
    !attempt.value.invoice?.subscription &&
    Boolean(attempt.value.settlement) &&
    attempt.value.settlement_history?.some(
      event => event.status === 'completed'
    )
)
const recoverSubscriptionBlocked = computed(
  () => Date.now() < store.recoverSubscriptionBlockedUntil
)
const retryCheckoutBlocked = computed(
  () => Date.now() < store.retryCheckoutBlockedUntil
)
const syncBlocked = computed(() => Date.now() < store.syncBlockedUntil)
</script>

<style scoped>
.detail-dialog {
  width: min(760px, 96vw);
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
  overflow-wrap: anywhere;
}
.sync-banner {
  border: 1px solid #e0c37c;
  background: #fff8e4;
  color: #4b3813;
}
.sync-banner--error {
  border-color: #e8b4ad;
  background: #fff1f1;
  color: #7b2222;
}
.history-list {
  border-color: #e0d7c6;
  border-radius: 10px;
}
</style>
