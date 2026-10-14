<template>
  <q-dialog v-model="store.formDialogOpen" persistent
    ><q-card class="form-dialog">
      <q-card-section class="row items-center justify-between"
        ><div
          ><p class="eyebrow">DATA DEMO</p
          ><h2>{{
            store.formMode === 'edit' ? 'Ubah pelanggan' : 'Tambah pelanggan'
          }}</h2></div
        ><q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.formDialogOpen = false"
      /></q-card-section>
      <q-separator />
      <q-form @submit="store.saveDemoCustomer"
        ><q-card-section class="q-gutter-md">
          <q-select
            v-model="store.form.application"
            outlined
            dense
            label="Aplikasi"
            :options="store.applications"
            :rules="[required]"
          />
          <q-input
            v-model="store.form.name"
            outlined
            dense
            label="Nama pelanggan"
            :rules="[required]"
          />
          <q-input
            v-model="store.form.externalId"
            outlined
            dense
            label="ID pelanggan pada aplikasi"
            :rules="[required]"
          />
          <q-input
            v-model="store.form.email"
            outlined
            dense
            type="email"
            label="Email"
            :rules="[required]"
          />
          <q-input
            v-model="store.form.phone"
            outlined
            dense
            type="tel"
            label="Nomor telepon"
            :rules="[required]"
          />
          <q-select
            v-model="store.form.status"
            outlined
            dense
            emit-value
            map-options
            label="Status"
            :options="statusOptions"
          /> </q-card-section
        ><q-separator /><q-card-actions align="right" class="q-pa-md"
          ><q-btn
            flat
            no-caps
            label="Batal"
            @click="store.formDialogOpen = false" /><q-btn
            color="warning"
            text-color="dark"
            no-caps
            type="submit"
            :label="
              store.formMode === 'edit'
                ? 'Simpan perubahan demo'
                : 'Tambah data demo'
            " /></q-card-actions
      ></q-form> </q-card
  ></q-dialog>
</template>

<script setup>
import { usePelangganAplikasiStore } from '@/stores/pelangganaplikasi'
const store = usePelangganAplikasiStore()
const required = value => !!value || 'Wajib diisi.'
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Tidak aktif', value: 'inactive' }
]
</script>

<style scoped>
.form-dialog {
  width: min(560px, 96vw);
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
</style>
