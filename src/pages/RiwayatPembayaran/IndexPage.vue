<template>
  <q-page class="q-pa-md q-pa-lg-md"
    ><div class="content-wrap">
      <AppBreadcrumb title="Riwayat Pembayaran" />
      <div class="q-mt-md q-mb-md"
        ><p class="eyebrow">BILLING UDEV</p><h1>Riwayat pembayaran</h1
        ><p class="page-description"
          >Pantau setiap percobaan pembayaran tanpa mengubah status invoice.</p
        ></div
      >
      <FilterPanel class="q-mb-md">
        <div class="col-12 col-md-4"
          ><q-select
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
        /></div>
        <div class="col-12 col-md-4"
          ><q-select
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
            @update:model-value="store.onCustomerChanged"
        /></div>
        <div class="col-12 col-md-4"
          ><q-select
            v-model="store.invoiceId"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Invoice"
            :options="invoiceOptions"
            :disable="!store.invoices.length"
            bg-color="white"
            @update:model-value="store.fetchPaymentAttempts({ page: 1 })"
        /></div>
        <div class="col-12 col-md-4"
          ><q-input
            v-model="store.provider"
            outlined
            dense
            clearable
            debounce="300"
            label="Provider pembayaran"
            bg-color="white"
            @update:model-value="store.fetchPaymentAttempts({ page: 1 })"
        /></div>
        <div class="col-12 col-md-4"
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
            @update:model-value="store.fetchPaymentAttempts({ page: 1 })"
        /></div>
      </FilterPanel>
      <ErrorState
        v-if="store.error"
        :message="store.error"
        @retry="store.fetchPaymentAttempts"
      />
      <RiwayatPembayaranTable
        v-else
        :rows="store.items"
        :loading="store.loading"
        :pagination="store.pagination"
        @request="store.fetchPaymentAttempts"
        @detail="store.openDetailDialog"
      />
      <RiwayatPembayaranDetailDialog /> </div
  ></q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { useRiwayatPembayaranStore } from '@/stores/riwayatpembayaran'
import RiwayatPembayaranDetailDialog from './comp/RiwayatPembayaranDetailDialog.vue'
import RiwayatPembayaranTable from './comp/RiwayatPembayaranTable.vue'

const store = useRiwayatPembayaranStore()
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
const invoiceOptions = computed(() =>
  store.invoices.map(invoice => ({
    label: invoice.invoice_number,
    value: invoice.id
  }))
)
const statusOptions = [
  { label: 'Dimulai', value: 'initiated' },
  { label: 'Menunggu pembayaran', value: 'pending' },
  { label: 'Berhasil', value: 'succeeded' },
  { label: 'Gagal', value: 'failed' },
  { label: 'Kedaluwarsa', value: 'expired' },
  { label: 'Dibatalkan', value: 'cancelled' }
]

onMounted(async () => {
  await store.fetchApplications()
  await store.fetchCustomers()
  await store.fetchInvoicesForFilter()
  await store.fetchPaymentAttempts()
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
