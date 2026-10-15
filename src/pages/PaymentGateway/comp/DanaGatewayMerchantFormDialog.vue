<template>
  <q-dialog v-model="store.formDialogOpen" persistent>
    <q-card class="form-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">DANA GATEWAY</p>
          <h2>Tambah merchant</h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          :disable="store.saving"
          @click="store.formDialogOpen = false"
        />
      </q-card-section>
      <q-separator />
      <q-form @submit="store.saveMerchant">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="store.form.code"
            outlined
            dense
            label="Kode merchant"
            hint="Huruf, angka, tanda hubung, dan garis bawah."
            autocomplete="off"
            :disable="store.saving"
            :rules="[requiredCode, validCode, maxCodeLength]"
            :error="hasError('code')"
            :error-message="errorFor('code')"
          />
          <q-input
            v-model="store.form.name"
            outlined
            dense
            label="Nama merchant"
            autocomplete="organization"
            :disable="store.saving"
            :rules="[requiredName, maxNameLength]"
            :error="hasError('name')"
            :error-message="errorFor('name')"
          />
          <q-input
            v-model="store.form.email"
            outlined
            dense
            type="email"
            label="Email resmi"
            autocomplete="email"
            :disable="store.saving"
            :rules="[requiredEmail, validEmail, maxEmailLength]"
            :error="hasError('email')"
            :error-message="errorFor('email')"
          />
          <q-select
            v-model="store.form.environment"
            outlined
            dense
            emit-value
            map-options
            label="Environment"
            :disable="store.saving"
            :options="environmentOptions"
            :rules="[requiredEnvironment]"
            :error="hasError('environment')"
            :error-message="errorFor('environment')"
          />
          <q-banner dense class="bootstrap-notice">
            Merchant yang berhasil diprovisikan tetap memerlukan bootstrap
            credential dan konfigurasi DANA sebelum dapat digunakan untuk
            checkout. Mapping aplikasi tidak dibuat otomatis.
          </q-banner>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Batal"
            :disable="store.saving"
            @click="store.formDialogOpen = false"
          />
          <q-btn
            color="warning"
            text-color="dark"
            no-caps
            type="submit"
            label="Provisikan merchant"
            :loading="store.saving"
            :disable="store.saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'

const store = useDanaGatewayMerchantStore()
const environmentOptions = [
  { label: 'Sandbox', value: 'sandbox' },
  {
    label: 'Production (belum diaktifkan)',
    value: 'production',
    disable: true
  }
]
const requiredCode = value => !!value?.trim() || 'Kode merchant wajib diisi.'
const validCode = value =>
  /^[A-Za-z0-9_-]+$/.test(value?.trim() || '') ||
  'Gunakan huruf, angka, tanda hubung, atau garis bawah.'
const maxCodeLength = value =>
  (value?.trim() || '').length <= 60 || 'Kode merchant maksimal 60 karakter.'
const requiredName = value => !!value?.trim() || 'Nama merchant wajib diisi.'
const maxNameLength = value =>
  (value?.trim() || '').length <= 180 || 'Nama merchant maksimal 180 karakter.'
const requiredEmail = value => !!value?.trim() || 'Email resmi wajib diisi.'
const validEmail = value =>
  /\S+@\S+\.\S+/.test(value) || 'Format email tidak valid.'
const maxEmailLength = value =>
  (value?.trim() || '').length <= 255 || 'Email resmi maksimal 255 karakter.'
const requiredEnvironment = value => !!value || 'Environment wajib dipilih.'
const hasError = field => Boolean(store.formErrors[field]?.length)
const errorFor = field => store.formErrors[field]?.[0] || ''
</script>

<style scoped>
.form-dialog {
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
.bootstrap-notice {
  border: 1px solid #e4c56c;
  background: #fff8dc;
  color: #5d4710;
  font-size: 0.82rem;
}
</style>
