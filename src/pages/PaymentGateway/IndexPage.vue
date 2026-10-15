<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Payment Gateway" />
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">PENGATURAN</p>
          <h1>Payment Gateway</h1>
          <p class="page-description">
            Hubungkan aplikasi dengan merchant DANA yang telah diizinkan server.
          </p>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn
            color="warning"
            text-color="dark"
            icon="add"
            label="Tambah mapping"
            no-caps
            @click="store.openCreateDialog"
          />
        </div>
      </div>

      <FilterPanel class="q-mb-md">
        <div class="col-12 col-md-6">
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
            v-model="store.environment"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Environment"
            :options="environmentOptions"
            bg-color="white"
          />
        </div>
      </FilterPanel>

      <ErrorState
        v-if="store.error"
        :message="store.error"
        @retry="store.fetchMappings"
      />
      <PaymentGatewayTable
        v-else
        :rows="store.items"
        :loading="store.loading"
        :pagination="store.pagination"
        @request="store.fetchMappings"
        @edit="store.openEditDialog"
        @change-status="store.setMappingActive"
      />
      <PaymentGatewayFormDialog />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { usePaymentGatewayStore } from '@/stores/paymentgateway'
import PaymentGatewayFormDialog from './comp/PaymentGatewayFormDialog.vue'
import PaymentGatewayTable from './comp/PaymentGatewayTable.vue'

const store = usePaymentGatewayStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const environmentOptions = [
  { label: 'Sandbox', value: 'sandbox' },
  { label: 'Production', value: 'production' }
]

onMounted(async () => {
  try {
    await store.fetchApplications()
  } catch (error) {
    store.error = 'Daftar aplikasi tidak dapat dimuat.'
  }
  await store.fetchMappings()
})

watch([() => store.applicationId, () => store.environment], () =>
  store.fetchMappings({ page: 1 })
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
