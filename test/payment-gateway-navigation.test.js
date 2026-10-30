import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('sidebar memisahkan Payment Gateway menjadi DANA dan DOKU dengan rute yang sesuai', async () => {
  const sidebar = await readFile(
    new URL('../src/components/AppSidebar.vue', import.meta.url),
    'utf8'
  )

  // Memastikan Payment Gateway DANA ada dan mengarah ke /payment-gateway
  assert.match(sidebar, /label:\s*'Payment Gateway DANA'/)
  assert.match(sidebar, /to:\s*'\/payment-gateway'/)

  // Memastikan Payment Gateway DOKU ada dan mengarah ke /payment-gateway-doku
  assert.match(sidebar, /label:\s*'Payment Gateway DOKU'/)
  assert.match(sidebar, /to:\s*'\/payment-gateway-doku'/)

  // Memastikan kedua menu tidak di-disable (tidak comingSoon)
  const danaIndex = sidebar.indexOf("label: 'Payment Gateway DANA'")
  const dokuIndex = sidebar.indexOf("label: 'Payment Gateway DOKU'")
  assert.ok(danaIndex !== -1, 'Menu Payment Gateway DANA harus ada di sidebar')
  assert.ok(dokuIndex !== -1, 'Menu Payment Gateway DOKU harus ada di sidebar')

  // Verifikasi icon
  assert.match(sidebar, /icon:\s*'account_balance_wallet'/)
  assert.match(sidebar, /icon:\s*'credit_card'/)
})

test('router mendaftarkan rute payment-gateway dan payment-gateway-doku', async () => {
  const routes = await readFile(
    new URL('../src/router/routes.js', import.meta.url),
    'utf8'
  )

  // Rute DANA tetap menggunakan /payment-gateway dan komponen existing
  assert.match(
    routes,
    /path:\s*'payment-gateway'[\s\S]*?@\/pages\/PaymentGateway\/IndexPage\.vue/
  )

  // Rute DOKU baru mengarah ke komponen PaymentGatewayDoku
  assert.match(
    routes,
    /path:\s*'payment-gateway-doku'[\s\S]*?@\/pages\/PaymentGatewayDoku\/IndexPage\.vue/
  )
})

test('halaman Payment Gateway DOKU menampilkan placeholder Dalam Pengembangan dan tema Black & Gold', async () => {
  const dokuPage = await readFile(
    new URL('../src/pages/PaymentGatewayDoku/IndexPage.vue', import.meta.url),
    'utf8'
  )

  // Memastikan teks placeholder 'Dalam Pengembangan' ada
  assert.match(dokuPage, /Dalam Pengembangan/)
  assert.match(dokuPage, /Payment Gateway DOKU/)

  // Memastikan AppBreadcrumb digunakan
  assert.match(dokuPage, /<AppBreadcrumb title="Payment Gateway DOKU"/)

  // Memastikan elemen tema Black & Gold diterapkan
  assert.match(dokuPage, /--udev-gold|#d6ad4d|#b88924/)
  assert.match(dokuPage, /eyebrow/)
  assert.match(dokuPage, /content-wrap/)
})

test('halaman Payment Gateway DANA tetap mempertahankan seluruh fungsionalitas dan komponen', async () => {
  const danaPage = await readFile(
    new URL('../src/pages/PaymentGateway/IndexPage.vue', import.meta.url),
    'utf8'
  )

  // Memastikan seluruh tab dan dialog tetap ada
  assert.match(danaPage, /DanaGatewayMerchantTable/)
  assert.match(danaPage, /PaymentGatewayTable/)
  assert.match(danaPage, /BillingGatewayTransactions/)
  assert.match(danaPage, /PaymentGatewayFormDialog/)
  assert.match(danaPage, /DanaGatewayMerchantFormDialog/)
  assert.match(danaPage, /DanaGatewayMerchantDetailDialog/)
  assert.match(danaPage, /useDanaGatewayMerchantStore/)
  assert.match(danaPage, /usePaymentGatewayStore/)
})
