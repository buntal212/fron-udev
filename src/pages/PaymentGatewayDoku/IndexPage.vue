<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Payment Gateway DOKU" />

      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">PENGATURAN</p>
          <h1>Payment Gateway DOKU</h1>
          <p class="page-description">
            Kelola konfigurasi merchant dan integrasi pembayaran multichannel
            DOKU dari satu halaman terpusat.
          </p>
        </div>
      </div>

      <q-card flat bordered class="placeholder-card q-pa-lg q-mt-lg">
        <div class="column items-center text-center q-py-md">
          <div class="placeholder-icon-wrap q-mb-md">
            <q-icon name="credit_card" size="38px" />
          </div>

          <q-badge
            class="status-badge q-mb-sm q-px-sm q-py-xs"
            label="Dalam Pengembangan"
          />

          <h2 class="placeholder-title">Payment Gateway DOKU</h2>
          <p class="placeholder-subtitle">
            Halaman integrasi DOKU sedang dipersiapkan. Fitur ini nantinya akan
            mencakup konfigurasi kredensial merchant, manajemen kanal pembayaran
            (Virtual Account, Kartu Kredit, QRIS), serta rekonsiliasi transaksi
            otomatis.
          </p>

          <div class="row q-gutter-sm q-mt-md">
            <q-btn
              color="warning"
              text-color="dark"
              icon="account_balance_wallet"
              label="Buka Payment Gateway DANA"
              no-caps
              to="/payment-gateway"
            />
            <q-btn
              outline
              color="dark"
              icon="space_dashboard"
              label="Kembali ke Dashboard"
              no-caps
              to="/"
            />
          </div>
        </div>

        <q-separator class="q-my-lg" />

        <div class="planned-section q-px-sm">
          <h3 class="planned-heading">Rencana Fitur DOKU</h3>
          <div class="row q-col-gutter-md q-mt-xs">
            <div
              v-for="feature in plannedFeatures"
              :key="feature.title"
              class="col-12 col-sm-6 col-md-3"
            >
              <q-card flat bordered class="feature-card h-100">
                <q-card-section>
                  <div class="row items-center no-wrap q-mb-sm">
                    <q-avatar
                      size="36px"
                      class="feature-avatar text-white"
                      :icon="feature.icon"
                    />
                    <div class="feature-title q-ml-sm">
                      {{ feature.title }}
                    </div>
                  </div>
                  <div class="feature-desc">
                    {{ feature.description }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

const plannedFeatures = [
  {
    title: 'Kredensial Merchant',
    description:
      'Manajemen Client ID, Shared Key, dan konfigurasi environment Sandbox/Production.',
    icon: 'vpn_key'
  },
  {
    title: 'Multichannel Payment',
    description:
      'Dukungan Virtual Account lintas bank, Kartu Kredit/Debit, dan QRIS DOKU.',
    icon: 'account_balance'
  },
  {
    title: 'Notifikasi Webhook',
    description:
      'Verifikasi signature notifikasi callback secara real-time dan andal.',
    icon: 'notifications_active'
  },
  {
    title: 'Audit & Rekonsiliasi',
    description:
      'Pemantauan status transaksi billing dan sinkronisasi berkala data pembayaran.',
    icon: 'receipt_long'
  }
]
</script>

<style scoped>
.content-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.71rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0 0 5px;
  color: #17130c;
  font-size: 1.7rem;
}

.page-description {
  margin: 0;
  color: #716a5d;
  font-size: 0.88rem;
}

.placeholder-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 14px;
}

.placeholder-icon-wrap {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border: 1px solid #e6bd5d;
  background: linear-gradient(145deg, #f3cc6e, #b88924);
  color: #17130c;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(184, 137, 36, 0.2);
}

.status-badge {
  background: rgba(214, 173, 77, 0.18);
  color: #926d18;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 6px;
  font-size: 0.75rem;
}

.placeholder-title {
  margin: 4px 0 8px;
  color: #17130c;
  font-size: 1.45rem;
  font-weight: 700;
}

.placeholder-subtitle {
  max-width: 680px;
  margin: 0;
  color: #716a5d;
  font-size: 0.92rem;
  line-height: 1.6;
}

.planned-heading {
  margin: 0 0 8px;
  color: #20180b;
  font-size: 1.05rem;
  font-weight: 700;
}

.feature-card {
  border: 1px solid #e8e2d5;
  border-radius: 10px;
  background: #fdfcf9;
  height: 100%;
}

.feature-avatar {
  background: linear-gradient(145deg, #2b251b, #0c0c0d);
  color: #e6bd5d !important;
  border: 1px solid rgba(214, 173, 77, 0.3);
}

.feature-title {
  color: #17130c;
  font-size: 0.88rem;
  font-weight: 700;
}

.feature-desc {
  color: #716a5d;
  font-size: 0.8rem;
  line-height: 1.45;
}
</style>
