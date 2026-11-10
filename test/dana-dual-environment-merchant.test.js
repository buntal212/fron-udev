import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('DanaGatewayMerchantFormDialog tidak lagi memiliki pilihan environment saat membuat merchant', async () => {
  const formDialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantFormDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Tidak ada dropdown environment saat registrasi merchant bisnis baru
  assert.doesNotMatch(formDialog, /v-model="store\.form\.environment"/)
  assert.doesNotMatch(formDialog, /environmentOptions/)
  assert.match(
    formDialog,
    /Merchant didaftarkan sebagai identitas bisnis tunggal/
  )
})

test('DanaGatewayMerchantDetailDialog mengimplementasikan tab Dual Environment (Sandbox dan Production)', async () => {
  const detailDialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Tab Sandbox dan Production
  assert.match(detailDialog, /activeEnvironmentTab/)
  assert.match(detailDialog, /name="sandbox"/)
  assert.match(detailDialog, /name="production"/)
  assert.match(detailDialog, /Kebijakan Dual Environment UDEV/)

  // Scoped readiness dan konfigurasi
  assert.match(
    detailDialog,
    /danaGatewayMerchantService\.readiness\(\s*merchantId,\s*activeEnvironmentTab\.value\s*\)/
  )
  assert.match(
    detailDialog,
    /danaGatewayMerchantService\.storedDanaConfiguration\(\s*merchant\.value\.merchant_id,\s*activeEnvironmentTab\.value\s*\)/
  )
  assert.match(detailDialog, /environment:\s*activeEnvironmentTab\.value/)
})

test('DanaGatewayMerchantTable menampilkan badge dual environment untuk setiap merchant', async () => {
  const table = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(table, /label="Sandbox"/)
  assert.match(table, /label="Production"/)
})

test('danaGatewayMerchantService meneruskan parameter environment pada readiness dan storedDanaConfiguration', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(
    service,
    /readiness:\s*\(merchantId,\s*environment\s*=\s*'sandbox'\)/
  )
  assert.match(
    service,
    /storedDanaConfiguration:\s*\(merchantId,\s*environment\s*=\s*'sandbox'\)/
  )
  assert.match(service, /params:\s*\{\s*environment\s*\}/)
})

test('Tombol konfigurasi DANA tetap dapat diakses ketika readiness error dan tidak disembunyikan', async () => {
  const detailDialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Tombol aksi Tambah/Ubah Konfigurasi tersedia di luar blok readiness
  assert.match(detailDialog, /Ubah Konfigurasi DANA/)
  assert.match(detailDialog, /Tambah Konfigurasi DANA/)
  assert.match(detailDialog, /isConfigured/)
  assert.match(detailDialog, /configurationDialogOpen/)

  // Error banner menampilkan opsi coba lagi dan buka form konfigurasi langsung
  assert.match(detailDialog, /Buka Form Konfigurasi/)
  assert.match(detailDialog, /Coba lagi/)
  assert.match(detailDialog, /refreshManagement\(true\)/)
})

test('DanaGatewayMerchantDetailDialog memisahkan state sandbox dan production secara independen', async () => {
  const detailDialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // State terpisah untuk masing-masing environment
  assert.match(detailDialog, /envStates\s*=\s*reactive\(\{\s*sandbox:/)
  assert.match(detailDialog, /production:\s*\{/)
  assert.match(detailDialog, /currentEnvState/)

  // Label form dinamis sesuai tab aktif (Sandbox dan Production)
  assert.match(detailDialog, /External Store ID Production \(untuk QRIS\)/)
  assert.match(detailDialog, /External Store ID Sandbox \(untuk QRIS\)/)
  assert.match(detailDialog, /Sub Merchant ID Production/)
  assert.match(detailDialog, /Sub Merchant ID Sandbox/)
  assert.match(detailDialog, /Aktifkan konfigurasi Production/)
  assert.match(detailDialog, /Aktifkan konfigurasi Sandbox/)
  assert.match(detailDialog, /Private key DANA Production/)
  assert.match(detailDialog, /Private key DANA Sandbox/)
})

test('DanaGatewayMerchantDetailDialog membersihkan dan menyaring pesan error API agar tidak membocorkan credential', async () => {
  const detailDialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(detailDialog, /function sanitizeErrorMessage/)
  assert.match(detailDialog, /\[REDACTED\]/)
})
