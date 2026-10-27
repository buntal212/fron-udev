<template>
  <q-dialog v-model="store.formDialogOpen" persistent>
    <q-card class="form-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">PENGATURAN</p>
          <h2>{{
            store.formMode === 'edit' ? 'Ubah mapping' : 'Tambah mapping'
          }}</h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.formDialogOpen = false"
        />
      </q-card-section>
      <q-separator />
      <q-form @submit="store.saveMapping">
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="store.form.application_id"
            outlined
            dense
            emit-value
            map-options
            label="Aplikasi"
            :disable="store.formMode === 'edit'"
            :options="applicationOptions"
            :rules="[requiredApplication]"
            :error="hasError('application_id')"
            :error-message="errorFor('application_id')"
          />
          <q-input
            outlined
            dense
            label="Provider pembayaran"
            model-value="DANA"
            readonly
          />
          <q-select
            :model-value="store.form.environment"
            outlined
            dense
            emit-value
            map-options
            label="Environment"
            :options="environmentOptions"
            :rules="[requiredEnvironment]"
            :error="hasError('environment')"
            :error-message="errorFor('environment')"
            @update:model-value="store.changeFormEnvironment"
          />
          <q-select
            v-model="store.form.gateway_merchant_code"
            outlined
            dense
            emit-value
            map-options
            label="Merchant DANA"
            hint="Hanya merchant yang diizinkan oleh server ditampilkan."
            :options="merchantOptions"
            :rules="[requiredMerchant]"
            :error="hasError('gateway_merchant_code')"
            :error-message="errorFor('gateway_merchant_code')"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="scope.opt.ready ? 'positive' : 'warning'">
                    {{ scope.opt.ready ? 'Siap' : 'Belum siap' }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-banner dense class="bg-amber-1 text-brown-10">
            Credential merchant disimpan di konfigurasi server dan tidak dapat
            dilihat atau diubah dari halaman ini.
          </q-banner>
          <q-banner dense class="bg-blue-1 text-blue-10">
            Mapping aplikasi hanya dipertahankan untuk checkout dan settlement
            historis. Invoice langganan Sandbox baru selalu memakai merchant
            penerima UDEV pusat yang dikonfigurasi aman di server.
          </q-banner>
          <q-toggle
            v-model="store.form.is_active"
            color="warning"
            label="Mapping aktif"
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Batal"
            @click="store.formDialogOpen = false"
          />
          <q-btn
            color="warning"
            text-color="dark"
            no-caps
            type="submit"
            :loading="store.saving"
            :label="
              store.formMode === 'edit' ? 'Simpan perubahan' : 'Simpan mapping'
            "
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { usePaymentGatewayStore } from '@/stores/paymentgateway'

const store = usePaymentGatewayStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const merchantOptions = computed(() =>
  store.merchantOptions
    .filter(merchant => merchant.is_active && merchant.readiness?.ready)
    .map(merchant => ({
      label: merchant.name
        ? `${merchant.name} (${merchant.code})`
        : merchant.code,
      value: merchant.code,
      caption: merchant.code,
      ready: merchant.readiness?.ready
    }))
)
const environmentOptions = [
  { label: 'Sandbox', value: 'sandbox' },
  { label: 'Production', value: 'production' }
]
const requiredApplication = value => !!value || 'Aplikasi wajib dipilih.'
const requiredEnvironment = value => !!value || 'Environment wajib dipilih.'
const requiredMerchant = value => !!value || 'Merchant wajib dipilih.'
const hasError = field => Boolean(store.formErrors[field]?.length)
const errorFor = field => store.formErrors[field]?.[0] || ''
</script>

<style scoped>
.form-dialog {
  width: min(620px, 96vw);
  border-radius: 14px;
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
h2 {
  margin: 0;
  color: #20180b;
  font-size: 1.15rem;
}
</style>
