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
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useLanggananPelangganStore } from '@/stores/langgananpelanggan'
import {
  formatSubscriptionDate,
  getDatabaseStatus,
  getPeriodStatus
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
</style>
