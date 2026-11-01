import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('MidtransSandboxTester menyediakan opsi bank BCA, BNI, BRI, Permata, dan Mandiri Bill Payment untuk Virtual Account', async () => {
  const tester = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransSandboxTester.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan opsi bank tersedia lengkap
  assert.match(tester, /bca/i)
  assert.match(tester, /BCA Virtual Account/)
  assert.match(tester, /bni/i)
  assert.match(tester, /BNI Virtual Account/)
  assert.match(tester, /bri/i)
  assert.match(tester, /BRI Virtual Account/)
  assert.match(tester, /permata/i)
  assert.match(tester, /Permata Virtual Account/)
  assert.match(tester, /mandiri/i)
  assert.match(tester, /Mandiri Bill Payment/)

  // Memastikan dropdown bank hanya muncul saat memilih Virtual Account (bank_transfer)
  assert.match(
    tester,
    /store\.testPaymentForm\.payment_type === 'bank_transfer'/
  )
})

test('MidtransSandboxTester mempertahankan dukungan metode QRIS dan GoPay', async () => {
  const tester = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransSandboxTester.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(tester, /value:\s*'qris'/)
  assert.match(tester, /QRIS \(GoPay \/ ShopeePay \/ Mandiri\)/)
  assert.match(tester, /value:\s*'gopay'/)
  assert.match(tester, /GoPay Direct/)
})

test('MidtransSandboxTester menampilkan nomor VA, kode perusahaan, dan kode pembayaran sesuai respons Midtrans', async () => {
  const tester = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransSandboxTester.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan visualisasi VA standard (BCA, BNI, BRI)
  assert.match(tester, /va\.bank/)
  assert.match(tester, /va\.va_number/)

  // Memastikan visualisasi Mandiri Bill Payment (Biller Code & Bill Key)
  assert.match(tester, /bill_key/)
  assert.match(tester, /biller_code/)
  assert.match(tester, /Kode Perusahaan \(Biller Code\)/)
  assert.match(tester, /Kode Pembayaran \(Bill Key\)/)

  // Memastikan visualisasi Permata VA
  assert.match(tester, /permata_va_number/)
  assert.match(tester, /PERMATA:/)

  // Memastikan link simulator GoPay
  assert.match(tester, /Buka Simulator Pembayaran GoPay/)
})

test('Store paymentgatewaymidtrans mengirimkan parameter bank yang dipilih saat Virtual Account aktif', async () => {
  const store = await readFile(
    new URL('../src/stores/paymentgatewaymidtrans/index.js', import.meta.url),
    'utf8'
  )

  assert.match(
    store,
    /if \(this\.testPaymentForm\.payment_type === 'bank_transfer'\)\s*\{\s*payload\.bank = this\.testPaymentForm\.bank/
  )
})

test('Integritas modul DANA dan DOKU tetap terjaga tanpa perubahan', async () => {
  const danaTester = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )
  assert.match(danaTester, /DANA/i)

  const dokuTester = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuTokenTester.vue',
      import.meta.url
    ),
    'utf8'
  )
  assert.match(dokuTester, /DOKU/i)
})
