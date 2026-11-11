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
          <div class="row items-center q-gutter-xs">
            <span class="text-weight-medium">{{
              props.row.merchant_name
            }}</span>
            <q-badge
              v-if="props.row.is_primary"
              color="purple"
              text-color="white"
              class="q-px-xs text-caption"
            >
              <q-icon name="star" size="12px" class="q-mr-xs" />
              Merchant Utama Aktif
            </q-badge>
          </div>
          <div class="text-caption text-grey-7">
            {{ props.row.merchant_code }}
          </div>
        </q-td>
      </template>
      <template #body-cell-environment="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <q-badge color="blue-grey" label="Sandbox" />
            <q-badge color="deep-orange" label="Production" />
          </div>
        </q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.merchant_status === 'active' ? 'positive' : 'grey-7'
            "
          >
            {{ props.row.merchant_status === 'active' ? 'Aktif' : 'Nonaktif' }}
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
        <q-td :props="props" class="text-right q-gutter-xs">
          <q-btn
            flat
            dense
            color="warning"
            icon="settings"
            label="Detail & Konfigurasi"
            no-caps
            @click="$emit('detail', props.row.merchant_id)"
          />
          <template v-if="props.row.is_primary">
            <q-badge
              color="amber-2"
              text-color="brown-9"
              label="Merchant Sistem Pusat"
              class="q-pa-xs"
            />
          </template>
          <template v-else>
            <q-btn
              flat
              dense
              color="primary"
              icon="star_outline"
              label="Jadikan Utama"
              no-caps
              :loading="settingPrimaryId === props.row.merchant_id"
              :disable="
                props.row.merchant_status !== 'active' ||
                Boolean(settingPrimaryId)
              "
              @click="confirmSetPrimary(props.row)"
            >
              <q-tooltip v-if="props.row.merchant_status !== 'active'">
                Hanya merchant aktif yang dapat dijadikan Merchant Utama
              </q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              :color="
                props.row.merchant_status === 'active'
                  ? 'blue-grey-7'
                  : 'positive'
              "
              :icon="
                props.row.merchant_status === 'active'
                  ? 'pause_circle'
                  : 'play_circle'
              "
              :label="
                props.row.merchant_status === 'active'
                  ? 'Nonaktifkan'
                  : 'Aktifkan'
              "
              no-caps
              @click="confirmToggleStatus(props.row)"
            />
            <q-btn
              flat
              dense
              color="negative"
              icon="delete_outline"
              label="Hapus"
              no-caps
              @click="confirmDelete(props.row)"
            />
          </template>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import { Dialog, useQuasar } from 'quasar'
import EmptyState from '@/components/EmptyState.vue'

const $q = useQuasar()

defineProps({
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  pagination: { type: Object, required: true },
  settingPrimaryId: { type: [Number, String], default: null }
})
const emit = defineEmits([
  'request',
  'detail',
  'toggle-status',
  'delete',
  'set-primary'
])

function confirmSetPrimary(row) {
  const dialog = $q?.dialog || Dialog.create
  dialog({
    title: 'Tetapkan Merchant Utama DANA',
    message: `Apakah Anda yakin ingin menetapkan "${row.merchant_name}" (${row.merchant_code}) sebagai Merchant Utama DANA? Seluruh Invoice langganan baru UDEV akan diarahkan ke merchant ini.`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Jadikan Utama', color: 'primary' },
    persistent: true
  }).onOk(() => {
    emit('set-primary', row)
  })
}

function confirmToggleStatus(row) {
  const isCurrentlyActive = row.merchant_status === 'active'
  const actionLabel = isCurrentlyActive ? 'menonaktifkan' : 'mengaktifkan'
  const dialog = $q?.dialog || Dialog.create
  dialog({
    title: `Konfirmasi ${isCurrentlyActive ? 'Nonaktifkan' : 'Aktifkan'} Merchant`,
    message: `Apakah Anda yakin ingin ${actionLabel} merchant "${row.merchant_name}" (${row.merchant_code})?`,
    cancel: { label: 'Batal', flat: true },
    ok: {
      label: isCurrentlyActive ? 'Nonaktifkan' : 'Aktifkan',
      color: isCurrentlyActive ? 'warning' : 'positive'
    },
    persistent: true
  }).onOk(() => {
    emit('toggle-status', row, !isCurrentlyActive)
  })
}

function confirmDelete(row) {
  const dialog = $q?.dialog || Dialog.create
  dialog({
    title: 'Hapus Merchant DANA',
    message: `Apakah Anda yakin ingin menghapus merchant "${row.merchant_name}" (${row.merchant_code})? Tindakan ini tidak dapat dibatalkan.`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative' },
    persistent: true
  }).onOk(() => {
    emit('delete', row)
  })
}

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
    name: 'status',
    label: 'Status',
    field: 'merchant_status',
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
