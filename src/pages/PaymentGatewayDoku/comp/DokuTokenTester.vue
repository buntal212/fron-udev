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
          :disable="!store.isB2bReady"
          @click="store.testConnection(forceRefresh)"
        />
      </div>
    </div>

    <!-- Peringatan jika belum siap SNAP B2B -->
    <q-banner
      v-if="!store.isB2bReady"
      rounded
      class="bg-amber-1 text-brown-9 q-mb-lg border-warning"
    >
      <template #avatar><q-icon name="warning" color="warning" /></template>
      <div
        v-if="!store.config?.has_private_key && !store.config?.has_client_id"
      >
        Kredensial SNAP B2B untuk merchant
        <strong>{{ store.selectedMerchant }}</strong> belum lengkap. Silakan
        buat pasangan kunci RSA dan masukkan Client ID pada tab
        <strong>Kredensial Sandbox</strong>.
      </div>
      <div v-else-if="!store.config?.has_private_key">
        Merchant <strong>{{ store.selectedMerchant }}</strong> belum memiliki
        pasangan kunci RSA aktif. Silakan klik
        <strong>Generate RSA Key Pair</strong> pada tab
        <strong>Kredensial Sandbox</strong>.
      </div>
      <div v-else-if="!store.config?.has_client_id">
        Merchant <strong>{{ store.selectedMerchant }}</strong> sudah memiliki
        RSA Key Pair aktif di server, namun belum memiliki
        <strong>Client ID</strong>. Silakan masukkan dan simpan Client ID pada
        tab <strong>Kredensial Sandbox</strong> tanpa perlu mengisi private key
        manual.
      </div>
      <div v-else-if="!store.config?.is_active">
        Merchant <strong>{{ store.selectedMerchant }}</strong> saat ini sedang
        nonaktif. Aktifkan merchant terlebih dahulu agar dapat melakukan
        pengujian token SNAP B2B.
      </div>
      <div v-else>
        Kredensial SNAP B2B untuk merchant
        <strong>{{ store.selectedMerchant }}</strong> belum lengkap. Silakan
        lengkapi konfigurasi pada tab <strong>Kredensial Sandbox</strong>.
      </div>
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
              v-if="store.testResult.http_status"
              :color="
                store.testResult.status === 'success'
                  ? 'teal-8'
                  : 'deep-orange-9'
              "
              :label="'HTTP ' + store.testResult.http_status"
              class="q-px-sm q-py-xs text-weight-bold"
            />
            <q-badge
              color="amber-8"
              :label="
                'Response Code: ' + (store.testResult.response_code || '-')
              "
              class="q-px-sm q-py-xs text-weight-bold"
            />
            <q-badge
              v-if="store.testResult.status === 'success'"
              :color="store.testResult.is_cached ? 'blue-8' : 'teal-8'"
              :label="store.testResult.is_cached ? 'Cache Hit' : 'Fresh Token'"
              class="q-px-sm q-py-xs"
            />
          </div>

          <div class="text-caption text-grey-7">
            Waktu Uji: {{ store.testResult.tested_at || 'Baru saja' }}
          </div>
        </div>

        <!-- TAMPILAN JIKA STATUS SUKSES (Token Berhasil Diterbitkan) -->
        <div
          v-if="store.testResult.status === 'success'"
          class="row q-col-gutter-md"
        >
          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Response Message</div>
              <div class="stat-val text-positive">
                {{ store.testResult.response_message || 'Successful' }}
              </div>
            </div>
          </div>

          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Token Type / Masa Berlaku</div>
              <div class="stat-val text-dark">
                {{ store.testResult.token_type }} ({{
                  store.testResult.expires_in
                }}s)
              </div>
            </div>
          </div>

          <div class="col-12 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Strategi Cache (Buffer 60s)</div>
              <div class="stat-val text-dark">
                TTL: {{ store.testResult.cache_ttl_seconds }} detik
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

          <!-- Target Endpoint on Success -->
          <div v-if="store.testResult.target_endpoint" class="col-12">
            <div class="endpoint-box q-pa-sm text-caption text-grey-8">
              <strong>Target Endpoint:</strong>
              <code class="q-ml-xs font-mono">{{
                store.testResult.target_endpoint
              }}</code>
            </div>
          </div>

          <!-- Masked Access Token Box (Hanya Muncul Jika Sukses) -->
          <div class="col-12">
            <div class="token-display-box q-pa-md">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-weight-bold text-amber-9">
                  <q-icon name="security" class="q-mr-xs" />Masked Access Token
                  (SNAP B2B Bearer)
                </span>
                <span class="text-caption text-grey-7">
                  Rahasia mentah tidak dikirim ke frontend
                </span>
              </div>
              <div
                class="font-mono text-dark bg-white q-pa-sm rounded-borders token-text"
              >
                {{ store.testResult.masked_token }}
              </div>
            </div>
          </div>
        </div>

        <!-- TAMPILAN JIKA STATUS GAGAL (Diagnostik Lengkap: HTTP status, response_code, response_message, latency, target_endpoint) -->
        <div v-else class="row q-col-gutter-md failure-section">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="stat-box stat-box-failed">
              <div class="stat-label">HTTP Status</div>
              <div class="stat-val text-negative font-mono">
                HTTP {{ store.testResult.http_status || '-' }}
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="stat-box stat-box-failed">
              <div class="stat-label">Response Code</div>
              <div class="stat-val text-negative font-mono">
                {{ store.testResult.response_code || '-' }}
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
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

          <div class="col-12 col-sm-6 col-md-3">
            <div class="stat-box">
              <div class="stat-label">Status Token</div>
              <div class="stat-val text-grey-7"> Tidak Diterbitkan </div>
            </div>
          </div>

          <!-- Target Endpoint on Failure -->
          <div class="col-12">
            <div class="endpoint-box-failed q-pa-sm text-caption text-grey-9">
              <q-icon name="link" class="q-mr-xs text-negative" />
              <strong>Target Endpoint:</strong>
              <code class="q-ml-xs font-mono">{{
                store.testResult.target_endpoint ||
                'https://api-sandbox.doku.com/authorization/v1/access-token/b2b'
              }}</code>
            </div>
          </div>

          <!-- Response Message on Failure -->
          <div class="col-12">
            <div class="response-message-box q-pa-md">
              <div class="text-caption text-weight-bold text-negative q-mb-xs">
                <q-icon name="error_outline" class="q-mr-xs" />Response Message
              </div>
              <div
                class="response-message-text text-negative font-mono text-body2"
              >
                {{
                  store.testResult.response_message ||
                  'Pengujian SNAP B2B Token gagal. Silakan periksa kembali konfigurasi kredensial atau status layanan upstream.'
                }}
              </div>
            </div>
          </div>

          <!-- Notice: No fake token issued -->
          <div class="col-12">
            <div
              class="failure-token-notice q-pa-sm text-caption text-grey-8 italic"
            >
              <q-icon name="info" color="grey-7" class="q-mr-xs" />
              Tidak ada SNAP B2B Access Token yang diterbitkan (pengujian gagal
              atau upstream error).
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
.stat-box-failed {
  background: #fdf5f4;
  border-color: #f1cfcb;
}
.endpoint-box {
  background: #fbf9f5;
  border: 1px solid #ebd8b0;
  border-radius: 8px;
  word-break: break-all;
}
.endpoint-box-failed {
  background: #fdf5f4;
  border: 1px solid #f1cfcb;
  border-radius: 8px;
  word-break: break-all;
}
.response-message-box {
  background: #fdf5f4;
  border: 1px solid #f1cfcb;
  border-radius: 8px;
}
.response-message-text {
  word-break: break-word;
}
.failure-token-notice {
  background: #f8f6f0;
  border: 1px dashed #d5cebf;
  border-radius: 8px;
}
.border-warning {
  border: 1px solid #e6c575;
}
.border-negative {
  border: 1px solid #e8b4ad;
}
</style>
