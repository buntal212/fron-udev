<template>
  <div class="doku-merchant-table-wrapper">
    <!-- Top Action & Filter Bar -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-h6 text-weight-bold q-my-none">Daftar Merchant DOKU</h2>
        <p class="text-caption text-grey-7 q-mb-none">
          Kelola merchant DOKU SNAP B2B, status konfigurasi, dan relasi aplikasi
          di UDEV.
        </p>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat Ulang"
          no-caps
          :loading="store.merchantsLoading"
          @click="store.fetchMerchants()"
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

    <!-- Filters -->
    <q-card flat bordered class="q-pa-sm q-mb-md filter-bar">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-input
            v-model="store.merchantFilter.search"
            outlined
            dense
            clearable
            placeholder="Cari kode atau nama merchant..."
            debounce="300"
            bg-color="white"
            @update:model-value="store.fetchMerchants()"
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
            label="Filter Status"
            :options="statusOptions"
            bg-color="white"
            @update:model-value="store.fetchMerchants()"
          />
        </div>
      </div>
    </q-card>

    <!-- Table -->
    <q-card flat bordered class="table-card">
      <q-table
        :rows="store.merchants"
        :columns="columns"
        :loading="store.merchantsLoading"
        row-key="merchant_code"
        flat
        :rows-per-page-options="[10, 15, 25, 50]"
        no-data-label="Belum ada merchant DOKU terdaftar."
      >
        <template #body-cell-merchant="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.merchant_name }}</div>
            <div class="text-caption text-grey-7 font-mono">
              {{ props.row.merchant_code }}
              <q-badge
                v-if="props.row.merchant_code === 'udev-central'"
                color="dark"
                text-color="amber-4"
                label="Pusat"
                class="q-ml-xs text-caption"
              />
            </div>
          </q-td>
        </template>

        <template #body-cell-environment="props">
          <q-td :props="props">
            <q-badge color="amber-9" text-color="dark">
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-is_configured="props">
          <q-td :props="props">
            <q-badge
              :color="props.value ? 'positive' : 'warning'"
              :text-color="props.value ? 'white' : 'dark'"
            >
              {{ props.value ? 'Terkonfigurasi' : 'Belum Konfigurasi' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-public_key_fingerprint="props">
          <q-td :props="props">
            <div v-if="props.value" class="text-caption font-mono text-grey-8">
              {{ props.value.substring(0, 16) }}...
              <q-tooltip>{{ props.value }}</q-tooltip>
            </div>
            <span v-else class="text-caption text-grey-5">—</span>
          </q-td>
        </template>

        <template #body-cell-mapped_applications="props">
          <q-td :props="props">
            <q-badge
              :color="
                props.row.mapped_applications_count > 0 ? 'primary' : 'grey-5'
              "
              class="q-px-sm q-py-xs"
            >
              {{ props.row.mapped_applications_count }} Aplikasi
              <q-tooltip v-if="props.row.mapped_applications?.length">
                <div v-for="app in props.row.mapped_applications" :key="app.id">
                  • {{ app.application_name }} ({{ app.application_code }})
                </div>
              </q-tooltip>
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.value"
              color="warning"
              @update:model-value="
                store.toggleMerchantStatus(props.row, $event)
              "
            >
              <q-tooltip>{{ props.value ? 'Aktif' : 'Nonaktif' }}</q-tooltip>
            </q-toggle>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right q-gutter-xs">
            <q-btn
              flat
              dense
              color="warning"
              icon="tune"
              label="Konfigurasi"
              no-caps
              @click="$emit('configure', props.row.merchant_code)"
            >
              <q-tooltip>Atur kredensial & kunci RSA</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="grey-8"
              @click="store.openEditMerchantDialog(props.row)"
            >
              <q-tooltip>Ubah nama merchant</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              :disable="
                props.row.merchant_code === 'udev-central' ||
                props.row.mapped_applications_count > 0
              "
              @click="store.confirmDeleteMerchant(props.row)"
            >
              <q-tooltip v-if="props.row.merchant_code === 'udev-central'">
                Merchant default pusat tidak dapat dihapus
              </q-tooltip>
              <q-tooltip v-else-if="props.row.mapped_applications_count > 0">
                Masih terhubung dengan
                {{ props.row.mapped_applications_count }} aplikasi
              </q-tooltip>
              <q-tooltip v-else>Hapus merchant</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog Konfirmasi Hapus Merchant -->
    <q-dialog v-model="store.merchantDeleteConfirmDialogOpen" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <div class="q-ml-md">
            <div class="text-h6 text-weight-bold"
              >Konfirmasi Hapus Merchant</div
            >
            <div class="text-caption text-grey-7"
              >Tindakan ini tidak dapat dibatalkan.</div
            >
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Apakah Anda yakin ingin menghapus merchant
          <strong>{{ store.merchantToDelete?.merchant_name }}</strong> ({{
            store.merchantToDelete?.merchant_code
          }})?
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey-7" no-caps v-close-popup />
          <q-btn
            unelevated
            color="negative"
            label="Hapus Merchant"
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
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

defineEmits(['configure'])

const store = usePaymentGatewayDokuStore()

const statusOptions = [
  { label: 'Semua Status', value: null },
  { label: 'Aktif', value: 'active' },
  { label: 'Non-aktif', value: 'inactive' },
  { label: 'Terkonfigurasi', value: 'configured' },
  { label: 'Belum Konfigurasi', value: 'unconfigured' }
]

const columns = [
  {
    name: 'merchant',
    label: 'Merchant',
    field: 'merchant_name',
    align: 'left',
    sortable: true
  },
  { name: 'environment', label: 'Env', field: 'environment', align: 'center' },
  {
    name: 'is_configured',
    label: 'Status Konfigurasi',
    field: 'is_configured',
    align: 'center',
    sortable: true
  },
  {
    name: 'public_key_fingerprint',
    label: 'Fingerprint Kunci RSA',
    field: 'public_key_fingerprint',
    align: 'left'
  },
  {
    name: 'mapped_applications',
    label: 'Mapping Aplikasi',
    field: 'mapped_applications_count',
    align: 'center',
    sortable: true
  },
  {
    name: 'is_active',
    label: 'Aktif',
    field: 'is_active',
    align: 'center',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]
</script>

<style scoped>
.font-mono {
  font-family: monospace;
}
.filter-bar {
  background: #fdfdfd;
}
.table-card {
  border-radius: 8px;
}
</style>
