<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Langganan Pelanggan" />
      <div class="q-mt-md q-mb-md">
        <p class="eyebrow">MONITORING LANGGANAN</p>
        <h1>Langganan pelanggan</h1>
        <p class="page-description">
          Pantau status data dan masa aktif berdasarkan tanggal berakhir
          langganan.
        </p>
      </div>

      <FilterPanel class="q-mb-md">
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
            @update:model-value="store.onApplicationChanged"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="store.customerId"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Pelanggan"
            :options="customerOptions"
            :disable="!store.customers.length"
            bg-color="white"
            @update:model-value="store.fetchSubscriptions({ page: 1 })"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="store.status"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Status data"
            :options="statusOptions"
            bg-color="white"
            @update:model-value="store.fetchSubscriptions({ page: 1 })"
          />
        </div>
      </FilterPanel>

      <ErrorState
        v-if="store.error"
        :message="store.error"
        @retry="store.fetchSubscriptions"
      />
      <LanggananTable
        v-else
        :rows="store.items"
        :applications="store.applications"
        :loading="store.loading"
        :pagination="store.pagination"
        @request="store.fetchSubscriptions"
        @detail="store.openDetailDialog"
      />
      <LanggananDetailDialog />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { useLanggananPelangganStore } from '@/stores/langgananpelanggan'
import LanggananDetailDialog from './comp/LanggananDetailDialog.vue'
import LanggananTable from './comp/LanggananTable.vue'

const store = useLanggananPelangganStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const customerOptions = computed(() =>
  store.customers.map(customer => ({
    label: customer.name,
    value: customer.id
  }))
)
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Kedaluwarsa', value: 'expired' },
  { label: 'Dibatalkan', value: 'cancelled' }
]

onMounted(async () => {
  await store.fetchApplications()
  await store.fetchCustomers()
  await store.fetchSubscriptions()
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
