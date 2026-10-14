<template>
  <q-dialog v-model="store.detailDialogOpen"
    ><q-card v-if="customer" class="detail-dialog">
      <q-card-section class="row items-start justify-between"
        ><div
          ><p class="eyebrow">DATA DEMO</p><h2>{{ customer.name }}</h2
          ><p>{{ customer.application }}</p></div
        ><q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.detailDialogOpen = false"
      /></q-card-section>
      <q-separator /><q-list separator
        ><q-item v-for="item in details" :key="item.label"
          ><q-item-section
            ><q-item-label caption>{{ item.label }}</q-item-label
            ><q-item-label>{{ item.value }}</q-item-label></q-item-section
          ></q-item
        ></q-list
      >
      <q-card-actions align="right"
        ><q-btn
          flat
          no-caps
          label="Tutup"
          @click="store.detailDialogOpen = false"
      /></q-card-actions> </q-card
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
        { label: 'ID eksternal', value: customer.value.externalId },
        { label: 'Email', value: customer.value.email },
        { label: 'Nomor telepon', value: customer.value.phone },
        {
          label: 'Status',
          value:
            { active: 'Aktif', pending: 'Menunggu', inactive: 'Tidak aktif' }[
              customer.value.status
            ] || customer.value.status
        },
        {
          label: 'Tanggal terdaftar',
          value: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
            new Date(customer.value.createdAt)
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
