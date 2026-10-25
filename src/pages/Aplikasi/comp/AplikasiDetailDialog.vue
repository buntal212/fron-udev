<template>
  <q-dialog v-model="store.detailDialogOpen">
    <q-card class="detail-dialog">
      <q-card-section class="row items-start justify-between">
        <div
          ><p class="eyebrow">MASTER APLIKASI</p
          ><h2>{{ application?.name || 'Memuat...' }}</h2
          ><p>{{ application?.code }}</p></div
        >
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="store.detailDialogOpen = false"
        />
      </q-card-section>
      <q-separator />
      <q-card-section v-if="store.detailLoading"
        ><q-spinner color="warning" size="28px"
      /></q-card-section>
      <q-list v-else-if="application" separator>
        <q-item v-for="item in details" :key="item.label"
          ><q-item-section
            ><q-item-label caption>{{ item.label }}</q-item-label
            ><q-item-label>{{
              item.value || '-'
            }}</q-item-label></q-item-section
          ></q-item
        >
      </q-list>
      <template v-if="application && !store.detailLoading">
        <q-separator />
        <q-card-section>
          <div class="section-heading">
            <div>
              <p class="eyebrow">KONFIGURASI DEFAULT</p>
              <h3>Global API Token</h3>
            </div>
            <q-badge color="dark" text-color="warning" label="Bearer token" />
          </div>
          <q-banner rounded class="token-banner q-mb-md">
            Satu token utama per aplikasi untuk integrasi server-to-server.
            Rotasi mempertahankan token lama selama 15 menit.
          </q-banner>
          <div class="row items-center justify-between q-gutter-sm">
            <div v-if="store.globalIntegrationToken">
              <div class="text-weight-bold">
                {{ store.globalIntegrationToken.token_prefix }}••••
              </div>
              <div class="text-caption text-grey-7">
                {{ tokenStatus(store.globalIntegrationToken) }} · terakhir
                dipakai
                {{ formatDateTime(store.globalIntegrationToken.last_used_at) }}
              </div>
            </div>
            <div v-else class="text-grey-7">Belum ada Global API Token.</div>
            <div class="row q-gutter-sm">
              <q-btn
                v-if="!store.globalIntegrationToken"
                color="warning"
                text-color="dark"
                no-caps
                label="Generate"
                :loading="store.tokenSaving"
                @click="confirmGlobalAction('generate')"
              />
              <q-btn
                v-else
                outline
                color="brown-8"
                no-caps
                label="Rotasi"
                :loading="store.tokenSaving"
                @click="confirmGlobalAction('rotate')"
              />
              <q-btn
                v-if="store.globalIntegrationToken"
                flat
                color="negative"
                no-caps
                label="Cabut"
                :loading="store.tokenSaving"
                @click="confirmGlobalAction('revoke')"
              />
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="section-heading">
            <div>
              <p class="eyebrow">SERVER-TO-SERVER</p>
              <h3>Token integrasi aplikasi</h3>
            </div>
            <q-badge
              color="dark"
              text-color="warning"
              label="HTTPS + token aplikasi"
            />
          </div>
          <q-banner
            v-if="store.newTokenPlaintext"
            class="token-banner q-mb-md"
            rounded
          >
            <div class="text-weight-bold">Token baru tampil sekali</div>
            <div class="token-value">{{ store.newTokenPlaintext }}</div>
            <template #action>
              <q-btn flat dense no-caps label="Salin" @click="copyToken" />
              <q-btn
                flat
                dense
                no-caps
                label="Sembunyikan"
                @click="store.clearNewToken"
              />
            </template>
          </q-banner>
          <q-form
            class="row q-col-gutter-sm items-end"
            @submit.prevent="store.createIntegrationToken"
          >
            <div class="col-12 col-md-4">
              <q-input
                v-model="store.tokenForm.name"
                outlined
                dense
                label="Nama token"
                :rules="[requiredTokenName]"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="store.tokenForm.scopes"
                outlined
                dense
                multiple
                use-chips
                emit-value
                map-options
                label="Metadata scope (opsional)"
                :options="scopeOptions"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="store.tokenForm.expires_at"
                outlined
                dense
                type="date"
                label="Berlaku sampai (opsional)"
              />
            </div>
            <div class="col-12 col-md-1">
              <q-btn
                color="warning"
                text-color="dark"
                no-caps
                type="submit"
                icon="add"
                :loading="store.tokenSaving"
                aria-label="Buat token"
              />
            </div>
          </q-form>
          <q-banner
            v-if="store.integrationError"
            class="bg-red-1 text-negative q-mt-md"
            rounded
          >
            {{ store.integrationError }}
          </q-banner>
          <q-list v-if="store.integrationLoading" class="q-mt-md">
            <q-item
              ><q-item-section><q-skeleton type="text" /></q-item-section
            ></q-item>
          </q-list>
          <q-list v-else separator class="q-mt-md">
            <q-item v-for="token in store.integrationTokens" :key="token.id">
              <q-item-section>
                <q-item-label
                  >{{ token.name }} · {{ token.token_prefix }}••••</q-item-label
                >
                <q-item-label caption>
                  {{ token.scopes?.join(', ') }} · {{ tokenStatus(token) }} ·
                  terakhir dipakai {{ formatDateTime(token.last_used_at) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  v-if="token.status === 'active'"
                  flat
                  dense
                  round
                  icon="block"
                  color="negative"
                  aria-label="Cabut token"
                  :loading="store.tokenSaving"
                  @click="store.revokeIntegrationToken(token)"
                />
              </q-item-section>
            </q-item>
            <q-item v-if="!store.integrationTokens.length"
              ><q-item-section class="text-grey-7"
                >Belum ada token integrasi.</q-item-section
              ></q-item
            >
          </q-list>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="section-heading"
            ><h3>Aktivitas sinkronisasi</h3
            ><q-badge
              color="grey-8"
              :label="`${store.integrationAudits.length} terbaru`"
          /></div>
          <q-list dense separator>
            <q-item v-for="audit in store.integrationAudits" :key="audit.id">
              <q-item-section>
                <q-item-label
                  >{{ audit.operation }} · {{ audit.status }}</q-item-label
                >
                <q-item-label caption
                  >{{ audit.external_customer_id || '—' }} ·
                  {{ formatDateTime(audit.created_at)
                  }}<span v-if="audit.error_code">
                    · {{ audit.error_code }}</span
                  ></q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item v-if="!store.integrationAudits.length"
              ><q-item-section class="text-grey-7"
                >Belum ada aktivitas integrasi.</q-item-section
              ></q-item
            >
          </q-list>
        </q-card-section>
        <q-separator />
        <q-card-section class="test-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">UAT INTERNAL</p>
              <h3>Uji Integrasi Pelanggan</h3>
            </div>
            <q-badge color="dark" text-color="warning" label="Admin internal" />
          </div>
          <q-banner rounded class="test-notice q-mb-md">
            Pengujian ini memakai otorisasi admin UDEV. Hasilnya tidak
            membuktikan autentikasi Bearer token server-to-server Larissama.
          </q-banner>
          <q-form
            class="row q-col-gutter-sm"
            @submit.prevent="store.sendIntegrationTestCustomer"
          >
            <div class="col-12 col-md-4">
              <q-input
                v-model="store.integrationTest.form.external_customer_id"
                outlined
                dense
                label="External customer ID"
                :rules="[requiredTestId]"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="store.integrationTest.form.name"
                outlined
                dense
                label="Nama pelanggan"
                :rules="[requiredTestName]"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="store.integrationTest.form.owner_name"
                outlined
                dense
                label="Nama pemilik"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="store.integrationTest.form.phone"
                outlined
                dense
                label="Nomor telepon (opsional)"
                type="tel"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="store.integrationTest.form.email"
                outlined
                dense
                label="Email (opsional)"
                type="email"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="store.integrationTest.form.status"
                outlined
                dense
                emit-value
                map-options
                label="Status"
                :options="testStatusOptions"
              />
            </div>
            <div class="col-12 row q-gutter-sm">
              <q-btn
                color="warning"
                text-color="dark"
                no-caps
                label="Kirim Pelanggan Uji"
                type="submit"
                :loading="store.integrationTest.saving"
              />
              <q-btn
                outline
                color="brown-8"
                no-caps
                label="Cek Pelanggan"
                type="button"
                :loading="store.integrationTest.loading"
                @click="store.checkIntegrationTestCustomer"
              />
              <q-btn
                outline
                color="brown-8"
                no-caps
                label="Perbarui Pelanggan Uji"
                type="button"
                :loading="store.integrationTest.saving"
                @click="store.updateIntegrationTestCustomer"
              />
              <q-btn
                outline
                color="brown-8"
                no-caps
                label="Uji Duplikasi"
                type="button"
                :loading="store.integrationTest.saving"
                @click="store.duplicateIntegrationTestCustomer"
              />
              <q-btn
                flat
                color="brown-8"
                no-caps
                label="Lihat Riwayat Pengujian"
                type="button"
                :loading="store.integrationTest.auditsLoading"
                @click="store.fetchIntegrationTestAudits"
              />
            </div>
          </q-form>
          <q-banner
            v-if="store.integrationTest.error"
            rounded
            class="bg-red-1 text-negative q-mt-md"
          >
            {{ store.integrationTest.error }}
          </q-banner>
          <q-card
            v-if="store.integrationTest.result"
            flat
            bordered
            class="test-result q-mt-md"
          >
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-weight-bold">Hasil pengujian</div>
                <q-badge
                  :color="
                    store.integrationTest.result.data ? 'positive' : 'negative'
                  "
                  :label="
                    store.integrationTest.result.data ? 'Berhasil' : 'Gagal'
                  "
                />
              </div>
              <div v-if="store.integrationTest.result.data" class="result-grid">
                <span>Customer ID UDEV</span
                ><strong>{{ store.integrationTest.result.data.id }}</strong>
                <span>External ID</span
                ><strong>{{
                  store.integrationTest.result.data.external_customer_id
                }}</strong>
                <span>Nama pelanggan</span
                ><strong>{{ store.integrationTest.result.data.name }}</strong>
                <span>Aplikasi</span><strong>{{ application?.name }}</strong>
                <span>Operasi</span
                ><strong>{{
                  store.integrationTest.result.test?.operation ||
                  'customer.read'
                }}</strong>
                <span>Waktu</span
                ><strong>{{
                  formatDateTime(store.integrationTest.result.data.updated_at)
                }}</strong>
                <span>Request ID</span
                ><strong class="break-value">{{
                  store.integrationTest.result.request_id
                }}</strong>
                <span>Duplikasi</span
                ><strong>{{
                  store.integrationTest.result.duplicate_check
                    ? 'Tidak membuat record kedua'
                    : '—'
                }}</strong>
              </div>
              <q-btn
                v-if="store.integrationTest.result.data"
                flat
                no-caps
                color="brown-8"
                label="Buka di Master Pelanggan"
                class="q-mt-sm"
                @click="openTestCustomer"
              />
            </q-card-section>
          </q-card>
          <q-list
            v-if="store.integrationTest.audits.length"
            dense
            separator
            class="q-mt-md"
          >
            <q-item
              v-for="audit in store.integrationTest.audits"
              :key="audit.id"
            >
              <q-item-section>
                <q-item-label
                  >{{ audit.operation }} - {{ audit.status }}</q-item-label
                >
                <q-item-label caption
                  >{{ formatDateTime(audit.created_at) }} ·
                  {{ audit.external_customer_id || '-'
                  }}<span v-if="audit.error_code">
                    · {{ audit.error_code }}</span
                  ></q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </template>
      <q-card-actions align="right"
        ><q-btn
          flat
          no-caps
          label="Tutup"
          @click="store.detailDialogOpen = false"
      /></q-card-actions>
    </q-card>
  </q-dialog>
  <ConfirmDialog
    v-model="globalConfirmation.open"
    :title="globalConfirmation.title"
    :message="globalConfirmation.message"
    @confirm="applyGlobalAction"
  />
</template>

<script setup>
import { computed, reactive } from 'vue'
import { Notify } from 'quasar'
import { useRouter } from 'vue-router'
import { useAplikasiStore } from '@/stores/aplikasi'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = useAplikasiStore()
const router = useRouter()
const application = computed(() => store.selectedApplication)
const globalConfirmation = reactive({
  open: false,
  action: '',
  title: '',
  message: ''
})
const scopeOptions = [
  { label: 'Baca pelanggan', value: 'customers:read' },
  { label: 'Tulis pelanggan', value: 'customers:write' },
  { label: 'Baca paket langganan', value: 'subscription-plans:read' }
]
const requiredTokenName = value => !!value || 'Nama token wajib diisi.'
const requiredTestId = value =>
  /^UAT-[A-Za-z0-9._:-]+$/.test(value || '') || 'Gunakan ID berawalan UAT-.'
const requiredTestName = value => !!value || 'Nama pelanggan wajib diisi.'
const testStatusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Tidak aktif', value: 'inactive' }
]
const formatDateTime = value =>
  value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : 'belum pernah'
const tokenStatus = token =>
  token.status === 'revoked'
    ? 'dicabut'
    : token.status === 'expired'
      ? 'kedaluwarsa'
      : 'aktif'
const copyToken = async () => {
  if (!store.newTokenPlaintext) return
  await navigator.clipboard?.writeText(store.newTokenPlaintext)
  Notify.create({
    type: 'positive',
    message: 'Token disalin. Simpan di server aplikasi Anda.'
  })
}
const confirmGlobalAction = action => {
  globalConfirmation.open = true
  globalConfirmation.action = action
  globalConfirmation.title =
    action === 'revoke'
      ? 'Cabut Global API Token?'
      : action === 'rotate'
        ? 'Rotasi Global API Token?'
        : 'Generate Global API Token?'
  globalConfirmation.message =
    action === 'revoke'
      ? 'Integrasi aplikasi akan ditolak sampai token baru dibuat.'
      : action === 'rotate'
        ? 'Token lama tetap dapat digunakan selama 15 menit.'
        : 'Token lengkap hanya akan ditampilkan satu kali.'
}
const applyGlobalAction = () => {
  globalConfirmation.open = false
  store.manageGlobalToken(globalConfirmation.action)
}
const openTestCustomer = () => {
  if (!application.value || !store.integrationTest.result?.data) return
  router.push({
    path: '/pelanggan-aplikasi',
    query: {
      application_id: application.value.id,
      search: store.integrationTest.result.data.external_customer_id
    }
  })
  store.detailDialogOpen = false
}
const details = computed(() =>
  application.value
    ? [
        { label: 'URL aplikasi', value: application.value.application_url },
        { label: 'Email kontak', value: application.value.contact_email },
        { label: 'Deskripsi', value: application.value.description },
        {
          label: 'Pelanggan tersinkronisasi',
          value: String(application.value.integration_customers_count ?? 0)
        },
        {
          label: 'Sinkronisasi terakhir',
          value: formatDateTime(application.value.latest_customer_sync_at)
        },
        {
          label: 'Status',
          value: application.value.is_active ? 'Aktif' : 'Tidak aktif'
        },
        {
          label: 'Tanggal terdaftar',
          value: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
            new Date(application.value.created_at)
          )
        }
      ]
    : []
)
</script>

<style scoped>
.detail-dialog {
  width: min(760px, 96vw);
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
p {
  margin: 2px 0 0;
  color: #746b5c;
  font-size: 0.82rem;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
h3 {
  margin: 0;
  color: #20180b;
  font-size: 1rem;
}
.token-banner {
  background: #fff6dc;
  border: 1px solid #e5bd62;
}
.token-value {
  overflow-wrap: anywhere;
  margin-top: 6px;
  font-family: monospace;
  font-size: 0.8rem;
}
.test-panel {
  background: #fffdf8;
}
.test-notice {
  background: #fff6dc;
  border: 1px solid #e5bd62;
  color: #604b20;
}
.test-result {
  border-color: #e0d7c6;
  background: #fff;
}
.result-grid {
  display: grid;
  grid-template-columns: minmax(130px, 0.7fr) minmax(0, 1.3fr);
  gap: 6px 14px;
  font-size: 0.82rem;
}
.result-grid span {
  color: #746b5c;
}
.result-grid strong,
.break-value {
  overflow-wrap: anywhere;
  color: #20180b;
}
@media (max-width: 599px) {
  .result-grid {
    grid-template-columns: 1fr;
    gap: 2px;
  }
  .result-grid strong {
    margin-bottom: 6px;
  }
}
</style>
