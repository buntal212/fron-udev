<template>
  <div>
    <!-- Table Toolbar -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Daftar Merchant Midtrans
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Kelola merchant Midtrans Sandbox untuk isolasi transaksi dan mapping
          aplikasi.
        </p>
      </div>

      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat ulang"
          no-caps
          :loading="store.merchantsLoading"
          @click="store.fetchMerchants"
        />
        <q-btn
          color="warning"
          text-color="dark"
          icon="add"
          label="Tambah Merchant"
          no-caps
          @click="store.openCreateMerchantDialog"
        />
      </div>
    </div>

    <!-- Filter Panel -->
    <FilterPanel class="q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="store.merchantFilter.search"
          outlined
          dense
          clearable
          label="Cari nama atau kode merchant"
          debounce="300"
          bg-color="white"
          @update:model-value="store.fetchMerchants"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <div class="col-12 col-md-3">
        <q-select
          v-model="store.merchantFilter.status"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Status Merchant"
          :options="statusOptions"
          bg-color="white"
          @update:model-value="store.fetchMerchants"
        />
      </div>
    </FilterPanel>

    <!-- Merchant Table -->
    <q-table
      flat
      bordered
      :rows="store.merchants"
      :columns="columns"
      row-key="merchant_code"
      :loading="store.merchantsLoading"
      no-data-label="Belum ada data merchant Midtrans"
      class="merchant-table"
    >
      <!-- Merchant Code & Name -->
      <template #body-cell-merchant_code="props">
        <q-td :props="props">
          <div class="text-weight-bold text-dark">{{
            props.row.merchant_code
          }}</div>
          <div class="text-caption text-grey-6">{{
            props.row.merchant_name
          }}</div>
        </q-td>
      </template>

      <!-- Midtrans Merchant ID -->
      <template #body-cell-midtrans_merchant_id="props">
        <q-td :props="props">
          <span
            v-if="props.row.midtrans_merchant_id"
            class="text-body2 text-weight-medium"
          >
            {{ props.row.midtrans_merchant_id }}
          </span>
          <span v-else class="text-caption text-grey-5">Belum diisi</span>
        </q-td>
      </template>

      <!-- Configuration Status -->
      <template #body-cell-is_configured="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.is_configured ? 'positive' : 'warning'"
            :text-color="props.row.is_configured ? 'white' : 'dark'"
          >
            {{ props.row.is_configured ? 'Terkonfigurasi' : 'Belum Lengkap' }}
          </q-badge>
        </q-td>
      </template>

      <!-- Checkout Readiness -->
      <template #body-cell-is_ready="props">
        <q-td :props="props">
          <q-badge :color="props.row.is_ready ? 'positive' : 'grey-7'">
            {{ props.row.is_ready ? 'Siap Checkout' : 'Belum Siap' }}
          </q-badge>
        </q-td>
      </template>

      <!-- Active Toggle -->
      <template #body-cell-is_active="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.row.is_active"
            color="warning"
            dense
            @update:model-value="store.toggleMerchantStatus(props.row)"
          />
        </q-td>
      </template>

      <!-- Actions -->
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right q-gutter-x-xs">
          <q-btn
            flat
            round
            dense
            color="warning"
            icon="vpn_key"
            tooltip="Kelola Kredensial API"
            @click="$emit('configure', props.row.merchant_code)"
          >
            <q-tooltip>Konfigurasi Kredensial</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="store.openEditMerchantDialog(props.row)"
          >
            <q-tooltip>Edit Merchant</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete_outline"
            :disable="props.row.merchant_code === 'udev-central'"
            @click="store.confirmDeleteMerchant(props.row)"
          >
            <q-tooltip v-if="props.row.merchant_code !== 'udev-central'"
              >Hapus Merchant</q-tooltip
            >
            <q-tooltip v-else>Merchant utama tidak dapat dihapus</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="store.merchantDeleteConfirmDialogOpen">
      <q-card style="min-width: 380px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Konfirmasi Hapus</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          Apakah Anda yakin ingin menghapus merchant
          <strong>{{ store.merchantToDelete?.merchant_name }}</strong>
          ({{ store.merchantToDelete?.merchant_code }})?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Batal" color="grey-8" v-close-popup />
          <q-btn
            label="Hapus Merchant"
            color="negative"
            no-caps
            :loading="store.merchantDeleting"
            @click="store.deleteMerchant"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import FilterPanel from '@/components/FilterPanel.vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

defineEmits(['configure'])

const store = usePaymentGatewayMidtransStore()

const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
  { label: 'Terkonfigurasi', value: 'configured' },
  { label: 'Belum Konfigurasi', value: 'unconfigured' }
]

const columns = [
  {
    name: 'merchant_code',
    label: 'KODE & NAMA MERCHANT',
    align: 'left',
    field: 'merchant_code'
  },
  {
    name: 'midtrans_merchant_id',
    label: 'MERCHANT ID (MIDTRANS)',
    align: 'left',
    field: 'midtrans_merchant_id'
  },
  {
    name: 'is_configured',
    label: 'KONFIGURASI API',
    align: 'center',
    field: 'is_configured'
  },
  {
    name: 'is_ready',
    label: 'KESIAPAN CHECKOUT',
    align: 'center',
    field: 'is_ready'
  },
  {
    name: 'is_active',
    label: 'AKTIF',
    align: 'center',
    field: 'is_active'
  },
  {
    name: 'actions',
    label: 'AKSI',
    align: 'right'
  }
]
</script>

<style scoped>
.merchant-table {
  background: #ffffff;
  border-radius: 12px;
}
</style>
