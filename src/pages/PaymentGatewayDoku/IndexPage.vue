<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Payment Gateway DOKU" />

      <!-- Page Header -->
      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">PENGATURAN PAYMENT GATEWAY</p>
          <h1>Payment Gateway DOKU</h1>
          <p class="page-description">
            Kelola merchant DOKU, mapping aplikasi, konfigurasi SNAP B2B Sandbox
            terenkripsi, uji token RSA-SHA256, dan audit trail keamanan.
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
            <span class="text-caption text-weight-bold text-grey-8 q-mr-sm"
              >Pilih Merchant Aktif:</span
            >
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
                  store.config?.is_configured ? 'text-positive' : 'text-warning'
                "
              >
                {{
                  store.config?.is_configured
                    ? 'Terkonfigurasi'
                    : 'Belum Lengkap'
                }}
              </strong>
            </div>
            <div>
              Cache B2B:
              <strong
                :class="
                  store.config?.token_cache_active
                    ? 'text-positive'
                    : 'text-grey-6'
                "
              >
                {{
                  store.config?.token_cache_active
                    ? 'Aktif (' +
                      store.config.token_cache_remaining_seconds +
                      's)'
                    : 'Kosong'
                }}
              </strong>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Navigation Tabs -->
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
        <q-tab
          name="credentials"
          icon="vpn_key"
          label="Kredensial & RSA Sandbox"
        />
        <q-tab name="tester" icon="sync_alt" label="Uji SNAP B2B Token" />
        <q-tab name="audits" icon="history" label="Audit Log Gateway" />
      </q-tabs>
      <q-separator />

      <!-- Tab Panels -->
      <q-tab-panels v-model="activeTab" animated class="gateway-panels">
        <!-- Tab 1: Daftar Merchant -->
        <q-tab-panel name="merchants" class="q-px-none q-pt-lg">
          <DokuMerchantTable @configure="onConfigureMerchant" />
        </q-tab-panel>

        <!-- Tab 2: Mapping Aplikasi -->
        <q-tab-panel name="mappings" class="q-px-none q-pt-lg">
          <DokuApplicationMappingTable />
        </q-tab-panel>

        <!-- Tab 3: Kredensial & RSA -->
        <q-tab-panel name="credentials" class="q-px-none q-pt-lg">
          <DokuCredentialForm />
        </q-tab-panel>

        <!-- Tab 4: Tester Token -->
        <q-tab-panel name="tester" class="q-px-none q-pt-lg">
          <DokuTokenTester />
        </q-tab-panel>

        <!-- Tab 5: Audit Log -->
        <q-tab-panel name="audits" class="q-px-none q-pt-lg">
          <DokuAuditTable />
        </q-tab-panel>
      </q-tab-panels>

      <!-- Modal Dialogs -->
      <DokuMerchantFormDialog />
      <DokuApplicationMappingDialog />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'
import DokuApplicationMappingDialog from './comp/DokuApplicationMappingDialog.vue'
import DokuApplicationMappingTable from './comp/DokuApplicationMappingTable.vue'
import DokuAuditTable from './comp/DokuAuditTable.vue'
import DokuCredentialForm from './comp/DokuCredentialForm.vue'
import DokuMerchantFormDialog from './comp/DokuMerchantFormDialog.vue'
import DokuMerchantTable from './comp/DokuMerchantTable.vue'
import DokuTokenTester from './comp/DokuTokenTester.vue'

const store = usePaymentGatewayDokuStore()
const activeTab = ref('merchants')

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

onMounted(async () => {
  await store.fetchMerchants()
  await store.selectMerchant(store.selectedMerchant || 'udev-central')
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
