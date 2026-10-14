<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Pelanggan Aplikasi" />
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">MASTER UDEV</p>
          <h1>Pelanggan aplikasi</h1>
          <p class="page-description"
            >Setiap pelanggan terhubung ke satu aplikasi dan akan memiliki
            tagihan serta masa aktif masing-masing.</p
          >
        </div>
        <div class="col-12 col-md-auto"
          ><q-btn
            color="warning"
            text-color="dark"
            icon="person_add"
            label="Tambah pelanggan"
            no-caps
            @click="store.openCreateDialog"
        /></div>
      </div>

      <DemoNotice class="q-mb-md" />
      <FilterPanel class="q-mb-md">
        <div class="col-12 col-md-5"
          ><q-input
            v-model="store.search"
            outlined
            dense
            clearable
            debounce="250"
            label="Cari nama, ID eksternal, atau email"
            bg-color="white"
            ><template #prepend><q-icon name="search" /></template></q-input
        ></div>
        <div class="col-12 col-md-3"
          ><q-select
            v-model="store.application"
            outlined
            dense
            clearable
            label="Aplikasi"
            :options="store.applications"
            bg-color="white"
        /></div>
        <div class="col-12 col-md-3"
          ><q-select
            v-model="store.status"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Status"
            :options="statusOptions"
            bg-color="white"
        /></div>
      </FilterPanel>

      <PelangganTable
        :rows="store.filteredItems"
        @edit="store.openEditDialog"
        @detail="store.openDetailDialog"
      />
      <PelangganFormDialog />
      <PelangganDetailDialog />
    </div>
  </q-page>
</template>

<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import DemoNotice from '@/components/DemoNotice.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { usePelangganAplikasiStore } from '@/stores/pelangganaplikasi'
import PelangganDetailDialog from './comp/PelangganDetailDialog.vue'
import PelangganFormDialog from './comp/PelangganFormDialog.vue'
import PelangganTable from './comp/PelangganTable.vue'

const store = usePelangganAplikasiStore()
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Tidak aktif', value: 'inactive' }
]
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
