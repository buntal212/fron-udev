import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('DanaGatewayMerchantTable: tombol Jadikan Utama, konfirmasi dialog, loading state, dan proteksi merchant utama', async () => {
  const tableSource = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  // 1. Props mendefinisikan settingPrimaryId untuk feedback reaktif
  assert.match(
    tableSource,
    /settingPrimaryId:\s*\{\s*type:\s*\[Number,\s*String\]/
  )

  // 2. Tombol Jadikan Utama memiliki binding loading dan disable sesuai merchant_status & in-flight request
  assert.match(
    tableSource,
    /:loading="settingPrimaryId === props\.row\.merchant_id"/
  )
  assert.match(
    tableSource,
    /:disable="\s*props\.row\.merchant_status !== 'active' \|\|\s*Boolean\(settingPrimaryId\)\s*"/
  )
  assert.match(tableSource, /@click="confirmSetPrimary\(props\.row\)"/)

  // 3. Dialog konfirmasi menyertakan nama dan kode merchant, serta meng-emit set-primary saat OK
  assert.match(tableSource, /function confirmSetPrimary\(row\)/)
  assert.match(tableSource, /title:\s*'Tetapkan Merchant Utama DANA'/)
  assert.match(
    tableSource,
    /\$\{row\.merchant_name\}" \(\$\{row\.merchant_code\}\)/
  )
  assert.match(tableSource, /emit\('set-primary',\s*row\)/)

  // 4. Baris dengan is_primary aktif menampilkan badge sistem pusat dan tidak menampilkan tombol Jadikan Utama
  assert.match(tableSource, /v-if="props\.row\.is_primary"/)
  assert.match(tableSource, /Merchant Sistem Pusat/)
  assert.match(tableSource, /Merchant Utama Aktif/)
})

test('IndexPage: meneruskan event set-primary dan binding setting-primary-id ke DanaGatewayMerchantTable', async () => {
  const indexSource = await readFile(
    new URL('../src/pages/PaymentGateway/IndexPage.vue', import.meta.url),
    'utf8'
  )

  // Event forwarding ke store action
  assert.match(indexSource, /@set-primary="merchantStore\.setPrimaryMerchant"/)
  // Loading prop forwarding
  assert.match(
    indexSource,
    /:setting-primary-id="merchantStore\.settingPrimaryMerchantId"/
  )
  // Fetch environment saat mount
  assert.match(indexSource, /merchantStore\.fetchEnvironment\(\)/)
})

test('danaGatewayMerchantService: mendefinisikan endpoint set-primary dan environment', async () => {
  const serviceSource = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(
    serviceSource,
    /setPrimaryMerchant:\s*merchantId\s*=>\s*api\.post\(\s*`\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/set-primary`\s*\)/
  )
  assert.match(
    serviceSource,
    /getEnvironment:\s*\(\)\s*=>\s*api\.get\('\/v1\/admin\/dana-gateway-merchants\/environment'\)/
  )
})

test('useDanaGatewayMerchantStore: setPrimaryMerchant menangani loading, API berhasil, API gagal, dan fetchEnvironment', async () => {
  const storeSource = await readFile(
    new URL('../src/stores/danagatewaymerchant/index.js', import.meta.url),
    'utf8'
  )

  // 1. State mendefinisikan environmentSettings dan settingPrimaryMerchantId
  assert.match(storeSource, /environmentSettings:\s*null/)
  assert.match(storeSource, /settingPrimaryMerchantId:\s*null/)

  // 2. Action fetchEnvironment tersedia dan menangani error secara graceful
  assert.match(storeSource, /async fetchEnvironment\(\)/)
  assert.match(
    storeSource,
    /await danaGatewayMerchantService\.getEnvironment\(\)/
  )

  // 3. Action setPrimaryMerchant mengelola loading state dan mencegah duplicate submission
  assert.match(storeSource, /if\s*\(this\.settingPrimaryMerchantId\)\s*return/)
  assert.match(storeSource, /this\.settingPrimaryMerchantId\s*=\s*merchantId/)

  // 4. Alur API berhasil: notifikasi positif, refresh tabel (fetchMerchants) dan environment
  assert.match(storeSource, /type:\s*'positive'/)
  assert.match(storeSource, /await this\.fetchMerchants\(\)/)
  assert.match(storeSource, /await this\.fetchEnvironment\(\)/)

  // 5. Alur API gagal: memformat pesan validasi lengkap (getApiValidationErrors), notifikasi negatif, dan rethrow error
  assert.match(
    storeSource,
    /const validationErrors = getApiValidationErrors\(error\)/
  )
  assert.match(storeSource, /type:\s*'negative'/)
  assert.match(storeSource, /throw error/)

  // 6. Cleanup loading state selalu dilakukan di block finally
  assert.match(
    storeSource,
    /finally\s*\{\s*this\.settingPrimaryMerchantId\s*=\s*null\s*\}/
  )
})
