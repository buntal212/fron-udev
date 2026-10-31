<template>
  <div class="credential-form-wrap">
    <!-- Header Bagian Konfigurasi & Status -->
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <h2 class="section-title">Konfigurasi Kredensial SNAP Sandbox</h2>
        <p class="section-desc">
          Kredensial disimpan terenkripsi (AES-256-GCM). Private key tidak
          pernah dikirim balik ke antarmuka pengguna atau disimpan dalam plain
          text.
        </p>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn
          v-if="store.config?.is_configured"
          outline
          color="negative"
          icon="delete_outline"
          label="Hapus Konfigurasi"
          no-caps
          class="text-weight-bold"
          :loading="store.deletingConfig"
          @click="store.deleteDialogOpen = true"
        >
          <q-tooltip>
            Hapus kredensial aktif merchant terpilih secara aman dari server
          </q-tooltip>
        </q-btn>

        <q-badge
          :color="store.config?.is_configured ? 'positive' : 'warning'"
          :label="
            store.config?.is_configured
              ? 'Terkonfigurasi'
              : 'Belum Dikonfigurasi'
          "
          class="q-px-sm q-py-xs text-weight-bold"
        />
      </div>
    </div>

    <!-- Banner Notifikasi Pemulihan Jika Belum Dikonfigurasi Namun Backup Tersedia -->
    <q-banner
      v-if="!store.config?.is_configured && store.config?.has_recovery_backup"
      dense
      rounded
      class="bg-blue-1 text-primary q-mb-md border-blue"
    >
      <template #avatar>
        <q-icon name="history" color="primary" />
      </template>
      <div class="text-caption">
        <strong>Cadangan Pemulihan Kunci Tersedia:</strong> Merchant ini belum
        memiliki kredensial aktif, namun memiliki arsip pasangan kunci RSA
        sebelumnya. Anda dapat mengkliknya melalui tombol
        <strong>Pulihkan Kunci Sebelumnya</strong> di bawah.
      </div>
    </q-banner>

    <!-- Info Banner Kredensial Aktif -->
    <q-card
      v-if="store.config?.is_configured"
      flat
      bordered
      class="active-config-card q-mb-lg"
    >
      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Merchant Code</div>
            <div class="text-weight-bold text-dark">{{
              store.config.merchant_code
            }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7"
              >Masked Client ID (X-CLIENT-KEY)</div
            >
            <div class="text-weight-bold text-dark font-mono">{{
              store.config.masked_client_id
            }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Status Private Key</div>
            <div class="text-weight-bold text-positive">
              <q-icon name="lock" class="q-mr-xs" />Terenkripsi (AES-256-GCM)
            </div>
          </div>
          <div v-if="store.config?.public_key_fingerprint" class="col-12">
            <div class="text-caption text-grey-7"
              >Public Key SHA-256 Fingerprint</div
            >
            <div class="text-caption text-grey-8 font-mono">{{
              store.config.public_key_fingerprint
            }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Card Manajemen Kunci RSA 2048-bit -->
    <q-card flat bordered class="rsa-card q-mb-lg q-pa-md">
      <div class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-md-7">
          <div
            class="text-subtitle1 text-weight-bold text-dark row items-center"
          >
            <q-icon name="key" color="warning" class="q-mr-sm" size="22px" />
            Pasangan Kunci RSA 2048-bit (SNAP Asymmetric Signature)
          </div>
          <p class="section-desc q-mt-xs">
            Generate pasangan kunci RSA 2048-bit standar DOKU SNAP B2B secara
            otomatis. Private key langsung dienkripsi AES-256-GCM di server dan
            tidak pernah dikirim ke browser.
          </p>
        </div>

        <div class="col-12 col-md-5 row items-center justify-end q-gutter-sm">
          <q-btn
            v-if="store.config?.has_recovery_backup"
            flat
            color="primary"
            icon="history"
            label="Pulihkan Kunci Sebelumnya"
            no-caps
            class="text-weight-bold"
            :loading="store.recoveringKey"
            @click="recoveryDialogOpen = true"
          >
            <q-tooltip>
              Pulihkan pasangan kunci RSA dari cadangan arsip sebelumnya
            </q-tooltip>
          </q-btn>
          <q-btn
            color="warning"
            text-color="dark"
            icon="vpn_key"
            :label="
              store.config?.has_private_key
                ? 'Rotasi RSA Key Pair'
                : 'Generate RSA Key Pair'
            "
            no-caps
            class="text-weight-bold"
            :loading="store.generatingKey"
            @click="handleGenerateClick"
          >
            <q-tooltip>
              {{
                store.config?.has_private_key
                  ? 'Rotasi pasangan kunci RSA (kunci lama akan diarsipkan ke cadangan)'
                  : 'Buat pasangan kunci RSA 2048-bit baru secara otomatis'
              }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Tampilan Public Key dan Salin -->
      <div v-if="store.config?.public_key" class="q-mt-md">
        <q-separator class="q-mb-md" />
        <div class="row items-center justify-between q-mb-sm">
          <div>
            <div class="text-subtitle2 text-weight-bold text-dark">
              DOKU Public Key (PEM)
            </div>
            <div class="text-caption text-grey-7">
              Daftarkan Public Key ini ke menu Public Key di DOKU Back Office
              Sandbox.
            </div>
          </div>
          <q-btn
            outline
            color="warning"
            text-color="dark"
            icon="content_copy"
            label="Salin Public Key"
            no-caps
            size="sm"
            class="text-weight-bold"
            @click="copyPublicKey"
          />
        </div>

        <div class="public-key-box q-pa-sm q-mb-sm">
          <pre class="q-ma-none text-caption font-mono">{{
            store.config.public_key
          }}</pre>
        </div>

        <div
          v-if="store.config?.public_key_fingerprint"
          class="row items-center text-caption text-grey-8"
        >
          <span class="text-weight-medium q-mr-xs">SHA-256 Fingerprint:</span>
          <span class="font-mono text-grey-9">{{
            store.config.public_key_fingerprint
          }}</span>
        </div>
      </div>
      <div v-else class="q-mt-sm text-caption text-grey-7">
        <q-icon name="info" color="grey-6" class="q-mr-xs" />
        Belum ada pasangan kunci RSA aktif yang di-generate. Klik tombol
        "Generate RSA Key Pair" di atas untuk membuatnya secara otomatis.
      </div>
    </q-card>

    <!-- Form Input / Update Manual Kredensial -->
    <q-card flat bordered class="form-card q-pa-md">
      <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs">
        Konfigurasi Client ID & Private Key Manual
      </div>
      <p class="section-desc q-mb-md">
        Anda juga dapat memasukkan Client ID dan Private Key RSA yang telah ada
        secara manual.
      </p>

      <q-form @submit.prevent="store.saveConfiguration">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="store.form.merchant_code"
              outlined
              dense
              label="Merchant Code *"
              hint="Kode unik merchant (mis. udev-central)"
              :error="!!store.formErrors?.merchant_code"
              :error-message="store.formErrors?.merchant_code?.[0]"
              bg-color="white"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="store.form.merchant_name"
              outlined
              dense
              label="Nama Merchant *"
              hint="Nama instansi atau aplikasi merchant"
              :error="!!store.formErrors?.merchant_name"
              :error-message="store.formErrors?.merchant_name?.[0]"
              bg-color="white"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="store.form.client_id"
              outlined
              dense
              label="Client ID / X-CLIENT-KEY *"
              hint="Client ID DOKU Sandbox (mis. DEV-UDEV-CENTRAL-001)"
              :error="!!store.formErrors?.client_id"
              :error-message="store.formErrors?.client_id?.[0]"
              bg-color="white"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="store.form.private_key"
              outlined
              type="textarea"
              rows="5"
              label="RSA Private Key (PEM format) *"
              hint="Opsional jika menggunakan fitur Generate RSA Key Pair di atas. Masukkan format lengkap (-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----)"
              :error="!!store.formErrors?.private_key"
              :error-message="store.formErrors?.private_key?.[0]"
              bg-color="white"
              class="font-mono text-caption"
            >
              <template #prepend>
                <q-icon name="vpn_key" />
              </template>
            </q-input>
          </div>

          <div class="col-12 row items-center justify-between q-mt-sm">
            <div class="row items-center">
              <q-toggle
                v-model="store.form.is_active"
                color="warning"
                label="Status Aktif"
              />
              <q-badge color="grey-8" class="q-ml-sm" label="Sandbox Only" />
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                flat
                color="grey-8"
                label="Reset Form"
                no-caps
                @click="store.resetForm"
              >
                <q-tooltip>
                  Kosongkan isian form di layar (tidak mengubah data tersimpan
                  di server)
                </q-tooltip>
              </q-btn>
              <q-btn
                color="warning"
                text-color="dark"
                icon="save"
                label="Simpan Kredensial"
                no-caps
                type="submit"
                :loading="store.saving"
              />
            </div>
          </div>
        </div>
      </q-form>
    </q-card>

    <!-- Dialog Konfirmasi Hapus Konfigurasi -->
    <q-dialog v-model="store.deleteDialogOpen" persistent>
      <q-card style="min-width: 380px; max-width: 540px; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="row items-center">
            <q-avatar
              icon="delete_forever"
              color="red-1"
              text-color="negative"
              class="q-mr-sm"
            />
            <span class="text-h6 text-weight-bold text-dark"
              >Konfirmasi Hapus Konfigurasi</span
            >
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8 q-mb-sm">
            Apakah Anda yakin ingin menghapus konfigurasi aktif DOKU Sandbox
            untuk merchant <strong>{{ store.selectedMerchant }}</strong
            >?
          </p>
          <div
            class="text-caption text-grey-9 q-mb-md bg-grey-2 q-pa-sm rounded-borders"
          >
            <div
              >• Kredensial aktif (Client ID dan Private Key) di server akan
              dihapus.</div
            >
            <div>• Cache token SNAP B2B akan dibersihkan seketika.</div>
            <div
              >• Status konfigurasi merchant akan berubah menjadi
              <strong>Belum Dikonfigurasi</strong>.</div
            >
          </div>

          <q-banner dense rounded class="bg-amber-1 text-amber-10 q-mt-sm">
            <template #avatar>
              <q-icon name="security" color="amber-9" />
            </template>
            <div class="text-caption">
              <strong>Data Tetap Aman:</strong> Riwayat Audit Trail, data
              invoice, transaksi billing, konfigurasi DANA, dan cadangan
              pemulihan RSA sebelumnya <strong>tidak akan terhapus</strong>.
            </div>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey-8" v-close-popup no-caps />
          <q-btn
            color="negative"
            label="Ya, Hapus Konfigurasi"
            no-caps
            class="text-weight-bold"
            :loading="store.deletingConfig"
            @click="confirmDeleteConfig"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog Konfirmasi Rotasi Kunci -->
    <q-dialog v-model="store.rotateDialogOpen" persistent>
      <q-card style="min-width: 380px; max-width: 520px; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="row items-center">
            <q-avatar
              icon="warning"
              color="amber-1"
              text-color="warning"
              class="q-mr-sm"
            />
            <span class="text-h6 text-weight-bold text-dark"
              >Konfirmasi Rotasi Kunci RSA</span
            >
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8 q-mb-sm">
            Merchant <strong>{{ store.selectedMerchant }}</strong> telah
            memiliki kunci RSA aktif.
          </p>
          <p class="text-body2 text-grey-8 q-mb-sm">
            Merotasi kunci akan menghasilkan pasangan RSA 2048-bit baru dan
            mengarsipkan kunci lama ke cadangan pemulihan.
          </p>
          <q-banner dense rounded class="bg-amber-1 text-amber-10 q-mt-sm">
            <template #avatar>
              <q-icon name="info" color="amber-9" />
            </template>
            Setelah rotasi, daftarkan Public Key baru ke DOKU Back Office agar
            verifikasi SNAP B2B tidak gagal.
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey-8" v-close-popup no-caps />
          <q-btn
            color="warning"
            text-color="dark"
            label="Ya, Rotasi Kunci"
            no-caps
            class="text-weight-bold"
            :loading="store.generatingKey"
            @click="confirmRotateKey"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog Konfirmasi Pemulihan Kunci -->
    <q-dialog v-model="recoveryDialogOpen" persistent>
      <q-card style="min-width: 380px; max-width: 520px; border-radius: 12px">
        <q-card-section class="row items-center q-pb-none">
          <div class="row items-center">
            <q-avatar
              icon="history"
              color="blue-1"
              text-color="primary"
              class="q-mr-sm"
            />
            <span class="text-h6 text-weight-bold text-dark"
              >Pulihkan Kunci Sebelumnya</span
            >
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8 q-mb-sm">
            Apakah Anda yakin ingin memulihkan pasangan kunci RSA sebelumnya
            untuk merchant <strong>{{ store.selectedMerchant }}</strong
            >?
          </p>
          <p class="text-body2 text-grey-8 q-mb-none">
            Kunci aktif saat ini akan disimpan sebagai cadangan pemulihan
            sebelum diganti.
          </p>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey-8" v-close-popup no-caps />
          <q-btn
            color="primary"
            label="Ya, Pulihkan Kunci"
            no-caps
            class="text-weight-bold"
            :loading="store.recoveringKey"
            @click="confirmRecoverKey"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { copyToClipboard, Notify } from 'quasar'
import { usePaymentGatewayDokuStore } from '@/stores/paymentgatewaydoku'

const store = usePaymentGatewayDokuStore()
const recoveryDialogOpen = ref(false)

function handleGenerateClick() {
  store.generateRsaKey(false)
}

async function confirmRotateKey() {
  await store.generateRsaKey(true)
}

async function confirmRecoverKey() {
  const result = await store.recoverPreviousKey()
  if (result.success) {
    recoveryDialogOpen.value = false
  }
}

async function confirmDeleteConfig() {
  await store.deleteConfiguration()
}

async function copyPublicKey() {
  if (!store.config?.public_key) return
  try {
    if (typeof copyToClipboard === 'function') {
      await copyToClipboard(store.config.public_key)
    } else if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(store.config.public_key)
    }
    Notify.create({
      type: 'positive',
      message: 'Public Key berhasil disalin ke clipboard!'
    })
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: 'Gagal menyalin Public Key.'
    })
  }
}
</script>

<style scoped>
.section-title {
  margin: 0 0 4px;
  color: #17130c;
  font-size: 1.15rem;
  font-weight: 700;
}
.section-desc {
  margin: 0;
  color: #716a5d;
  font-size: 0.85rem;
}
.active-config-card {
  background: #fcfbfa;
  border: 1px solid #e0d7c6;
  border-radius: 10px;
}
.rsa-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.form-card {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 12px;
}
.border-blue {
  border: 1px solid #90caf9;
}
.public-key-box {
  background: #17130c;
  color: #f7df94;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 200px;
}
.public-key-box pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.78rem;
  line-height: 1.4;
}
.font-mono {
  font-family:
    SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}
</style>
