<template>
  <q-dialog v-model="store.merchantFormDialogOpen" persistent>
    <q-card style="min-width: 480px; max-width: 600px">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div>
          <p class="text-caption text-weight-bold text-amber-9 q-mb-xs">
            MIDTRANS SANDBOX
          </p>
          <div class="text-h6 text-weight-bold">
            {{
              store.merchantFormMode === 'create'
                ? 'Tambah Merchant Baru'
                : 'Edit Merchant'
            }}
          </div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form class="q-gutter-y-md" @submit="store.saveMerchant">
          <!-- Merchant Code -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Kode Merchant <span class="text-negative">*</span>
            </label>
            <q-input
              v-model="store.merchantForm.merchant_code"
              outlined
              dense
              placeholder="contoh: udev-central, pos-utama, toko-laris"
              :disable="store.merchantFormMode === 'edit'"
              :error="Boolean(store.merchantFormErrors.merchant_code)"
              :error-message="store.merchantFormErrors.merchant_code?.[0]"
              hint="Format huruf kecil, angka, garis bawah, atau tanda hubung (-)"
            />
          </div>

          <!-- Merchant Name -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Nama Merchant <span class="text-negative">*</span>
            </label>
            <q-input
              v-model="store.merchantForm.merchant_name"
              outlined
              dense
              placeholder="contoh: UDEV Central Billing"
              :error="Boolean(store.merchantFormErrors.merchant_name)"
              :error-message="store.merchantFormErrors.merchant_name?.[0]"
            />
          </div>

          <!-- Midtrans Merchant ID -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Merchant ID Midtrans (Opsional)
            </label>
            <q-input
              v-model="store.merchantForm.midtrans_merchant_id"
              outlined
              dense
              placeholder="contoh: G123456789"
              :error="Boolean(store.merchantFormErrors.midtrans_merchant_id)"
              :error-message="
                store.merchantFormErrors.midtrans_merchant_id?.[0]
              "
              hint="ID Merchant yang tertera pada Dashboard Midtrans"
            />
          </div>

          <!-- Client Key -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Client Key (Opsional)
            </label>
            <q-input
              v-model="store.merchantForm.client_key"
              outlined
              dense
              placeholder="contoh: SB-Mid-client-xxxxxxxx"
              :error="Boolean(store.merchantFormErrors.client_key)"
              :error-message="store.merchantFormErrors.client_key?.[0]"
              hint="Client Key publik untuk integrasi frontend Midtrans Snap/Core"
            />
          </div>

          <!-- Is Active Toggle -->
          <div
            class="row items-center justify-between q-pa-sm rounded-borders bg-grey-1"
          >
            <div>
              <div class="text-caption text-weight-bold"
                >Status Merchant Aktif</div
              >
              <div class="text-caption text-grey-6"
                >Merchant dapat digunakan untuk mapping aplikasi</div
              >
            </div>
            <q-toggle v-model="store.merchantForm.is_active" color="warning" />
          </div>

          <!-- Actions -->
          <div class="row justify-end q-gutter-sm q-mt-lg">
            <q-btn flat label="Batal" color="grey-8" v-close-popup />
            <q-btn
              type="submit"
              color="warning"
              text-color="dark"
              :label="
                store.merchantFormMode === 'create'
                  ? 'Simpan Merchant'
                  : 'Perbarui'
              "
              no-caps
              :loading="store.merchantSaving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()
</script>
