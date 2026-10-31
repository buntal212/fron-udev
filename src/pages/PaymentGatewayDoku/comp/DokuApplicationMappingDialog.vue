<template>
  <q-dialog v-model="store.mappingDialogOpen" persistent>
    <q-card style="min-width: 440px; max-width: 550px">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="text-caption text-weight-bold text-amber-9 q-mb-xs">
            INTEGRASI APLIKASI
          </p>
          <div class="text-h6 text-weight-bold">
            {{
              store.mappingDialogMode === 'create'
                ? 'Tambah Mapping Aplikasi DOKU'
                : 'Ubah Mapping Aplikasi'
            }}
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form @submit.prevent="store.saveMapping">
        <q-card-section class="q-gutter-md">
          <!-- Pilih Aplikasi -->
          <div>
            <label class="text-caption text-weight-medium text-grey-8"
              >Aplikasi</label
            >
            <q-select
              v-model="store.mappingForm.application_id"
              outlined
              dense
              emit-value
              map-options
              label="Pilih Aplikasi"
              :options="store.applicationOptions"
              :disable="store.mappingDialogMode === 'edit'"
              :error="Boolean(store.mappingFormErrors.application_id)"
              :error-message="store.mappingFormErrors.application_id?.[0]"
              :rules="[val => !!val || 'Aplikasi wajib dipilih']"
            />
          </div>

          <!-- Provider & Environment (Read-only) -->
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <label class="text-caption text-weight-medium text-grey-8"
                >Provider</label
              >
              <q-input
                model-value="DOKU"
                outlined
                dense
                readonly
                bg-color="grey-2"
              />
            </div>
            <div class="col-6">
              <label class="text-caption text-weight-medium text-grey-8"
                >Environment</label
              >
              <q-input
                model-value="sandbox"
                outlined
                dense
                readonly
                bg-color="amber-1"
              />
            </div>
          </div>

          <!-- Merchant DOKU -->
          <div>
            <label class="text-caption text-weight-medium text-grey-8"
              >Merchant DOKU Penerima</label
            >
            <q-select
              v-model="store.mappingForm.gateway_merchant_code"
              outlined
              dense
              emit-value
              map-options
              label="Pilih Merchant DOKU"
              :options="merchantOptions"
              :error="Boolean(store.mappingFormErrors.gateway_merchant_code)"
              :error-message="
                store.mappingFormErrors.gateway_merchant_code?.[0]
              "
              :rules="[val => !!val || 'Merchant DOKU wajib dipilih']"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption class="font-mono">{{
                      scope.opt.value
                    }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="scope.opt.ready ? 'positive' : 'warning'">
                      {{ scope.opt.ready ? 'Siap' : 'Belum Lengkap' }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <q-banner dense rounded class="bg-amber-1 text-brown-10 text-caption">
            Invoice checkout yang dibuat oleh aplikasi ini akan diarahkan ke
            kredensial SNAP B2B merchant DOKU yang dipilih.
          </q-banner>

          <!-- Toggle Aktif -->
          <div class="row items-center justify-between q-pt-sm">
            <div>
              <div class="text-subtitle2 text-weight-medium"
                >Status Mapping</div
              >
              <div class="text-caption text-grey-6">
                {{
                  store.mappingForm.is_active
                    ? 'Mapping aktif untuk transaksi checkout'
                    : 'Mapping dinonaktifkan sementara'
                }}
              </div>
            </div>
            <q-toggle v-model="store.mappingForm.is_active" color="warning" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey-7" no-caps v-close-popup />
          <q-btn
            unelevated
            color="warning"
            text-color="dark"
            icon="save"
            :label="
              store.mappingDialogMode === 'create'
                ? 'Tambah Mapping'
                : 'Simpan Perubahan'
            "
            no-caps
            type="submit"
            :loading="store.mappingSaving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()

const merchantOptions = computed(() => {
  if (store.merchantMappingOptions?.length) {
    return store.merchantMappingOptions
  }

  return (store.merchants || []).map(m => ({
    label: m.merchant_name,
    value: m.merchant_code,
    ready: m.is_configured && m.is_active
  }))
})
</script>

<style scoped>
.font-mono {
  font-family: monospace;
}
</style>
