<template>
  <div class="dana-fee-management">
    <!-- Header Summary & Policies -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2>Pengaturan Biaya Payment Gateway DANA</h2>
        <p class="section-description">
          Konfigurasi tarif biaya DANA (gateway) dan biaya platform UDEV untuk
          setiap metode pembayaran. Kedua biaya dibebankan kepada pelanggan dan
          hak pemilik aplikasi dijamin tetap utuh sebesar tagihan pokok.
        </p>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat ulang"
          no-caps
          :loading="store.feesLoading"
          @click="store.fetchFees(true)"
        />
        <q-btn
          color="warning"
          text-color="dark"
          icon="add"
          label="Tambah Biaya Metode"
          no-caps
          class="text-weight-bold"
          @click="store.openCreateFeeDialog"
        />
      </div>
    </div>

    <!-- Simulation Calculator Card -->
    <q-card flat bordered class="sim-card q-pa-md q-mb-lg">
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center q-gutter-sm">
          <q-icon name="calculate" size="22px" color="warning" />
          <span class="text-subtitle1 text-weight-bold text-sand"
            >Simulasi Perhitungan Biaya Checkout</span
          >
          <q-badge color="teal-9" text-color="white" class="text-weight-bold">
            Customer-Borne Fee
          </q-badge>
        </div>
        <q-btn
          dense
          flat
          round
          :icon="simExpanded ? 'expand_less' : 'expand_more'"
          color="grey-5"
          @click="simExpanded = !simExpanded"
        >
          <q-tooltip>{{ simExpanded ? 'Sembunyikan' : 'Tampilkan' }}</q-tooltip>
        </q-btn>
      </div>

      <q-slide-transition>
        <div v-show="simExpanded">
          <div class="row q-col-gutter-md items-end q-mt-xs">
            <div class="col-12 col-sm-6 col-md-3">
              <label class="text-caption text-sand block q-mb-xs">
                Tagihan Pokok (Rp)
              </label>
              <q-input
                v-model.number="store.feeCalcForm.amount"
                type="number"
                outlined
                dense
                bg-color="dark"
                prefix="Rp"
                min="1000"
                step="1000"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <label class="text-caption text-sand block q-mb-xs">
                Metode Pembayaran
              </label>
              <q-select
                v-model="store.feeCalcForm.payment_method"
                outlined
                dense
                emit-value
                map-options
                bg-color="dark"
                :options="paymentMethodOptions"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <label class="text-caption text-sand block q-mb-xs">
                Environment
              </label>
              <q-select
                v-model="store.feeCalcForm.environment"
                outlined
                dense
                emit-value
                map-options
                bg-color="dark"
                :options="environmentOptions"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <label class="text-caption text-sand block q-mb-xs">
                Merchant DANA (Opsional)
              </label>
              <q-select
                v-model="store.feeCalcForm.gateway_merchant_code"
                outlined
                dense
                emit-value
                map-options
                clearable
                bg-color="dark"
                placeholder="Default UDEV"
                :options="calcMerchantOptions"
              />
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <label class="text-caption text-sand block q-mb-xs">
                Aplikasi (Opsional)
              </label>
              <q-select
                v-model="store.feeCalcForm.application_id"
                outlined
                dense
                emit-value
                map-options
                clearable
                bg-color="dark"
                placeholder="Default Global"
                :options="appOptionsWithGlobal"
              />
            </div>

            <div class="col-12 col-md-1">
              <q-btn
                unelevated
                color="warning"
                text-color="dark"
                icon="bolt"
                label="Hitung"
                class="full-width text-weight-bold"
                :loading="store.feeCalcLoading"
                @click="store.calculateFeePreview"
              />
            </div>
          </div>

          <!-- Simulation Result Box -->
          <div
            v-if="store.feeCalcResult"
            class="sim-result-box q-pa-md q-mt-md rounded-borders"
          >
            <div class="row q-col-gutter-md items-center text-center">
              <div class="col-12 col-sm-6 col-md-2">
                <div class="text-caption text-muted">Tagihan Pokok</div>
                <div class="text-subtitle1 text-weight-bold text-sand">
                  {{ formatRupiah(store.feeCalcResult.base_amount) }}
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-2">
                <div class="text-caption text-muted">Biaya DANA (Gateway)</div>
                <div class="text-subtitle1 text-weight-bold text-blue-4">
                  + {{ formatRupiah(store.feeCalcResult.dana_fee) }}
                </div>
                <div class="text-caption text-grey-5">
                  {{
                    store.feeCalcResult.dana_fee_details?.fee_unit === 'percent'
                      ? `${store.feeCalcResult.dana_fee_details?.fee_value}% tagihan`
                      : 'Tetap'
                  }}
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-2">
                <div class="text-caption text-muted">Biaya UDEV (Platform)</div>
                <div class="text-subtitle1 text-weight-bold text-indigo-3">
                  + {{ formatRupiah(store.feeCalcResult.udev_fee) }}
                </div>
                <div class="text-caption text-grey-5">
                  {{
                    store.feeCalcResult.udev_fee_details?.fee_unit === 'percent'
                      ? `${store.feeCalcResult.udev_fee_details?.fee_value}% tagihan`
                      : 'Tetap'
                  }}
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="text-caption text-muted">Total Bayar Pelanggan</div>
                <div class="text-h6 text-weight-bolder text-warning">
                  {{ formatRupiah(store.feeCalcResult.total_amount) }}
                </div>
                <div class="text-caption text-grey-5">
                  Total = Pokok + DANA + UDEV
                </div>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <div class="text-caption text-muted">Hak Pemilik Aplikasi</div>
                <div class="text-subtitle1 text-weight-bold text-positive">
                  {{
                    formatRupiah(store.feeCalcResult.estimated_net_settlement)
                  }}
                </div>
                <q-badge
                  color="positive"
                  text-color="white"
                  class="text-weight-bold q-px-sm"
                >
                  <q-icon name="check_circle" size="14px" class="q-mr-xs" />
                  100% Hak Utuh
                </q-badge>
              </div>
            </div>
          </div>
        </div>
      </q-slide-transition>
    </q-card>

    <!-- Filter Bar -->
    <q-card flat bordered class="fee-filter-card q-pa-md q-mb-md">
      <div class="row items-center q-col-gutter-sm">
        <div class="col-12 col-md-3">
          <q-input
            v-model="store.feeFilter.search"
            outlined
            dense
            debounce="300"
            placeholder="Cari metode atau catatan..."
            clearable
            bg-color="white"
            @update:model-value="onFilterChanged"
          >
            <template #prepend>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <q-select
            v-model="store.feeFilter.environment"
            outlined
            dense
            emit-value
            map-options
            label="Environment"
            bg-color="white"
            :options="[
              { label: 'Semua Environment', value: null },
              { label: 'Sandbox', value: 'sandbox' },
              { label: 'Production', value: 'production' }
            ]"
            @update:model-value="onFilterChanged"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <q-select
            v-model="store.feeFilter.gateway_merchant_code"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Merchant DANA"
            bg-color="white"
            :options="filterMerchantOptions"
            @update:model-value="onFilterChanged"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <q-select
            v-model="store.feeFilter.application_id"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Cakupan Aplikasi"
            bg-color="white"
            :options="filterAppOptions"
            @update:model-value="onFilterChanged"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-1">
          <q-select
            v-model="store.feeFilter.fee_type"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Tipe"
            bg-color="white"
            :options="[
              { label: 'Semua', value: null },
              { label: 'DANA', value: 'dana' },
              { label: 'UDEV', value: 'udev' }
            ]"
            @update:model-value="onFilterChanged"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-2">
          <q-select
            v-model="store.feeFilter.status"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Status"
            bg-color="white"
            :options="[
              { label: 'Semua Status', value: null },
              { label: 'Hanya Aktif', value: 'active' },
              { label: 'Hanya Nonaktif', value: 'inactive' }
            ]"
            @update:model-value="onFilterChanged"
          />
        </div>
      </div>
    </q-card>

    <!-- Empty State -->
    <div
      v-if="!store.feesLoading && store.fees.length === 0"
      class="empty-state-box q-pa-xl text-center"
    >
      <q-icon name="payments" size="48px" color="grey-6" class="q-mb-sm" />
      <div class="text-h6 text-sand text-weight-bold">
        Belum Ada Aturan Biaya
      </div>
      <div class="text-caption text-muted q-mb-md">
        Belum ada aturan biaya DANA yang sesuai dengan filter. Klik tombol di
        bawah untuk menambahkan aturan tarif baru.
      </div>
      <q-btn
        unelevated
        no-caps
        color="warning"
        text-color="dark"
        icon="add"
        label="Tambah Biaya Pertama"
        class="text-weight-bold"
        @click="store.openCreateFeeDialog"
      />
    </div>

    <!-- Fee Cards List with Infinite Scroll -->
    <div v-else class="fee-card-list">
      <q-infinite-scroll
        ref="infiniteScrollRef"
        :offset="250"
        :disable="!store.feesHasMore || store.feesLoading"
        class="fee-infinite-scroll"
        @load="store.loadMoreFees"
      >
        <q-card
          v-for="fee in store.fees"
          :key="fee.id"
          flat
          bordered
          class="fee-item-card q-mb-md"
        >
          <!-- Header Bar -->
          <div
            class="card-header-bar q-px-md q-py-sm row items-center justify-between"
          >
            <!-- Left Badges -->
            <div class="row items-center q-gutter-xs">
              <q-badge
                color="dark"
                text-color="amber-3"
                class="text-weight-bold q-px-sm q-py-xs"
              >
                <q-icon
                  :name="methodIcon(fee.payment_method)"
                  size="14px"
                  class="q-mr-xs"
                />
                {{ methodLabel(fee.payment_method).toUpperCase() }}
              </q-badge>

              <q-badge
                :color="
                  fee.environment === 'production' ? 'negative' : 'amber-9'
                "
                :text-color="
                  fee.environment === 'production' ? 'white' : 'dark'
                "
                class="text-weight-bold q-px-xs"
              >
                {{ fee.environment.toUpperCase() }}
              </q-badge>

              <q-badge
                v-if="fee.gateway_merchant_code"
                rounded
                color="cyan-9"
                text-color="white"
                class="text-weight-bold q-px-sm"
              >
                <q-icon name="storefront" size="13px" class="q-mr-xs" />
                Merchant: {{ fee.gateway_merchant_code }}
              </q-badge>

              <q-badge
                rounded
                :color="fee.application_id ? 'purple-9' : 'teal-9'"
                class="text-weight-bold q-px-sm"
              >
                {{
                  fee.application
                    ? `Khusus: ${fee.application.name}`
                    : fee.gateway_merchant_code
                      ? 'Semua Aplikasi'
                      : 'Default Global'
                }}
              </q-badge>

              <q-badge
                rounded
                :color="fee.fee_type === 'dana' ? 'blue-9' : 'indigo-9'"
                :label="fee.fee_type === 'dana' ? 'Biaya DANA' : 'Biaya UDEV'"
                class="text-weight-bold q-px-sm"
              />
            </div>

            <!-- Right Actions & Toggle -->
            <div class="row items-center q-gutter-xs">
              <q-badge
                rounded
                :color="fee.is_active ? 'positive' : 'grey-7'"
                :label="fee.is_active ? 'Aktif' : 'Nonaktif'"
                class="text-weight-bold q-px-sm"
              />

              <q-toggle
                :model-value="fee.is_active"
                dense
                color="warning"
                class="q-ml-sm"
                @update:model-value="store.toggleFeeStatus(fee)"
              >
                <q-tooltip>{{
                  fee.is_active ? 'Nonaktifkan Aturan' : 'Aktifkan Aturan'
                }}</q-tooltip>
              </q-toggle>

              <q-btn
                flat
                round
                dense
                color="warning"
                icon="edit"
                aria-label="Edit biaya"
                @click="store.openEditFeeDialog(fee)"
              >
                <q-tooltip>Edit Aturan Biaya</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                aria-label="Hapus biaya"
                @click="store.confirmDeleteFee(fee)"
              >
                <q-tooltip>Hapus Aturan Biaya</q-tooltip>
              </q-btn>
            </div>
          </div>

          <q-separator class="gold-separator" />

          <!-- Card Content Body -->
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
              <!-- Kolom 1: Nilai Tarif -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Tarif Biaya</div>
                <div
                  class="metric-value text-gold-glow text-weight-bolder text-h6"
                >
                  {{ formatFeeValue(fee) }}
                </div>
                <div class="text-caption text-grey-5">
                  {{
                    fee.fee_unit === 'percent'
                      ? 'Dihitung dari tagihan pokok'
                      : 'Biaya tetap per transaksi'
                  }}
                </div>
              </div>

              <!-- Kolom 2: Pembebanan & Hak Mitra -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Kebijakan Pembebanan</div>
                <div class="text-body2 text-sand text-weight-medium">
                  Pelanggan menanggung biaya
                </div>
                <div class="text-caption text-positive">
                  Hak aplikasi: Tagihan pokok utuh
                </div>
              </div>

              <!-- Kolom 3: Catatan -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Catatan Aturan</div>
                <div class="text-body2 text-sand">
                  {{ fee.notes || '—' }}
                </div>
                <div class="text-caption text-grey-5">
                  Cakupan:
                  <span class="text-warning">{{
                    fee.gateway_merchant_code
                      ? `Merchant ${fee.gateway_merchant_code}${fee.application ? ` (App: ${fee.application.name})` : ''}`
                      : fee.application?.name
                        ? `App: ${fee.application.name}`
                        : 'Semua Aplikasi (Default)'
                  }}</span>
                </div>
              </div>

              <!-- Kolom 4: Timestamps -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Terakhir Diperbarui</div>
                <div class="text-body2 text-sand">
                  {{ formatDate(fee.updated_at) }}
                </div>
                <div class="text-caption text-grey-5">
                  Dibuat: {{ formatDate(fee.created_at) }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="warning" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="store.feeDeleteConfirmDialogOpen">
      <q-card class="bg-dark text-white" style="min-width: 380px">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6 text-weight-bold"
            >Hapus Aturan Biaya?</span
          >
        </q-card-section>

        <q-card-section class="q-pt-sm text-sand">
          Apakah Anda yakin ingin menghapus aturan biaya untuk metode
          <strong class="text-warning">{{
            methodLabel(store.feeToDelete?.payment_method)
          }}</strong>
          ({{ store.feeToDelete?.fee_type?.toUpperCase() }} -
          {{ store.feeToDelete?.environment?.toUpperCase() }})?
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Batal"
            text-color="grey-4"
            :disable="store.feeDeleting"
            @click="store.feeDeleteConfirmDialogOpen = false"
          />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Hapus Sekarang"
            :loading="store.feeDeleting"
            @click="store.deleteFee"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'
import { usePaymentGatewayStore } from '@/stores/paymentgateway'

const props = defineProps({
  applications: {
    type: Array,
    default: () => []
  }
})

const store = useDanaGatewayMerchantStore()
const paymentGatewayStore = usePaymentGatewayStore()
const infiniteScrollRef = ref(null)
const simExpanded = ref(true)

const effectiveApplications = computed(() =>
  props.applications.length > 0
    ? props.applications
    : paymentGatewayStore.applications
)

const appOptionsWithGlobal = computed(() => [
  { label: 'Default Global', value: null },
  ...effectiveApplications.value.map(app => ({
    label: app.name,
    value: app.id
  }))
])

const filterAppOptions = computed(() => [
  { label: 'Semua Cakupan', value: null },
  { label: 'Default Global', value: 'default' },
  ...effectiveApplications.value.map(app => ({
    label: `Khusus: ${app.name}`,
    value: app.id
  }))
])

function getMerchantCode(m) {
  if (!m) return ''
  return String(m.merchant_code || m.code || '').trim()
}

function getMerchantName(m) {
  if (!m) return ''
  return String(m.merchant_name || m.name || '').trim()
}

function formatMerchantLabel(m) {
  const code = getMerchantCode(m)
  const name = getMerchantName(m)
  if (!code && !name) return 'Merchant Tidak Dikenal'
  if (name && code && name.toLowerCase() !== code.toLowerCase()) {
    return `${name} (${code})`
  }
  return name || code
}

const filterMerchantOptions = computed(() => {
  const items = Array.isArray(store.items) ? store.items : []
  const mapped = items
    .map(m => {
      const code = getMerchantCode(m)
      const name = getMerchantName(m)
      if (!code && !name) return null
      return {
        label: formatMerchantLabel(m),
        value: code || name
      }
    })
    .filter(Boolean)

  return [{ label: 'Semua Merchant', value: null }, ...mapped]
})

const calcMerchantOptions = computed(() => {
  const items = Array.isArray(store.items) ? store.items : []
  const mapped = items
    .map(m => {
      const code = getMerchantCode(m)
      const name = getMerchantName(m)
      if (!code && !name) return null
      return {
        label: formatMerchantLabel(m),
        value: code || name
      }
    })
    .filter(Boolean)

  return [{ label: 'Default UDEV', value: null }, ...mapped]
})

const paymentMethodOptions = [
  { label: 'QRIS (0.70%)', value: 'qris' },
  { label: 'DANA Wallet (1.50%)', value: 'dana_wallet' },
  { label: 'VA BRI (Rp 4.000)', value: 'va_bri' },
  { label: 'VA CIMB Niaga (Rp 4.000)', value: 'va_cimb' },
  { label: 'VA BTPN (Rp 4.000)', value: 'va_btpn' },
  { label: 'VA Panin (Rp 4.000)', value: 'va_pani' }
]

const environmentOptions = [
  { label: 'Sandbox', value: 'sandbox' },
  { label: 'Production', value: 'production' }
]

onMounted(async () => {
  if (!store.items || store.items.length === 0) {
    store.fetchMerchants().catch(() => {})
  }
  await store.fetchFees(true)
  if (!store.feeCalcResult) {
    store.calculateFeePreview()
  }
})

function onFilterChanged() {
  store.fetchFees(true)
}

function methodLabel(method) {
  const map = {
    qris: 'QRIS',
    dana_wallet: 'DANA Wallet',
    va_bri: 'VA BRI',
    va_cimb: 'VA CIMB Niaga',
    va_btpn: 'VA BTPN',
    va_pani: 'VA Panin'
  }
  return map[method] || method || '—'
}

function methodIcon(method) {
  if (method === 'qris') return 'qr_code_2'
  if (method === 'dana_wallet') return 'account_balance_wallet'
  return 'account_balance'
}

function formatFeeValue(fee) {
  if (fee.fee_unit === 'percent') {
    const rate = Number(fee.fee_value || 0)
    return `${rate.toFixed(2).replace(/\.?0+$/, '')}%`
  }
  return formatRupiah(fee.fee_value || 0)
}

function formatRupiah(amount) {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID')
}

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return val
  }
}
</script>

<style scoped>
.dana-fee-management {
  max-width: 1440px;
}

.section-description {
  margin: 0;
  color: #716a5d;
  font-size: 0.88rem;
}

.sim-card {
  background: #19191e;
  border: 1px solid rgba(224, 195, 124, 0.35);
  border-radius: 10px;
}

.sim-result-box {
  background: #141418;
  border: 1px solid rgba(224, 195, 124, 0.2);
}

.fee-filter-card {
  background: #fff;
  border: 1px solid #e0d7c6;
  border-radius: 8px;
}

.fee-item-card {
  background: #19191e;
  border: 1px solid rgba(224, 195, 124, 0.2);
  border-radius: 8px;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.fee-item-card:hover {
  border-color: #e0c37c;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.card-header-bar {
  background: #141418;
  border-bottom: 1px solid rgba(224, 195, 124, 0.15);
}

.gold-separator {
  background: rgba(224, 195, 124, 0.15);
}

.metric-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  margin-bottom: 4px;
}

.text-gold-glow {
  color: #f6c85f;
  text-shadow: 0 0 10px rgba(246, 200, 95, 0.25);
}

.text-sand {
  color: #f5f0e6;
}

.text-muted {
  color: #a0a0a8;
}

.empty-state-box {
  background: #19191e;
  border: 1px dashed rgba(224, 195, 124, 0.3);
  border-radius: 8px;
}
</style>
