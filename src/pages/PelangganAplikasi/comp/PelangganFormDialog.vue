<template>
  <q-dialog v-model="store.formDialogOpen" persistent
    ><q-card class="form-dialog"
      ><q-card-section class="row items-center justify-between"
        ><div
          ><p class="eyebrow">MASTER PELANGGAN</p
          ><h2>{{
            store.formMode === 'edit' ? 'Ubah pelanggan' : 'Tambah pelanggan'
          }}</h2></div
        ><q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.formDialogOpen = false" /></q-card-section
      ><q-separator /><q-form @submit="store.saveCustomer"
        ><q-card-section class="q-gutter-md"
          ><q-select
            v-model="store.form.application_id"
            outlined
            dense
            emit-value
            map-options
            label="Aplikasi"
            :options="applicationOptions"
            :rules="[requiredApplication]"
            :error="hasError('application_id')"
            :error-message="errorFor('application_id')" /><q-input
            v-model="store.form.name"
            outlined
            dense
            label="Nama pelanggan"
            :rules="[requiredName]"
            :error="hasError('name')"
            :error-message="errorFor('name')" /><q-input
            v-model="store.form.owner_name"
            outlined
            dense
            label="Nama pemilik (opsional)"
            :error="hasError('owner_name')"
            :error-message="errorFor('owner_name')" /><q-input
            v-model="store.form.external_customer_id"
            outlined
            dense
            label="ID pelanggan pada aplikasi"
            :rules="[requiredExternalCustomerId]"
            :error="hasError('external_customer_id')"
            :error-message="errorFor('external_customer_id')" /><q-input
            v-model="store.form.email"
            outlined
            dense
            type="email"
            label="Email"
            :error="hasError('email')"
            :error-message="errorFor('email')" /><q-input
            v-model="store.form.phone_number"
            outlined
            dense
            type="tel"
            label="Nomor telepon"
            :error="hasError('phone_number')"
            :error-message="errorFor('phone_number')" /><q-toggle
            v-model="store.form.is_active"
            color="warning"
            label="Pelanggan aktif" /></q-card-section
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
            :loading="store.saving"
            :label="
              store.formMode === 'edit'
                ? 'Simpan perubahan'
                : 'Tambah pelanggan'
            " /></q-card-actions></q-form></q-card
  ></q-dialog>
</template>
<script setup>
import { computed } from 'vue'
import { usePelangganAplikasiStore } from '@/stores/pelangganaplikasi'
const store = usePelangganAplikasiStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const requiredApplication = value => !!value || 'Aplikasi wajib dipilih.'
const requiredName = value => !!value || 'Nama pelanggan wajib diisi.'
const requiredExternalCustomerId = value =>
  !!value || 'ID pelanggan pada aplikasi wajib diisi.'
const hasError = field => Boolean(store.formErrors[field]?.length)
const errorFor = field => store.formErrors[field]?.[0] || ''
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
