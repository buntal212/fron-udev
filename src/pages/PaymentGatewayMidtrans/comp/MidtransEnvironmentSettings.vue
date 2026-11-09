<template>
  <div class="q-gutter-y-lg">
    <!-- Header Section -->
    <div class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <h2 class="text-subtitle1 text-weight-bold text-dark q-my-none">
          Pengaturan Environment Midtrans Gateway
        </h2>
        <p class="text-caption text-grey-7 q-my-none">
          Kelola mode operasional aktif (Sandbox &amp; Production), evaluasi
          kesiapan production, kredensial terpisah, dan mapping aplikasi.
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
          :disable="!readinessSummary.is_ready"
          @click="openActivateDialog"
        >
          <q-tooltip v-if="!readinessSummary.is_ready">
            Semua syarat kesiapan (kredensial, uji koneksi, mapping aplikasi)
            harus terpenuhi terlebih dahulu.
          </q-tooltip>
        </q-btn>
        <q-btn
          v-else
          color="warning"
          text-color="dark"
          icon="history"
          label="Kembalikan ke Sandbox"
          no-caps
          @click="openSwitchSandboxDialog"
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
                    ? 'PERHATIAN: Sistem sedang berjalan dalam mode PRODUCTION. Seluruh checkout invoice baru menggunakan API Midtrans Production dan memproses dana riil.'
                    : 'Sistem berjalan dalam mode SANDBOX. Seluruh checkout invoice baru menggunakan simulator Midtrans dan tidak memproses dana riil.'
                }}
              </p>
            </div>
          </div>

          <div
            v-if="store.environmentSettings?.production_settings"
            class="col-12 col-md-auto text-caption text-grey-8"
          >
            <div>
              Diaktifkan Oleh:
              <strong>{{
                store.environmentSettings.production_settings
                  .activated_by_name || 'Admin'
              }}</strong>
            </div>
            <div>
              Waktu Aktivasi:
              <strong>{{
                formatDate(
                  store.environmentSettings.production_settings.activated_at
                )
              }}</strong>
            </div>
            <div
              v-if="store.environmentSettings.production_settings.notes"
              class="text-italic q-mt-xs"
            >
              Catatan: "{{
                store.environmentSettings.production_settings.notes
              }}"
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Production Readiness Checklist -->
    <q-card flat bordered class="readiness-card">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="fact_check" color="warning" size="24px" />
            <span class="text-subtitle1 text-weight-bold">
              Checklist Evaluasi Kesiapan Production
            </span>
          </div>

          <q-badge
            :color="readinessSummary.is_ready ? 'positive' : 'warning'"
            class="text-weight-bold q-pa-xs"
          >
            {{
              readinessSummary.is_ready
                ? 'SIAP DIAKTIFKAN'
                : 'BELUM MEMENUHI SYARAT'
            }}
          </q-badge>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Item 1: Server Key & Client Key Configured -->
          <div class="col-12 col-md-4">
            <q-card
              flat
              bordered
              class="q-pa-sm checklist-item"
              :class="{ 'item-pass': readinessSummary.credentials_pass }"
            >
              <div class="row items-center q-gutter-x-sm">
                <q-icon
                  :name="
                    readinessSummary.credentials_pass
                      ? 'check_circle'
                      : 'cancel'
                  "
                  :color="
                    readinessSummary.credentials_pass ? 'positive' : 'negative'
                  "
                  size="22px"
                />
                <div class="text-weight-bold text-caption"
                  >1. Kredensial Production</div
                >
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{
                  readinessSummary.credentials_pass
                    ? 'Server Key & Client Key tersimpan dan terdekripsi AES-256.'
                    : 'Kredensial Production belum disimpan atau Server Key kosong.'
                }}
              </div>
            </q-card>
          </div>

          <!-- Item 2: Connection Test Passed -->
          <div class="col-12 col-md-4">
            <q-card
              flat
              bordered
              class="q-pa-sm checklist-item"
              :class="{ 'item-pass': readinessSummary.connection_pass }"
            >
              <div class="row items-center q-gutter-x-sm">
                <q-icon
                  :name="
                    readinessSummary.connection_pass ? 'check_circle' : 'cancel'
                  "
                  :color="
                    readinessSummary.connection_pass ? 'positive' : 'negative'
                  "
                  size="22px"
                />
                <div class="text-weight-bold text-caption"
                  >2. Uji Koneksi API Production</div
                >
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{
                  readinessSummary.connection_pass
                    ? 'Probe ke Core API Production sukses merespons valid.'
                    : 'Uji koneksi ke Production API belum dilakukan atau gagal.'
                }}
              </div>
            </q-card>
          </div>

          <!-- Item 3: Application Mapping Active -->
          <div class="col-12 col-md-4">
            <q-card
              flat
              bordered
              class="q-pa-sm checklist-item"
              :class="{ 'item-pass': readinessSummary.mapping_pass }"
            >
              <div class="row items-center q-gutter-x-sm">
                <q-icon
                  :name="
                    readinessSummary.mapping_pass ? 'check_circle' : 'cancel'
                  "
                  :color="
                    readinessSummary.mapping_pass ? 'positive' : 'negative'
                  "
                  size="22px"
                />
                <div class="text-weight-bold text-caption"
                  >3. Mapping Aplikasi Production</div
                >
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{
                  readinessSummary.mapping_pass
                    ? `${readinessSummary.mapping_count} aplikasi aktif terhubung ke Midtrans Production.`
                    : 'Belum ada aplikasi yang dimapping ke Midtrans Production.'
                }}
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Merchant Environment Configuration & Testing -->
    <q-card flat bordered class="config-section-card">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-subtitle1 text-weight-bold">
              Konfigurasi Kredensial &amp; Uji Koneksi Terpisah
            </div>
            <p class="text-caption text-grey-7 q-my-none">
              Pilih environment untuk mengatur Server Key, Client Key, dan
              menjalankan uji koneksi tanpa memengaruhi environment lainnya.
            </p>
          </div>

          <!-- Environment Tab Switcher -->
          <q-btn-toggle
            v-model="activeConfigEnv"
            no-caps
            rounded
            unelevated
            toggle-color="warning"
            toggle-text-color="dark"
            text-color="grey-8"
            :options="[
              { label: 'Sandbox Environment', value: 'sandbox' },
              { label: 'Production Environment', value: 'production' }
            ]"
            @update:model-value="onConfigEnvChange"
          />
        </div>

        <q-separator class="q-mb-md" />

        <div class="row q-col-gutter-lg">
          <!-- Left: Credentials Form -->
          <div class="col-12 col-lg-7">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle2 text-weight-bold">
                  Kredensial {{ activeConfigEnv.toUpperCase() }} ({{
                    store.selectedMerchant
                  }})
                </div>
                <q-badge
                  :color="store.config?.has_server_key ? 'positive' : 'warning'"
                  class="text-weight-bold q-pa-xs"
                >
                  {{
                    store.config?.has_server_key
                      ? 'Server Key Terenkripsi AES-256'
                      : 'Belum Dikonfigurasi'
                  }}
                </q-badge>
              </div>

              <q-form class="q-gutter-y-md" @submit="onSaveCredential">
                <!-- Merchant Code -->
                <div>
                  <label
                    class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
                  >
                    Kode Merchant UDEV
                  </label>
                  <q-input
                    :model-value="store.selectedMerchant"
                    outlined
                    dense
                    disable
                    bg-color="white"
                  />
                </div>

                <!-- Midtrans Merchant ID -->
                <div>
                  <label
                    class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
                  >
                    Midtrans Merchant ID
                  </label>
                  <q-input
                    v-model="store.configForm.midtrans_merchant_id"
                    outlined
                    dense
                    bg-color="white"
                    placeholder="Contoh: G123456789"
                    :error="
                      Boolean(store.configFormErrors.midtrans_merchant_id)
                    "
                    :error-message="
                      store.configFormErrors.midtrans_merchant_id?.[0]
                    "
                  />
                </div>

                <!-- Client Key -->
                <div>
                  <label
                    class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
                  >
                    Client Key ({{ activeConfigEnv.toUpperCase() }})
                  </label>
                  <q-input
                    v-model="store.configForm.client_key"
                    outlined
                    dense
                    bg-color="white"
                    placeholder="Contoh: SB-Mid-client-..."
                    :error="Boolean(store.configFormErrors.client_key)"
                    :error-message="store.configFormErrors.client_key?.[0]"
                  />
                </div>

                <!-- Server Key (Encrypted Secret) -->
                <div>
                  <label
                    class="text-caption text-weight-bold text-grey-8 q-mb-xs block"
                  >
                    Server Key ({{ activeConfigEnv.toUpperCase() }})
                    <span class="text-negative">*</span>
                  </label>
                  <q-input
                    v-model="store.configForm.server_key"
                    :type="showServerKey ? 'text' : 'password'"
                    outlined
                    dense
                    bg-color="white"
                    :placeholder="
                      store.config?.has_server_key
                        ? 'Ketik nilai baru untuk memperbarui (tersimpan aman)'
                        : 'Contoh: Mid-server-...'
                    "
                    :error="Boolean(store.configFormErrors.server_key)"
                    :error-message="store.configFormErrors.server_key?.[0]"
                  >
                    <template #append>
                      <q-icon
                        :name="showServerKey ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="showServerKey = !showServerKey"
                      />
                    </template>
                  </q-input>
                </div>

                <!-- Active Status Toggle -->
                <div
                  class="row items-center justify-between q-pa-sm rounded-borders bg-white border-grey"
                >
                  <div>
                    <div class="text-caption text-weight-bold"
                      >Status Kredensial Aktif</div
                    >
                    <div class="text-caption text-grey-6">
                      Izinkan backend menggunakan kredensial ini untuk
                      environment {{ activeConfigEnv }}
                    </div>
                  </div>
                  <q-toggle
                    v-model="store.configForm.is_active"
                    color="warning"
                  />
                </div>

                <!-- Action Buttons -->
                <div class="row justify-between items-center q-pt-sm">
                  <q-btn
                    v-if="store.config?.has_server_key"
                    flat
                    color="negative"
                    icon="delete"
                    label="Hapus Kredensial"
                    no-caps
                    :loading="store.configDeleting"
                    @click="onDeleteCredential"
                  />
                  <div v-else></div>

                  <q-btn
                    type="submit"
                    color="warning"
                    text-color="dark"
                    icon="save"
                    :label="`Simpan Kredensial ${activeConfigEnv.toUpperCase()}`"
                    no-caps
                    :loading="store.configSaving"
                  />
                </div>
              </q-form>
            </q-card>
          </div>

          <!-- Right: Connection Tester & Summary -->
          <div class="col-12 col-lg-5">
            <!-- Connection Tester Card -->
            <q-card flat bordered class="q-pa-md bg-white q-mb-md">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-weight-bold">
                  Uji Koneksi {{ activeConfigEnv.toUpperCase() }}
                </div>
                <q-btn
                  outline
                  color="positive"
                  icon="sync_alt"
                  :label="`Uji Koneksi ${activeConfigEnv.toUpperCase()}`"
                  no-caps
                  :loading="store.testingEnvironmentConnection"
                  :disable="!store.config?.has_server_key"
                  @click="runConnectionTest"
                >
                  <q-tooltip v-if="!store.config?.has_server_key">
                    Simpan Server Key terlebih dahulu untuk menjalankan uji
                    koneksi.
                  </q-tooltip>
                </q-btn>
              </div>

              <p class="text-caption text-grey-7">
                Uji koneksi menjalankan probe read-only ke Core API Midtrans
                (GET status). Ini memverifikasi Server Key tanpa membuat
                transaksi finansial.
              </p>

              <!-- Connection Test Result -->
              <div v-if="store.environmentConnectionResult" class="q-mt-sm">
                <q-banner
                  rounded
                  dense
                  :class="
                    store.environmentConnectionResult.is_connected
                      ? 'bg-positive-1 text-positive border-positive'
                      : 'bg-red-1 text-negative border-negative'
                  "
                  class="q-pa-sm"
                >
                  <div class="row items-center q-gutter-x-xs">
                    <q-icon
                      :name="
                        store.environmentConnectionResult.is_connected
                          ? 'check_circle'
                          : 'error'
                      "
                      size="18px"
                    />
                    <strong class="text-caption">
                      {{
                        store.environmentConnectionResult.is_connected
                          ? 'Koneksi Berhasil'
                          : 'Koneksi Gagal'
                      }}
                    </strong>
                  </div>
                  <div class="text-caption q-mt-xs">
                    {{ store.environmentConnectionResult.message }}
                  </div>
                  <div
                    v-if="store.environmentConnectionResult.latency_ms"
                    class="text-caption text-grey-7 q-mt-xs"
                  >
                    Latency:
                    {{ store.environmentConnectionResult.latency_ms }} ms |
                    Status Code:
                    {{ store.environmentConnectionResult.http_status }}
                  </div>
                </q-banner>
              </div>
            </q-card>

            <!-- App Mapping Summary for Selected Environment -->
            <q-card flat bordered class="q-pa-md bg-white">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-weight-bold">
                  Mapping Aplikasi ({{ activeConfigEnv.toUpperCase() }})
                </div>
                <q-btn
                  flat
                  dense
                  color="warning"
                  icon="add"
                  label="Tambah Mapping"
                  no-caps
                  @click="store.openCreateMappingDialog(activeConfigEnv)"
                />
              </div>

              <div
                v-if="envMappings.length === 0"
                class="text-caption text-grey-6 q-py-sm"
              >
                Belum ada aplikasi yang dimapping ke Midtrans
                {{ activeConfigEnv }}.
              </div>

              <q-list v-else separator dense class="rounded-borders">
                <q-item
                  v-for="map in envMappings"
                  :key="map.id"
                  class="q-px-none"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-caption">
                      {{
                        map.application?.name ||
                        'Aplikasi #' + map.application_id
                      }}
                    </q-item-label>
                    <q-item-label caption class="font-mono">
                      Merchant: {{ map.gateway_merchant_code }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge
                      :color="map.is_active ? 'positive' : 'grey-6'"
                      class="text-weight-bold"
                    >
                      {{ map.is_active ? 'Aktif' : 'Nonaktif' }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Confirmation Dialog: Activate Production -->
    <q-dialog v-model="activateDialogOpen" persistent>
      <q-card style="min-width: 480px; max-width: 600px">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="warning" color="negative" size="28px" />
            <div class="text-h6 text-weight-bold text-negative">
              Konfirmasi Aktivasi Midtrans Production
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
              invoice baru ke Midtrans Production API. Pastikan kredensial
              Production telah terverifikasi dan merchant UDEV siap menerima
              dana riil.
            </div>
          </q-banner>

          <div class="text-body2 text-grey-9 q-mb-md">
            Untuk mengonfirmasi tindakan ini, ketik kalimat konfirmasi berikut:
            <br />
            <span
              class="text-weight-bolder text-negative font-mono text-subtitle2"
            >
              AKTIFKAN PRODUCTION
            </span>
          </div>

          <q-form class="q-gutter-y-md" @submit="confirmActivateProduction">
            <q-input
              v-model="confirmationPhrase"
              outlined
              dense
              label="Ketik: AKTIFKAN PRODUCTION"
              placeholder="AKTIFKAN PRODUCTION"
              :rules="[
                val =>
                  val === 'AKTIFKAN PRODUCTION' ||
                  'Kalimat konfirmasi tidak cocok.'
              ]"
            />

            <q-input
              v-model="activationNotes"
              outlined
              dense
              type="textarea"
              rows="2"
              label="Catatan Aktivasi (Opsional)"
              placeholder="Contoh: Migrasi go-live produksi setelah uji Sandbox selesai."
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Batal" color="grey-8" v-close-popup />
              <q-btn
                type="submit"
                color="negative"
                label="Aktifkan Mode Production"
                no-caps
                :loading="store.activatingProduction"
                :disable="confirmationPhrase !== 'AKTIFKAN PRODUCTION'"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog: Switch back to Sandbox -->
    <q-dialog v-model="switchSandboxDialogOpen" persistent>
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
            Checkout invoice baru akan kembali menggunakan simulator Midtrans
            Sandbox. Transaksi historis dan settlement Production tetap tercatat
            dan aman.
          </p>

          <q-form class="q-gutter-y-md" @submit="confirmSwitchSandbox">
            <q-input
              v-model="switchNotes"
              outlined
              dense
              type="textarea"
              rows="2"
              label="Catatan Pengalihan (Opsional)"
              placeholder="Contoh: Mengembalikan ke Sandbox untuk keperluan maintenance atau pengujian modul."
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Batal" color="grey-8" v-close-popup />
              <q-btn
                type="submit"
                color="warning"
                text-color="dark"
                label="Konfirmasi ke Sandbox"
                no-caps
                :loading="store.switchingSandbox"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePaymentGatewayMidtransStore } from '@/stores/paymentgatewaymidtrans'

const store = usePaymentGatewayMidtransStore()

const activeConfigEnv = ref(store.selectedConfigEnvironment || 'sandbox')
const showServerKey = ref(false)

const activateDialogOpen = ref(false)
const confirmationPhrase = ref('')
const activationNotes = ref('')

const switchSandboxDialogOpen = ref(false)
const switchNotes = ref('')

const readinessSummary = computed(() => {
  const r =
    store.productionReadiness || store.environmentSettings?.readiness || {}
  const creds = r.checks?.credentials || {}
  const conn = r.checks?.connection || {}
  const mapping = r.checks?.application_mapping || {}

  return {
    is_ready: Boolean(r.is_ready_for_production),
    credentials_pass: Boolean(creds.has_keys && creds.decryptable),
    connection_pass: Boolean(conn.passed),
    mapping_pass: Boolean(mapping.active_mappings_count > 0),
    mapping_count: mapping.active_mappings_count || 0
  }
})

const envMappings = computed(() => {
  if (!store.mappings) return []
  return store.mappings.filter(m => m.environment === activeConfigEnv.value)
})

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

const onConfigEnvChange = async env => {
  activeConfigEnv.value = env
  await store.setConfigEnvironment(env)
}

const refreshAll = async () => {
  await Promise.all([
    store.fetchEnvironmentSettings(),
    store.fetchConfiguration(store.selectedMerchant, activeConfigEnv.value),
    store.fetchMappings()
  ])
}

const onSaveCredential = async () => {
  await store.saveConfiguration(activeConfigEnv.value)
}

const onDeleteCredential = async () => {
  await store.deleteConfiguration(activeConfigEnv.value)
}

const runConnectionTest = async () => {
  await store.testEnvironmentConnection(
    store.selectedMerchant,
    activeConfigEnv.value
  )
}

const openActivateDialog = () => {
  confirmationPhrase.value = ''
  activationNotes.value = ''
  activateDialogOpen.value = true
}

const confirmActivateProduction = async () => {
  const success = await store.activateProduction(
    confirmationPhrase.value,
    activationNotes.value
  )
  if (success) {
    activateDialogOpen.value = false
    confirmationPhrase.value = ''
    activationNotes.value = ''
  }
}

const openSwitchSandboxDialog = () => {
  switchNotes.value = ''
  switchSandboxDialogOpen.value = true
}

const confirmSwitchSandbox = async () => {
  const success = await store.switchSandbox(switchNotes.value)
  if (success) {
    switchSandboxDialogOpen.value = false
    switchNotes.value = ''
  }
}

onMounted(async () => {
  await store.fetchEnvironmentSettings()
  await store.fetchConfiguration(store.selectedMerchant, activeConfigEnv.value)
  await store.fetchMappings()
})
</script>

<style scoped>
.active-env-card {
  border-radius: 12px;
}
.border-amber {
  border: 1px solid #d6ad4d;
}
.border-negative {
  border: 1px solid #c10015;
}
.border-positive {
  border: 1px solid #21ba45;
}
.bg-positive-1 {
  background: #f0fdf4;
}
.border-grey {
  border: 1px solid #e0e0e0;
}
.readiness-card,
.config-section-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.checklist-item {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  min-height: 80px;
}
.item-pass {
  background: #f0fdf4;
  border-color: #86efac;
}
.font-mono {
  font-family: monospace;
}
</style>
