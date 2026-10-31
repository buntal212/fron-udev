<template>
  <div class="doku-mapping-table-wrapper">
    <!-- Header & Action -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-h6 text-weight-bold q-my-none"
          >Mapping Aplikasi ke DOKU Gateway</h2
        >
        <p class="text-caption text-grey-7 q-mb-none">
          Hubungkan aplikasi UDEV dengan merchant penerima DOKU SNAP B2B
          Sandbox.
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
          @click="store.fetchMappings()"
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

    <!-- Table -->
    <q-card flat bordered class="table-card">
      <q-table
        :rows="store.mappings"
        :columns="columns"
        :loading="store.mappingsLoading"
        :pagination="store.mappingsPagination"
        row-key="id"
        flat
        :rows-per-page-options="[10, 15, 25, 50]"
        no-data-label="Belum ada mapping aplikasi ke DOKU Gateway."
        @request="store.fetchMappings($event.pagination)"
      >
        <template #body-cell-application="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{
              props.row.application?.name || '—'
            }}</div>
            <div class="text-caption text-grey-7 font-mono">{{
              props.row.application?.code
            }}</div>
          </q-td>
        </template>

        <template #body-cell-provider="props">
          <q-td :props="props">
            <q-badge color="grey-9" text-color="amber-4"> DOKU </q-badge>
          </q-td>
        </template>

        <template #body-cell-environment="props">
          <q-td :props="props">
            <q-badge color="amber-9" text-color="dark">
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-gateway_merchant_code="props">
          <q-td :props="props">
            <div class="font-mono text-weight-medium">{{ props.value }}</div>
          </q-td>
        </template>

        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.value"
              color="warning"
              @update:model-value="store.toggleMappingStatus(props.row, $event)"
            >
              <q-tooltip>{{
                props.value ? 'Mapping Aktif' : 'Mapping Non-aktif'
              }}</q-tooltip>
            </q-toggle>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right q-gutter-xs">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="warning"
              @click="store.openEditMappingDialog(props.row)"
            >
              <q-tooltip>Ubah mapping</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="confirmDeleteMapping(props.row)"
            >
              <q-tooltip>Hapus mapping</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog Konfirmasi Hapus Mapping -->
    <q-dialog v-model="deleteDialogOpen" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <div class="q-ml-md">
            <div class="text-h6 text-weight-bold">Hapus Mapping Aplikasi</div>
            <div class="text-caption text-grey-7"
              >Tindakan ini menghapus integrasi checkout aplikasi ini.</div
            >
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Apakah Anda yakin ingin menghapus mapping untuk aplikasi
          <strong>{{ mappingToDelete?.application?.name }}</strong> ke merchant
          <strong>{{ mappingToDelete?.gateway_merchant_code }}</strong
          >?
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey-7" no-caps v-close-popup />
          <q-btn
            unelevated
            color="negative"
            label="Hapus Mapping"
            no-caps
            @click="executeDeleteMapping"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()
const deleteDialogOpen = ref(false)
const mappingToDelete = ref(null)

const confirmDeleteMapping = mapping => {
  mappingToDelete.value = mapping
  deleteDialogOpen.value = true
}

const executeDeleteMapping = async () => {
  if (mappingToDelete.value) {
    await store.deleteMapping(mappingToDelete.value)
    deleteDialogOpen.value = false
    mappingToDelete.value = null
  }
}

const columns = [
  {
    name: 'application',
    label: 'Aplikasi',
    field: 'application',
    align: 'left',
    sortable: true
  },
  { name: 'provider', label: 'Provider', field: 'provider', align: 'center' },
  { name: 'environment', label: 'Env', field: 'environment', align: 'center' },
  {
    name: 'gateway_merchant_code',
    label: 'Merchant DOKU Terhubung',
    field: 'gateway_merchant_code',
    align: 'left',
    sortable: true
  },
  {
    name: 'is_active',
    label: 'Status Aktif',
    field: 'is_active',
    align: 'center',
    sortable: true
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

onMounted(() => {
  store.fetchMappings()
})
</script>

<style scoped>
.font-mono {
  font-family: monospace;
}
.table-card {
  border-radius: 8px;
}
</style>
