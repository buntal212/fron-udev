<template>
  <q-dialog v-model="store.detailDialogOpen"
    ><q-card class="detail-dialog"
      ><q-card-section class="row items-start justify-between"
        ><div
          ><p class="eyebrow">MASTER PELANGGAN</p
          ><h2>{{ customer?.name || 'Memuat...' }}</h2
          ><p>{{ customer?.application?.name }}</p></div
        ><q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.detailDialogOpen = false" /></q-card-section
      ><q-separator /><q-card-section v-if="store.detailLoading"
        ><q-spinner color="warning" size="28px" /></q-card-section
      ><q-card-section
        v-else-if="customer && !customer.referral"
        class="referral-panel"
        ><p class="eyebrow">REFERRAL MANUAL</p
        ><div class="text-weight-bold q-mb-sm">Terapkan referral pelanggan</div
        ><q-input
          v-model="store.referralForm.code"
          outlined
          dense
          label="Kode referral"
          placeholder="REF-XXXXXX"
          :error="Boolean(store.referralForm.error)"
          :error-message="store.referralForm.error"
        />
        ><div class="row q-gutter-sm q-mt-sm"
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
            label="Terapkan"
            :loading="store.referralForm.applying"
            @click="store.applyReferral" /></div
        ><div v-if="store.referralForm.preview" class="preview q-mt-sm"
          ><strong>{{ store.referralForm.preview.code }}</strong> ·
          {{ store.referralForm.preview.type === 'khusus' ? 'Khusus' : 'Umum'
          }}<br />Mitra:
          {{ store.referralForm.preview.partner_name || 'Mitra referral'
          }}<br />Diskon
          {{ money(store.referralForm.preview.discount_amount) }} · Harga akhir
          <strong>{{
            money(store.referralForm.preview.customer_price)
          }}</strong></div
        ></q-card-section
      ><q-separator v-if="customer && !customer.referral" /> ><q-list
        v-if="customer && !store.detailLoading"
        separator
        ><q-item v-for="item in details" :key="item.label"
          ><q-item-section
            ><q-item-label caption>{{ item.label }}</q-item-label
            ><q-item-label>{{
              item.value || '-'
            }}</q-item-label></q-item-section
          ></q-item
        ></q-list
      ><q-card-actions align="right"
        ><q-btn
          flat
          no-caps
          label="Tutup"
          @click="store.detailDialogOpen = false" /></q-card-actions></q-card
  ></q-dialog>
</template>
<script setup>
import { computed } from 'vue'
import { usePelangganAplikasiStore } from '@/stores/pelangganaplikasi'
const store = usePelangganAplikasiStore()
const customer = computed(() => store.selectedCustomer)
const details = computed(() =>
  customer.value
    ? [
        { label: 'ID eksternal', value: customer.value.external_customer_id },
        { label: 'Nama pemilik', value: customer.value.owner_name },
        { label: 'Email', value: customer.value.email },
        { label: 'Nomor telepon', value: customer.value.phone_number },
        {
          label: 'Sumber data',
          value:
            customer.value.source === 'integration'
              ? 'Integrasi aplikasi'
              : 'Manual UDEV'
        },
        {
          label: 'Jenis data',
          value: customer.value.is_test ? 'Data uji UAT' : 'Data produksi'
        },
        { label: 'Status sinkronisasi', value: customer.value.sync_status },
        {
          label: 'Sinkronisasi terakhir',
          value: customer.value.last_synced_at || '-'
        },
        { label: 'Error sinkronisasi', value: customer.value.sync_error_code },
        { label: 'Kode referral', value: customer.value.referral?.code },
        {
          label: 'Mitra referral',
          value: customer.value.referral?.partner_name
        },
        { label: 'Jenis referral', value: customer.value.referral?.type },
        {
          label: 'Harga normal referral',
          value: money(customer.value.referral?.base_price)
        },
        {
          label: 'Diskon permanen',
          value: money(customer.value.referral?.discount_amount)
        },
        {
          label: 'Harga terkunci',
          value: money(customer.value.referral?.customer_price)
        },
        {
          label: 'Referral dikunci',
          value: customer.value.referral?.locked_at || '-'
        },
        { label: 'Invoice', value: String(customer.value.invoices_count ?? 0) },
        {
          label: 'Langganan',
          value: String(customer.value.subscriptions_count ?? 0)
        },
        {
          label: 'Status',
          value: customer.value.is_active ? 'Aktif' : 'Tidak aktif'
        },
        {
          label: 'Tanggal terdaftar',
          value: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
            new Date(customer.value.created_at)
          )
        }
      ]
    : []
)
const money = value =>
  value === undefined || value === null
    ? '-'
    : new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(Number(value))
</script>
<style scoped>
.detail-dialog {
  width: min(580px, 96vw);
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
p {
  margin: 2px 0 0;
  color: #746b5c;
  font-size: 0.82rem;
}
.referral-panel {
  background: #fffdf8;
}
.preview {
  padding: 10px;
  border: 1px solid #e5bd62;
  border-radius: 8px;
  background: #fff6dc;
  color: #604b20;
  font-size: 0.82rem;
}
</style>
