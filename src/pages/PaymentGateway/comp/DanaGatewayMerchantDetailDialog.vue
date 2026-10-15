<template>
  <q-dialog v-model="store.detailDialogOpen">
    <q-card class="detail-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">DANA GATEWAY</p>
          <h2>Detail merchant</h2>
        </div>
        <q-btn v-close-popup flat round dense icon="close" aria-label="Tutup" />
      </q-card-section>
      <q-separator />

      <q-card-section v-if="store.detailLoading" class="q-gutter-y-sm">
        <q-skeleton type="text" />
        <q-skeleton type="text" />
        <q-skeleton type="text" />
        <q-skeleton type="text" />
      </q-card-section>

      <q-card-section v-else-if="store.selectedMerchant" class="q-gutter-y-md">
        <div class="detail-row">
          <span>Nama merchant</span>
          <strong>{{ store.selectedMerchant.merchant_name }}</strong>
        </div>
        <div class="detail-row">
          <span>Kode merchant</span>
          <strong>{{ store.selectedMerchant.merchant_code }}</strong>
        </div>
        <div class="detail-row">
          <span>Environment</span>
          <q-badge
            :color="
              store.selectedMerchant.environment === 'production'
                ? 'deep-orange'
                : 'blue-grey'
            "
          >
            {{ store.selectedMerchant.environment }}
          </q-badge>
        </div>
        <div class="detail-row">
          <span>Status provisioning</span>
          <q-badge color="positive">
            {{ labelFor(store.selectedMerchant.provisioning_status) }}
          </q-badge>
        </div>
        <div class="detail-row">
          <span>Bootstrap credential</span>
          <q-badge color="warning" text-color="dark">
            {{ labelFor(store.selectedMerchant.credential_status) }}
          </q-badge>
        </div>
        <div class="detail-row">
          <span>Konfigurasi DANA</span>
          <q-badge color="warning" text-color="dark">
            {{ labelFor(store.selectedMerchant.dana_configuration_status) }}
          </q-badge>
        </div>
        <div class="detail-row">
          <span>Diproses</span>
          <strong>{{
            formatDate(store.selectedMerchant.provisioned_at)
          }}</strong>
        </div>
        <q-banner dense class="bootstrap-notice">
          Merchant belum siap checkout sampai bootstrap credential dan
          konfigurasi DANA diselesaikan oleh administrator server.
        </q-banner>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat color="warning" label="Tutup" no-caps />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'

const store = useDanaGatewayMerchantStore()

function labelFor(value) {
  return value ? value.replaceAll('_', ' ') : 'Tidak diketahui'
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<style scoped>
.detail-dialog {
  width: min(620px, 96vw);
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
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  font-size: 0.9rem;
}
.detail-row span {
  color: #746b5c;
}
.detail-row strong {
  overflow-wrap: anywhere;
  text-align: right;
}
.bootstrap-notice {
  border: 1px solid #e4c56c;
  background: #fff8dc;
  color: #5d4710;
  font-size: 0.82rem;
}
</style>
