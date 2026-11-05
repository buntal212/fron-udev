import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('tab Pengaturan Environment tersedia di Payment Gateway Midtrans tanpa menambah menu baru di sidebar', async () => {
  const indexPage = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/IndexPage.vue',
      import.meta.url
    ),
    'utf8'
  )
  const sidebar = await readFile(
    new URL('../src/components/AppSidebar.vue', import.meta.url),
    'utf8'
  )

  // Memastikan tab Pengaturan Environment terdaftar di IndexPage
  assert.match(
    indexPage,
    /<q-tab[\s\S]*?name="environment"[\s\S]*?label="Pengaturan Environment"/
  )
  assert.match(indexPage, /<q-tab-panel[^>]*name="environment"/)
  assert.match(indexPage, /<MidtransEnvironmentSettings \/>/)

  // Header badge mendukung status dinamis PRODUCTION AKTIF / SANDBOX AKTIF
  assert.match(
    indexPage,
    /store\.isProductionActive \? 'PRODUCTION AKTIF' : 'SANDBOX AKTIF'/
  )

  // Memastikan TIDAK ADA menu baru di AppSidebar
  const midtransOccurrences = (
    sidebar.match(/label:\s*'Payment Gateway Midtrans'/g) || []
  ).length
  assert.equal(
    midtransOccurrences,
    1,
    'Hanya boleh ada 1 menu Midtrans di sidebar'
  )
  assert.doesNotMatch(
    sidebar,
    /Pengaturan Environment/i,
    'Sidebar tidak boleh memiliki menu Pengaturan Environment terpisah'
  )
  assert.doesNotMatch(
    sidebar,
    /Midtrans Production/i,
    'Sidebar tidak boleh memiliki menu Midtrans Production terpisah'
  )
})

test('komponen MidtransEnvironmentSettings mengimplementasikan checklist kesiapan, konfigurasi terpisah, dan konfirmasi admin', async () => {
  const envComp = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransEnvironmentSettings.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Banner status environment operasional aktif
  assert.match(envComp, /ENVIRONMENT OPERASIONAL AKTIF/)
  assert.match(envComp, /store\.activeEnvironment/)

  // Checklist evaluasi kesiapan production (3 pilar: kredensial, uji koneksi, mapping aplikasi)
  assert.match(envComp, /Checklist Evaluasi Kesiapan Production/)
  assert.match(envComp, /1\. Kredensial Production/)
  assert.match(envComp, /2\. Uji Koneksi API Production/)
  assert.match(envComp, /3\. Mapping Aplikasi Production/)

  // Konfigurasi terpisah Sandbox dan Production
  assert.match(envComp, /Sandbox Environment/)
  assert.match(envComp, /Production Environment/)
  assert.match(envComp, /activeConfigEnv/)

  // Uji koneksi per environment
  assert.match(envComp, /Uji Koneksi/)
  assert.match(envComp, /runConnectionTest/)

  // Dialog aktivasi Production dengan validasi ketat kalimat konfirmasi
  assert.match(envComp, /Konfirmasi Aktivasi Midtrans Production/)
  assert.match(envComp, /AKTIFKAN PRODUCTION/)
  assert.match(
    envComp,
    /val === 'AKTIFKAN PRODUCTION' \|\| 'Kalimat konfirmasi tidak cocok\.'/
  )
  assert.match(envComp, /confirmActivateProduction/)

  // Tombol kembalikan ke Sandbox
  assert.match(envComp, /Kembalikan ke Sandbox/)
  assert.match(envComp, /confirmSwitchSandbox/)
})

test('midtransGatewayService di udev-billing.js mendefinisikan endpoint environment dan parameter environment pada kredensial/uji koneksi', async () => {
  const serviceCode = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(
    serviceCode,
    /environment:\s*\(\)\s*=>\s*api\.get\('\/v1\/admin\/midtrans-gateway\/environment'\)/
  )
  assert.match(
    serviceCode,
    /activateProduction:\s*payload\s*=>\s*api\.post\(\s*'\/v1\/admin\/midtrans-gateway\/environment\/activate-production'/
  )
  assert.match(
    serviceCode,
    /switchSandbox:\s*payload\s*=>\s*api\.post\(\s*'\/v1\/admin\/midtrans-gateway\/environment\/switch-sandbox'/
  )
  assert.match(
    serviceCode,
    /configuration:\s*\(merchantCode,\s*environment\s*=\s*null\)/
  )
  assert.match(
    serviceCode,
    /testConnection:\s*\(merchantCode,\s*environment\s*=\s*null\)/
  )
  assert.match(
    serviceCode,
    /deleteConfiguration:\s*\(merchantCode,\s*environment\s*=\s*null\)/
  )
})

test('Pinia store payment-gateway-midtrans mengelola state environment, aktivasi production, dan isolasi kredensial', async () => {
  const storeCode = await readFile(
    new URL('../src/stores/paymentgatewaymidtrans/index.js', import.meta.url),
    'utf8'
  )

  // State
  assert.match(storeCode, /activeEnvironment:\s*'sandbox'/)
  assert.match(storeCode, /environmentSettings:\s*null/)
  assert.match(storeCode, /productionReadiness:\s*null/)
  assert.match(storeCode, /selectedConfigEnvironment:\s*'sandbox'/)

  // Getters
  assert.match(
    storeCode,
    /isProductionActive:\s*state\s*=>\s*state\.activeEnvironment\s*===\s*'production'/
  )
  assert.match(
    storeCode,
    /isReadyForProduction:\s*state\s*=>\s*Boolean\(state\.productionReadiness\?\.is_ready_for_production\)/
  )

  // Actions
  assert.match(storeCode, /async fetchEnvironmentSettings\(\)/)
  assert.match(
    storeCode,
    /async activateProduction\(confirmationPhrase,\s*notes\s*=\s*null\)/
  )
  assert.match(storeCode, /async switchSandbox\(notes\s*=\s*null\)/)
  assert.match(storeCode, /async testEnvironmentConnection\(/)
})
