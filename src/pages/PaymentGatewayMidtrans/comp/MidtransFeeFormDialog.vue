<template>
  <q-dialog v-model="store.feeFormDialogOpen" persistent>
    <q-card class="form-dialog" style="min-width: 480px; max-width: 95vw">
      <!-- Header -->
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div>
          <p class="eyebrow">BIAYA ADMIN MIDTRANS</p>
          <h2 class="text-h6 text-weight-bold text-sand">
            {{
              store.feeFormMode === 'create'
                ? 'Tambah Biaya Metode Pembayaran'
                : 'Edit Biaya Metode Pembayaran'
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
          <!-- Merchant Info Badge -->
          <div class="row items-center q-gutter-xs">
            <span class="text-caption text-muted">Merchant:</span>
            <q-badge
              color="amber-10"
              text-color="dark"
              class="text-weight-bold"
            >
              {{ store.selectedMerchant }}
            </q-badge>
          </div>

          <!-- Payment Method Selection -->
          <div>
            <label
              class="text-caption text-weight-medium text-sand block q-mb-xs"
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

          <!-- Display Name -->
          <div>
            <label
              class="text-caption text-weight-medium text-sand block q-mb-xs"
            >
              Nama Tampilan Metode
            </label>
            <q-input
              v-model="store.feeForm.payment_method_name"
              outlined
              dense
              placeholder="Contoh: QRIS Midtrans, BCA Virtual Account"
              :error="Boolean(store.feeFormErrors.payment_method_name)"
              :error-message="store.feeFormErrors.payment_method_name?.[0]"
            />
          </div>

          <!-- Fee Type Toggle -->
          <div>
            <label
              class="text-caption text-weight-medium text-sand block q-mb-xs"
            >
              Tipe Biaya Admin
            </label>
            <q-btn-toggle
              v-model="store.feeForm.fee_type"
              spread
              dense
              no-caps
              rounded
              unelevated
              toggle-color="warning"
              color="dark"
              text-color="grey-4"
              toggle-text-color="dark"
              :options="[
                { label: 'Persentase (%)', value: 'percent' },
                { label: 'Nominal Tetap (Rp)', value: 'fixed' }
              ]"
            />
          </div>

          <!-- Percentage Input -->
          <div
            v-if="store.feeForm.fee_type === 'percent'"
            class="row q-col-gutter-sm"
          >
            <div class="col-12">
              <label
                class="text-caption text-weight-medium text-sand block q-mb-xs"
              >
                Tarif Persentase (%)
              </label>
              <q-input
                v-model.number="store.feeForm.fee_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                outlined
                dense
                suffix="%"
                hint="Dihitung dari subtotal tagihan setelah diskon. Contoh: 0.7 untuk 0.7%"
                :error="Boolean(store.feeFormErrors.fee_rate)"
                :error-message="store.feeFormErrors.fee_rate?.[0]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <label
                class="text-caption text-weight-medium text-sand block q-mb-xs"
              >
                Batas Minimal Biaya (Opsional)
              </label>
              <q-input
                v-model.number="store.feeForm.min_fee"
                type="number"
                min="0"
                outlined
                dense
                prefix="Rp"
                placeholder="0"
                hint="Nominal biaya minimum"
              />
            </div>
            <div class="col-12 col-sm-6">
              <label
                class="text-caption text-weight-medium text-sand block q-mb-xs"
              >
                Batas Maksimal Biaya (Opsional)
              </label>
              <q-input
                v-model.number="store.feeForm.max_fee"
                type="number"
                min="0"
                outlined
                dense
                prefix="Rp"
                placeholder="Tanpa batas"
                hint="Nominal biaya maksimum"
              />
            </div>
          </div>

          <!-- Fixed Nominal Input -->
          <div v-else>
            <label
              class="text-caption text-weight-medium text-sand block q-mb-xs"
            >
              Nominal Biaya Tetap (Rp)
            </label>
            <q-input
              v-model.number="store.feeForm.fixed_amount"
              type="number"
              min="0"
              outlined
              dense
              prefix="Rp"
              hint="Nominal biaya tetap ditanggung pelanggan. Contoh: 4000"
              :error="Boolean(store.feeFormErrors.fixed_amount)"
              :error-message="store.feeFormErrors.fixed_amount?.[0]"
            />
          </div>

          <!-- Active Toggle -->
          <div class="row items-center justify-between q-py-xs">
            <div>
              <div class="text-caption text-weight-medium text-sand"
                >Status Aktif</div
              >
              <div class="text-caption text-muted">
                Jika dinonaktifkan, biaya untuk metode ini diabaikan (0).
              </div>
            </div>
            <q-toggle v-model="store.feeForm.is_active" color="warning" />
          </div>

          <!-- Notes -->
          <div>
            <label
              class="text-caption text-weight-medium text-sand block q-mb-xs"
            >
              Catatan Internal (Opsional)
            </label>
            <q-input
              v-model="store.feeForm.notes"
              outlined
              dense
              type="textarea"
              rows="2"
              placeholder="Catatan regulasi, MDR bank, atau perubahan biaya"
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
            text-color="grey-4"
            :disable="store.feeSaving"
            @click="store.feeFormDialogOpen = false"
          />
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="warning"
            text-color="dark"
            class="text-weight-bold"
            :loading="store.feeSaving"
            :label="
              store.feeFormMode === 'create' ? 'Simpan Biaya' : 'Perbarui Biaya'
            "
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()

const paymentMethodOptions = [
  { label: 'QRIS Midtrans', value: 'qris' },
  { label: 'BCA Virtual Account', value: 'va_bca' },
  { label: 'BNI Virtual Account', value: 'va_bni' },
  { label: 'BRI Virtual Account', value: 'va_bri' },
  { label: 'Permata Virtual Account', value: 'va_permata' },
  { label: 'Mandiri Bill Payment', value: 'va_mandiri' },
  { label: 'GoPay', value: 'gopay' }
]

const defaultNames = {
  qris: 'QRIS Midtrans',
  va_bca: 'BCA Virtual Account',
  va_bni: 'BNI Virtual Account',
  va_bri: 'BRI Virtual Account',
  va_permata: 'Permata Virtual Account',
  va_mandiri: 'Mandiri Bill Payment',
  gopay: 'GoPay'
}

function onPaymentMethodChanged(val) {
  if (defaultNames[val] && !store.feeForm.payment_method_name) {
    store.feeForm.payment_method_name = defaultNames[val]
  }
}
</script>

<style scoped>
.form-dialog {
  background: #19191e;
  border: 1px solid rgba(224, 195, 124, 0.2);
  border-radius: 8px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 1.5px;
  font-weight: 700;
  color: #e0c37c;
  margin: 0;
}
.text-sand {
  color: #f5f0e6;
}
.text-muted {
  color: #a0a0a8;
}
</style>
