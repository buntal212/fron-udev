<template>
  <div>
    <!-- Header & Action -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Mapping Aplikasi ke Midtrans Gateway
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Hubungkan aplikasi UDEV dengan merchant penerima Midtrans Sandbox
          untuk invoice billing otomatis.
        </p>
      </div>

      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat Ulang"
          no-caps
          :loading="store.mappingsLoading"
          @click="store.fetchMappings"
        />
        <q-btn
          color="warning"
          text-color="dark"
          icon="add"
          label="Tambah Mapping"
          no-caps
          @click="store.openCreateMappingDialog"
        />
      </div>
    </div>

    <!-- Mapping Table -->
    <q-table
      flat
      bordered
      :rows="store.mappings"
      :columns="columns"
      :loading="store.mappingsLoading"
      :pagination="store.mappingsPagination"
      row-key="id"
      :rows-per-page-options="[10, 15, 25, 50]"
      no-data-label="Belum ada mapping aplikasi ke Midtrans Gateway."
      class="mapping-table"
      @request="store.fetchMappings"
    >
      <!-- Application Column -->
      <template #body-cell-application="props">
        <q-td :props="props">
          <div class="text-weight-bold text-dark">
            {{
              props.row.application?.name ||
              'Aplikasi ID: ' + props.row.application_id
            }}
          </div>
          <div class="text-caption text-grey-6 font-mono">
            {{ props.row.application?.code || '—' }}
          </div>
        </q-td>
      </template>

      <!-- Provider Column -->
      <template #body-cell-provider="props">
        <q-td :props="props">
          <q-badge color="grey-9" text-color="amber-4" class="text-weight-bold">
            MIDTRANS
          </q-badge>
        </q-td>
      </template>

      <!-- Environment Column -->
      <template #body-cell-environment="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.environment === 'production' ? 'negative' : 'amber-9'
            "
            :text-color="
              props.row.environment === 'production' ? 'white' : 'dark'
            "
            class="text-weight-bold"
          >
            {{ (props.row.environment || 'sandbox').toUpperCase() }}
          </q-badge>
        </q-td>
      </template>

      <!-- Merchant Code Column -->
      <template #body-cell-gateway_merchant_code="props">
        <q-td :props="props">
          <div class="font-mono text-weight-bold text-dark">{{
            props.row.gateway_merchant_code
          }}</div>
        </q-td>
      </template>

      <!-- Active Toggle Column -->
      <template #body-cell-is_active="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.row.is_active"
            color="warning"
            dense
            @update:model-value="store.toggleMappingStatus(props.row)"
          >
            <q-tooltip>{{
              props.row.is_active ? 'Mapping Aktif' : 'Mapping Non-aktif'
            }}</q-tooltip>
          </q-toggle>
        </q-td>
      </template>

      <!-- Actions Column -->
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right q-gutter-x-xs">
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="primary"
            @click="store.openEditMappingDialog(props.row)"
          >
            <q-tooltip>Edit Mapping</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="delete_outline"
            color="negative"
            @click="store.confirmDeleteMapping(props.row)"
          >
            <q-tooltip>Hapus Mapping</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="store.mappingDeleteConfirmDialogOpen">
      <q-card style="min-width: 380px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Konfirmasi Hapus Mapping</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          Apakah Anda yakin ingin menghapus mapping untuk aplikasi
          <strong>{{ store.mappingToDelete?.application?.name }}</strong
          >?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Batal" color="grey-8" v-close-popup />
          <q-btn
            label="Hapus Mapping"
            color="negative"
            no-caps
            :loading="store.mappingDeleting"
            @click="store.deleteMapping"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()

const columns = [
  {
    name: 'application',
    label: 'APLIKASI',
    align: 'left',
    field: row => row.application?.name
  },
  {
    name: 'provider',
    label: 'PROVIDER',
    align: 'center',
    field: 'provider'
  },
  {
    name: 'environment',
    label: 'ENVIRONMENT',
    align: 'center',
    field: 'environment'
  },
  {
    name: 'gateway_merchant_code',
    label: 'MERCHANT TUJUAN',
    align: 'left',
    field: 'gateway_merchant_code'
  },
  {
    name: 'is_active',
    label: 'STATUS',
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
.mapping-table {
  background: #ffffff;
  border-radius: 12px;
}
.font-mono {
  font-family: monospace;
}
</style>
