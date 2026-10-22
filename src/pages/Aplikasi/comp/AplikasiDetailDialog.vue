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
              <p class="eyebrow">SERVER-TO-SERVER</p>
              <h3>Token integrasi pelanggan</h3>
            </div>
            <q-badge color="dark" text-color="warning" label="HTTPS + scope" />
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
                label="Scope"
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
</template>

<script setup>
import { computed } from 'vue'
import { Notify } from 'quasar'
import { useAplikasiStore } from '@/stores/aplikasi'

const store = useAplikasiStore()
const application = computed(() => store.selectedApplication)
const scopeOptions = [
  { label: 'Baca pelanggan', value: 'customers:read' },
  { label: 'Tulis pelanggan', value: 'customers:write' }
]
const requiredTokenName = value => !!value || 'Nama token wajib diisi.'
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
</style>
