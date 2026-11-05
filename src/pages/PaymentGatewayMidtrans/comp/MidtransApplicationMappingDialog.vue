<template>
  <q-dialog v-model="store.mappingFormDialogOpen" persistent>
    <q-card style="min-width: 480px; max-width: 600px">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div>
          <p class="text-caption text-weight-bold text-amber-9 q-mb-xs">
            MAPPING APLIKASI
          </p>
          <div class="text-h6 text-weight-bold">
            {{
              store.mappingFormMode === 'create'
                ? 'Tambah Mapping Baru'
                : 'Edit Mapping'
            }}
          </div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form class="q-gutter-y-md" @submit="store.saveMapping">
          <!-- Application Select -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Pilih Aplikasi <span class="text-negative">*</span>
            </label>
            <q-select
              v-model="store.mappingForm.application_id"
              outlined
              dense
              emit-value
              map-options
              :options="applicationOptions"
              label="Pilih aplikasi yang akan dihubungkan"
              :disable="store.mappingFormMode === 'edit'"
              :error="Boolean(store.mappingFormErrors.application_id)"
              :error-message="store.mappingFormErrors.application_id?.[0]"
            />
          </div>

          <!-- Merchant Target Select -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Pilih Merchant Midtrans Tujuan
              <span class="text-negative">*</span>
            </label>
            <q-select
              v-model="store.mappingForm.gateway_merchant_code"
              outlined
              dense
              emit-value
              map-options
              :options="merchantOptions"
              label="Pilih merchant Midtrans Sandbox"
              :error="Boolean(store.mappingFormErrors.gateway_merchant_code)"
              :error-message="
                store.mappingFormErrors.gateway_merchant_code?.[0]
              "
            />
          </div>

          <!-- Provider & Environment Preview -->
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <label
                class="text-caption text-weight-bold text-grey-7 q-mb-xs block"
              >
                Provider
              </label>
              <q-input
                outlined
                dense
                model-value="Midtrans"
                disable
                bg-color="grey-1"
              />
            </div>
            <div class="col-6">
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Environment <span class="text-negative">*</span>
              </label>
              <q-select
                v-model="store.mappingForm.environment"
                outlined
                dense
                emit-value
                map-options
                :options="[
                  { label: 'Sandbox', value: 'sandbox' },
                  { label: 'Production', value: 'production' }
                ]"
                label="Pilih Environment"
                :disable="store.mappingFormMode === 'edit'"
                :error="Boolean(store.mappingFormErrors.environment)"
                :error-message="store.mappingFormErrors.environment?.[0]"
              />
            </div>
          </div>

          <!-- Active Toggle -->
          <div
            class="row items-center justify-between q-pa-sm rounded-borders bg-grey-1"
          >
            <div>
              <div class="text-caption text-weight-bold"
                >Status Mapping Aktif</div
              >
              <div class="text-caption text-grey-6"
                >Invoice dari aplikasi ini akan diteruskan ke merchant
                terkait</div
              >
            </div>
            <q-toggle v-model="store.mappingForm.is_active" color="warning" />
          </div>

          <!-- Actions -->
          <div class="row justify-end q-gutter-sm q-mt-lg">
            <q-btn flat label="Batal" color="grey-8" v-close-popup />
            <q-btn
              type="submit"
              color="warning"
              text-color="dark"
              :label="
                store.mappingFormMode === 'create'
                  ? 'Simpan Mapping'
                  : 'Perbarui'
              "
              no-caps
              :loading="store.mappingSaving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()

const applicationOptions = computed(() =>
  store.applications.map(app => ({
    label: `${app.name} (${app.code})`,
    value: app.id
  }))
)

const merchantOptions = computed(() => {
  if (!store.merchants || store.merchants.length === 0) {
    return [
      { label: 'UDEV Central Billing (udev-central)', value: 'udev-central' },
      { label: 'Larissama (larissama)', value: 'larissama' }
    ]
  }

  return store.merchants.map(m => ({
    label: `${m.merchant_name} (${m.merchant_code})`,
    value: m.merchant_code
  }))
})
</script>
