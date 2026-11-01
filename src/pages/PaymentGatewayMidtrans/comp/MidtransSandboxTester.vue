<template>
  <div class="q-gutter-y-md">
    <!-- Header -->
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Uji Coba Sandbox & Simulator Pembayaran
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Simulasikan pembuatan transaksi Core API Sandbox, pengujian koneksi,
          dan pengecekan status real-time.
        </p>
      </div>
    </div>

    <!-- Section 1: Uji Koneksi Probe -->
    <q-card flat bordered class="panel-card">
      <q-card-section>
        <div class="row items-center justify-between q-col-gutter-md">
          <div>
            <div
              class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
            >
              <q-icon name="wifi_tethering" color="warning" size="20px" />
              <span>1. Uji Koneksi ke Midtrans Core API Sandbox</span>
            </div>
            <p class="text-caption text-grey-7 q-my-none">
              Mengirim request otentikasi menggunakan Server Key merchant
              <strong>{{ store.selectedMerchant }}</strong
              >.
            </p>
          </div>

          <div>
            <q-btn
              color="warning"
              text-color="dark"
              icon="sync_alt"
              label="Jalankan Uji Koneksi"
              no-caps
              :loading="store.testingConnection"
              :disable="!store.config?.has_server_key"
              @click="store.testConnection"
            />
          </div>
        </div>

        <!-- Connection Result Banner -->
        <div v-if="store.connectionResult" class="q-mt-md">
          <q-banner
            rounded
            :class="
              store.connectionResult.is_connected
                ? 'bg-green-1 text-positive border-green'
                : 'bg-red-1 text-negative border-red'
            "
          >
            <template #avatar>
              <q-icon
                :name="
                  store.connectionResult.is_connected ? 'check_circle' : 'error'
                "
                size="24px"
              />
            </template>
            <div class="text-weight-bold text-body2">
              {{
                store.connectionResult.is_connected
                  ? 'Koneksi Berhasil'
                  : 'Koneksi Gagal'
              }}
            </div>
            <div class="text-caption">
              {{ store.connectionResult.message }}
            </div>
            <div
              class="row items-center q-gutter-x-md text-caption q-mt-xs text-grey-8"
            >
              <span
                >Status HTTP:
                <strong>{{ store.connectionResult.http_status }}</strong></span
              >
              <span
                >Latensi:
                <strong
                  >{{ store.connectionResult.latency_ms }} ms</strong
                ></span
              >
              <span
                >Waktu:
                <strong>{{ store.connectionResult.tested_at }}</strong></span
              >
            </div>
          </q-banner>
        </div>
      </q-card-section>
    </q-card>

    <!-- Section 2: Simulator Pembayaran Sandbox -->
    <q-card flat bordered class="panel-card">
      <q-card-section>
        <div
          class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs q-mb-xs"
        >
          <q-icon name="point_of_sale" color="warning" size="20px" />
          <span>2. Simulator Pembuatan Transaksi Core API</span>
        </div>
        <p class="text-caption text-grey-7 q-mb-md">
          Buat transaksi charge sandbox untuk menguji respon QRIS atau nomor
          Virtual Account.
        </p>

        <q-form class="q-gutter-y-md" @submit="store.createSandboxPayment">
          <div class="row q-col-gutter-md">
            <!-- Order ID -->
            <div class="col-12 col-md-4">
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Order ID (Opsional)
              </label>
              <q-input
                v-model="store.testPaymentForm.order_id"
                outlined
                dense
                placeholder="Kosongkan untuk auto-generate"
                hint="ID unik untuk order sandbox"
              />
            </div>

            <!-- Amount -->
            <div class="col-12 col-md-4">
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Nominal Pembayaran (IDR) <span class="text-negative">*</span>
              </label>
              <q-input
                v-model.number="store.testPaymentForm.amount"
                outlined
                dense
                type="number"
                min="1000"
                step="1000"
                hint="Minimal Rp 1.000"
              />
            </div>

            <!-- Payment Type -->
            <div class="col-12 col-md-4">
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Metode Pembayaran
              </label>
              <q-select
                v-model="store.testPaymentForm.payment_type"
                outlined
                dense
                emit-value
                map-options
                :options="paymentTypeOptions"
              />
            </div>

            <!-- Bank Selection (for Bank Transfer) -->
            <div
              v-if="store.testPaymentForm.payment_type === 'bank_transfer'"
              class="col-12 col-md-4"
            >
              <label
                class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
              >
                Pilih Bank Virtual Account
              </label>
              <q-select
                v-model="store.testPaymentForm.bank"
                outlined
                dense
                emit-value
                map-options
                :options="bankOptions"
              />
            </div>
          </div>

          <div class="row justify-end q-mt-sm">
            <q-btn
              type="submit"
              color="warning"
              text-color="dark"
              icon="send"
              label="Buat Transaksi Sandbox"
              no-caps
              :loading="store.creatingTestPayment"
              :disable="!store.config?.has_server_key"
            />
          </div>
        </q-form>

        <!-- Result of Test Payment -->
        <div v-if="store.testPaymentResult" class="q-mt-lg">
          <q-separator class="q-mb-md" />
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-weight-bold text-subtitle2">
              Hasil Respon Pembayaran Sandbox:
            </div>
            <div class="row q-gutter-x-sm">
              <q-btn
                outline
                dense
                color="primary"
                icon="sync"
                label="Cek Status Sekarang"
                no-caps
                :loading="store.queryingStatus"
                @click="
                  store.querySandboxStatus(store.testPaymentResult.order_id)
                "
              />
            </div>
          </div>

          <div class="row q-col-gutter-md items-start">
            <!-- Left: Transaction Info -->
            <div class="col-12 col-md-7">
              <div class="bg-grey-1 q-pa-md rounded-borders q-gutter-y-xs">
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">Order ID:</span>
                  <span class="text-weight-bold font-mono">{{
                    store.testPaymentResult.order_id
                  }}</span>
                </div>
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">Transaction ID:</span>
                  <span class="text-weight-bold font-mono">{{
                    store.testPaymentResult.transaction_id || '—'
                  }}</span>
                </div>
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">Nominal:</span>
                  <span class="text-weight-bold font-mono"
                    >Rp
                    {{
                      formatNumber(store.testPaymentResult.gross_amount)
                    }}</span
                  >
                </div>
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">Metode:</span>
                  <span class="text-weight-bold text-uppercase">{{
                    store.testPaymentResult.payment_type
                  }}</span>
                </div>
                <div class="row justify-between items-center">
                  <span class="text-caption text-grey-7"
                    >Status Transaksi:</span
                  >
                  <q-badge
                    :color="
                      statusColor(store.testPaymentResult.transaction_status)
                    "
                  >
                    {{
                      store.testPaymentResult.transaction_status?.toUpperCase()
                    }}
                  </q-badge>
                </div>
                <!-- VA numbers if any -->
                <div
                  v-if="store.testPaymentResult.va_numbers?.length"
                  class="q-mt-sm"
                >
                  <span class="text-caption text-grey-7"
                    >Nomor Virtual Account:</span
                  >
                  <div
                    v-for="va in store.testPaymentResult.va_numbers"
                    :key="va.va_number"
                    class="row items-center justify-between bg-white q-pa-xs rounded-borders q-mt-xs border-grey"
                  >
                    <span class="text-weight-bold text-uppercase"
                      >{{ va.bank }}:</span
                    >
                    <span
                      class="font-mono text-subtitle2 text-weight-bolder text-primary"
                      >{{ va.va_number }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: QR Code Visualizer (if QRIS) -->
            <div
              v-if="
                store.testPaymentResult.qr_string ||
                store.testPaymentResult.checkout_url
              "
              class="col-12 col-md-5 text-center"
            >
              <div
                class="bg-white q-pa-md rounded-borders border-grey text-center"
              >
                <div class="text-caption text-weight-bold text-grey-8 q-mb-xs"
                  >KODE QRIS SANDBOX</div
                >
                <canvas ref="qrCanvasRef" style="max-width: 180px"></canvas>
                <div
                  v-if="store.testPaymentResult.checkout_url"
                  class="q-mt-xs"
                >
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="open_in_new"
                    label="Buka Gambar QR"
                    type="a"
                    :href="store.testPaymentResult.checkout_url"
                    target="_blank"
                    no-caps
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Section 3: Riwayat Simulasi Sandbox -->
    <q-card flat bordered class="panel-card">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div
            class="text-subtitle2 text-weight-bold row items-center q-gutter-x-xs"
          >
            <q-icon name="history" color="warning" size="20px" />
            <span>Riwayat Simulasi Sandbox</span>
          </div>

          <q-btn
            outline
            dense
            color="warning"
            icon="refresh"
            label="Refresh"
            no-caps
            :loading="store.sandboxHistoryLoading"
            @click="store.fetchSandboxHistory"
          />
        </div>

        <q-table
          flat
          bordered
          :rows="store.sandboxHistory"
          :columns="historyColumns"
          :loading="store.sandboxHistoryLoading"
          row-key="id"
          no-data-label="Belum ada riwayat simulasi sandbox."
          class="history-table"
        >
          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-order_id="props">
            <q-td :props="props">
              <span class="font-mono text-weight-bold">{{
                props.row.metadata?.order_id || '—'
              }}</span>
            </q-td>
          </template>

          <template #body-cell-gross_amount="props">
            <q-td :props="props" class="text-right">
              <span class="font-mono"
                >Rp {{ formatNumber(props.row.metadata?.gross_amount) }}</span
              >
            </q-td>
          </template>

          <template #body-cell-payment_type="props">
            <q-td :props="props" class="text-center">
              <span class="text-uppercase text-caption text-weight-bold">{{
                props.row.metadata?.payment_type || '—'
              }}</span>
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props" class="text-center">
              <q-badge
                :color="
                  props.row.status === 'success' ? 'positive' : 'negative'
                "
              >
                {{ props.row.status?.toUpperCase() }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="props.row.metadata?.order_id"
                flat
                dense
                color="primary"
                icon="sync"
                label="Cek Status"
                no-caps
                @click="store.querySandboxStatus(props.row.metadata.order_id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()
const qrCanvasRef = ref(null)

const paymentTypeOptions = [
  { label: 'QRIS (GoPay / ShopeePay / Mandiri)', value: 'qris' },
  { label: 'Virtual Account (Bank Transfer)', value: 'bank_transfer' },
  { label: 'GoPay Direct', value: 'gopay' }
]

const bankOptions = [
  { label: 'BCA Virtual Account', value: 'bca' },
  { label: 'BNI Virtual Account', value: 'bni' },
  { label: 'BRI Virtual Account', value: 'bri' },
  { label: 'Permata Virtual Account', value: 'permata' }
]

const historyColumns = [
  { name: 'created_at', label: 'WAKTU', align: 'left', field: 'created_at' },
  {
    name: 'order_id',
    label: 'ORDER ID',
    align: 'left',
    field: row => row.metadata?.order_id
  },
  {
    name: 'gross_amount',
    label: 'NOMINAL',
    align: 'right',
    field: row => row.metadata?.gross_amount
  },
  {
    name: 'payment_type',
    label: 'METODE',
    align: 'center',
    field: row => row.metadata?.payment_type
  },
  { name: 'status', label: 'HASIL', align: 'center', field: 'status' },
  { name: 'actions', label: 'AKSI', align: 'right' }
]

watch(
  () => store.testPaymentResult,
  async newResult => {
    if (newResult?.qr_string) {
      await nextTick()
      if (qrCanvasRef.value) {
        try {
          QRCode.toCanvas(qrCanvasRef.value, newResult.qr_string, {
            width: 180,
            margin: 1
          })
        } catch (e) {
          console.error('Failed to generate QR canvas:', e)
        }
      }
    }
  }
)

function formatNumber(val) {
  if (!val) return '0'
  return Number(val).toLocaleString('id-ID')
}

function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'medium'
  })
}

function statusColor(status) {
  switch (status) {
    case 'settlement':
    case 'capture':
      return 'positive'
    case 'pending':
      return 'warning'
    case 'deny':
    case 'cancel':
    case 'expire':
      return 'negative'
    default:
      return 'grey-7'
  }
}
</script>

<style scoped>
.panel-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.history-table {
  background: #ffffff;
  border-radius: 12px;
}
.border-green {
  border: 1px solid #b7eb8f;
}
.border-red {
  border: 1px solid #ffa39e;
}
.border-grey {
  border: 1px solid #e8e8e8;
}
.font-mono {
  font-family: monospace;
}
</style>
