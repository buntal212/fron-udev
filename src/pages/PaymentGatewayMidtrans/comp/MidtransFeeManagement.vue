<template>
  <div class="midtrans-fee-management">
    <!-- Top Filter & Action Bar -->
    <q-card flat bordered class="fee-filter-card q-pa-md q-mb-md">
      <div class="row items-center justify-between q-col-gutter-md">
        <!-- Search & Filter Controls -->
        <div class="col-12 col-md-8 row items-center q-gutter-sm">
          <q-input
            v-model="store.feeFilter.search"
            outlined
            dense
            debounce="300"
            placeholder="Cari metode pembayaran..."
            class="search-input"
            clearable
            @update:model-value="onFilterChanged"
          >
            <template #prepend>
              <q-icon name="search" color="grey-5" />
            </template>
          </q-input>

          <q-select
            v-model="store.feeFilter.fee_type"
            outlined
            dense
            emit-value
            map-options
            clearable
            placeholder="Semua Tipe Biaya"
            class="filter-select"
            :options="[
              { label: 'Semua Tipe Biaya', value: null },
              { label: 'Persentase (%)', value: 'percent' },
              { label: 'Nominal Tetap (Rp)', value: 'fixed' }
            ]"
            @update:model-value="onFilterChanged"
          />

          <q-select
            v-model="store.feeFilter.status"
            outlined
            dense
            emit-value
            map-options
            clearable
            placeholder="Semua Status"
            class="filter-select"
            :options="[
              { label: 'Semua Status', value: null },
              { label: 'Hanya Aktif', value: 'active' },
              { label: 'Hanya Nonaktif', value: 'inactive' }
            ]"
            @update:model-value="onFilterChanged"
          />
        </div>

        <!-- Add Fee Button -->
        <div class="col-12 col-md-auto row items-center justify-end">
          <q-btn
            unelevated
            no-caps
            color="warning"
            text-color="dark"
            icon="add"
            label="Tambah Biaya Metode"
            class="text-weight-bold"
            @click="store.openCreateFeeDialog"
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
      <div class="text-h6 text-sand text-weight-bold"
        >Belum Ada Biaya Admin</div
      >
      <div class="text-caption text-muted q-mb-md">
        Belum ada aturan biaya admin Midtrans untuk merchant
        <strong class="text-warning">{{ store.selectedMerchant }}</strong
        >.
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

    <!-- Card List Item dengan QInfiniteScroll -->
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
          <!-- Card Header Bar: Black & Gold Theme -->
          <div
            class="card-header-bar q-px-md q-py-sm row items-center justify-between"
          >
            <!-- Left: Method Badge, Name & Type -->
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
                {{ fee.payment_method.toUpperCase() }}
              </q-badge>

              <span class="fee-method-name text-weight-bold text-sand q-ml-xs">
                {{ fee.payment_method_name }}
              </span>

              <q-badge
                rounded
                :color="fee.fee_type === 'percent' ? 'blue-9' : 'teal-9'"
                :label="
                  fee.fee_type === 'percent'
                    ? 'Persentase (%)'
                    : 'Nominal Tetap (Rp)'
                "
                class="text-weight-bold q-ml-sm"
              />
            </div>

            <!-- Right: Status Badge & Actions -->
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
                  fee.is_active ? 'Nonaktifkan Biaya' : 'Aktifkan Biaya'
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
                <q-tooltip>Edit Konfigurasi Biaya</q-tooltip>
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
                <q-tooltip>Hapus Konfigurasi Biaya</q-tooltip>
              </q-btn>
            </div>
          </div>

          <q-separator class="gold-separator" />

          <!-- Card Content Body: Grid Responsif -->
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
              <!-- Kolom 1: Nilai Biaya -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Tarif Biaya Admin</div>
                <div
                  class="metric-value text-gold-glow text-weight-bolder text-h6"
                >
                  {{ formatFeeValue(fee) }}
                </div>
                <div class="text-caption text-grey-5">
                  {{
                    fee.fee_type === 'percent'
                      ? 'Dari subtotal setelah diskon'
                      : 'Biaya tetap per transaksi'
                  }}
                </div>
              </div>

              <!-- Kolom 2: Batas Min / Max -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Batas Nominal Biaya</div>
                <div class="text-body2 text-sand text-weight-medium">
                  <span v-if="fee.min_fee || fee.max_fee">
                    Min: {{ fee.min_fee ? formatRupiah(fee.min_fee) : 'Rp 0'
                    }}<br />
                    Maks:
                    {{
                      fee.max_fee ? formatRupiah(fee.max_fee) : 'Tanpa Batas'
                    }}
                  </span>
                  <span v-else class="text-grey-5">Tanpa batas min/maks</span>
                </div>
              </div>

              <!-- Kolom 3: Merchant & Catatan -->
              <div class="col-12 col-sm-6 col-md-3">
                <div class="metric-label text-muted">Catatan & Merchant</div>
                <div class="text-body2 text-sand">
                  {{ fee.notes || '—' }}
                </div>
                <div class="text-caption text-grey-5">
                  Merchant:
                  <span class="text-warning">{{ fee.merchant_code }}</span>
                </div>
              </div>

              <!-- Kolom 4: Terakhir Diperbarui -->
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

        <!-- Loading Indicator saat Infinite Scroll -->
        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="warning" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>

    <!-- Dialog Konfirmasi Hapus Biaya -->
    <q-dialog v-model="store.feeDeleteConfirmDialogOpen">
      <q-card class="bg-dark text-white" style="min-width: 380px">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6 text-weight-bold"
            >Hapus Biaya Metode?</span
          >
        </q-card-section>

        <q-card-section class="q-pt-sm text-sand">
          Apakah Anda yakin ingin menghapus konfigurasi biaya admin untuk metode
          <strong class="text-warning">
            {{
              store.feeToDelete?.payment_method_name ||
              store.feeToDelete?.payment_method
            }} </strong
          >? Transaksi baru dengan metode ini tidak akan dikenakan biaya admin.
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
import { onMounted, ref } from 'vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()
const infiniteScrollRef = ref(null)

onMounted(() => {
  store.fetchFees(true)
})

function onFilterChanged() {
  store.fetchFees(true)
}

function methodIcon(method) {
  if (method === 'qris') return 'qr_code_2'
  if (method === 'gopay') return 'account_balance_wallet'
  return 'account_balance'
}

function formatFeeValue(fee) {
  if (fee.fee_type === 'percent') {
    const rate = Number(fee.fee_rate || 0)
    return `${rate.toFixed(2).replace(/\.?0+$/, '')}%`
  }
  return formatRupiah(fee.fixed_amount || 0)
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
.midtrans-fee-management {
  max-width: 1200px;
}

.fee-filter-card {
  background: #19191e;
  border: 1px solid rgba(224, 195, 124, 0.2);
  border-radius: 8px;
}

.search-input {
  min-width: 240px;
}

.filter-select {
  min-width: 170px;
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

.fee-method-name {
  font-size: 15px;
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
