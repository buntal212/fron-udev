<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Aplikasi" />
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">MASTER UDEV</p>
          <h1>Aplikasi</h1>
          <p class="page-description"
            >Kelola identitas aplikasi yang menggunakan UDEV Billing.</p
          >
        </div>
        <div class="col-12 col-md-auto">
          <q-btn
            color="warning"
            text-color="dark"
            icon="add"
            label="Tambah aplikasi"
            no-caps
            @click="store.openCreateDialog"
          />
        </div>
      </div>

      <FilterPanel class="q-mb-md">
        <div class="col-12 col-md-6">
          <q-input
            v-model="store.search"
            outlined
            dense
            clearable
            debounce="250"
            label="Cari nama, kode, atau email kontak"
            bg-color="white"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
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
        @retry="store.fetchApplications"
      />
      <AplikasiTable
        v-else
        :rows="store.items"
        :loading="store.loading"
        :pagination="store.pagination"
        @request="store.fetchApplications"
        @edit="store.openEditDialog"
        @detail="store.openDetailDialog"
      />
      <AplikasiFormDialog />
      <AplikasiDetailDialog />
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { useAplikasiStore } from '@/stores/aplikasi'
import AplikasiDetailDialog from './comp/AplikasiDetailDialog.vue'
import AplikasiFormDialog from './comp/AplikasiFormDialog.vue'
import AplikasiTable from './comp/AplikasiTable.vue'

const store = useAplikasiStore()
const statusOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak aktif', value: false }
]

onMounted(() => store.fetchApplications())
watch([() => store.search, () => store.status], () => {
  store.fetchApplications({ page: 1 })
})
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
