<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Payment Gateway Midtrans" />

      <!-- Page Header -->
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">PENGATURAN PAYMENT GATEWAY</p>
          <h1>Payment Gateway Midtrans</h1>
          <p class="page-description">
            Kelola merchant Midtrans, mapping aplikasi, konfigurasi API Core
            Sandbox terenkripsi, transaksi billing, simulasi pembayaran, dan
            audit log keamanan.
          </p>
        </div>

        <div class="col-12 col-md-auto row items-center q-gutter-sm">
          <q-badge
            color="amber-9"
            text-color="dark"
            label="SANDBOX ONLY"
            class="q-px-md q-py-xs text-weight-bold"
          />
        </div>
      </div>

      <!-- Merchant Selector Bar -->
      <q-card flat bordered class="merchant-bar q-pa-sm q-mb-md">
        <div class="row items-center justify-between q-col-gutter-sm">
          <div class="col-12 col-sm-auto row items-center">
            <span class="text-caption text-weight-bold text-grey-8 q-mr-sm">
              Pilih Merchant Aktif:
            </span>
            <q-btn-toggle
              v-model="store.selectedMerchant"
              toggle-color="warning"
              toggle-text-color="dark"
              text-color="grey-8"
              flat
              dense
              no-caps
              :options="merchantOptions"
              @update:model-value="store.selectMerchant"
            />
          </div>

          <div
            class="col-12 col-sm-auto row items-center q-gutter-x-md text-caption text-grey-7"
          >
            <div>
              Status:
              <strong
                :class="
                  store.isReady
                    ? 'text-positive'
                    : store.isConfigured
                      ? 'text-info'
                      : 'text-warning'
                "
              >
                {{
                  store.isReady
                    ? 'Siap Checkout'
                    : store.isConfigured
                      ? 'Menunggu Aktivasi'
                      : 'Belum Lengkap'
                }}
              </strong>
            </div>
            <div>
              Server Key:
              <strong
                :class="store.isConfigured ? 'text-positive' : 'text-grey-6'"
              >
                {{ store.isConfigured ? 'Terenkripsi AES-256' : 'Kosong' }}
              </strong>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Navigation Tabs (7 Feature Tabs) -->
      <q-tabs
        v-model="activeTab"
        align="left"
        active-color="warning"
        indicator-color="warning"
        class="gateway-tabs"
        narrow-indicator
      >
        <q-tab name="dashboard" icon="space_dashboard" label="Dashboard" />
        <q-tab name="merchants" icon="storefront" label="Daftar Merchant" />
        <q-tab name="mappings" icon="account_tree" label="Mapping Aplikasi" />
        <q-tab name="credentials" icon="vpn_key" label="Konfigurasi API" />
        <q-tab name="fees" icon="payments" label="Biaya Admin" />
        <q-tab
          name="billing-transactions"
          icon="receipt_long"
          label="Transaksi Billing"
        />
        <q-tab name="tester" icon="sync_alt" label="Uji Sandbox" />
        <q-tab name="audits" icon="history" label="Audit Log" />
      </q-tabs>
      <q-separator />

      <!-- Tab Panels -->
      <q-tab-panels v-model="activeTab" animated class="gateway-panels">
        <!-- Tab 1: Dashboard -->
        <q-tab-panel name="dashboard" class="q-px-none q-pt-lg">
          <MidtransDashboard @navigate="onNavigateTab" />
        </q-tab-panel>

        <!-- Tab 2: Daftar Merchant -->
        <q-tab-panel name="merchants" class="q-px-none q-pt-lg">
          <MidtransMerchantTable @configure="onConfigureMerchant" />
        </q-tab-panel>

        <!-- Tab 3: Mapping Aplikasi -->
        <q-tab-panel name="mappings" class="q-px-none q-pt-lg">
          <MidtransApplicationMappingTable />
        </q-tab-panel>

        <!-- Tab 4: Konfigurasi API -->
        <q-tab-panel name="credentials" class="q-px-none q-pt-lg">
          <MidtransCredentialForm />
        </q-tab-panel>

        <!-- Tab 5: Biaya Admin per Metode -->
        <q-tab-panel name="fees" class="q-px-none q-pt-lg">
          <MidtransFeeManagement />
        </q-tab-panel>

        <!-- Tab 6: Transaksi Billing -->
        <q-tab-panel name="billing-transactions" class="q-px-none q-pt-lg">
          <MidtransBillingTransactions />
        </q-tab-panel>

        <!-- Tab 6: Uji Sandbox & Simulator -->
        <q-tab-panel name="tester" class="q-px-none q-pt-lg">
          <MidtransSandboxTester />
        </q-tab-panel>

        <!-- Tab 7: Audit Log -->
        <q-tab-panel name="audits" class="q-px-none q-pt-lg">
          <MidtransAuditTable />
        </q-tab-panel>
      </q-tab-panels>

      <!-- Modal Dialogs -->
      <MidtransMerchantFormDialog />
      <MidtransApplicationMappingDialog />
      <MidtransFeeFormDialog />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'
import MidtransApplicationMappingDialog from './comp/MidtransApplicationMappingDialog.vue'
import MidtransApplicationMappingTable from './comp/MidtransApplicationMappingTable.vue'
import MidtransAuditTable from './comp/MidtransAuditTable.vue'
import MidtransBillingTransactions from './comp/MidtransBillingTransactions.vue'
import MidtransCredentialForm from './comp/MidtransCredentialForm.vue'
import MidtransDashboard from './comp/MidtransDashboard.vue'
import MidtransFeeFormDialog from './comp/MidtransFeeFormDialog.vue'
import MidtransFeeManagement from './comp/MidtransFeeManagement.vue'
import MidtransMerchantFormDialog from './comp/MidtransMerchantFormDialog.vue'
import MidtransMerchantTable from './comp/MidtransMerchantTable.vue'
import MidtransSandboxTester from './comp/MidtransSandboxTester.vue'

const store = usePaymentGatewayMidtransStore()
const route = useRoute()

const activeTab = ref(route.query.tab ? String(route.query.tab) : 'dashboard')

const merchantOptions = computed(() => {
  if (!store.merchants || store.merchants.length === 0) {
    return [
      { label: 'UDEV Central Billing', value: 'udev-central' },
      { label: 'Larissama', value: 'larissama' }
    ]
  }

  return store.merchants.map(m => ({
    label: m.merchant_name,
    value: m.merchant_code
  }))
})

const onConfigureMerchant = async merchantCode => {
  await store.selectMerchant(merchantCode)
  activeTab.value = 'credentials'
}

const onNavigateTab = tabName => {
  activeTab.value = tabName
}

onMounted(async () => {
  await Promise.all([
    store.fetchDashboardSummary(),
    store.fetchMerchants(),
    store.fetchApplications(),
    store.fetchMappings()
  ])
  await store.selectMerchant(store.selectedMerchant || 'udev-central')
})

watch(activeTab, newTab => {
  if (newTab === 'billing-transactions') {
    store.fetchBillingTransactions()
  } else if (newTab === 'mappings') {
    store.fetchMappings()
  } else if (newTab === 'audits') {
    store.fetchAudits()
  } else if (newTab === 'tester') {
    store.fetchSandboxHistory()
  } else if (newTab === 'dashboard') {
    store.fetchDashboardSummary()
  }
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
.merchant-bar {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 10px;
}
.gateway-tabs {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
}
.gateway-panels {
  background: transparent;
}
</style>
