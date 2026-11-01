<template>
  <div class="q-gutter-y-md">
    <!-- Header Section -->
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Konfigurasi Kredensial & API Midtrans Sandbox
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Simpan Merchant ID, Server Key, Client Key, dan Signature Secret Key
          terenkripsi AES-256-GCM di backend UDEV.
        </p>
      </div>

      <div class="col-12 col-md-auto row items-center q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh Data"
          no-caps
          :loading="store.configLoading"
          @click="store.fetchConfiguration(store.selectedMerchant)"
        />
        <q-btn
          outline
          color="positive"
          icon="sync_alt"
          label="Uji Koneksi Sandbox"
          no-caps
          :loading="store.testingConnection"
          :disable="!store.config?.has_server_key"
          @click="store.testConnection"
        >
          <q-tooltip v-if="!store.config?.has_server_key">
            Simpan Server Key terlebih dahulu untuk menguji koneksi
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Security Alert Banner -->
    <q-banner rounded class="bg-amber-1 text-dark border-amber">
      <template #avatar>
        <q-icon name="lock" color="warning" size="24px" />
      </template>
      <div class="text-weight-bold text-body2"
        >Protokol Keamanan Kredensial UDEV</div
      >
      <div class="text-caption text-grey-8">
        Nilai <strong>Server Key</strong> dan
        <strong>Signature Secret Key</strong> disimpan terenkripsi menggunakan
        AES-256-GCM pada backend. Setelah disimpan, nilai rahasia tidak pernah
        ditampilkan kembali dalam bentuk teks polos (plaintext).
      </div>
    </q-banner>

    <!-- Main Configuration Card -->
    <q-card flat bordered class="config-card">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-subtitle1 text-weight-bold">
            Parameter API Sandbox Merchant:
            <span class="text-amber-9">{{ store.selectedMerchant }}</span>
          </div>

          <div class="row items-center q-gutter-x-xs">
            <q-badge
              :color="store.config?.has_server_key ? 'positive' : 'warning'"
              class="q-pa-xs text-weight-bold"
            >
              {{
                store.config?.has_server_key
                  ? 'Server Key Terenkripsi'
                  : 'Server Key Belum Ada'
              }}
            </q-badge>
            <q-badge
              v-if="store.config?.has_signature_key"
              color="info"
              class="q-pa-xs text-weight-bold"
            >
              Signature Key Aktif
            </q-badge>
          </div>
        </div>

        <q-separator class="q-mb-md" />

        <q-form class="q-gutter-y-md" @submit="store.saveConfiguration">
          <!-- Row 1: Merchant Code & Merchant ID -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Kode Merchant UDEV
              </label>
              <q-input
                :model-value="store.selectedMerchant"
                outlined
                dense
                disable
                bg-color="grey-1"
                hint="Merchant yang sedang dipilih"
              />
            </div>

            <div class="col-12 col-md-6">
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Merchant ID Midtrans (Opsional)
              </label>
              <q-input
                v-model="store.configForm.midtrans_merchant_id"
                outlined
                dense
                placeholder="contoh: G123456789"
                :error="Boolean(store.configFormErrors.midtrans_merchant_id)"
                :error-message="
                  store.configFormErrors.midtrans_merchant_id?.[0]
                "
                hint="ID merchant dari Midtrans Dashboard Sandbox"
              />
            </div>
          </div>

          <!-- Row 2: Client Key -->
          <div>
            <label
              class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
            >
              Client Key (Midtrans Sandbox)
            </label>
            <q-input
              v-model="store.configForm.client_key"
              outlined
              dense
              placeholder="contoh: SB-Mid-client-xxxxxxxxxxxx"
              :error="Boolean(store.configFormErrors.client_key)"
              :error-message="store.configFormErrors.client_key?.[0]"
              hint="Client Key publik yang disediakan Midtrans"
            >
              <template #prepend
                ><q-icon name="badge" color="grey-6"
              /></template>
            </q-input>
          </div>

          <!-- Row 3: Server Key (Secret) -->
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <label class="text-caption text-weight-bold text-grey-8">
                Server Key <span class="text-negative">*</span>
              </label>
              <span
                v-if="store.config?.masked_server_key"
                class="text-caption text-positive font-mono"
              >
                Status saat ini: {{ store.config.masked_server_key }}
              </span>
            </div>
            <q-input
              v-model="store.configForm.server_key"
              outlined
              dense
              :type="showServerKey ? 'text' : 'password'"
              :placeholder="
                store.config?.has_server_key
                  ? 'Ketik untuk mengganti Server Key baru...'
                  : 'contoh: SB-Mid-server-xxxxxxxxxxxx'
              "
              :error="Boolean(store.configFormErrors.server_key)"
              :error-message="store.configFormErrors.server_key?.[0]"
              hint="Server Key digunakan untuk autentikasi API Sandbox Basic Auth dan otorisasi charge"
            >
              <template #prepend
                ><q-icon name="vpn_key" color="warning"
              /></template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  :icon="showServerKey ? 'visibility_off' : 'visibility'"
                  @click="showServerKey = !showServerKey"
                />
              </template>
            </q-input>
          </div>

          <!-- Row 4: Signature Secret Key (Secret) -->
          <div>
            <div class="row items-center justify-between q-mb-xs">
              <label class="text-caption text-weight-bold text-grey-8">
                Signature Secret Key (Opsional)
              </label>
              <span
                v-if="store.config?.masked_signature_key"
                class="text-caption text-info font-mono"
              >
                Status saat ini: {{ store.config.masked_signature_key }}
              </span>
            </div>
            <q-input
              v-model="store.configForm.signature_secret_key"
              outlined
              dense
              :type="showSignatureKey ? 'text' : 'password'"
              :placeholder="
                store.config?.has_signature_key
                  ? 'Ketik untuk mengganti Signature Secret Key...'
                  : 'Secret key opsional untuk webhook signature'
              "
              :error="Boolean(store.configFormErrors.signature_secret_key)"
              :error-message="store.configFormErrors.signature_secret_key?.[0]"
              hint="Digunakan jika webhook Midtrans dikonfigurasikan dengan Signature Key khusus"
            >
              <template #prepend
                ><q-icon name="enhanced_encryption" color="info"
              /></template>
              <template #append>
                <q-btn
                  flat
                  round
                  dense
                  :icon="showSignatureKey ? 'visibility_off' : 'visibility'"
                  @click="showSignatureKey = !showSignatureKey"
                />
              </template>
            </q-input>
          </div>

          <!-- Row 5: Active Toggle -->
          <div
            class="row items-center justify-between q-pa-sm rounded-borders bg-grey-1"
          >
            <div>
              <div class="text-caption text-weight-bold"
                >Status Konfigurasi Aktif</div
              >
              <div class="text-caption text-grey-6"
                >Aktifkan untuk memproses transaksi dengan kredensial ini</div
              >
            </div>
            <q-toggle v-model="store.configForm.is_active" color="warning" />
          </div>

          <!-- Form Actions -->
          <div class="row items-center justify-between q-pt-md">
            <q-btn
              flat
              color="negative"
              icon="delete_outline"
              label="Hapus Kredensial"
              no-caps
              :disable="!store.config?.has_server_key"
              @click="store.deleteConfigDialogOpen = true"
            />

            <div class="row q-gutter-sm">
              <q-btn
                type="submit"
                color="warning"
                text-color="dark"
                icon="save"
                label="Simpan Konfigurasi Terenkripsi"
                no-caps
                :loading="store.configSaving"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Delete Credentials Confirmation Dialog -->
    <q-dialog v-model="store.deleteConfigDialogOpen">
      <q-card style="min-width: 380px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Hapus Kredensial Midtrans</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          Apakah Anda yakin ingin menghapus kredensial API Midtrans untuk
          merchant
          <strong>{{ store.selectedMerchant }}</strong
          >? Transaksi checkout tidak akan dapat diproses sampai kredensial baru
          disimpan.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Batal" color="grey-8" v-close-popup />
          <q-btn
            label="Hapus Kredensial"
            color="negative"
            no-caps
            :loading="store.configDeleting"
            @click="store.deleteConfiguration"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()

const showServerKey = ref(false)
const showSignatureKey = ref(false)
</script>

<style scoped>
.config-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.border-amber {
  border: 1px solid #eed69f;
}
.font-mono {
  font-family: monospace;
}
</style>
