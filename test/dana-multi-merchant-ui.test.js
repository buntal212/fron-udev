import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('DanaGatewayMerchantTable memiliki tombol Jadikan Utama, Nonaktifkan/Aktifkan, Hapus, dan badge Merchant Utama Aktif', async () => {
  const tableComponent = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan kolom Status terdaftar
  assert.match(tableComponent, /name:\s*'status'/)
  assert.match(tableComponent, /field:\s*'merchant_status'/)

  // Memastikan tombol Jadikan Utama, Nonaktifkan / Aktifkan dan Hapus tersedia
  assert.match(tableComponent, /confirmSetPrimary/)
  assert.match(tableComponent, /confirmToggleStatus/)
  assert.match(tableComponent, /confirmDelete/)
  assert.match(tableComponent, /Jadikan Utama/)
  assert.match(tableComponent, /Nonaktifkan/)
  assert.match(tableComponent, /Aktifkan/)
  assert.match(tableComponent, /Hapus/)

  // Memastikan badge dan proteksi dinamis Merchant Utama terpasang
  assert.match(tableComponent, /props\.row\.is_primary/)
  assert.match(tableComponent, /Merchant Utama Aktif/)
  assert.match(tableComponent, /Merchant Sistem Pusat/)

  // Memastikan emit set-primary, toggle-status, dan delete terdaftar
  assert.match(tableComponent, /'set-primary'/)
  assert.match(tableComponent, /emit\('toggle-status'/)
  assert.match(tableComponent, /emit\('delete'/)
})

test('danaGatewayMerchantService dan store memiliki endpoint toggle status, delete, set primary, dan environment', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/danagatewaymerchant/index.js', import.meta.url),
    'utf8'
  )

  // Service methods
  assert.match(service, /toggleStatus:\s*\(merchantId,\s*isActive\)/)
  assert.match(service, /delete:\s*merchantId\s*=>/)
  assert.match(service, /setPrimaryMerchant:\s*merchantId\s*=>/)
  assert.match(service, /getEnvironment:\s*\(\)\s*=>/)
  assert.match(service, /activateProduction:\s*payload\s*=>/)
  assert.match(service, /switchSandbox:\s*payload\s*=>/)

  // Store actions
  assert.match(store, /toggleMerchantStatus\(merchant,\s*isActive\)/)
  assert.match(store, /deleteMerchant\(merchant\)/)
  assert.match(store, /setPrimaryMerchant\(merchant\)/)

  // Pastikan penanganan kegagalan menampilkan notifikasi negative dan melempar error (tidak menganggap sukses)
  assert.match(store, /type:\s*'negative'/)
  assert.match(store, /throw error/)
})
