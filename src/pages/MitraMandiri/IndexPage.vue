<template>
  <q-page class="q-pa-md q-pa-lg-md"
    ><div class="content-wrap">
      <AppBreadcrumb title="Mitra Mandiri" />
      <div class="row items-center justify-between q-mt-md q-mb-md"
        ><div
          ><p class="eyebrow">MASTER KEMITRAAN</p><h1>Mitra Mandiri</h1
          ><p class="page-description"
            >Kelola mitra dan kode referral UDEV.</p
          ></div
        ><q-btn
          color="warning"
          text-color="dark"
          icon="add"
          label="Tambah mitra"
          no-caps
          @click="store.openCreate"
      /></div>
      <FilterPanel class="q-mb-md"
        ><div class="col-12 col-md-6"
          ><q-input
            v-model="store.search"
            outlined
            dense
            clearable
            debounce="250"
            label="Cari nama, WhatsApp, atau email"
            bg-color="white"
            ><template #prepend
              ><q-icon name="search" /></template></q-input></div
        ><div class="col-12 col-md-3"
          ><q-select
            v-model="store.status"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Status"
            :options="statusOptions"
            bg-color="white" /></div
      ></FilterPanel>
      <ErrorState
        v-if="store.error"
        :message="store.error"
        @retry="store.fetch"
      />
      <q-table
        v-else
        flat
        bordered
        row-key="id"
        :rows="store.items"
        :columns="columns"
        :loading="store.loading"
        :pagination="store.pagination"
        :rows-per-page-options="[15, 30, 50]"
        @request="request"
        ><template #body-cell-status="props"
          ><q-td :props="props"
            ><q-badge
              :color="props.row.is_active ? 'positive' : 'grey-7'"
              :label="
                props.row.is_active ? 'Aktif' : 'Tidak aktif'
              " /></q-td></template
        ><template #body-cell-actions="props"
          ><q-td :props="props"
            ><q-btn
              flat
              round
              dense
              icon="visibility"
              @click="store.openDetail(props.row)" /><q-btn
              flat
              round
              dense
              icon="edit"
              @click="store.openEdit(props.row)" /><q-btn
              flat
              round
              dense
              :icon="props.row.is_active ? 'block' : 'check_circle'"
              :color="props.row.is_active ? 'negative' : 'positive'"
              @click="confirmStatus(props.row)" /></q-td></template
      ></q-table>
      <q-dialog v-model="store.formOpen"
        ><q-card class="dialog"
          ><q-form @submit.prevent="store.save"
            ><q-card-section
              ><p class="eyebrow"
                >{{ store.editingId ? 'PERBARUI' : 'TAMBAH' }} MITRA</p
              ><h2>{{
                store.editingId ? 'Edit mitra' : 'Mitra baru'
              }}</h2></q-card-section
            ><q-card-section class="row q-col-gutter-sm"
              ><div class="col-12"
                ><q-input
                  v-model="store.form.name"
                  outlined
                  dense
                  label="Nama mitra *"
                  :error="hasError('name')"
                  :error-message="errorFor('name')" /></div
              ><div class="col-12 col-sm-6"
                ><q-input
                  v-model="store.form.whatsapp_number"
                  outlined
                  dense
                  label="Nomor WhatsApp *"
                  :error="hasError('whatsapp_number')"
                  :error-message="errorFor('whatsapp_number')" /></div
              ><div class="col-12 col-sm-6"
                ><q-input
                  v-model="store.form.email"
                  outlined
                  dense
                  type="email"
                  label="Email"
                  :error="hasError('email')"
                  :error-message="errorFor('email')" /></div
              ><div class="col-12"
                ><q-input
                  v-model="store.form.address"
                  outlined
                  dense
                  type="textarea"
                  label="Alamat" /></div
              ><div class="col-12"
                ><q-input
                  v-model="store.form.notes"
                  outlined
                  dense
                  type="textarea"
                  label="Catatan" /></div
              ><div class="col-12"
                ><q-toggle
                  v-model="store.form.is_active"
                  color="warning"
                  label="Mitra aktif" /></div></q-card-section
            ><q-card-actions align="right"
              ><q-btn flat no-caps label="Batal" v-close-popup /><q-btn
                color="warning"
                text-color="dark"
                no-caps
                type="submit"
                :loading="store.saving"
                label="Simpan" /></q-card-actions></q-form></q-card
      ></q-dialog>
      <q-dialog v-model="store.detailOpen"
        ><q-card class="dialog"
          ><q-card-section class="row justify-between"
            ><div
              ><p class="eyebrow">DETAIL MITRA</p
              ><h2>{{ store.detail?.name || 'Memuat...' }}</h2></div
            ><q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup /></q-card-section
          ><q-card-section v-if="store.detail"
            ><div class="detail-grid"
              ><span>WhatsApp</span
              ><strong>{{ store.detail.whatsapp_number }}</strong
              ><span>Email</span><strong>{{ store.detail.email || '-' }}</strong
              ><span>Kode referral</span
              ><strong>{{ store.detail.referral_codes_count || 0 }}</strong
              ><span>Total komisi terverifikasi</span
              ><strong>{{ money(store.detail.commission_total) }}</strong></div
            ><q-separator class="q-my-md" /><div
              class="text-weight-bold q-mb-sm"
              >Kode referral</div
            ><q-list bordered separator
              ><q-item
                v-for="code in store.detail.referral_codes"
                :key="code.id"
                ><q-item-section
                  ><q-item-label>{{ code.code }} · {{ code.type }}</q-item-label
                  ><q-item-label caption
                    >{{ money(code.customer_price) }} ·
                    {{ code.usages_count || 0 }} penggunaan</q-item-label
                  ></q-item-section
                ><q-item-section side
                  ><q-badge
                    :color="code.is_active ? 'positive' : 'grey-7'"
                    :label="
                      code.is_active ? 'Aktif' : 'Nonaktif'
                    " /></q-item-section></q-item
              ><q-item v-if="!store.detail.referral_codes?.length"
                ><q-item-section
                  >Belum ada kode referral.</q-item-section
                ></q-item
              ></q-list
            ></q-card-section
          ></q-card
        ></q-dialog
      >
      <ConfirmDialog
        v-model="confirmation.open"
        :title="confirmation.title"
        :message="confirmation.message"
        @confirm="applyConfirmation"
      /> </div
  ></q-page>
</template>
<script setup>
import { onMounted, reactive, watch } from 'vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useMitraStore } from '@/stores/mitra'
const store = useMitraStore()
const statusOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak aktif', value: false }
]
const columns = [
  {
    name: 'name',
    label: 'Mitra',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'whatsapp_number',
    label: 'WhatsApp',
    field: 'whatsapp_number',
    align: 'left'
  },
  {
    name: 'referral_codes_count',
    label: 'Kode',
    field: 'referral_codes_count',
    align: 'center'
  },
  { name: 'status', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'actions', label: '', field: 'id', align: 'right' }
]
const confirmation = reactive({
  open: false,
  title: '',
  message: '',
  action: null
})
const request = props =>
  store.fetch({
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending
  })
const confirmStatus = item => {
  confirmation.open = true
  confirmation.title = item.is_active ? 'Nonaktifkan mitra?' : 'Aktifkan mitra?'
  confirmation.message = item.is_active
    ? 'Kode aktif milik mitra ini tidak dapat digunakan pelanggan baru saat mitra nonaktif.'
    : 'Mitra dapat kembali menerima kode referral.'
  confirmation.action = () => store.setStatus(item, !item.is_active)
}
const applyConfirmation = () => {
  confirmation.open = false
  confirmation.action?.()
}
const hasError = field => Boolean(store.formErrors[field]?.length)
const errorFor = field => store.formErrors[field]?.[0] || ''
const money = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
onMounted(() => store.fetch())
watch([() => store.search, () => store.status], () => store.fetch({ page: 1 }))
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
h1,
h2 {
  margin: 0;
  color: #17130c;
}
h1 {
  font-size: 1.7rem;
}
.page-description {
  margin: 5px 0 0;
  color: #716a5d;
}
.dialog {
  width: min(700px, 96vw);
  border-radius: 14px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 9px;
}
.detail-grid span {
  color: #716a5d;
}
</style>
