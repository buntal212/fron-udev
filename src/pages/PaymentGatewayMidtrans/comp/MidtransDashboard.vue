<template>
  <div class="q-gutter-y-md">
    <!-- Header Summary Cards -->
    <div class="row q-col-gutter-md">
      <!-- Card 1: Status Koneksi & Gateway -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="metric-card">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div>
                <p class="metric-title">STATUS GATEWAY</p>
                <div class="row items-center q-gutter-x-sm">
                  <q-badge
                    :color="
                      store.dashboardSummary?.api_status === 'online'
                        ? 'positive'
                        : store.dashboardSummary?.api_status === 'error'
                          ? 'negative'
                          : 'grey-7'
                    "
                    class="text-weight-bold"
                  >
                    {{
                      store.dashboardSummary?.api_status === 'online'
                        ? 'ONLINE'
                        : store.dashboardSummary?.api_status === 'error'
                          ? 'ERROR'
                          : 'BELUM DIUJI'
                    }}
                  </q-badge>
                  <span class="text-caption text-grey-7">Sandbox Core API</span>
                </div>
              </div>
              <div class="metric-icon-wrap bg-amber-1 text-amber-9">
                <q-icon name="cloud_done" size="24px" />
              </div>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              {{
                store.dashboardSummary?.latest_test
                  ? 'Terakhir diuji: ' +
                    store.dashboardSummary.latest_test.tested_at
                  : 'Belum ada uji coba koneksi'
              }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Card 2: Merchant Aktif & Siap -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="metric-card">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div>
                <p class="metric-title">TOTAL MERCHANT</p>
                <div class="text-h5 text-weight-bolder text-dark">
                  {{ store.dashboardSummary?.total_merchants ?? 0 }}
                  <span class="text-caption text-weight-normal text-grey-7">
                    ({{ store.dashboardSummary?.active_merchants ?? 0 }} aktif)
                  </span>
                </div>
              </div>
              <div class="metric-icon-wrap bg-blue-1 text-primary">
                <q-icon name="storefront" size="24px" />
              </div>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              {{ store.dashboardSummary?.configured_merchants ?? 0 }} merchant
              terkonfigurasi Server Key
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Card 3: Mapping Aplikasi Aktif -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="metric-card">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div>
                <p class="metric-title">MAPPING APLIKASI</p>
                <div class="text-h5 text-weight-bolder text-dark">
                  {{ store.dashboardSummary?.total_mappings ?? 0 }}
                  <span class="text-caption text-weight-normal text-grey-7">
                    ({{ store.dashboardSummary?.active_mappings ?? 0 }} aktif)
                  </span>
                </div>
              </div>
              <div class="metric-icon-wrap bg-green-1 text-positive">
                <q-icon name="account_tree" size="24px" />
              </div>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              Terhubung ke Billing UDEV
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Card 4: Transaksi Billing & Simulasi -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="metric-card">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div>
                <p class="metric-title">TRANSAKSI BILLING</p>
                <div class="text-h5 text-weight-bolder text-dark">
                  {{ store.dashboardSummary?.total_billing_transactions ?? 0 }}
                  <span class="text-caption text-weight-normal text-grey-7">
                    ({{
                      store.dashboardSummary?.successful_billing_transactions ??
                      0
                    }}
                    berhasil)
                  </span>
                </div>
              </div>
              <div class="metric-icon-wrap bg-purple-1 text-purple-9">
                <q-icon name="receipt_long" size="24px" />
              </div>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
              {{ store.dashboardSummary?.total_sandbox_tests ?? 0 }} simulasi
              sandbox telah dijalankan
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Status Banner for Selected Merchant -->
    <q-card flat bordered class="merchant-status-card">
      <q-card-section>
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-md-8">
            <div class="row items-center q-gutter-x-sm q-mb-xs">
              <span class="text-weight-bold text-subtitle1">
                {{
                  store.currentMerchantObj?.merchant_name ||
                  store.selectedMerchant
                }}
              </span>
              <q-badge
                :color="
                  store.isReady
                    ? 'positive'
                    : store.isConfigured
                      ? 'warning'
                      : 'negative'
                "
                class="text-weight-bold"
              >
                {{
                  store.isReady
                    ? 'SIAP CHECKOUT'
                    : store.isConfigured
                      ? 'MENUNGGU AKTIVASI'
                      : 'BELUM TERKONFIGURASI'
                }}
              </q-badge>
              <q-badge color="grey-8"
                >Kode: {{ store.selectedMerchant }}</q-badge
              >
            </div>
            <p class="text-caption text-grey-7 q-mb-none">
              {{
                store.isReady
                  ? 'Merchant ini telah siap memproses pembayaran Midtrans Sandbox (QRIS, VA, dsb) secara otomatis melalui Billing UDEV.'
                  : 'Server Key Midtrans belum diisi atau status merchant nonaktif. Lengkapi konfigurasi API pada tab Konfigurasi API.'
              }}
            </p>
          </div>

          <div class="col-12 col-md-auto row items-center q-gutter-sm">
            <q-btn
              outline
              color="warning"
              icon="sync_alt"
              label="Uji Koneksi Sandbox"
              no-caps
              :loading="store.testingConnection"
              @click="store.testConnection"
            />
            <q-btn
              color="warning"
              text-color="dark"
              icon="vpn_key"
              label="Kelola Kredensial"
              no-caps
              @click="$emit('navigate', 'credentials')"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Information & Security Highlights -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div
              class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs q-mb-sm"
            >
              <q-icon name="security" color="warning" size="20px" />
              <span>Standar Keamanan Kredensial UDEV</span>
            </div>
            <ul
              class="text-caption text-grey-8 q-pl-md q-my-none q-gutter-y-xs"
            >
              <li>
                <strong>Enkripsi Backend:</strong> Server Key dan Signature
                Secret Key dienkripsi menggunakan AES-256-GCM dengan kunci HKDF
                terisolasi.
              </li>
              <li>
                <strong>Zero Secret Plaintext:</strong> Secret tidak pernah
                dikembalikan ke antarmuka pengguna atau browser setelah
                disimpan.
              </li>
              <li>
                <strong>Verifikasi SHA512 Webhook:</strong> Webhook notifikasi
                Midtrans diverifikasi secara ketat sebelum mutasi status
                pembayaran.
              </li>
              <li>
                <strong>Isolasi Merchant:</strong> Transaksi dan konfigurasi
                dipisahkan secara ketat antar-merchant Sandbox.
              </li>
            </ul>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div
              class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs q-mb-sm"
            >
              <q-icon name="hub" color="warning" size="20px" />
              <span>Integrasi 3-Tier UDEV</span>
            </div>
            <div class="text-caption text-grey-8 q-gutter-y-xs">
              <p class="q-mb-xs">
                Sistem ini terintegrasi secara otomatis antara
                <strong>Quasar Frontend (fron-udev)</strong>,
                <strong>Centralized Billing (apiudev-billing)</strong>, dan
                <strong>Midtrans Payment Microservice (mitrans-payment)</strong
                >.
              </p>
              <div class="row items-center q-gutter-x-sm q-mt-xs">
                <q-chip
                  dense
                  outline
                  color="primary"
                  label="Core API Sandbox v2"
                  icon="check"
                />
                <q-chip
                  dense
                  outline
                  color="positive"
                  label="QRIS & Virtual Account"
                  icon="check"
                />
                <q-chip
                  dense
                  outline
                  color="amber-9"
                  label="Webhook Auto-Reconciliation"
                  icon="check"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

defineEmits(['navigate'])

const store = usePaymentGatewayMidtransStore()
</script>

<style scoped>
.metric-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.metric-title {
  margin: 0 0 4px;
  color: #8d877e;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.metric-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: grid;
  place-items: center;
}
.merchant-status-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.info-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
</style>
