<template>
  <q-dialog v-model="store.detailDialogOpen"
    ><q-card v-if="application" class="detail-dialog">
      <q-card-section class="row items-start justify-between"
        ><div
          ><p class="eyebrow">DATA DEMO</p><h2>{{ application.name }}</h2
          ><p>{{ application.code }}</p></div
        ><q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.detailDialogOpen = false"
      /></q-card-section>
      <q-separator />
      <q-list separator
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
import { useAplikasiStore } from '@/stores/aplikasi'
const store = useAplikasiStore()
const application = computed(() => store.selectedApplication)
const details = computed(() =>
  application.value
    ? [
        { label: 'URL aplikasi', value: application.value.url },
        { label: 'Deskripsi', value: application.value.description },
        {
          label: 'Status',
          value: application.value.status === 'active' ? 'Aktif' : 'Tidak aktif'
        },
        {
          label: 'Tanggal terdaftar',
          value: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
            new Date(application.value.createdAt)
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
