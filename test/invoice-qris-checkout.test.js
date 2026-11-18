import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('InvoiceDetailDialog menyediakan pilihan QRIS, VA, tampilan instruksi, status, countdown, dan retry', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Opsi QRIS
  assert.match(dialog, /q-btn-toggle/)
  assert.match(dialog, /value:\s*'qris'/)
  assert.match(dialog, /value:\s*'dana_wallet'/)
  for (const method of ['va_bri', 'va_mandiri', 'va_bni', 'va_cimb', 'va_pani']) {
    assert.match(dialog, new RegExp(`value: '${method}'`))
  }
  // BTPN bukan bagian dari kontrak resmi DANA Udumbara dan tidak boleh otomatis ditawarkan
  assert.doesNotMatch(dialog, /value:\s*'va_btpn'/)

  // Tampilan QRIS
  assert.match(dialog, /class="qris-img"/)
  assert.match(dialog, /store\.checkoutQrDataUrl/)
  assert.match(dialog, /store\.checkoutQrPayload/)
  assert.match(dialog, /formattedCountdown/)

  // Unduh & Salin
  assert.match(dialog, /downloadQrisPng/)
  assert.match(dialog, /copyPayload/)

  // Retry
  assert.match(dialog, /store\.retryCheckout/)
  assert.match(dialog, /isQrisExpired/)

  // VA hanya dirender bila nomor dikembalikan oleh checkout gateway.
  assert.match(dialog, /isCurrentAttemptVirtualAccount/)
  assert.match(dialog, /Nomor Virtual Account/)
  assert.match(dialog, /Salin Nomor VA/)
  assert.match(dialog, /currentPaymentInstruction/)
  assert.match(dialog, /checkout_expires_at/)
})

test('invoice store dan service mendukung pengiriman payment_method pada checkout', async () => {
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(store, /checkoutPaymentMethod:\s*'qris'/)
  assert.match(store, /QRCode\.toDataURL/)
  assert.match(store, /isQrisMpmInstruction/)
  assert.match(store, /instruction\?\.type === 'qris_mpm'/)
  assert.match(store, /startCountdown/)
  assert.match(store, /startPolling/)
  assert.match(store, /payment_method:\s*method/)
  assert.match(
    service,
    /checkout:\s*\(id,\s*idempotencyKey,\s*payload\s*=\s*\{\}\)/
  )
})

test('polling QRIS invoice memakai paymentResultService dengan interval 4 detik dan timer cleanup', async () => {
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Polling via paymentResultService
  assert.match(store, /paymentResultService\.get\(/)
  assert.match(store, /},\s*4000\)/)
  assert.match(store, /this\.stopCheckoutSession\(\)/)

  // Payment code Custom Checkout tidak dianggap QR MPM hanya dari bentuk teksnya.
  assert.doesNotMatch(store, /startsWith\('00020101'\)/)
  assert.match(store, /instruction\.qr_content/)
  assert.match(store, /checkoutPaymentCode/)
  assert.match(dialog, /store\.checkoutPaymentCode/)
  assert.match(dialog, /onBeforeUnmount/)
  assert.match(store, /method\.startsWith\('va_'\)/)
})

test('QRIS tidak berubah menjadi dana_wallet saat checkout DANA dan tarif MDR QRIS bertingkat UMI ditampilkan akurat', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // QRIS menjadi opsi pertama pada metode pembayaran DANA
  const qrisIndex = dialog.indexOf("{ label: 'QRIS DANA', value: 'qris' }")
  const walletIndex = dialog.indexOf("{ label: 'DANA Wallet', value: 'dana_wallet' }")
  assert.ok(qrisIndex !== -1, 'Opsi QRIS DANA harus ada')
  assert.ok(walletIndex !== -1, 'Opsi DANA Wallet harus ada')
  assert.ok(qrisIndex < walletIndex, 'Opsi QRIS DANA harus berada di urutan pertama sebelum DANA Wallet')

  // Watcher checkoutProvider DANA tidak memaksa dana_wallet, melainkan fallback ke qris
  assert.match(dialog, /store\.checkoutPaymentMethod = 'qris'/)
  assert.doesNotMatch(dialog, /store\.checkoutPaymentMethod = 'dana_wallet'/)

  // Rincian MDR QRIS tidak hardcoded 0,7% melainkan dinamis
  assert.doesNotMatch(dialog, /MDR QRIS 0,7%/)
  assert.match(dialog, /MDR QRIS \{\{\s*merchantFeeRateLabel/)

  // Logika MDR 0% dan 0,3% bertingkat UMI pada merchantFeeRateLabel dan estimatedMerchantFee
  assert.match(dialog, /subtotal <= 500000 \? 0 : Math\.round\(subtotal \* 0\.003\)/)
  assert.match(dialog, /currentSubtotal\.value <= 500000 \? '0%' : '0,3%'/)
  assert.match(dialog, /fb\.merchant_fee_rate !== undefined/)
})
