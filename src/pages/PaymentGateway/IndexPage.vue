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
            Kelola provisioning merchant DANA dan mapping aplikasi dari satu
            halaman aman.
          </p>
        </div>
      </div>

      <q-tabs
        v-model="activeTab"
        align="left"
        active-color="warning"
        indicator-color="warning"
        class="gateway-tabs"
        narrow-indicator
      >
        <q-tab name="merchants" icon="storefront" label="Daftar Merchant" />
        <q-tab name="mappings" icon="account_tree" label="Mapping Aplikasi" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="activeTab" animated class="gateway-panels">
        <q-tab-panel name="merchants" class="q-px-none q-pt-lg">
          <div class="row items-center justify-between q-mb-md q-col-gutter-md">
            <div class="col-12 col-md">
              <h2>Provisioning merchant DANA</h2>
              <p class="section-description">
                Merchant baru memerlukan bootstrap credential dan konfigurasi
                DANA sebelum checkout dapat digunakan.
              </p>
            </div>
            <div class="col-12 col-md-auto row q-gutter-sm">
              <q-btn
                outline
                color="warning"
                icon="refresh"
                label="Muat ulang"
                no-caps
                :loading="merchantStore.loading"
                @click="merchantStore.fetchMerchants()"
              />
              <q-btn
                color="warning"
                text-color="dark"
                icon="add"
                label="Tambah Merchant"
                no-caps
                @click="merchantStore.openCreateDialog"
              />
            </div>
          </div>

          <FilterPanel class="q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="merchantStore.search"
                outlined
                dense
                clearable
                label="Cari nama atau kode merchant"
                debounce="300"
                bg-color="white"
                @update:model-value="merchantStore.fetchMerchants({ page: 1 })"
              >
                <template #prepend><q-icon name="search" /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="merchantStore.environment"
                outlined
                dense
                clearable
                emit-value
                map-options
                label="Environment"
                :options="environmentOptions"
                bg-color="white"
                @update:model-value="merchantStore.fetchMerchants({ page: 1 })"
              />
            </div>
          </FilterPanel>

          <ErrorState
            v-if="merchantStore.error && !merchantStore.items.length"
            :message="merchantStore.error"
            @retry="merchantStore.fetchMerchants"
          />
          <q-banner
            v-else-if="merchantStore.error"
            rounded
            class="merchant-error q-mb-md"
          >
            <template #avatar><q-icon name="error_outline" /></template>
            {{ merchantStore.error }}
            <template #action>
              <q-btn
                flat
                color="negative"
                label="Coba lagi"
                no-caps
                @click="merchantStore.fetchMerchants"
              />
            </template>
          </q-banner>
          <DanaGatewayMerchantTable
            v-else
            :rows="merchantStore.items"
            :loading="merchantStore.loading"
            :pagination="merchantStore.pagination"
            @request="merchantStore.fetchMerchants"
            @detail="merchantStore.showMerchant"
          />
        </q-tab-panel>

        <q-tab-panel name="mappings" class="q-px-none q-pt-lg">
          <div class="row items-center justify-between q-mb-md q-col-gutter-md">
            <div class="col-12 col-md">
              <h2>Mapping aplikasi</h2>
              <p class="section-description">
                Hubungkan aplikasi dengan merchant DANA yang sudah siap pakai.
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
        </q-tab-panel>
      </q-tab-panels>

      <PaymentGatewayFormDialog />
      <DanaGatewayMerchantFormDialog />
      <DanaGatewayMerchantDetailDialog />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'
import { usePaymentGatewayStore } from '@/stores/paymentgateway'
import DanaGatewayMerchantDetailDialog from './comp/DanaGatewayMerchantDetailDialog.vue'
import DanaGatewayMerchantFormDialog from './comp/DanaGatewayMerchantFormDialog.vue'
import DanaGatewayMerchantTable from './comp/DanaGatewayMerchantTable.vue'
import PaymentGatewayFormDialog from './comp/PaymentGatewayFormDialog.vue'
import PaymentGatewayTable from './comp/PaymentGatewayTable.vue'

const store = usePaymentGatewayStore()
const merchantStore = useDanaGatewayMerchantStore()
const activeTab = ref('merchants')
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
  await Promise.all([store.fetchMappings(), merchantStore.fetchMerchants()])
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
.gateway-tabs {
  background: #fff;
  border: 1px solid #e0d7c6;
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
}
.gateway-panels {
  background: transparent;
}
h2 {
  margin: 0 0 5px;
  color: #20180b;
  font-size: 1.15rem;
}
.section-description {
  margin: 0;
  color: #716a5d;
  font-size: 0.88rem;
}
.merchant-error {
  border: 1px solid #e8b4ad;
  background: #fff2f0;
  color: #9f2419;
}
</style>
