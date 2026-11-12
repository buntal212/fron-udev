import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('tab Pengaturan Environment tersedia di Payment Gateway DANA dan header menampilkan status operasional aktif', async () => {
  const indexPage = await readFile(
    new URL('../src/pages/PaymentGateway/IndexPage.vue', import.meta.url),
    'utf8'
  )
  const sidebar = await readFile(
    new URL('../src/components/AppSidebar.vue', import.meta.url),
    'utf8'
  )

  // Memastikan tab Pengaturan Environment terdaftar di IndexPage DANA
  assert.match(
    indexPage,
    /<q-tab[\s\S]*?name="environment"[\s\S]*?label="Pengaturan Environment"/
  )
  assert.match(indexPage, /<q-tab-panel[^>]*name="environment"/)
  assert.match(indexPage, /<DanaEnvironmentSettings \/>/)

  // Header badge mendukung status dinamis PRODUCTION AKTIF / SANDBOX AKTIF
  assert.match(
    indexPage,
    /merchantStore\.isProductionActive\s*\?\s*'PRODUCTION AKTIF'\s*:\s*'SANDBOX AKTIF'/
  )

  // Memastikan TIDAK ADA menu baru di AppSidebar (tetap 1 menu Payment Gateway DANA)
  const danaOccurrences = (
    sidebar.match(/label:\s*'Payment Gateway DANA'/g) || []
  ).length
  assert.equal(danaOccurrences, 1, 'Hanya boleh ada 1 menu DANA di sidebar')
  assert.doesNotMatch(
    sidebar,
    /Pengaturan Environment DANA/i,
    'Sidebar tidak boleh memiliki menu Pengaturan Environment terpisah'
  )
})

test('komponen DanaEnvironmentSettings mengimplementasikan banner status, merchant utama, checklist 3 pilar, dan dialog konfirmasi', async () => {
  const envComp = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaEnvironmentSettings.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Banner status environment operasional aktif
  assert.match(envComp, /ENVIRONMENT OPERASIONAL AKTIF/)
  assert.match(envComp, /store\.activeEnvironment/)

  // Merchant Utama DANA (Central Bill Recipient)
  assert.match(envComp, /Merchant Utama DANA \(Central Bill Recipient\)/)
  assert.match(envComp, /store\.primaryMerchantCode/)

  // Checklist evaluasi kesiapan production (3 pilar: merchant, kredensial & base URL, mapping aplikasi)
  assert.match(envComp, /Checklist Evaluasi Kesiapan Production/)
  assert.match(envComp, /1\.\s*Merchant Utama Production/)
  assert.match(envComp, /2\.\s*Kredensial &amp; Base URL/)
  assert.match(envComp, /3\.\s*Mapping Aplikasi Production/)

  // Banner alasan belum siap
  assert.match(envComp, /reasonsNotReady/)
  assert.match(envComp, /Persyaratan Aktivasi Production Belum Terpenuhi/)

  // Tombol Aktivasi Production & Kembali ke Sandbox
  assert.match(envComp, /Aktivasi Mode Production/)
  assert.match(envComp, /Kembalikan ke Sandbox/)

  // Dialog aktivasi Production dengan validasi frasa ketat AKTIFKAN-DANA-PRODUCTION
  assert.match(envComp, /Konfirmasi Aktivasi DANA Production/)
  assert.match(envComp, /AKTIFKAN-DANA-PRODUCTION/)
  assert.match(envComp, /store\.activateProduction/)

  // Dialog kembali ke Sandbox
  assert.match(envComp, /Kembalikan ke Mode Sandbox/)
  assert.match(envComp, /store\.switchSandbox/)
})

test('store useDanaGatewayMerchantStore memiliki getters dan actions manajemen environment global', async () => {
  const storeSource = await readFile(
    new URL('../src/stores/danagatewaymerchant/index.js', import.meta.url),
    'utf8'
  )

  // Getters
  assert.match(storeSource, /activeEnvironment:/)
  assert.match(storeSource, /isProductionActive:/)
  assert.match(storeSource, /primaryMerchantCode:/)
  assert.match(storeSource, /isProductionReady:/)
  assert.match(storeSource, /productionReadiness:/)

  // Actions
  assert.match(storeSource, /openActivateDialog\(\)/)
  assert.match(storeSource, /closeActivateDialog\(\)/)
  assert.match(storeSource, /openSwitchSandboxDialog\(\)/)
  assert.match(storeSource, /closeSwitchSandboxDialog\(\)/)
  assert.match(storeSource, /async activateProduction\(/)
  assert.match(storeSource, /async switchSandbox\(/)
  assert.match(storeSource, /async fetchEnvironment\(\)/)
})

test('kebijakan dual environment di DanaGatewayMerchantDetailDialog menghapus klaim fallback otomatis dan tab berlabel Production (Live)', async () => {
  const detailSource = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Tab berlabel Production (Live)
  assert.match(detailSource, /label="Production \(Live\)"/)
  assert.doesNotMatch(detailSource, /label="Production \(Prioritas Utama\)"/)

  // Kebijakan tidak lagi menyebut fallback otomatis atau Sandbox hanya jika Production belum siap
  assert.doesNotMatch(detailSource, /otomatis memprioritaskan Production/)
  assert.doesNotMatch(
    detailSource,
    /Sandbox hanya digunakan untuk pengujian jika Production belum siap/
  )

  // Kebijakan menegaskan isolasi ketat dan tanpa fallback otomatis
  assert.match(detailSource, /isolasi ketat antar environment/)
  assert.match(detailSource, /Tidak ada fallback\s+otomatis/)
})
