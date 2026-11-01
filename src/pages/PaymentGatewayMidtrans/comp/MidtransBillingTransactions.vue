<template>
  <div>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Transaksi Billing Midtrans
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Monitoring percobaan pembayaran invoice dan status sinkronisasi
          gateway Midtrans Sandbox.
        </p>
      </div>

      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Muat Ulang"
          no-caps
          :loading="store.billingLoading"
          @click="store.fetchBillingTransactions"
        />
      </div>
    </div>

    <!-- Filter Panel -->
    <FilterPanel class="q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-input
          v-model="store.billingFilter.invoice_number"
          outlined
          dense
          clearable
          label="Nomor Invoice"
          debounce="300"
          bg-color="white"
          @update:model-value="store.fetchBillingTransactions"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-input
          v-model="store.billingFilter.customer"
          outlined
          dense
          clearable
          label="Nama Pelanggan"
          debounce="300"
          bg-color="white"
          @update:model-value="store.fetchBillingTransactions"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-select
          v-model="store.billingFilter.status"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Status Pembayaran"
          :options="statusOptions"
          bg-color="white"
          @update:model-value="store.fetchBillingTransactions"
        />
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-select
          v-model="store.billingFilter.application_id"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Aplikasi"
          :options="applicationOptions"
          bg-color="white"
          @update:model-value="store.fetchBillingTransactions"
        />
      </div>
    </FilterPanel>

    <!-- Table -->
    <q-table
      flat
      bordered
      :rows="store.billingTransactions"
      :columns="columns"
      :loading="store.billingLoading"
      :pagination="store.billingPagination"
      row-key="id"
      no-data-label="Belum ada transaksi billing Midtrans."
      class="billing-table"
      @request="store.fetchBillingTransactions"
    >
      <!-- Invoice & Customer -->
      <template #body-cell-invoice="props">
        <q-td :props="props">
          <div class="text-weight-bold text-dark">
            {{ props.row.invoice?.number || '—' }}
          </div>
          <div class="text-caption text-grey-7">
            {{ props.row.customer?.name || '—' }}
          </div>
        </q-td>
      </template>

      <!-- Application -->
      <template #body-cell-application="props">
        <q-td :props="props">
          <div class="text-weight-medium">
            {{ props.row.application?.name || '—' }}
          </div>
          <div class="text-caption text-grey-6 font-mono">
            {{ props.row.application?.code || '—' }}
          </div>
        </q-td>
      </template>

      <!-- Amount -->
      <template #body-cell-amount="props">
        <q-td :props="props" class="text-right">
          <div class="text-weight-bold text-dark font-mono">
            Rp {{ formatNumber(props.row.amount) }}
          </div>
        </q-td>
      </template>

      <!-- Status -->
      <template #body-cell-status="props">
        <q-td :props="props" class="text-center">
          <q-badge
            :color="statusColor(props.row.payment_attempt?.status)"
            class="text-weight-bold"
          >
            {{ (props.row.payment_attempt?.status || 'UNKNOWN').toUpperCase() }}
          </q-badge>
        </q-td>
      </template>

      <!-- Requested At -->
      <template #body-cell-requested_at="props">
        <q-td :props="props">
          <div class="text-caption">
            {{
              props.row.payment_attempt?.requested_at
                ? formatDate(props.row.payment_attempt.requested_at)
                : '—'
            }}
          </div>
        </q-td>
      </template>

      <!-- Actions -->
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="warning"
            @click="store.showBillingTransactionDetail(props.row.id)"
          >
            <q-tooltip>Lihat Detail Transaksi</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Detail Dialog -->
    <q-dialog v-model="store.billingDetailDialogOpen">
      <q-card style="min-width: 500px; max-width: 700px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div>
            <div class="text-caption text-weight-bold text-amber-9"
              >DETAIL TRANSAKSI BILLING</div
            >
            <div class="text-h6 text-weight-bold">
              {{ store.selectedBillingTransaction?.invoice?.number }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator class="q-my-sm" />

        <q-card-section v-if="store.billingDetailLoading">
          <q-skeleton type="rect" height="150px" />
        </q-card-section>

        <q-card-section
          v-else-if="store.selectedBillingTransaction"
          class="q-gutter-y-sm"
        >
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <span class="text-caption text-grey-7">Pelanggan:</span>
              <div class="text-weight-bold">{{
                store.selectedBillingTransaction.customer?.name
              }}</div>
            </div>
            <div class="col-6">
              <span class="text-caption text-grey-7">Aplikasi:</span>
              <div class="text-weight-bold">{{
                store.selectedBillingTransaction.application?.name
              }}</div>
            </div>
            <div class="col-6">
              <span class="text-caption text-grey-7">Nominal:</span>
              <div
                class="text-weight-bolder text-dark font-mono text-subtitle1"
              >
                Rp {{ formatNumber(store.selectedBillingTransaction.amount) }}
              </div>
            </div>
            <div class="col-6">
              <span class="text-caption text-grey-7">Status:</span>
              <div>
                <q-badge
                  :color="
                    statusColor(
                      store.selectedBillingTransaction.payment_attempt?.status
                    )
                  "
                >
                  {{
                    store.selectedBillingTransaction.payment_attempt?.status?.toUpperCase()
                  }}
                </q-badge>
              </div>
            </div>
            <div class="col-12">
              <span class="text-caption text-grey-7">Merchant Reference:</span>
              <div
                class="font-mono text-weight-medium bg-grey-2 q-pa-xs rounded-borders"
              >
                {{ store.selectedBillingTransaction.references?.merchant }}
              </div>
            </div>
            <div class="col-12">
              <span class="text-caption text-grey-7"
                >Sinkronisasi Gateway:</span
              >
              <div class="text-body2">
                {{ store.selectedBillingTransaction.billing_sync?.label }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Tutup" color="grey-8" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Succeeded / Paid', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' }
]

const applicationOptions = computed(() =>
  store.applications.map(app => ({
    label: app.name,
    value: app.id
  }))
)

const columns = [
  {
    name: 'invoice',
    label: 'INVOICE & PELANGGAN',
    align: 'left',
    field: row => row.invoice?.number
  },
  {
    name: 'application',
    label: 'APLIKASI',
    align: 'left',
    field: row => row.application?.name
  },
  {
    name: 'amount',
    label: 'NOMINAL',
    align: 'right',
    field: 'amount'
  },
  {
    name: 'status',
    label: 'STATUS',
    align: 'center',
    field: row => row.payment_attempt?.status
  },
  {
    name: 'requested_at',
    label: 'WAKTU PERMINTAAN',
    align: 'left',
    field: row => row.payment_attempt?.requested_at
  },
  {
    name: 'actions',
    label: 'AKSI',
    align: 'right'
  }
]

function formatNumber(val) {
  if (!val) return '0'
  return Number(val).toLocaleString('id-ID')
}

function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function statusColor(status) {
  switch (status) {
    case 'succeeded':
    case 'paid':
      return 'positive'
    case 'pending':
    case 'initiated':
      return 'warning'
    case 'failed':
      return 'negative'
    case 'expired':
    case 'cancelled':
      return 'grey-7'
    default:
      return 'grey-6'
  }
}
</script>

<style scoped>
.billing-table {
  background: #ffffff;
  border-radius: 12px;
}
.font-mono {
  font-family: monospace;
}
</style>
