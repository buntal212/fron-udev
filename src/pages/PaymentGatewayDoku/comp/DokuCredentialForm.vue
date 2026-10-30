<template>
  <div class="credential-form-wrap">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <h2 class="section-title">Konfigurasi Kredensial SNAP Sandbox</h2>
        <p class="section-desc">
          Kredensial disimpan terenkripsi (AES-256-GCM). Private key tidak
          pernah dikirim balik ke antarmuka pengguna.
        </p>
      </div>
      <div>
        <q-badge
          :color="store.config?.is_configured ? 'positive' : 'warning'"
          :label="
            store.config?.is_configured
              ? 'Terkonfigurasi'
              : 'Belum Dikonfigurasi'
          "
          class="q-px-sm q-py-xs"
        />
      </div>
    </div>

    <!-- Info Banner Kredensial Aktif -->
    <q-card
      v-if="store.config?.is_configured"
      flat
      bordered
      class="active-config-card q-mb-lg"
    >
      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Merchant Code</div>
            <div class="text-weight-bold text-dark">{{
              store.config.merchant_code
            }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7"
              >Masked Client ID (X-CLIENT-KEY)</div
            >
            <div class="text-weight-bold text-dark font-mono">{{
              store.config.masked_client_id
            }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Status Private Key</div>
            <div class="text-weight-bold text-positive">
              <q-icon name="lock" class="q-mr-xs" />Terenkripsi (AES-256-GCM)
            </div>
          </div>
          <div v-if="store.config.public_key_fingerprint" class="col-12">
            <div class="text-caption text-grey-7"
              >Public Key SHA-256 Fingerprint</div
            >
            <div class="text-caption text-grey-8 font-mono">{{
              store.config.public_key_fingerprint
            }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Form Input / Update Kredensial -->
    <q-card flat bordered class="form-card q-pa-md">
      <q-form @submit.prevent="store.saveConfiguration">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="store.form.merchant_code"
              outlined
              dense
              label="Merchant Code *"
              hint="Kode unik merchant (mis. udev-central)"
              :error="!!store.formErrors?.merchant_code"
              :error-message="store.formErrors?.merchant_code?.[0]"
              bg-color="white"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="store.form.merchant_name"
              outlined
              dense
              label="Nama Merchant *"
              hint="Nama instansi atau aplikasi merchant"
              :error="!!store.formErrors?.merchant_name"
              :error-message="store.formErrors?.merchant_name?.[0]"
              bg-color="white"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="store.form.client_id"
              outlined
              dense
              label="Client ID / X-CLIENT-KEY *"
              hint="Client ID DOKU Sandbox (mis. DEV-UDEV-CENTRAL-001)"
              :error="!!store.formErrors?.client_id"
              :error-message="store.formErrors?.client_id?.[0]"
              bg-color="white"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="store.form.private_key"
              outlined
              type="textarea"
              rows="6"
              label="RSA Private Key (PEM format) *"
              hint="Masukkan RSA Private Key lengkap (-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----)"
              :error="!!store.formErrors?.private_key"
              :error-message="store.formErrors?.private_key?.[0]"
              bg-color="white"
              class="font-mono text-caption"
            >
              <template #prepend>
                <q-icon name="vpn_key" />
              </template>
            </q-input>
          </div>

          <div class="col-12 row items-center justify-between q-mt-sm">
            <div class="row items-center">
              <q-toggle
                v-model="store.form.is_active"
                color="warning"
                label="Status Aktif"
              />
              <q-badge color="grey-8" class="q-ml-sm" label="Sandbox Only" />
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                flat
                color="grey-8"
                label="Reset"
                no-caps
                @click="store.resetForm"
              />
              <q-btn
                color="warning"
                text-color="dark"
                icon="save"
                label="Simpan Kredensial"
                no-caps
                type="submit"
                :loading="store.saving"
              />
            </div>
          </div>
        </div>
      </q-form>
    </q-card>
  </div>
</template>

<script setup>
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()
</script>

<style scoped>
.section-title {
  margin: 0 0 4px;
  color: #17130c;
  font-size: 1.15rem;
  font-weight: 700;
}
.section-desc {
  margin: 0;
  color: #716a5d;
  font-size: 0.85rem;
}
.active-config-card {
  background: #fcfbfa;
  border: 1px solid #e0d7c6;
  border-radius: 10px;
}
.form-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.font-mono {
  font-family:
    SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}
</style>
