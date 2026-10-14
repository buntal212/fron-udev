<template>
  <div>
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="card in cards"
        :key="card.label"
        class="col-12 col-sm-6 col-lg-4"
      >
        <StatCard v-bind="card" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-7">
        <q-card flat bordered class="panel full-height">
          <q-card-section class="row items-start justify-between">
            <div>
              <h2>Tren pembayaran</h2>
              <p>Nilai ilustratif pembayaran terverifikasi per bulan.</p>
            </div>
            <q-badge outline color="warning" label="DEMO" />
          </q-card-section>
          <q-separator />
          <q-card-section class="chart-wrap">
            <div class="chart">
              <div
                v-for="point in store.paymentTrend"
                :key="point.label"
                class="bar-column"
              >
                <div class="bar-value">{{ point.value }}</div>
                <div class="bar-track">
                  <div class="bar" :style="{ height: `${point.value}%` }" />
                </div>
                <span>{{ point.label }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card flat bordered class="panel full-height">
          <q-card-section>
            <h2>Ruang lingkup admin</h2>
            <p>Semua pembayaran tahap awal dikelola administrator UDEV.</p>
          </q-card-section>
          <q-separator />
          <q-list separator>
            <q-item v-for="item in adminScopes" :key="item.label">
              <q-item-section avatar>
                <q-icon :name="item.icon" color="warning" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
                <q-item-label caption>{{ item.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12">
        <q-card flat bordered class="panel">
          <q-card-section class="row items-center justify-between">
            <div>
              <h2>Tagihan terbaru</h2>
              <p>Data contoh untuk rancangan integrasi UDEV Billing.</p>
            </div>
            <q-badge outline color="warning" label="DATA DEMO" />
          </q-card-section>
          <q-separator />
          <q-markup-table flat separator="horizontal" class="invoice-table">
            <thead>
              <tr>
                <th class="text-left">Nomor tagihan</th>
                <th class="text-left">Pelanggan</th>
                <th class="text-left">Aplikasi</th>
                <th class="text-right">Nominal</th>
                <th class="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in store.recentInvoices" :key="invoice.number">
                <td>{{ invoice.number }}</td>
                <td>{{ invoice.customer }}</td>
                <td>{{ invoice.application }}</td>
                <td class="text-right">{{ formatCurrency(invoice.amount) }}</td>
                <td>
                  <q-badge
                    :color="statusColor(invoice.status)"
                    :label="invoice.status"
                    rounded
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatCard from '@/components/StatCard.vue'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()

const cards = computed(() => [
  {
    label: 'Aplikasi',
    value: store.summary.applications,
    icon: 'apps',
    color: 'amber-9'
  },
  {
    label: 'Pelanggan aplikasi',
    value: store.summary.customers,
    icon: 'groups',
    color: 'brown-7'
  },
  {
    label: 'Langganan aktif',
    value: store.summary.activeSubscriptions,
    icon: 'verified',
    color: 'positive'
  },
  {
    label: 'Tagihan belum dibayar',
    value: store.summary.unpaidInvoices,
    icon: 'receipt_long',
    color: 'negative'
  },
  {
    label: 'Pembayaran terverifikasi',
    value: formatCurrency(store.summary.verifiedPayments),
    icon: 'payments',
    color: 'amber-10'
  },
  {
    label: 'Pembayaran pending',
    value: store.summary.pendingPayments,
    icon: 'pending_actions',
    color: 'warning'
  }
])

const adminScopes = [
  {
    icon: 'fact_check',
    label: 'Verifikasi pembayaran',
    description: 'Pemeriksaan pembayaran dilakukan admin.'
  },
  {
    icon: 'sync_problem',
    label: 'Rekonsiliasi aman',
    description:
      'Kasus bermasalah disiapkan untuk ditangani tanpa perubahan status sembarang.'
  },
  {
    icon: 'restart_alt',
    label: 'Aktivasi idempoten',
    description: 'Aktivasi langganan akan diulang aman saat backend tersedia.'
  }
]

const formatCurrency = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)

const statusColor = status => {
  if (status === 'Terverifikasi') return 'positive'
  if (status === 'Menunggu verifikasi') return 'warning'
  return 'grey-7'
}
</script>

<style scoped>
h2 {
  margin: 0 0 4px;
  color: #20180b;
  font-size: 1.02rem;
}

p {
  margin: 0;
  color: #746b5c;
  font-size: 0.82rem;
}

.panel {
  border-color: #e0d7c6;
  border-radius: 14px;
}

.chart-wrap {
  min-height: 255px;
}

.chart {
  display: flex;
  height: 205px;
  align-items: end;
  justify-content: space-around;
  gap: 15px;
}

.bar-column {
  display: grid;
  flex: 1;
  height: 100%;
  min-width: 28px;
  grid-template-rows: 20px 1fr 24px;
  justify-items: center;
  color: #796f60;
  font-size: 0.72rem;
}

.bar-value {
  color: #7a5a13;
  font-weight: 700;
}

.bar-track {
  display: flex;
  width: min(38px, 100%);
  height: 100%;
  align-items: end;
  background: #f5eee0;
  border-radius: 8px 8px 3px 3px;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #e7bf5a, #b58117);
  border-radius: inherit;
}

.invoice-table th {
  color: #756b5c;
  font-size: 0.72rem;
  font-weight: 800;
}
</style>
