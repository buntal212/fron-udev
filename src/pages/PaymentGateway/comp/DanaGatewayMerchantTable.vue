<template>
  <q-card flat bordered class="table-card">
    <q-card-section>
      <h2>Daftar merchant DANA</h2>
      <p>{{ pagination.rowsNumber }} merchant diprovisikan melalui UDEV.</p>
    </q-card-section>
    <q-separator />
    <q-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="merchant_id"
      flat
      :rows-per-page-options="[10, 15, 25, 50]"
      @request="$emit('request', $event.pagination)"
    >
      <template #no-data>
        <EmptyState
          icon="storefront"
          title="Belum ada merchant DANA"
          message="Tambahkan merchant untuk memulai provisioning. Merchant baru belum dapat digunakan untuk checkout."
        />
      </template>
      <template #body-cell-merchant="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.merchant_name }}</div>
          <div class="text-caption text-grey-7">
            {{ props.row.merchant_code }}
          </div>
        </q-td>
      </template>
      <template #body-cell-environment="props">
        <q-td :props="props">
          <q-badge
            :color="props.value === 'production' ? 'deep-orange' : 'blue-grey'"
          >
            {{ props.value }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-provisioning_status="props">
        <q-td :props="props">
          <q-badge color="positive">{{ labelFor(props.value) }}</q-badge>
        </q-td>
      </template>
      <template #body-cell-credential_status="props">
        <q-td :props="props">
          <q-badge color="warning" text-color="dark">
            {{ labelFor(props.value) }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-provisioned_at="props">
        <q-td :props="props">{{ formatDate(props.value) }}</q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            dense
            color="warning"
            icon="visibility"
            label="Detail"
            no-caps
            @click="$emit('detail', props.row.merchant_id)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import EmptyState from '@/components/EmptyState.vue'

defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true }
})
defineEmits(['request', 'detail'])

const columns = [
  {
    name: 'merchant',
    label: 'Merchant',
    field: 'merchant_name',
    align: 'left'
  },
  {
    name: 'environment',
    label: 'Environment',
    field: 'environment',
    align: 'left'
  },
  {
    name: 'provisioning_status',
    label: 'Provisioning',
    field: 'provisioning_status',
    align: 'left'
  },
  {
    name: 'credential_status',
    label: 'Bootstrap credential',
    field: 'credential_status',
    align: 'left'
  },
  {
    name: 'provisioned_at',
    label: 'Diproses',
    field: 'provisioned_at',
    align: 'left'
  },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]

function labelFor(value) {
  return value ? value.replaceAll('_', ' ') : 'Tidak diketahui'
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<style scoped>
.table-card {
  border-color: #e0d7c6;
  border-radius: 14px;
}
h2 {
  margin: 0 0 4px;
  color: #20180b;
  font-size: 1.02rem;
}
p {
  margin: 0;
  color: #746b5c;
  font-size: 0.82rem;
}
</style>
