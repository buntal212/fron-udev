import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('InvoiceDetailDialog mendukung checkout Midtrans Sandbox: QRIS, VA Bank, Mandiri Bill, GoPay, dan Indomaret CStore', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Gateway toggle
  assert.match(dialog, /v-model="store\.checkoutProvider"/)
  assert.match(dialog, /value:\s*'midtrans'/)
  assert.match(dialog, /value:\s*'dana'/)

  // Midtrans payment methods
  assert.match(dialog, /value:\s*'va_bca'/)
  assert.match(dialog, /value:\s*'va_bni'/)
  assert.match(dialog, /value:\s*'va_bri'/)
  assert.match(dialog, /value:\s*'va_permata'/)
  assert.match(dialog, /value:\s*'va_mandiri'/)
  assert.match(dialog, /value:\s*'gopay'/)
  assert.match(dialog, /value:\s*'qris'/)
  assert.match(dialog, /value:\s*'indomaret'/)

  // Indomaret CStore presentation & instructions
  assert.match(dialog, /isCurrentAttemptIndomaret/)
  assert.match(dialog, /Gerai Indomaret/)
  assert.match(dialog, /Kode Pembayaran Indomaret/)
  assert.match(dialog, /Salin Kode Bayar/)
  assert.match(dialog, /Instruksi Pembayaran di Indomaret:/)
  assert.match(dialog, /currentPaymentCode/)
  assert.match(dialog, /activeAdminFee/)
  assert.match(dialog, /activeTotalPayable/)

  // Mandiri Bill Payment display (Biller Code and Bill Key)
  assert.match(dialog, /currentPaymentInstruction\?\.biller_code/)
  assert.match(dialog, /Kode Perusahaan \(Biller Code\)/)
  assert.match(dialog, /Salin Biller Code/)
  assert.match(dialog, /Salin Bill Key/)

  // GoPay display
  assert.match(dialog, /isCurrentAttemptGopay/)
  assert.match(dialog, /Buka Aplikasi GoPay/)
  assert.match(dialog, /GoPay Midtrans Sandbox/)

  // Method to provider mapping & bank passing in onStartCheckout
  assert.match(dialog, /const onStartCheckout = \(\) =>/)
  assert.match(dialog, /if \(method === 'va_bca'\) bank = 'bca'/)
  assert.match(
    dialog,
    /if \(method === 'va_mandiri' \|\| method === 'echannel'\) bank = 'echannel'/
  )
})

test('MidtransSandboxTester dan MidtransFeeFormDialog mendukung Indomaret CStore', async () => {
  const tester = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransSandboxTester.vue',
      import.meta.url
    ),
    'utf8'
  )
  assert.match(tester, /value:\s*'cstore'/)
  assert.match(tester, /Kode Pembayaran Indomaret:/)
  assert.match(tester, /Salin Kode Bayar/)

  const feeDialog = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransFeeFormDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  assert.match(feeDialog, /value:\s*'indomaret'/)
  assert.match(feeDialog, /indomaret:\s*'Indomaret'/)
})

test('Invoice store mendukung provider Midtrans, dynamic gateway auto-detection, dan penerusan bank', async () => {
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // State initialization
  assert.match(store, /checkoutProvider:\s*null/)
  assert.match(store, /checkoutBank:\s*'bca'/)

  // Auto-detection from application_payment_gateways
  assert.match(store, /g\.provider === 'midtrans' && g\.is_active/)
  assert.match(store, /g\.provider === 'dana' && g\.is_active/)
  assert.match(store, /this\.checkoutProvider = 'midtrans'/)

  // startCheckout payload
  assert.match(store, /if \(provider\) payload\.provider = provider/)
  assert.match(store, /if \(bank\) payload\.bank = bank/)

  // Gopay handling in startCheckout
  assert.match(store, /else if \(method === 'gopay'\)/)

  // Retry checkout preserves provider and bank
  assert.match(store, /this\.checkoutProvider/)
  assert.match(store, /this\.checkoutBank/)
})
