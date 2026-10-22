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
      ><q-list v-else-if="customer" separator
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
        { label: 'Status sinkronisasi', value: customer.value.sync_status },
        {
          label: 'Sinkronisasi terakhir',
          value: customer.value.last_synced_at || '-'
        },
        { label: 'Error sinkronisasi', value: customer.value.sync_error_code },
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
</script>
<style scoped>
.detail-dialog {
  width: min(500px, 96vw);
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
</style>
