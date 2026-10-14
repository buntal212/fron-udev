<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Merchant / Aplikasi" />

      <div
        class="row items-center justify-between q-mt-md q-mb-lg q-gutter-y-sm"
      >
        <div>
          <h1>Merchant / Aplikasi</h1>
          <p>Daftar aplikasi yang menggunakan DANA Payment.</p>
        </div>

        <q-btn
          outline
          color="primary"
          label="Tambah aplikasi"
          icon="add"
          no-caps
          disable
        >
          <q-tooltip>
            Provisioning aplikasi membutuhkan persetujuan dan mekanisme backend
            terpisah.
          </q-tooltip>
        </q-btn>
      </div>

      <FilterPanel>
        <div class="col-12 col-sm-5">
          <q-input
            v-model="store.params.search"
            outlined
            dense
            label="Cari nama atau kode aplikasi"
            debounce="300"
            @update:model-value="store.applyFilters()"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>

        <div class="col-12 col-sm-3">
          <q-select
            v-model="store.params.status"
            outlined
            dense
            label="Status"
            :options="statusOptions"
            clearable
            emit-value
            map-options
            @update:model-value="store.applyFilters()"
          />
        </div>

        <div class="col-12 col-sm-auto">
          <q-btn
            outline
            color="primary"
            icon="refresh"
            label="Muat ulang"
            no-caps
            :loading="store.loading"
            @click="store.fetchMerchants()"
          />
        </div>
      </FilterPanel>

      <q-card flat bordered class="q-mt-md table-card">
        <q-card-section class="q-pa-md">
          <ErrorState
            v-if="store.error && !store.items.length"
            :message="store.error"
            @retry="store.fetchMerchants()"
          />
          <MerchantTable
            v-else
            :rows="store.items"
            :loading="store.loading"
            :pagination="store.pagination"
            @request="handleTableRequest"
            @detail="store.showMerchant"
          />
        </q-card-section>
      </q-card>
    </div>

    <MerchantDetailDialog
      v-model="store.detailDialogOpen"
      :merchant="store.selectedMerchant"
      :loading="store.detailLoading"
    />
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import MerchantDetailDialog from './comp/MerchantDetailDialog.vue'
import MerchantTable from './comp/MerchantTable.vue'
import { useMerchantStore } from '@/stores/merchant'

const store = useMerchantStore()
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Ditangguhkan', value: 'suspended' },
  { label: 'Ditutup', value: 'closed' }
]

function handleTableRequest({ pagination }) {
  store.fetchMerchants({
    page: pagination.page,
    perPage: pagination.rowsPerPage
  })
}

onMounted(() => {
  store.fetchMerchants()
})
</script>

<style scoped>
.content-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 5px;
  color: #17283a;
  font-size: 1.55rem;
}

p {
  margin: 0;
  color: #718096;
  font-size: 0.85rem;
}

.table-card {
  border-radius: 12px;
}
</style>
