<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Paket Langganan" />
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">MASTER LANGGANAN</p>
          <h1>Paket langganan</h1>
          <p class="page-description"
            >Kelola paket dan harga layanan setiap aplikasi.</p
          >
        </div>
        <div class="col-12 col-md-auto">
          <q-btn
            color="warning"
            text-color="dark"
            icon="add"
            label="Tambah paket"
            no-caps
            @click="store.openCreateDialog"
          />
        </div>
      </div>

      <FilterPanel class="q-mb-md">
        <div class="col-12 col-md-5">
          <q-input
            v-model="store.search"
            outlined
            dense
            clearable
            debounce="250"
            label="Cari kode atau nama paket"
            bg-color="white"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="store.applicationId"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Aplikasi"
            :options="applicationOptions"
            bg-color="white"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="store.status"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Status"
            :options="statusOptions"
            bg-color="white"
          />
        </div>
      </FilterPanel>

      <ErrorState
        v-if="store.error"
        :message="store.error"
        @retry="store.fetchPlans"
      />
      <PaketLanggananTable
        v-else
        :rows="store.items"
        :applications="store.applications"
        :loading="store.loading"
        :pagination="store.pagination"
        @request="store.fetchPlans"
        @edit="store.openEditDialog"
        @delete="store.requestDelete"
        @change-status="store.setPlanActive"
      />
      <PaketLanggananFormDialog />
      <ConfirmDialog
        v-model="store.deleteDialogOpen"
        title="Hapus paket langganan"
        :message="`Paket ${store.selectedPlan?.name || ''} akan dihapus. Lanjutkan?`"
        @confirm="store.deletePlan"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { usePaketLanggananStore } from '@/stores/paketlangganan'
import PaketLanggananFormDialog from './comp/PaketLanggananFormDialog.vue'
import PaketLanggananTable from './comp/PaketLanggananTable.vue'

const store = usePaketLanggananStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const statusOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak aktif', value: false }
]

onMounted(async () => {
  await store.fetchApplications()
  await store.fetchPlans()
})
watch([() => store.search, () => store.applicationId, () => store.status], () =>
  store.fetchPlans({ page: 1 })
)
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
</style>
