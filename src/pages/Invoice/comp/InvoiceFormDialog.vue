<template>
  <q-dialog v-model="store.formDialogOpen" persistent>
    <q-card class="form-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <p class="eyebrow">TAGIHAN UDEV</p>
          <h2>Buat invoice</h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          :disable="store.saving"
          @click="store.formDialogOpen = false"
        />
      </q-card-section>
      <q-separator />
      <q-form @submit="store.saveInvoice">
        <q-card-section class="q-gutter-md">
          <q-banner
            v-if="store.formMessage"
            rounded
            class="bg-negative text-white"
          >
            {{ store.formMessage }}
          </q-banner>
          <q-select
            v-model="store.form.application_id"
            outlined
            dense
            emit-value
            map-options
            label="Aplikasi"
            :options="applicationOptions"
            :loading="store.applicationsLoading"
            :rules="[requiredApplication]"
            :error="hasError('application_id')"
            :error-message="errorFor('application_id')"
            @update:model-value="store.onFormApplicationChanged"
          >
            <template #no-option>
              <q-item>
                <q-item-section>
                  {{ applicationNoOptionMessage }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-banner
            v-if="store.applicationsError"
            rounded
            class="lookup-message lookup-message--error"
          >
            {{ store.applicationsError }}
            <template #action>
              <q-btn
                flat
                dense
                no-caps
                label="Coba lagi"
                :loading="store.applicationsLoading"
                @click="store.fetchApplications"
              />
            </template>
          </q-banner>
          <q-select
            v-model="store.form.application_customer_id"
            outlined
            dense
            emit-value
            map-options
            label="Pelanggan"
            :options="customerOptions"
            :disable="!store.form.application_id || store.formCustomersLoading"
            :loading="store.formCustomersLoading"
            :hint="customerHint"
            persistent-hint
            :rules="[requiredCustomer]"
            :error="hasError('application_customer_id')"
            :error-message="errorFor('application_customer_id')"
            @update:model-value="store.onFormCustomerChanged"
          >
            <template #no-option>
              <q-item>
                <q-item-section>{{ customerNoOptionMessage }}</q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-banner
            v-if="customerLookupMessage"
            rounded
            :class="[
              'lookup-message',
              { 'lookup-message--error': store.formCustomersError }
            ]"
          >
            {{ customerLookupMessage }}
            <template v-if="store.formCustomersError" #action>
              <q-btn
                flat
                dense
                no-caps
                label="Coba lagi"
                :loading="store.formCustomersLoading"
                @click="store.retryFormCustomers"
              />
            </template>
          </q-banner>
          <q-select
            v-model="store.form.subscription_plan_id"
            outlined
            dense
            emit-value
            map-options
            label="Paket langganan"
            :options="planOptions"
            :disable="!store.form.application_id || store.plansLoading"
            :loading="store.plansLoading"
            :hint="planHint"
            persistent-hint
            :rules="[requiredPlan]"
            :error="hasError('subscription_plan_id')"
            :error-message="errorFor('subscription_plan_id')"
            @update:model-value="store.onFormPlanChanged"
          >
            <template #no-option>
              <q-item>
                <q-item-section>{{ planNoOptionMessage }}</q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-banner
            v-if="planLookupMessage"
            rounded
            :class="[
              'lookup-message',
              { 'lookup-message--error': store.plansError }
            ]"
          >
            {{ planLookupMessage }}
            <template v-if="store.plansError" #action>
              <q-btn
                flat
                dense
                no-caps
                label="Coba lagi"
                :loading="store.plansLoading"
                @click="store.retryPlans"
              />
            </template>
          </q-banner>
          <q-banner v-if="selectedPlan" rounded class="price-preview">
            <div class="text-weight-bold">Harga paket</div>
            <div>{{
              formatSubscriptionPrice(selectedPlan.price, selectedPlan.currency)
            }}</div>
            <div class="text-caption"
              >Durasi {{ selectedPlan.duration_days }} hari</div
            >
          </q-banner>
          <q-select
            v-model="store.form.subscription_id"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Langganan terkait (opsional)"
            :options="subscriptionOptions"
            :disable="
              !store.form.application_customer_id || store.subscriptionsLoading
            "
            :loading="store.subscriptionsLoading"
            :hint="subscriptionHint"
            persistent-hint
            :error="hasError('subscription_id')"
            :error-message="errorFor('subscription_id')"
          >
            <template #no-option>
              <q-item>
                <q-item-section>{{
                  subscriptionNoOptionMessage
                }}</q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-banner
            v-if="subscriptionLookupMessage"
            rounded
            :class="[
              'lookup-message',
              { 'lookup-message--error': store.subscriptionsError }
            ]"
          >
            {{ subscriptionLookupMessage }}
            <template v-if="store.subscriptionsError" #action>
              <q-btn
                flat
                dense
                no-caps
                label="Coba lagi"
                :loading="store.subscriptionsLoading"
                @click="store.retrySubscriptions"
              />
            </template>
          </q-banner>
          <q-input
            v-model="store.form.due_at"
            outlined
            dense
            type="datetime-local"
            label="Tanggal jatuh tempo"
            :rules="[requiredDueDate]"
            :error="hasError('due_at')"
            :error-message="errorFor('due_at')"
          />
          <p class="form-note">
            Nominal dan mata uang ditentukan oleh paket langganan untuk menjaga
            konsistensi tagihan.
          </p>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Batal"
            :disable="store.saving"
            @click="store.formDialogOpen = false"
          />
          <q-btn
            color="warning"
            text-color="dark"
            no-caps
            type="submit"
            label="Buat invoice"
            :loading="store.saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useInvoiceStore } from '@/stores/invoice'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice
} from '@/utils/subscription'

const store = useInvoiceStore()
const applicationOptions = computed(() =>
  store.applications.map(application => ({
    label: application.name,
    value: application.id
  }))
)
const customerOptions = computed(() =>
  store.formCustomers.map(customer => ({
    label: customer.name,
    value: customer.id
  }))
)
const planOptions = computed(() =>
  store.plans.map(plan => ({
    label: `${plan.name} (${formatSubscriptionPrice(plan.price, plan.currency)})`,
    value: plan.id
  }))
)
const subscriptionOptions = computed(() =>
  store.subscriptions.map(subscription => ({
    label: `${subscription.plan?.name || 'Langganan'} · berakhir ${formatSubscriptionDate(subscription.expires_at)}`,
    value: subscription.id
  }))
)
const selectedPlan = computed(() =>
  store.plans.find(plan => plan.id === store.form.subscription_plan_id)
)
const applicationNoOptionMessage = computed(() => {
  if (store.applicationsLoading) return 'Memuat aplikasi...'
  return 'Belum ada aplikasi yang dapat dipilih.'
})
const customerNoOptionMessage = computed(() => {
  if (!store.form.application_id) return 'Pilih aplikasi terlebih dahulu.'
  if (store.formCustomersLoading) return 'Memuat pelanggan...'
  if (store.formCustomersError) return 'Pelanggan tidak dapat dimuat.'
  return 'Belum ada pelanggan.'
})
const planNoOptionMessage = computed(() => {
  if (!store.form.application_id) return 'Pilih aplikasi terlebih dahulu.'
  if (store.plansLoading) return 'Memuat paket langganan...'
  if (store.plansError) return 'Paket langganan tidak dapat dimuat.'
  return 'Belum ada paket langganan.'
})
const subscriptionNoOptionMessage = computed(() => {
  if (!store.form.application_customer_id)
    return 'Pilih pelanggan terlebih dahulu.'
  if (store.subscriptionsLoading) return 'Memuat langganan...'
  if (store.subscriptionsError) return 'Langganan terkait tidak dapat dimuat.'
  return 'Belum ada langganan terkait.'
})
const customerHint = computed(() =>
  store.form.application_id
    ? 'Pelanggan aktif dari aplikasi terpilih.'
    : 'Pilih aplikasi terlebih dahulu.'
)
const planHint = computed(() =>
  store.form.application_id
    ? 'Paket aktif dari aplikasi terpilih.'
    : 'Pilih aplikasi terlebih dahulu.'
)
const subscriptionHint = computed(() =>
  store.form.application_customer_id
    ? 'Opsional; hanya menampilkan langganan pelanggan terpilih.'
    : 'Pilih pelanggan terlebih dahulu.'
)
const customerLookupMessage = computed(() => {
  if (!store.form.application_id || store.formCustomersLoading) return ''
  return (
    store.formCustomersError ||
    (!customerOptions.value.length
      ? 'Belum ada pelanggan untuk aplikasi ini.'
      : '')
  )
})
const planLookupMessage = computed(() => {
  if (!store.form.application_id || store.plansLoading) return ''
  return (
    store.plansError ||
    (!planOptions.value.length
      ? 'Belum ada paket langganan untuk aplikasi ini.'
      : '')
  )
})
const subscriptionLookupMessage = computed(() => {
  if (!store.form.application_customer_id || store.subscriptionsLoading)
    return ''
  return (
    store.subscriptionsError ||
    (!subscriptionOptions.value.length
      ? 'Belum ada langganan terkait untuk pelanggan ini.'
      : '')
  )
})
const requiredApplication = value => !!value || 'Aplikasi wajib dipilih.'
const requiredCustomer = value => !!value || 'Pelanggan wajib dipilih.'
const requiredPlan = value => !!value || 'Paket langganan wajib dipilih.'
const requiredDueDate = value => !!value || 'Tanggal jatuh tempo wajib diisi.'
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
.price-preview {
  border: 1px solid #e0c37c;
  background: #fff8e4;
  color: #4b3813;
}
.form-note {
  margin: 0;
  color: #746b5c;
  font-size: 0.78rem;
}
.lookup-message {
  border: 1px solid #e0c37c;
  background: #fff8e4;
  color: #4b3813;
  font-size: 0.8rem;
}
.lookup-message--error {
  border-color: #d27c7c;
  background: #fff1f1;
  color: #7b2222;
}
</style>
