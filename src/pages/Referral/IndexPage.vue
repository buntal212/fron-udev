<template>
  <q-page class="q-pa-md q-pa-lg-md"
    ><div class="content-wrap"
      ><AppBreadcrumb title="Referral" />
      <div class="row items-center justify-between q-mt-md q-mb-md"
        ><div
          ><p class="eyebrow">PROGRAM KEMITRAAN</p><h1>Kode Referral</h1
          ><p class="page-description"
            >Harga dan diskon pelanggan dikunci saat kode pertama kali
            dipakai.</p
          ></div
        ><q-btn
          color="warning"
          text-color="dark"
          icon="add"
          label="Buat kode referral"
          no-caps
          @click="store.openCreate"
      /></div>
      <FilterPanel class="q-mb-md"
        ><div class="col-12 col-md-5"
          ><q-input
            v-model="store.search"
            outlined
            dense
            clearable
            debounce="250"
            label="Cari kode referral"
            bg-color="white"
            ><template #prepend
              ><q-icon name="search" /></template></q-input></div
        ><div class="col-12 col-md-3"
          ><q-select
            v-model="store.type"
            outlined
            dense
            clearable
            emit-value
            map-options
            label="Jenis"
            :options="typeOptions"
            bg-color="white" /></div
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
        ><template #body-cell-code="props"
          ><q-td :props="props"
            ><div class="row items-center no-wrap q-gutter-xs"
              ><code>{{ props.row.code }}</code
              ><q-btn
                flat
                round
                dense
                size="sm"
                icon="content_copy"
                @click="copy(props.row.code)" /></div></q-td></template
        ><template #body-cell-price="props"
          ><q-td :props="props"
            >{{ money(props.row.customer_price)
            }}<div class="caption"
              >Diskon {{ money(props.row.discount_amount) }}</div
            ></q-td
          ></template
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
              :icon="props.row.is_active ? 'block' : 'check_circle'"
              :color="props.row.is_active ? 'negative' : 'positive'"
              @click="confirmStatus(props.row)" /></q-td></template
      ></q-table>
      <q-dialog v-model="store.formOpen"
        ><q-card class="dialog"
          ><q-form @submit.prevent="store.save"
            ><q-card-section
              ><p class="eyebrow">REFERRAL BARU</p
              ><h2>Buat kode referral</h2></q-card-section
            ><q-card-section class="row q-col-gutter-sm"
              ><div class="col-12"
                ><q-select
                  v-model="store.form.partner_id"
                  outlined
                  dense
                  emit-value
                  map-options
                  option-label="name"
                  option-value="id"
                  label="Mitra *"
                  :options="store.partners"
                  :error="hasError('partner_id')"
                  :error-message="errorFor('partner_id')" /></div
              ><div class="col-12"
                ><q-banner rounded class="automatic-code-banner"
                  >Kode referral akan dibuat otomatis oleh sistem setelah
                  disimpan.</q-banner
                ></div
              ><div class="col-12"
                ><q-select
                  v-model="store.form.type"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Jenis kode *"
                  :options="typeOptions"
                  :error="hasError('type')"
                  :error-message="errorFor('type')" /></div
              ><div class="col-12"
                ><q-banner rounded class="price-banner"
                  >{{ priceText }} per 30 hari. Harga dasar Rp175.000.</q-banner
                ></div
              ><div class="col-12"
                ><q-toggle
                  v-model="store.form.is_active"
                  color="warning"
                  label="Kode aktif" /></div></q-card-section
            ><q-card-actions align="right"
              ><q-btn flat no-caps label="Batal" v-close-popup /><q-btn
                color="warning"
                text-color="dark"
                no-caps
                type="submit"
                :loading="store.saving"
                label="Buat kode" /></q-card-actions></q-form></q-card
      ></q-dialog>
      <q-dialog v-model="store.createdCodeOpen" persistent
        ><q-card class="created-code-dialog"
          ><q-card-section
            ><p class="eyebrow">KODE BERHASIL DIBUAT</p
            ><h2>Simpan kode referral ini</h2
            ><p class="created-code-note"
              >Bagikan kode ini kepada mitra. Kode juga tersedia pada daftar
              referral.</p
            ></q-card-section
          ><q-card-section class="row items-center no-wrap q-gutter-sm"
            ><code class="created-code">{{ store.createdCode }}</code
            ><q-btn
              color="warning"
              text-color="dark"
              no-caps
              icon="content_copy"
              label="Salin kode"
              @click="copy(store.createdCode)" /></q-card-section
          ><q-card-actions align="right"
            ><q-btn
              flat
              no-caps
              label="Selesai"
              @click="store.createdCodeOpen = false" /></q-card-actions></q-card
      ></q-dialog>
      <q-dialog v-model="store.detailOpen"
        ><q-card class="dialog"
          ><q-card-section class="row justify-between"
            ><div
              ><p class="eyebrow">DETAIL REFERRAL</p
              ><h2>{{ store.detail?.code || 'Memuat...' }}</h2></div
            ><q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup /></q-card-section
          ><q-card-section v-if="store.detail"
            ><div class="detail-grid"
              ><span>Mitra</span><strong>{{ store.detail.partner_name }}</strong
              ><span>Jenis</span
              ><strong class="text-capitalize">{{ store.detail.type }}</strong
              ><span>Harga dasar</span
              ><strong>{{ money(store.detail.base_price) }}</strong
              ><span>Diskon</span
              ><strong>{{ money(store.detail.discount_amount) }}</strong
              ><span>Harga pelanggan</span
              ><strong>{{ money(store.detail.customer_price) }}</strong
              ><span>Penggunaan</span
              ><strong>{{ store.detail.usages_count || 0 }}</strong></div
            ><q-separator class="q-my-md" /><div
              class="text-weight-bold q-mb-sm"
              >Riwayat penggunaan</div
            ><q-list bordered separator
              ><q-item v-for="usage in store.usages" :key="usage.id"
                ><q-item-section
                  ><q-item-label
                    >{{ usage.customer_name || 'Pelanggan' }} ·
                    {{ usage.application_name || 'Aplikasi' }}</q-item-label
                  ><q-item-label caption
                    >{{ money(usage.customer_price) }} dikunci
                    {{ date(usage.locked_at) }}</q-item-label
                  ></q-item-section
                ></q-item
              ><q-item v-if="!store.usages.length"
                ><q-item-section
                  >Belum ada pelanggan yang memakai kode ini.</q-item-section
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
import { computed, onMounted, reactive, watch } from 'vue'
import { Notify } from 'quasar'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useReferralStore } from '@/stores/referral'
const store = useReferralStore()
const typeOptions = [
  { label: 'Umum — diskon Rp50.000', value: 'umum' },
  { label: 'Khusus — diskon Rp75.000', value: 'khusus' }
]
const statusOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak aktif', value: false }
]
const columns = [
  { name: 'code', label: 'Kode', field: 'code', align: 'left', sortable: true },
  {
    name: 'partner_name',
    label: 'Mitra',
    field: 'partner_name',
    align: 'left'
  },
  { name: 'type', label: 'Jenis', field: 'type', align: 'left' },
  {
    name: 'price',
    label: 'Harga pelanggan',
    field: 'customer_price',
    align: 'right'
  },
  {
    name: 'usages_count',
    label: 'Penggunaan',
    field: 'usages_count',
    align: 'center'
  },
  { name: 'status', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'actions', label: '', field: 'id', align: 'right' }
]
const money = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
const date = value =>
  value
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
        new Date(value)
      )
    : '-'
const priceText = computed(() =>
  store.form.type === 'khusus'
    ? 'Diskon Rp75.000, pelanggan membayar Rp100.000'
    : 'Diskon Rp50.000, pelanggan membayar Rp125.000'
)
const request = props =>
  store.fetch({
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending
  })
const confirmation = reactive({
  open: false,
  title: '',
  message: '',
  action: null
})
const confirmStatus = item => {
  confirmation.open = true
  confirmation.title = item.is_active ? 'Nonaktifkan kode?' : 'Aktifkan kode?'
  confirmation.message = item.is_active
    ? 'Pelanggan baru tidak dapat memakai kode ini. Diskon pelanggan lama tetap berlaku.'
    : 'Kode dapat kembali digunakan pelanggan baru.'
  confirmation.action = () => store.setStatus(item, !item.is_active)
}
const applyConfirmation = () => {
  confirmation.open = false
  confirmation.action?.()
}
const copy = async code => {
  await navigator.clipboard?.writeText(code)
  Notify.create({ type: 'positive', message: 'Kode referral disalin.' })
}
const hasError = field => Boolean(store.formErrors[field]?.length)
const errorFor = field => store.formErrors[field]?.[0] || ''
onMounted(async () => {
  await Promise.all([store.fetch(), store.fetchPartners()])
})
watch([() => store.search, () => store.status, () => store.type], () =>
  store.fetch({ page: 1 })
)
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
.page-description,
.caption {
  margin: 5px 0 0;
  color: #716a5d;
}
.caption {
  font-size: 0.73rem;
}
.dialog {
  width: min(700px, 96vw);
  border-radius: 14px;
}
.price-banner {
  background: #fff6dc;
  border: 1px solid #e5bd62;
  color: #604b20;
}
.automatic-code-banner {
  background: #fff6dc;
  border: 1px solid #e5bd62;
  color: #604b20;
}
.created-code-dialog {
  width: min(520px, 96vw);
  border-radius: 14px;
}
.created-code-note {
  margin: 6px 0 0;
  color: #716a5d;
}
.created-code {
  flex: 1;
  border: 1px solid #e5bd62;
  border-radius: 8px;
  padding: 10px;
  background: #fff6dc;
  font-size: 1.05rem;
}
.detail-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 9px;
}
.detail-grid span {
  color: #716a5d;
}
code {
  color: #694a0c;
  font-weight: 800;
}
</style>
