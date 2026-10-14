<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="detail-dialog">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Detail merchant</div>
          <div class="text-caption text-grey-7"
            >Informasi monitoring aplikasi</div
          >
        </div>
        <q-btn v-close-popup flat round dense icon="close" aria-label="Tutup" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="loading" class="q-gutter-y-sm">
        <q-skeleton type="text" />
        <q-skeleton type="text" />
        <q-skeleton type="text" />
      </q-card-section>

      <q-card-section v-else-if="merchant" class="q-gutter-y-md">
        <div class="detail-row"
          ><span>Nama aplikasi</span><strong>{{ merchant.name }}</strong></div
        >
        <div class="detail-row"
          ><span>Kode aplikasi</span><strong>{{ merchant.code }}</strong></div
        >
        <div class="detail-row"
          ><span>Status</span><StatusBadge :status="merchant.status"
        /></div>
        <div class="detail-row">
          <span>Total transaksi</span
          ><strong>{{
            merchant.total_transactions.toLocaleString('id-ID')
          }}</strong>
        </div>
        <div class="detail-row"
          ><span>Tanggal terdaftar</span
          ><strong>{{ formatDate(merchant.registered_at) }}</strong></div
        >
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat color="primary" label="Tutup" no-caps />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import StatusBadge from '@/components/StatusBadge.vue'

defineProps({
  modelValue: Boolean,
  merchant: { type: Object, default: null },
  loading: Boolean
})
defineEmits(['update:modelValue'])

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<style scoped>
.detail-dialog {
  width: min(100vw - 32px, 520px);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  font-size: 0.9rem;
}

.detail-row span {
  color: #718096;
}
</style>
