<template>
  <q-dialog v-model="store.feeFormDialogOpen" persistent>
    <q-card class="form-dialog" style="min-width: 520px; max-width: 95vw">
      <!-- Header -->
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <p class="eyebrow">PENGATURAN BIAYA DANA</p>
          <h2 class="text-h6 text-weight-bold">
            {{
              store.feeFormMode === 'create'
                ? 'Tambah Aturan Biaya DANA'
                : 'Edit Aturan Biaya DANA'
            }}
          </h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          :disable="store.feeSaving"
          @click="store.feeFormDialogOpen = false"
        />
      </q-card-section>

      <q-separator />

      <!-- Form Body -->
      <q-form @submit.prevent="store.saveFee">
        <q-card-section class="q-gutter-y-md">
          <!-- Policy Banner -->
          <q-banner dense class="bg-blue-1 text-blue-10 rounded-borders">
            <template #avatar>
              <q-icon name="info" color="primary" />
            </template>
            Biaya gateway DANA dan platform UDEV dibebankan kepada pelanggan
            saat checkout. Hak pemilik aplikasi dijamin 100% utuh sebesar
            tagihan pokok.
          </q-banner>

          <!-- Scope Selection: Default vs Khusus Merchant vs Khusus Aplikasi -->
          <div>
            <label
              class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
            >
              Cakupan Tarif
            </label>
            <q-btn-toggle
              v-model="store.feeForm.scope_type"
              spread
              dense
              no-caps
              rounded
              unelevated
              toggle-color="warning"
              color="grey-3"
              text-color="grey-8"
              toggle-text-color="dark"
              :options="[
                { label: 'Default Global (Semua Aplikasi)', value: 'default' },
                { label: 'Khusus Merchant DANA', value: 'merchant' },
                { label: 'Khusus Aplikasi Tertentu', value: 'application' }
              ]"
              :disable="store.feeFormMode === 'edit'"
            />
          </div>

          <!-- Merchant Select (Visible only when scope_type === 'merchant') -->
          <div v-if="store.feeForm.scope_type === 'merchant'">
            <label
              class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
            >
              Pilih Merchant DANA
            </label>
            <q-select
              v-model="store.feeForm.gateway_merchant_code"
              outlined
              dense
              emit-value
              map-options
              :options="merchantOptions"
              label="Pilih merchant DANA target"
              :disable="store.feeFormMode === 'edit'"
              :error="Boolean(store.feeFormErrors.gateway_merchant_code)"
              :error-message="store.feeFormErrors.gateway_merchant_code?.[0]"
            />
          </div>

          <!-- Application Select (Visible only when scope_type === 'application') -->
          <div v-if="store.feeForm.scope_type === 'application'">
            <label
              class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
            >
              Pilih Aplikasi
            </label>
            <q-select
              v-model="store.feeForm.application_id"
              outlined
              dense
              emit-value
              map-options
              :options="applicationOptions"
              label="Pilih aplikasi target"
              :disable="store.feeFormMode === 'edit'"
              :error="Boolean(store.feeFormErrors.application_id)"
              :error-message="store.feeFormErrors.application_id?.[0]"
            />
          </div>

          <!-- Environment & Payment Method -->
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <label
                class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
              >
                Environment
              </label>
              <q-select
                v-model="store.feeForm.environment"
                outlined
                dense
                emit-value
                map-options
                :options="environmentOptions"
                :disable="store.feeFormMode === 'edit'"
                :error="Boolean(store.feeFormErrors.environment)"
                :error-message="store.feeFormErrors.environment?.[0]"
              />
            </div>

            <div class="col-12 col-sm-6">
              <label
                class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
              >
                Metode Pembayaran
              </label>
              <q-select
                v-model="store.feeForm.payment_method"
                outlined
                dense
                emit-value
                map-options
                :options="paymentMethodOptions"
                :disable="store.feeFormMode === 'edit'"
                :error="Boolean(store.feeFormErrors.payment_method)"
                :error-message="store.feeFormErrors.payment_method?.[0]"
                @update:model-value="onPaymentMethodChanged"
              />
            </div>
          </div>

          <!-- Fee Type & Fee Unit -->
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <label
                class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
              >
                Tipe Biaya
              </label>
              <q-btn-toggle
                v-model="store.feeForm.fee_type"
                spread
                dense
                no-caps
                rounded
                unelevated
                toggle-color="warning"
                color="grey-3"
                text-color="grey-8"
                toggle-text-color="dark"
                :options="[
                  { label: 'Biaya DANA (Gateway)', value: 'dana' },
                  { label: 'Biaya UDEV (Platform)', value: 'udev' }
                ]"
                :disable="store.feeFormMode === 'edit'"
                @update:model-value="onFeeTypeChanged"
              />
            </div>

            <div class="col-12 col-sm-6">
              <label
                class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
              >
                Satuan Biaya
              </label>
              <q-btn-toggle
                v-model="store.feeForm.fee_unit"
                spread
                dense
                no-caps
                rounded
                unelevated
                toggle-color="warning"
                color="grey-3"
                text-color="grey-8"
                toggle-text-color="dark"
                :options="[
                  { label: 'Persentase (%)', value: 'percent' },
                  { label: 'Nominal Tetap (Rp)', value: 'rupiah' }
                ]"
              />
            </div>
          </div>

          <!-- Fee Value Input -->
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <label class="text-caption text-weight-medium text-grey-9">
                Nilai Tarif
              </label>
              <q-btn
                v-if="recommendedFee !== null"
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                :label="`Gunakan tarif resmi (${formatRecommended(recommendedFee)})`"
                @click="applyRecommendedFee"
              />
            </div>
            <q-input
              v-model.number="store.feeForm.fee_value"
              type="number"
              step="0.01"
              min="0"
              outlined
              dense
              :prefix="store.feeForm.fee_unit === 'rupiah' ? 'Rp' : ''"
              :suffix="store.feeForm.fee_unit === 'percent' ? '%' : ''"
              :placeholder="
                store.feeForm.fee_unit === 'percent'
                  ? 'Contoh: 0.70'
                  : 'Contoh: 4000'
              "
              :error="Boolean(store.feeFormErrors.fee_value)"
              :error-message="store.feeFormErrors.fee_value?.[0]"
            />
          </div>

          <!-- Active Toggle & Notes -->
          <div class="row items-center justify-between">
            <q-toggle
              v-model="store.feeForm.is_active"
              color="warning"
              label="Aturan Biaya Aktif"
            />
            <span class="text-caption text-grey-7">
              Hanya 1 aturan aktif per kombinasi scope, env, metode, dan tipe.
            </span>
          </div>

          <div>
            <label
              class="text-caption text-weight-medium text-grey-9 block q-mb-xs"
            >
              Catatan Aturan (Opsional)
            </label>
            <q-input
              v-model="store.feeForm.notes"
              outlined
              dense
              type="textarea"
              rows="2"
              placeholder="Contoh: Tarif MDR resmi DANA Production VA Rp 4.000"
              :error="Boolean(store.feeFormErrors.notes)"
              :error-message="store.feeFormErrors.notes?.[0]"
            />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Actions -->
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Batal"
            :disable="store.feeSaving"
            @click="store.feeFormDialogOpen = false"
          />
          <q-btn
            color="warning"
            text-color="dark"
            no-caps
            type="submit"
            class="text-weight-bold"
            :loading="store.feeSaving"
            :label="
              store.feeFormMode === 'create'
                ? 'Simpan Aturan Biaya'
                : 'Simpan Perubahan'
            "
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'
import { usePaymentGatewayStore } from '@/stores/paymentgateway'

const props = defineProps({
  applications: {
    type: Array,
    default: () => []
  }
})

const store = useDanaGatewayMerchantStore()
const paymentGatewayStore = usePaymentGatewayStore()

const effectiveApplications = computed(() =>
  props.applications.length > 0
    ? props.applications
    : paymentGatewayStore.applications
)

const applicationOptions = computed(() =>
  effectiveApplications.value.map(app => ({
    label: app.name,
    value: app.id
  }))
)

const merchantOptions = computed(() =>
  store.items.map(m => ({
    label: `${m.name} (${m.code})`,
    value: m.code
  }))
)

const paymentMethodOptions = [
  { label: 'QRIS', value: 'qris' },
  { label: 'DANA Wallet', value: 'dana_wallet' },
  { label: 'VA BRI', value: 'va_bri' },
  { label: 'VA CIMB Niaga', value: 'va_cimb' },
  { label: 'VA BTPN', value: 'va_btpn' },
  { label: 'VA Panin', value: 'va_pani' }
]

const environmentOptions = [
  { label: 'Sandbox', value: 'sandbox' },
  { label: 'Production', value: 'production' }
]

const officialRates = {
  dana: {
    qris: { value: 0.7, unit: 'percent' },
    dana_wallet: { value: 1.5, unit: 'percent' },
    va_bri: { value: 4000, unit: 'rupiah' },
    va_cimb: { value: 4000, unit: 'rupiah' },
    va_btpn: { value: 4000, unit: 'rupiah' },
    va_pani: { value: 4000, unit: 'rupiah' }
  },
  udev: {
    qris: { value: 0, unit: 'rupiah' },
    dana_wallet: { value: 0, unit: 'rupiah' },
    va_bri: { value: 0, unit: 'rupiah' },
    va_cimb: { value: 0, unit: 'rupiah' },
    va_btpn: { value: 0, unit: 'rupiah' },
    va_pani: { value: 0, unit: 'rupiah' }
  }
}

const recommendedFee = computed(() => {
  const type = store.feeForm.fee_type
  const method = store.feeForm.payment_method
  return officialRates[type]?.[method] || null
})

function formatRecommended(rec) {
  if (!rec) return ''
  return rec.unit === 'percent'
    ? `${rec.value}%`
    : `Rp ${Number(rec.value).toLocaleString('id-ID')}`
}

function applyRecommendedFee() {
  if (recommendedFee.value) {
    store.feeForm.fee_value = recommendedFee.value.value
    store.feeForm.fee_unit = recommendedFee.value.unit
  }
}

function onPaymentMethodChanged() {
  if (store.feeFormMode === 'create' && recommendedFee.value) {
    store.feeForm.fee_value = recommendedFee.value.value
    store.feeForm.fee_unit = recommendedFee.value.unit
  }
}

function onFeeTypeChanged() {
  if (store.feeFormMode === 'create' && recommendedFee.value) {
    store.feeForm.fee_value = recommendedFee.value.value
    store.feeForm.fee_unit = recommendedFee.value.unit
  }
}
</script>

<style scoped>
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.71rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h2 {
  margin: 0;
  color: #17130c;
}
</style>
