<template>
  <q-dialog v-model="store.merchantFormDialogOpen" persistent>
    <q-card style="min-width: 440px; max-width: 550px">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="text-caption text-weight-bold text-amber-9 q-mb-xs">
            {{
              store.merchantFormMode === 'create'
                ? 'PROVISIONING BARU'
                : 'PENGATURAN'
            }}
          </p>
          <div class="text-h6 text-weight-bold">
            {{
              store.merchantFormMode === 'create'
                ? 'Tambah Merchant DOKU'
                : 'Ubah Data Merchant'
            }}
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-form @submit.prevent="store.saveMerchant">
        <q-card-section class="q-gutter-md">
          <!-- Kode Merchant -->
          <div>
            <label class="text-caption text-weight-medium text-grey-8"
              >Kode Merchant</label
            >
            <q-input
              v-model="store.merchantForm.merchant_code"
              outlined
              dense
              placeholder="contoh: udev-central atau mitra-01"
              hint="Format: huruf kecil, angka, strip (-), atau garis bawah (_). Tidak dapat diubah setelah dibuat."
              :disable="store.merchantFormMode === 'edit'"
              :error="Boolean(store.merchantFormErrors.merchant_code)"
              :error-message="store.merchantFormErrors.merchant_code?.[0]"
              :rules="[val => !!val || 'Kode merchant wajib diisi']"
            />
          </div>

          <!-- Nama Merchant -->
          <div>
            <label class="text-caption text-weight-medium text-grey-8"
              >Nama Merchant</label
            >
            <q-input
              v-model="store.merchantForm.merchant_name"
              outlined
              dense
              placeholder="contoh: PT Udumbara Ekosistem Digital"
              :error="Boolean(store.merchantFormErrors.merchant_name)"
              :error-message="store.merchantFormErrors.merchant_name?.[0]"
              :rules="[val => !!val || 'Nama merchant wajib diisi']"
            />
          </div>

          <!-- Client ID (Mall ID) Opsional -->
          <div>
            <label class="text-caption text-weight-medium text-grey-8"
              >Client ID / Mall ID (Opsional)</label
            >
            <q-input
              v-model="store.merchantForm.client_id"
              outlined
              dense
              placeholder="contoh: MALL-000123"
              hint="Dapat dikonfigurasi sekarang atau nanti pada tab Kredensial."
              :error="Boolean(store.merchantFormErrors.client_id)"
              :error-message="store.merchantFormErrors.client_id?.[0]"
            />
          </div>

          <!-- Environment -->
          <div>
            <label class="text-caption text-weight-medium text-grey-8"
              >Environment</label
            >
            <q-input
              model-value="Sandbox Only"
              outlined
              dense
              readonly
              bg-color="amber-1"
            >
              <template #prepend>
                <q-icon name="science" color="amber-9" />
              </template>
            </q-input>
          </div>

          <!-- Toggle Aktif -->
          <div class="row items-center justify-between q-pt-sm">
            <div>
              <div class="text-subtitle2 text-weight-medium"
                >Status Merchant</div
              >
              <div class="text-caption text-grey-6">
                {{
                  store.merchantForm.is_active
                    ? 'Merchant aktif dan dapat digunakan'
                    : 'Merchant non-aktif'
                }}
              </div>
            </div>
            <q-toggle v-model="store.merchantForm.is_active" color="warning" />
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
              store.merchantFormMode === 'create'
                ? 'Tambah Merchant'
                : 'Simpan Perubahan'
            "
            no-caps
            type="submit"
            :loading="store.merchantSaving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()
</script>
