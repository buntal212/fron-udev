<template>
  <q-dialog v-model="store.formDialogOpen" persistent>
    <q-card class="form-dialog">
      <q-card-section class="row items-center justify-between">
        <div
          ><p class="eyebrow">MASTER APLIKASI</p
          ><h2>{{
            store.formMode === 'edit' ? 'Ubah aplikasi' : 'Tambah aplikasi'
          }}</h2></div
        >
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.formDialogOpen = false"
        />
      </q-card-section>
      <q-separator />
      <q-form @submit="store.saveApplication">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="store.form.name"
            outlined
            dense
            label="Nama aplikasi"
            :rules="[requiredName]"
            :error="hasError('name')"
            :error-message="errorFor('name')"
          />
          <q-input
            v-model="store.form.code"
            outlined
            dense
            label="Kode aplikasi"
            hint="Huruf, angka, tanda hubung, dan garis bawah."
            :rules="[requiredCode]"
            :error="hasError('code')"
            :error-message="errorFor('code')"
          />
          <q-input
            v-model="store.form.application_url"
            outlined
            dense
            type="url"
            label="URL aplikasi"
            :error="hasError('application_url')"
            :error-message="errorFor('application_url')"
          />
          <q-input
            v-model="store.form.contact_email"
            outlined
            dense
            type="email"
            label="Email kontak"
            :error="hasError('contact_email')"
            :error-message="errorFor('contact_email')"
          />
          <q-input
            v-model="store.form.description"
            outlined
            dense
            type="textarea"
            autogrow
            label="Deskripsi"
            :error="hasError('description')"
            :error-message="errorFor('description')"
          />
          <q-toggle
            v-model="store.form.is_active"
            color="warning"
            label="Aplikasi aktif"
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Batal"
            @click="store.formDialogOpen = false"
          />
          <q-btn
            color="warning"
            text-color="dark"
            no-caps
            type="submit"
            :loading="store.saving"
            :label="
              store.formMode === 'edit' ? 'Simpan perubahan' : 'Tambah aplikasi'
            "
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useAplikasiStore } from '@/stores/aplikasi'

const store = useAplikasiStore()
const requiredName = value => !!value || 'Nama aplikasi wajib diisi.'
const requiredCode = value => !!value || 'Kode aplikasi wajib diisi.'
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
