<template>
  <q-dialog v-model="store.formDialogOpen" persistent>
    <q-card class="form-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">MASTER LANGGANAN</p>
          <h2>{{
            store.formMode === 'edit' ? 'Ubah paket' : 'Tambah paket'
          }}</h2>
        </div>
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
      <q-form @submit="store.savePlan">
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="store.form.application_id"
            outlined
            dense
            emit-value
            map-options
            label="Aplikasi"
            :options="applicationOptions"
            :rules="[requiredApplication]"
            :error="hasError('application_id')"
            :error-message="errorFor('application_id')"
          />
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-5">
              <q-input
                v-model="store.form.code"
                outlined
                dense
                label="Kode paket"
                hint="Huruf, angka, tanda hubung, dan garis bawah."
                :rules="[requiredCode]"
                :error="hasError('code')"
                :error-message="errorFor('code')"
              />
            </div>
            <div class="col-12 col-sm-7">
              <q-input
                v-model="store.form.name"
                outlined
                dense
                label="Nama paket"
                :rules="[requiredName]"
                :error="hasError('name')"
                :error-message="errorFor('name')"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="store.form.duration_months"
                outlined
                dense
                type="number"
                min="1"
                step="1"
                label="Durasi (bulan)"
                :rules="[validDuration]"
                :error="hasError('duration_months')"
                :error-message="errorFor('duration_months')"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="store.form.price"
                outlined
                dense
                inputmode="decimal"
                label="Harga (Rupiah)"
                hint="Contoh: 150000 atau 150000,00"
                :rules="[validPrice]"
                :error="hasError('price')"
                :error-message="errorFor('price')"
              />
            </div>
          </div>
          <q-input
            v-model="store.form.currency"
            outlined
            dense
            label="Mata uang"
            readonly
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
            label="Paket aktif"
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
              store.formMode === 'edit' ? 'Simpan perubahan' : 'Tambah paket'
            "
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { usePaketLanggananStore } from '@/stores/paketlangganan'

const store = usePaketLanggananStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const requiredApplication = value => !!value || 'Aplikasi wajib dipilih.'
const requiredCode = value => !!value || 'Kode paket wajib diisi.'
const requiredName = value => !!value || 'Nama paket wajib diisi.'
const validDuration = value =>
  /^[1-9]\d*$/.test(String(value)) ||
  'Durasi harus berupa jumlah bulan yang valid.'
const validPrice = value =>
  /^\d+(?:[,.]\d{1,2})?$/.test(String(value)) ||
  'Harga harus berupa nominal Rupiah yang valid.'
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
</style>
