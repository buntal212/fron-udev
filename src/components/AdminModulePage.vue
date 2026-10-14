<template>
  <q-page class="q-pa-md q-pa-lg-md"
    ><div class="content-wrap"
      ><AppBreadcrumb :title="title" /><div
        class="row items-center justify-between q-mt-md q-mb-lg"
        ><div
          ><h1>{{ title }}</h1
          ><p>{{ description }}</p></div
        ><q-btn
          v-if="actionLabel"
          outline
          color="primary"
          :label="actionLabel"
          icon="add"
          no-caps
          :disable="true"
          ><q-tooltip
            >Menunggu API dengan otorisasi yang sesuai.</q-tooltip
          ></q-btn
        ></div
      ><FilterPanel
        ><div class="col-12 col-sm-4"
          ><q-input
            v-model="store.params.search"
            outlined
            dense
            label="Cari"
            debounce="300"
            ><template #prepend
              ><q-icon name="search" /></template></q-input></div
        ><div v-if="showStatus" class="col-12 col-sm-3"
          ><q-select
            v-model="store.params.status"
            outlined
            dense
            label="Status"
            :options="statusOptions"
            clearable /></div
        ><div v-if="showMerchant" class="col-12 col-sm-3"
          ><q-select
            v-model="store.params.merchant"
            outlined
            dense
            label="Merchant"
            :options="[]"
            clearable /></div
        ><div class="col-12 col-sm-3"
          ><DateRangeFilter
            v-model="store.params.dateRange" /></div></FilterPanel
      ><q-card flat bordered class="q-mt-md table-card"
        ><q-card-section class="q-pa-md"
          ><DataTable
            :rows="store.items"
            :columns="columns"
            :loading="store.loading"
            :pagination="
              store.params.pagination
            " /></q-card-section></q-card></div
  ></q-page>
</template>
<script setup>
import AppBreadcrumb from './AppBreadcrumb.vue'
import DataTable from './DataTable.vue'
import DateRangeFilter from './DateRangeFilter.vue'
import FilterPanel from './FilterPanel.vue'
defineProps({
  title: String,
  description: String,
  columns: { type: Array, default: () => [] },
  store: { type: Object, required: true },
  showStatus: Boolean,
  showMerchant: Boolean,
  actionLabel: String
})
const statusOptions = ['Berhasil', 'Pending', 'Gagal', 'Kedaluwarsa']
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
