<template>
  <div class="q-gutter-y-lg">
    <!-- Header Section -->
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Pengaturan Environment DANA Gateway
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Kelola mode operasional aktif (Sandbox &amp; Production), evaluasi
          kesiapan production, merchant utama, dan mapping aplikasi.
        </p>
      </div>

      <div class="col-12 col-md-auto row items-center q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh Status"
          no-caps
          :loading="store.environmentLoading"
          @click="refreshAll"
        />
        <q-btn
          v-if="!store.isProductionActive"
          color="negative"
          icon="lock_open"
          label="Aktivasi Mode Production"
          no-caps
          :disable="!store.isProductionReady"
          @click="store.openActivateDialog"
        >
          <q-tooltip v-if="!store.isProductionReady">
            Semua syarat kesiapan (merchant, kredensial, mapping aplikasi) harus
            terpenuhi terlebih dahulu.
          </q-tooltip>
        </q-btn>
        <q-btn
          v-else
          color="warning"
          text-color="dark"
          icon="history"
          label="Kembalikan ke Sandbox"
          no-caps
          @click="store.openSwitchSandboxDialog"
        />
      </div>
    </div>

    <!-- Active Environment Status Banner -->
    <q-card
      flat
      bordered
      :class="[
        'active-env-card',
        store.isProductionActive
          ? 'border-negative bg-red-1'
          : 'border-amber bg-amber-1'
      ]"
    >
      <q-card-section>
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-md row items-center q-gutter-md">
            <q-avatar
              :color="store.isProductionActive ? 'negative' : 'warning'"
              :text-color="store.isProductionActive ? 'white' : 'dark'"
              :icon="store.isProductionActive ? 'verified_user' : 'science'"
              size="52px"
            />
            <div>
              <div class="row items-center q-gutter-x-sm">
                <span class="text-caption text-weight-bold text-grey-8">
                  ENVIRONMENT OPERASIONAL AKTIF:
                </span>
                <q-badge
                  :color="store.isProductionActive ? 'negative' : 'amber-9'"
                  :text-color="store.isProductionActive ? 'white' : 'dark'"
                  class="text-weight-bolder text-subtitle2 q-px-sm"
                >
                  {{ (store.activeEnvironment || 'sandbox').toUpperCase() }}
                </q-badge>
              </div>
              <p class="text-body2 text-grey-9 q-mt-xs q-mb-none">
                {{
                  store.isProductionActive
                    ? 'PERHATIAN: Sistem sedang berjalan dalam mode PRODUCTION. Seluruh checkout invoice baru menggunakan API DANA Production dan memproses dana riil.'
                    : 'Sistem berjalan dalam mode SANDBOX. Seluruh checkout invoice baru menggunakan simulator DANA Sandbox dan tidak memproses dana riil.'
                }}
              </p>
            </div>
          </div>

          <div
            v-if="store.environmentSettings"
            class="col-12 col-md-auto text-caption text-grey-8"
          >
            <div v-if="store.isProductionActive">
              <div>
                Diaktifkan Oleh:
                <strong>{{
                  store.environmentSettings.production_activated_by || 'Admin'
                }}</strong>
              </div>
              <div>
                Waktu Aktivasi:
                <strong>{{
                  formatDate(store.environmentSettings.production_activated_at)
                }}</strong>
              </div>
              <div
                v-if="store.environmentSettings.activation_notes"
                class="text-italic q-mt-xs"
              >
                Catatan: "{{ store.environmentSettings.activation_notes }}"
              </div>
            </div>
            <div v-else-if="store.environmentSettings.last_switched_at">
              <div>
                Terakhir Dialihkan Oleh:
                <strong>{{
                  store.environmentSettings.last_switched_by || 'Admin'
                }}</strong>
              </div>
              <div>
                Waktu Pengalihan:
                <strong>{{
                  formatDate(store.environmentSettings.last_switched_at)
                }}</strong>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Primary Merchant Card -->
    <q-card flat bordered class="bg-white">
      <q-card-section>
        <div class="row items-center justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-x-sm q-mb-xs">
              <q-icon name="stars" color="warning" size="22px" />
              <span class="text-subtitle2 text-weight-bold">
                Merchant Utama DANA (Central Bill Recipient)
              </span>
              <q-badge color="primary" class="font-mono text-weight-bold">
                {{ store.primaryMerchantCode }}
              </q-badge>
            </div>
            <p class="text-caption text-grey-7 q-mb-none">
              Merchant ini bertindak sebagai penerima pembayaran langganan resmi
              sistem UDEV. Checkout invoice tagihan aplikasi diarahkan secara
              otomatis ke merchant utama ini.
            </p>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Reasons Not Ready Banner (If Not Ready) -->
    <q-banner
      v-if="!store.isProductionReady && reasonsNotReady.length > 0"
      rounded
      class="bg-amber-1 text-brown-9 border-amber"
    >
      <template #avatar>
        <q-icon name="warning" color="warning" size="28px" />
      </template>
      <div class="text-weight-bold text-subtitle2">
        Persyaratan Aktivasi Production Belum Terpenuhi:
      </div>
      <ul class="q-pl-md q-my-xs text-caption">
        <li v-for="(reason, idx) in reasonsNotReady" :key="idx">
          {{ reason }}
        </li>
      </ul>
      <div class="text-caption text-grey-8">
        Selesaikan konfigurasi di atas sebelum mengaktifkan mode Production.
      </div>
    </q-banner>

    <!-- Production Readiness Checklist -->
    <q-card flat bordered class="readiness-card bg-white">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="fact_check" color="warning" size="24px" />
            <span class="text-subtitle1 text-weight-bold">
              Checklist Evaluasi Kesiapan Production
            </span>
          </div>

          <q-badge
            :color="store.isProductionReady ? 'positive' : 'warning'"
            class="text-weight-bold q-pa-xs"
          >
            {{
              store.isProductionReady
                ? 'SIAP DIAKTIFKAN'
                : 'BELUM MEMENUHI SYARAT'
            }}
          </q-badge>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Item 1: Merchant Production -->
          <div class="col-12 col-md-4">
            <q-card
              flat
              bordered
              :class="[
                'q-pa-md h-full',
                merchantReady ? 'bg-positive-0' : 'bg-grey-1'
              ]"
            >
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-weight-bold text-caption text-grey-8">
                  1. Merchant Utama Production
                </span>
                <q-icon
                  :name="merchantReady ? 'check_circle' : 'cancel'"
                  :color="merchantReady ? 'positive' : 'negative'"
                  size="20px"
                />
              </div>
              <div class="text-caption text-grey-7">
                {{
                  merchantCheck.message ||
                  'Pemeriksaan katalog merchant gateway.'
                }}
              </div>
              <div class="q-mt-sm">
                <q-badge
                  :color="merchantReady ? 'positive' : 'negative'"
                  class="text-caption"
                >
                  {{
                    merchantReady
                      ? 'Terdaftar &amp; Aktif'
                      : 'Belum Terdaftar / Nonaktif'
                  }}
                </q-badge>
              </div>
            </q-card>
          </div>

          <!-- Item 2: Credentials & Base URL -->
          <div class="col-12 col-md-4">
            <q-card
              flat
              bordered
              :class="[
                'q-pa-md h-full',
                credentialsReady ? 'bg-positive-0' : 'bg-grey-1'
              ]"
            >
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-weight-bold text-caption text-grey-8">
                  2. Kredensial &amp; Base URL
                </span>
                <q-icon
                  :name="credentialsReady ? 'check_circle' : 'cancel'"
                  :color="credentialsReady ? 'positive' : 'negative'"
                  size="20px"
                />
              </div>
              <div class="text-caption text-grey-7">
                {{
                  credentialsCheck.message ||
                  'API Key dan Base URL gateway Production.'
                }}
              </div>
              <div class="q-mt-sm">
                <q-badge
                  :color="credentialsReady ? 'positive' : 'negative'"
                  class="text-caption"
                >
                  {{
                    credentialsReady ? 'Lengkap &amp; Siap' : 'Belum Lengkap'
                  }}
                </q-badge>
              </div>
            </q-card>
          </div>

          <!-- Item 3: Application Mapping -->
          <div class="col-12 col-md-4">
            <q-card
              flat
              bordered
              :class="[
                'q-pa-md h-full',
                mappingReady ? 'bg-positive-0' : 'bg-grey-1'
              ]"
            >
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-weight-bold text-caption text-grey-8">
                  3. Mapping Aplikasi Production
                </span>
                <q-icon
                  :name="mappingReady ? 'check_circle' : 'cancel'"
                  :color="mappingReady ? 'positive' : 'negative'"
                  size="20px"
                />
              </div>
              <div class="text-caption text-grey-7">
                {{
                  mappingCheck.message ||
                  'Pemetaan aplikasi ke gateway DANA Production.'
                }}
              </div>
              <div class="q-mt-sm row items-center q-gutter-xs">
                <q-badge
                  :color="mappingReady ? 'positive' : 'negative'"
                  class="text-caption"
                >
                  {{
                    mappingReady
                      ? `${mappingCheck.active_count} Mapping Aktif`
                      : 'Belum Ada Mapping'
                  }}
                </q-badge>
              </div>
              <div
                v-if="mappedApps.length > 0"
                class="q-mt-xs row items-center q-gutter-xs"
              >
                <q-chip
                  v-for="(app, idx) in mappedApps"
                  :key="idx"
                  dense
                  size="sm"
                  color="blue-grey-1"
                  text-color="blue-grey-9"
                >
                  {{ app }}
                </q-chip>
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Confirmation Dialog: Activate Production -->
    <q-dialog v-model="store.activateDialogOpen" persistent>
      <q-card style="min-width: 480px; max-width: 600px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="warning" color="negative" size="28px" />
            <div class="text-h6 text-weight-bold text-negative">
              Konfirmasi Aktivasi DANA Production
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-banner
            rounded
            class="bg-red-1 text-negative border-negative q-mb-md"
          >
            <div class="text-weight-bold text-body2">
              PERINGATAN TRANSAKSI KEUANGAN NYATA:
            </div>
            <div class="text-caption q-mt-xs">
              Mengaktifkan mode Production akan mengarahkan seluruh checkout
              invoice baru ke gateway DANA Production (dana.udumbara.my.id) dan
              memproses transaksi dana riil. Pastikan seluruh kredensial dan
              mapping aplikasi siap.
            </div>
          </q-banner>

          <div class="text-body2 text-grey-9 q-mb-md">
            Untuk mengonfirmasi tindakan ini, ketik kalimat konfirmasi berikut:
            <br />
            <span
              class="text-weight-bolder text-negative font-mono text-subtitle2"
            >
              AKTIFKAN-DANA-PRODUCTION
            </span>
          </div>

          <q-form class="q-gutter-y-md" @submit="store.activateProduction()">
            <q-input
              v-model="store.activationPhrase"
              outlined
              dense
              label="Ketik: AKTIFKAN-DANA-PRODUCTION"
              placeholder="AKTIFKAN-DANA-PRODUCTION"
              :rules="[
                val =>
                  isPhraseValid(val) ||
                  'Kalimat konfirmasi tidak cocok. Ketik tepat: AKTIFKAN-DANA-PRODUCTION'
              ]"
            />

            <q-input
              v-model="store.activationNotes"
              outlined
              dense
              type="textarea"
              rows="2"
              label="Catatan Aktivasi (Opsional)"
              placeholder="Contoh: Migrasi go-live produksi setelah uji Sandbox selesai."
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn
                flat
                label="Batal"
                color="grey-8"
                :disable="store.submittingEnvironment"
                v-close-popup
              />
              <q-btn
                type="submit"
                color="negative"
                label="Aktifkan Mode Production"
                no-caps
                :loading="store.submittingEnvironment"
                :disable="!isPhraseValid(store.activationPhrase)"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog: Switch back to Sandbox -->
    <q-dialog v-model="store.switchSandboxDialogOpen" persistent>
      <q-card style="min-width: 440px; max-width: 550px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="info" color="warning" size="26px" />
            <div class="text-h6 text-weight-bold">
              Kembalikan ke Mode Sandbox
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8">
            Checkout invoice baru akan kembali menggunakan simulator DANA
            Sandbox. Transaksi historis dan pembayaran Production tetap tercatat
            dan aman.
          </p>

          <q-form class="q-gutter-y-md" @submit="store.switchSandbox()">
            <q-input
              v-model="store.switchSandboxNotes"
              outlined
              dense
              type="textarea"
              rows="2"
              label="Catatan Pengalihan (Opsional)"
              placeholder="Contoh: Mengembalikan ke Sandbox untuk keperluan pemeliharaan atau pengujian fitur baru."
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn
                flat
                label="Batal"
                color="grey-8"
                :disable="store.submittingEnvironment"
                v-close-popup
              />
              <q-btn
                type="submit"
                color="warning"
                text-color="dark"
                label="Konfirmasi ke Sandbox"
                no-caps
                :loading="store.submittingEnvironment"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'

const store = useDanaGatewayMerchantStore()

const readiness = computed(
  () => store.productionReadiness || store.environmentSettings?.readiness || {}
)

const merchantCheck = computed(() => readiness.value.checks?.merchant || {})
const credentialsCheck = computed(
  () => readiness.value.checks?.credentials || {}
)
const mappingCheck = computed(() => readiness.value.checks?.mapping || {})

const merchantReady = computed(() =>
  Boolean(merchantCheck.value.configured && merchantCheck.value.active)
)
const credentialsReady = computed(() =>
  Boolean(credentialsCheck.value.configured && credentialsCheck.value.base_url)
)
const mappingReady = computed(() => Boolean(mappingCheck.value.is_mapped))

const mappedApps = computed(() => mappingCheck.value.mapped_applications || [])

const reasonsNotReady = computed(() => readiness.value.reasons_not_ready || [])

const isPhraseValid = phrase => {
  if (!phrase) return false
  const p = phrase.trim().toUpperCase()
  return p === 'AKTIFKAN-DANA-PRODUCTION' || p === 'AKTIFKAN PRODUCTION'
}

const formatDate = dateStr => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return dateStr
  }
}

const refreshAll = async () => {
  await Promise.all([store.fetchEnvironment(), store.fetchMerchants()])
}

onMounted(() => {
  if (!store.environmentSettings) {
    store.fetchEnvironment()
  }
})
</script>

<style scoped>
.active-env-card {
  border-width: 1px;
}
.border-negative {
  border: 1px solid #e8b4ad !important;
}
.border-amber {
  border: 1px solid #ffd54f !important;
}
.h-full {
  height: 100%;
}
.bg-positive-0 {
  background: #f1f8f3;
}
</style>
