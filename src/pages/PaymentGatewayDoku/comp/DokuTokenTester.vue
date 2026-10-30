<template>
  <div class="token-tester-wrap">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <h2 class="section-title">Pengujian SNAP B2B Sandbox Token</h2>
        <p class="section-desc">
          Eksekusi request ASPI SNAP B2B: POST
          <code>/authorization/v1/access-token/b2b</code> dengan
          <code>grantType: client_credentials</code> dan tanda tangan digital
          RSA-SHA256.
        </p>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-checkbox
          v-model="forceRefresh"
          label="Bypass Cache (Force Refresh)"
          dense
          color="warning"
        >
          <q-tooltip
            >Paksa pembuatan signature RSA baru dan bypass token
            tersimpan.</q-tooltip
          >
        </q-checkbox>

        <q-btn
          color="warning"
          text-color="dark"
          icon="sync_alt"
          label="Uji Koneksi SNAP B2B"
          no-caps
          :loading="store.testing"
          :disable="!store.config?.is_configured"
          @click="store.testConnection(forceRefresh)"
        />
      </div>
    </div>

    <!-- Peringatan jika belum dikonfigurasi -->
    <q-banner
      v-if="!store.config?.is_configured"
      rounded
      class="bg-amber-1 text-brown-9 q-mb-lg border-warning"
    >
      <template #avatar><q-icon name="warning" color="warning" /></template>
      Kredensial DOKU Sandbox untuk merchant
      <strong>{{ store.selectedMerchant }}</strong> belum lengkap. Silakan
      simpan Client ID dan RSA Private Key pada tab
      <strong>Kredensial Sandbox</strong> terlebih dahulu.
    </q-banner>

    <!-- Hasil Pengujian SNAP B2B Token -->
    <q-card v-if="store.testResult" flat bordered class="result-card q-mb-lg">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center q-gutter-sm">
            <q-badge
              :color="
                store.testResult.status === 'success' ? 'positive' : 'negative'
              "
              :label="
                store.testResult.status === 'success'
                  ? 'PENGUJIAN BERHASIL'
                  : 'PENGUJIAN GAGAL'
              "
              class="q-px-sm q-py-xs text-weight-bold"
            />
            <q-badge
              color="amber-8"
              :label="'Response Code: ' + store.testResult.response_code"
              class="q-px-sm q-py-xs text-weight-bold"
            />
            <q-badge
              :color="store.testResult.is_cached ? 'blue-8' : 'teal-8'"
              :label="store.testResult.is_cached ? 'Cache Hit' : 'Fresh Token'"
              class="q-px-sm q-py-xs"
            />
          </div>

          <div class="text-caption text-grey-7">
            Waktu Uji: {{ store.testResult.tested_at || 'Baru saja' }}
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Response Message</div>
              <div class="stat-val text-positive">{{
                store.testResult.response_message || 'Successful'
              }}</div>
            </div>
          </div>

          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Token Type / Masa Berlaku</div>
              <div class="stat-val text-dark">
                {{ store.testResult.token_type || 'Bearer' }} ({{
                  store.testResult.expires_in || 900
                }}s)
              </div>
            </div>
          </div>

          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Strategi Cache (Buffer 60s)</div>
              <div class="stat-val text-dark">
                TTL: {{ store.testResult.cache_ttl_seconds || 840 }} detik
              </div>
            </div>
          </div>

          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Latensi Jaringan</div>
              <div class="stat-val text-dark font-mono">
                {{
                  store.testResult.latency_ms !== undefined
                    ? store.testResult.latency_ms + ' ms'
                    : '0 ms'
                }}
              </div>
            </div>
          </div>

          <!-- Masked Access Token Box -->
          <div class="col-12">
            <div class="token-display-box q-pa-md">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-weight-bold text-amber-9">
                  <q-icon name="security" class="q-mr-xs" />Masked Access Token
                  (SNAP B2B Bearer)
                </span>
                <span class="text-caption text-grey-7"
                  >Rahasia mentah tidak dikirim ke frontend</span
                >
              </div>
              <div
                class="font-mono text-dark bg-white q-pa-sm rounded-borders token-text"
              >
                {{
                  store.testResult.masked_token ||
                  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.***[TERMASKING]***'
                }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Error Banner jika pengujian gagal -->
    <q-banner
      v-if="store.testError"
      rounded
      class="bg-red-1 text-negative q-mb-lg border-negative"
    >
      <template #avatar
        ><q-icon name="error_outline" color="negative"
      /></template>
      {{ store.testError }}
    </q-banner>

    <!-- Spesifikasi Teknis SNAP B2B Card -->
    <q-card flat bordered class="spec-card">
      <q-card-section>
        <div class="text-weight-bold q-mb-sm text-dark">
          <q-icon name="info" color="warning" class="q-mr-xs" />Spesifikasi
          Standar ASPI SNAP B2B (DOKU Sandbox)
        </div>
        <div class="row q-col-gutter-md text-caption text-grey-8">
          <div class="col-12 col-md-4">
            <strong>Endpoint:</strong>
            <code>POST /authorization/v1/access-token/b2b</code><br />
            <strong>Grant Type:</strong> <code>client_credentials</code><br />
            <strong>Algoritma Signature:</strong> <code>RSA-SHA256</code>
          </div>
          <div class="col-12 col-md-4">
            <strong>Header Wajib:</strong>
            <code>X-CLIENT-KEY, X-TIMESTAMP, X-SIGNATURE</code><br />
            <strong>String to Sign:</strong>
            <code>X-CLIENT-KEY + "|" + X-TIMESTAMP</code><br />
            <strong>Response Code Sukses:</strong> <code>2007300</code>
          </div>
          <div class="col-12 col-md-4">
            <strong>Siklus Hidup Token:</strong> expiresIn 900 detik (15
            menit)<br />
            <strong>Proteksi Cache:</strong> Buffer 60 detik (Sisa 840 detik)<br />
            <strong>Keamanan Kunci:</strong> Terenkripsi AES-256-GCM di Backend
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()
const forceRefresh = ref(false)
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
.result-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.spec-card {
  background: #fbf9f5;
  border: 1px solid #ebd8b0;
  border-radius: 10px;
}
.stat-box {
  background: #f8f6f0;
  border: 1px solid #e8e2d5;
  border-radius: 8px;
  padding: 12px;
}
.stat-label {
  font-size: 0.72rem;
  color: #716a5d;
  margin-bottom: 4px;
}
.stat-val {
  font-size: 0.95rem;
  font-weight: 700;
}
.token-display-box {
  background: #fffdf7;
  border: 1px dashed #d6ad4d;
  border-radius: 8px;
}
.token-text {
  word-break: break-all;
  border: 1px solid #e0d7c6;
}
.font-mono {
  font-family:
    SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}
.border-warning {
  border: 1px solid #e6c575;
}
.border-negative {
  border: 1px solid #e8b4ad;
}
</style>
