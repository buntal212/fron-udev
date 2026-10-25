<template>
  <q-dialog v-model="store.detailDialogOpen">
    <q-card class="detail-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center no-wrap q-gutter-md">
          <div class="customer-mark">{{ initials }}</div>
          <div>
            <p class="eyebrow">DETAIL PELANGGAN</p>
            <h2>{{ customer?.name || 'Memuat...' }}</h2>
            <p class="application-name">{{
              customer?.application?.name || 'UDEV Billing'
            }}</p>
          </div>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-badge
            v-if="customer"
            rounded
            :color="customer.is_active ? 'positive' : 'grey-7'"
            :label="customer.is_active ? 'Aktif' : 'Tidak aktif'"
          />
          <q-btn
            flat
            round
            dense
            icon="close"
            aria-label="Tutup"
            @click="store.detailDialogOpen = false"
          />
        </div>
      </q-card-section>
      <q-separator />
      <div class="dialog-content">
        <q-card-section v-if="store.detailLoading" class="q-pa-xl text-center"
          ><q-spinner color="warning" size="32px"
        /></q-card-section>
        <template v-else-if="customer">
          <q-card-section class="section">
            <SectionTitle eyebrow="IDENTITAS" title="Profil pelanggan" />
            <div class="detail-grid">
              <DetailItem
                label="ID eksternal"
                :value="customer.external_customer_id"
                mono
              />
              <DetailItem label="Nama pemilik" :value="customer.owner_name" />
              <DetailItem label="Email" :value="customer.email" />
              <DetailItem
                label="Nomor telepon"
                :value="customer.phone_number"
              />
              <DetailItem
                label="Terdaftar"
                :value="formatDate(customer.created_at)"
              />
              <DetailItem
                label="Status"
                :value="customer.is_active ? 'Aktif' : 'Tidak aktif'"
              />
            </div>
          </q-card-section>

          <q-card-section class="section section-muted">
            <SectionTitle eyebrow="LANGGANAN" title="Paket & masa aktif" />
            <q-card flat bordered class="summary-card">
              <template v-if="latestSubscription">
                <div class="summary-main">
                  <span>Paket aktif</span
                  ><strong>{{
                    latestSubscription.plan?.name || 'Paket langganan'
                  }}</strong>
                </div>
                <div class="summary-meta"
                  ><span
                    >Mulai {{ formatDate(latestSubscription.starts_at) }}</span
                  ><span
                    >Berakhir
                    {{ formatDate(latestSubscription.expires_at) }}</span
                  ><q-badge
                    outline
                    color="brown-7"
                    :label="latestSubscription.status"
                /></div>
              </template>
              <span v-else class="empty-copy">Belum ada paket aktif.</span>
            </q-card>
          </q-card-section>

          <q-card-section class="section">
            <SectionTitle eyebrow="PROGRAM MITRA" title="Referral" />
            <q-card
              v-if="customer.referral"
              flat
              bordered
              class="summary-card referral-card"
            >
              <div class="summary-main"
                ><span>{{
                  customer.referral.partner_name || 'Mitra referral'
                }}</span
                ><strong>{{ customer.referral.code }}</strong></div
              >
              <div class="summary-meta"
                ><q-badge outline color="brown-7" :label="referralType" /><span
                  >Diskon {{ money(customer.referral.discount_amount) }}</span
                ><span class="final-price"
                  >Harga akhir
                  {{ money(customer.referral.customer_price) }}</span
                ></div
              >
              <div class="lock-note"
                >Terkunci pada
                {{ formatDate(customer.referral.locked_at, true) }}</div
              >
            </q-card>
            <q-card v-else flat bordered class="manual-referral-card">
              <div class="text-weight-bold">Terapkan referral manual</div
              ><p class="card-copy"
                >Validasi kode sebelum mengunci harga pelanggan.</p
              >
              <q-input
                v-model="store.referralForm.code"
                outlined
                dense
                label="Kode referral"
                placeholder="REF-XXXXXX"
                :error="Boolean(store.referralForm.error)"
                :error-message="store.referralForm.error"
              />
              <div class="row q-gutter-sm q-mt-sm"
                ><q-btn
                  outline
                  color="brown-8"
                  no-caps
                  label="Validasi"
                  :loading="store.referralForm.loading"
                  @click="store.validateReferral" /><q-btn
                  v-if="store.referralForm.preview"
                  color="warning"
                  text-color="dark"
                  no-caps
                  label="Terapkan & kunci"
                  :loading="store.referralForm.applying"
                  @click="store.applyReferral"
              /></div>
              <div
                v-if="store.referralForm.preview"
                class="referral-preview q-mt-md"
                ><strong>{{
                  store.referralForm.preview.partner_name || 'Mitra referral'
                }}</strong
                ><span>{{
                  store.referralForm.preview.type === 'khusus'
                    ? 'Khusus'
                    : 'Umum'
                }}</span
                ><span
                  >Diskon
                  {{ money(store.referralForm.preview.discount_amount) }}</span
                ><strong>{{
                  money(store.referralForm.preview.customer_price)
                }}</strong></div
              >
            </q-card>
          </q-card-section>

          <q-card-section class="section section-muted">
            <SectionTitle eyebrow="TRANSAKSI" title="Riwayat pembayaran" />
            <q-expansion-item
              v-model="paymentExpanded"
              dense
              expand-separator
              icon="receipt_long"
              label="Buka timeline pembayaran dan perubahan paket"
              class="timeline-expansion"
            >
              <q-timeline color="warning" layout="dense" class="q-pt-md">
                <q-timeline-entry
                  v-for="event in timeline"
                  :key="event.key"
                  :icon="event.icon"
                  :color="event.color"
                  :title="event.title"
                  :subtitle="event.date"
                  ><div class="timeline-status"
                    ><q-badge
                      outline
                      :color="event.color"
                      :label="event.status" /></div
                  ><p>{{ event.description }}</p
                  ><span v-if="event.tracking" class="tracking-id"
                    >ID tracking: {{ event.tracking }}</span
                  ></q-timeline-entry
                >
                <div v-if="!timeline.length" class="empty-copy"
                  >Belum ada pembayaran atau perubahan paket.</div
                >
              </q-timeline>
            </q-expansion-item>
          </q-card-section>

          <q-card-section class="section">
            <SectionTitle eyebrow="INTEGRASI" title="Sinkronisasi" />
            <div class="sync-row"
              ><div
                ><strong>{{
                  customer.source === 'integration'
                    ? 'Integrasi aplikasi'
                    : 'Manual UDEV'
                }}</strong
                ><p
                  >{{ customer.is_test ? 'Data uji UAT' : 'Data produksi' }} ·
                  terakhir diperbarui
                  {{ formatDate(customer.last_synced_at, true) }}</p
                ></div
              ><q-badge
                outline
                color="brown-7"
                :label="syncLabel(customer.sync_status)"
            /></div>
            <p v-if="customer.sync_error_code" class="sync-error">{{
              customer.sync_error_code
            }}</p>
          </q-card-section>
        </template>
      </div>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md"
        ><q-btn
          flat
          no-caps
          label="Tutup"
          @click="store.detailDialogOpen = false"
      /></q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePelangganAplikasiStore } from '@/stores/pelangganaplikasi'
const store = usePelangganAplikasiStore()
const paymentExpanded = ref(false)
const customer = computed(() => store.selectedCustomer)
const initials = computed(
  () =>
    customer.value?.name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
)
const latestSubscription = computed(
  () =>
    (customer.value?.subscriptions || [])
      .slice()
      .sort((a, b) => new Date(b.expires_at) - new Date(a.expires_at))[0]
)
const referralType = computed(() =>
  customer.value?.referral?.type === 'khusus' ? 'Khusus' : 'Umum'
)
const money = value =>
  value === undefined || value === null
    ? '-'
    : new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(Number(value))
const formatDate = (value, withTime = false) =>
  value
    ? new Intl.DateTimeFormat(
        'id-ID',
        withTime
          ? { dateStyle: 'medium', timeStyle: 'short' }
          : { dateStyle: 'long' }
      ).format(new Date(value))
    : '-'
const syncLabel = status =>
  status === 'synced' ? 'Tersinkron' : status || 'Belum disinkronkan'
const timeline = computed(() => {
  if (!customer.value) return []
  const payments = (customer.value.invoices || []).flatMap(invoice =>
    (invoice.payment_attempts || []).map(attempt => ({
      key: `p-${attempt.id}`,
      icon: attempt.status === 'succeeded' ? 'payments' : 'error_outline',
      color:
        attempt.status === 'succeeded'
          ? 'positive'
          : attempt.status === 'pending'
            ? 'warning'
            : 'negative',
      status: attempt.status,
      title: `Pembayaran ${invoice.invoice_number}`,
      date: formatDate(attempt.completed_at || attempt.requested_at, true),
      description:
        attempt.failure_message ||
        attempt.failure_code ||
        'Menunggu hasil settlement.',
      tracking: attempt.settlement?.id || attempt.gateway_payment_id
    }))
  )
  const periods = (customer.value.subscriptions || []).flatMap(subscription =>
    (subscription.period_events || []).map(event => ({
      key: `s-${event.id}`,
      icon: 'workspace_premium',
      color: 'warning',
      status: event.event_type === 'renewal' ? 'Diperpanjang' : 'Aktif',
      title: 'Paket dan masa aktif diperbarui',
      date: formatDate(event.created_at, true),
      description: `${formatDate(event.previous_expires_at)} → ${formatDate(event.new_expires_at)}`,
      tracking: event.source_id
    }))
  )
  return [...payments, ...periods]
})
const SectionTitle = {
  props: ['eyebrow', 'title'],
  template:
    '<div class="section-title"><p class="eyebrow">{{ eyebrow }}</p><h3>{{ title }}</h3></div>'
}
const DetailItem = {
  props: ['label', 'value', 'mono'],
  template:
    '<div class="detail-item"><span>{{ label }}</span><strong :class="{ mono }">{{ value || \'-\' }}</strong></div>'
}
</script>

<style scoped>
.detail-dialog {
  width: min(900px, 96vw);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  border-radius: 16px;
  overflow: hidden;
}
.dialog-header,
.detail-dialog :deep(.q-card__actions) {
  flex: 0 0 auto;
}
.dialog-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
.dialog-header {
  background: #11100e;
  color: #fff;
  padding: 22px 26px;
}
.customer-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(145deg, #f3cc6e, #b88924);
  color: #17130c;
  font-weight: 800;
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}
h2,
h3 {
  margin: 0;
}
h2 {
  font-size: 1.3rem;
}
.application-name {
  margin: 4px 0 0;
  color: #c8bda9;
  font-size: 0.82rem;
}
.section {
  padding: 22px 26px;
}
.section-muted {
  background: #fffdf8;
}
.section-title {
  margin-bottom: 14px;
}
.section-title h3 {
  color: #20180b;
  font-size: 1rem;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 28px;
}
.detail-item {
  display: grid;
  gap: 3px;
}
.detail-item span,
.card-copy,
.sync-row p,
.lock-note {
  color: #746b5c;
  font-size: 0.78rem;
}
.detail-item strong {
  color: #20180b;
  font-size: 0.88rem;
}
.mono,
.tracking-id {
  font-family: monospace;
}
.summary-card,
.manual-referral-card {
  padding: 16px;
  border-color: #dfd4c0;
  border-radius: 10px;
  background: #fff;
}
.summary-main {
  display: grid;
  gap: 3px;
}
.summary-main span {
  color: #746b5c;
  font-size: 0.78rem;
}
.summary-main strong {
  color: #20180b;
}
.summary-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  color: #746b5c;
  font-size: 0.78rem;
}
.final-price {
  font-weight: 700;
  color: #20180b;
}
.empty-copy {
  color: #746b5c;
  font-size: 0.82rem;
}
.manual-referral-card {
  background: #fffdf8;
}
.card-copy {
  margin: 4px 0 14px;
}
.referral-preview {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px 12px;
  padding: 11px;
  border: 1px solid #e5bd62;
  border-radius: 8px;
  background: #fff6dc;
  color: #604b20;
  font-size: 0.8rem;
}
.timeline-expansion {
  border: 1px solid #dfd4c0;
  border-radius: 10px;
  background: #fff;
  padding: 0 12px;
}
.timeline-status {
  margin-bottom: 4px;
}
.q-timeline p {
  margin: 5px 0;
  color: #746b5c;
  font-size: 0.8rem;
}
.tracking-id {
  color: #8a7c68;
  font-size: 0.72rem;
}
.sync-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.sync-row p {
  margin: 4px 0 0;
}
.sync-error {
  margin: 10px 0 0;
  color: #9a3e3e;
  font-size: 0.78rem;
}
@media (max-width: 599px) {
  .detail-dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    min-height: 0;
    border-radius: 0;
  }
  .dialog-header,
  .section {
    padding: 18px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .sync-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .summary-meta {
    gap: 7px;
  }
}
</style>
