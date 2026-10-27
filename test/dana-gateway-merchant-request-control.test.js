import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('daftar merchant tidak dimuat dua kali pada pembukaan halaman dan request identik dideduplikasi', async () => {
  const [page, store] = await Promise.all([
    readFile(
      new URL('../src/pages/PaymentGateway/IndexPage.vue', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../src/stores/danagatewaymerchant/index.js', import.meta.url),
      'utf8'
    )
  ])

  assert.match(
    page,
    /Promise\.all\(\[store\.fetchMappings\(\), merchantStore\.fetchMerchants\(\)\]\)/
  )
  assert.match(page, /store merchant mendeduplikasi request identik/)
  assert.match(store, /pendingMerchantRequest\?\.key === requestKey/)
  assert.match(store, /merchantRequestSequence/)
})

test('store menghormati Retry-After dan tidak menjadwalkan retry tanpa batas', async () => {
  const store = await readFile(
    new URL('../src/stores/danagatewaymerchant/index.js', import.meta.url),
    'utf8'
  )

  assert.match(store, /retry-after/)
  assert.match(store, /rateLimitedUntil > Date\.now\(\)/)
  assert.doesNotMatch(store, /setTimeout\(/)
})

test('detail merchant memuat status sekali per merchant dan hanya refresh atas tindakan pengguna', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(dialog, /managementLoadedMerchantId/)
  assert.match(dialog, /!force && managementLoadedMerchantId\.value === merchantId/)
  assert.match(dialog, /@click="refreshManagement\(true\)"/)
  assert.match(dialog, /Terlalu banyak permintaan status/)
  assert.match(dialog, /Tidak ada retry otomatis/)
  assert.doesNotMatch(dialog, /setInterval\(/)
  assert.doesNotMatch(dialog, /setTimeout\(/)
})
