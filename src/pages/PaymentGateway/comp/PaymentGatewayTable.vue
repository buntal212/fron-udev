<template>
  <q-card flat bordered class="table-card">
    <q-card-section>
      <h2>Mapping aplikasi dan merchant</h2>
      <p>{{ pagination.rowsNumber }} konfigurasi terdaftar.</p>
    </q-card-section>
    <q-separator />
    <q-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      flat
      :rows-per-page-options="[10, 15, 25, 50]"
      no-data-label="Belum ada mapping payment gateway."
      @request="$emit('request', $event.pagination)"
    >
      <template #body-cell-application="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.value?.name || '—' }}</div>
          <div class="text-caption text-grey-7">{{ props.value?.code }}</div>
        </q-td>
      </template>
      <template #body-cell-provider="props">
        <q-td :props="props"><q-badge color="grey-9">DANA</q-badge></q-td>
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
      <template #body-cell-readiness="props">
        <q-td :props="props">
          <q-badge :color="props.value?.ready ? 'positive' : 'warning'">
            {{ props.value?.ready ? 'Siap' : 'Belum siap' }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-is_active="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.value"
            color="warning"
            :aria-label="
              props.value ? 'Nonaktifkan mapping' : 'Aktifkan mapping'
            "
            @update:model-value="$emit('change-status', props.row, $event)"
          >
            <q-tooltip>{{ props.value ? 'Aktif' : 'Nonaktif' }}</q-tooltip>
          </q-toggle>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="warning"
            aria-label="Ubah mapping"
            @click="$emit('edit', props.row)"
          >
            <q-tooltip>Ubah</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true }
})
defineEmits(['request', 'edit', 'change-status'])

const columns = [
  {
    name: 'application',
    label: 'Aplikasi',
    field: 'application',
    align: 'left'
  },
  { name: 'provider', label: 'Provider', field: 'provider', align: 'left' },
  {
    name: 'environment',
    label: 'Environment',
    field: 'environment',
    align: 'left'
  },
  {
    name: 'gateway_merchant_code',
    label: 'Kode merchant internal',
    field: 'gateway_merchant_code',
    align: 'left'
  },
  { name: 'readiness', label: 'Kesiapan', field: 'readiness', align: 'left' },
  { name: 'is_active', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: 'Aksi', field: 'actions', align: 'right' }
]
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
