<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Invoice" />
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">BILLING UDEV</p>
          <h1>Invoice</h1>
          <p class="page-description"
            >Kelola tagihan pelanggan dari paket langganan.</p
          >
        </div>
        <div class="col-12 col-md-auto">
          <q-btn
            color="warning"
            text-color="dark"
            icon="add"
            label="Buat invoice"
            no-caps
            @click="store.openCreateDialog"
          />
        </div>
      </div>

      <FilterPanel class="q-mb-md">
        <div class="col-12 col-md-3">
          <q-input
            v-model="store.search"
            outlined
            dense
            clearable
            label="Cari invoice / pelanggan"
            bg-color="white"
            debounce="350"
            @update:model-value="onFilterChanged"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
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
            @update:model-value="onApplicationChanged"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="store.customerId"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Pelanggan"
            :options="customerOptions"
            :disable="!store.listCustomers.length"
            bg-color="white"
            @update:model-value="onFilterChanged"
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
            label="Status pembayaran"
            :options="statusOptions"
            bg-color="white"
            @update:model-value="onFilterChanged"
          />
        </div>
      </FilterPanel>

      <ErrorState
        v-if="store.error && store.items.length === 0"
        :message="store.error"
        @retry="store.resetAndFetchInvoices"
      />
      <InvoiceTable
        v-else
        ref="invoiceTableRef"
        :rows="store.items"
        :applications="store.applications"
        :loading="store.loading"
        @detail="store.openDetailDialog"
      />
      <InvoiceFormDialog />
      <InvoiceDetailDialog />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { useInvoiceStore } from '@/stores/invoice'
import InvoiceDetailDialog from './comp/InvoiceDetailDialog.vue'
import InvoiceFormDialog from './comp/InvoiceFormDialog.vue'
import InvoiceTable from './comp/InvoiceTable.vue'

const store = useInvoiceStore()
const invoiceTableRef = ref(null)

const onFilterChanged = () => {
  invoiceTableRef.value?.resetScroll()
  store.resetAndFetchInvoices()
}

const onApplicationChanged = async () => {
  invoiceTableRef.value?.resetScroll()
  await store.onListApplicationChanged()
}

const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const customerOptions = computed(() =>
  store.listCustomers.map(customer => ({
    label: customer.name,
    value: customer.id
  }))
)
const statusOptions = [
  { label: 'Menunggu pembayaran', value: 'pending' },
  { label: 'Lunas', value: 'paid' },
  { label: 'Kedaluwarsa', value: 'expired' },
  { label: 'Dibatalkan', value: 'cancelled' }
]

onMounted(async () => {
  await store.fetchApplications()
  await store.fetchListCustomers()
  await store.resetAndFetchInvoices()
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
