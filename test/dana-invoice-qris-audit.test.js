import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import QRCode from 'qrcode'

test('DANA QRIS: tidak memicu proxy qr-image dan merender string EMVCo langsung di client canvas', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // Watcher di dialog hanya memanggil loadProxyQrBlob jika isMidtrans bernilai true
  assert.match(
    dialog,
    /if\s*\(\s*isMidtrans\.value\s*\)\s*\{[\s\S]*await loadProxyQrBlob\(\)/
  )

  // Untuk DANA (non-Midtrans), watcher langsung merender EMVCo payload ke canvas tanpa loadProxyQrBlob
  assert.match(
    dialog,
    /\/\/\s*DANA QRIS: Selalu render string EMVCo \(qr_content\) di client canvas, TANPA request ke qr-image[\s\S]*await store\.renderQr\(emvcoPayload\.value,\s*attemptId\)/
  )

  // loadProxyQrBlob mengabaikan transaksi non-Midtrans (DANA)
  assert.match(
    dialog,
    /const loadProxyQrBlob\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?if\s*\(!isMidtrans\.value\)\s*\{[\s\S]*?return null\s*\}/
  )

  // Store mengikat renderQr ke attemptId aktif
  assert.match(
    store,
    /async renderQr\(payload,\s*attemptId\s*=\s*null\)\s*\{[\s\S]*this\.checkoutQrDataUrlAttemptId\s*=\s*attemptId/
  )
})

test('Anti-Stale Cache: Pergantian payment attempt membersihkan QR attempt lama dan merender attempt baru', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // Dialog mendeteksi attemptChanged dan membersihkan data URL attempt lama
  assert.match(
    dialog,
    /if\s*\(attemptChanged\)\s*\{[\s\S]*store\.checkoutQrDataUrlAttemptId\s*!==\s*attemptId[\s\S]*store\.checkoutQrDataUrl\s*=\s*null/
  )

  // emvcoPayload memprioritaskan data dari latestAttempt aktif terlebih dahulu
  assert.match(
    dialog,
    /const emvcoPayload\s*=\s*computed\(\(\)\s*=>\s*\{[\s\S]*attempt\?\.qr_string[\s\S]*attempt\?\.qr_content[\s\S]*attempt\?\.metadata\?\.qr_content/
  )

  // reconcileInvoice memeriksa checkoutQrDataUrlAttemptId agar attempt baru merender QR baru
  assert.match(
    store,
    /this\.checkoutQrDataUrlAttemptId\s*!==\s*latest\.id[\s\S]*await this\.renderQr\(recoveredPayload,\s*latest\.id\)/
  )

  // stopCheckoutSession dan retryCheckout mereset tracking attempt ID
  assert.match(store, /this\.checkoutQrDataUrlAttemptId\s*=\s*null/)
  assert.match(store, /this\.checkoutQrPayloadAttemptId\s*=\s*null/)
})

test('Render QRIS DANA menghasilkan Data URL PNG valid dan nominal sesuai EMVCo Tag 54', async () => {
  // Payload contoh DANA QRIS dengan nominal Rp 100.000 (Tag 54 = '5406100000')
  const danaPayload100k =
    '00020101021226570011ID.DANA.WWW011893600915000295707502090029570750303UMI51380014ID.CO.QRIS.WWW02090029570750303UMI52047372530336054061000005802ID5905UDEV6015Kota Jakarta Se61051224063041A2B'

  // Pastikan payload mengandung tag 54 (amount) sebesar 100000
  assert.match(danaPayload100k, /5406100000/)

  // Render payload menggunakan qrcode
  const dataUrl = await QRCode.toDataURL(danaPayload100k, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320
  })

  assert.match(dataUrl, /^data:image\/png;base64,/)

  const buffer = Buffer.from(
    dataUrl.slice('data:image/png;base64,'.length),
    'base64'
  )
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  assert.deepEqual(
    [...buffer.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10]
  )
  assert.ok(buffer.length > 500, 'Ukuran buffer PNG harus lebih dari 500 byte')
})

test('Error Image: handleQrImageError memicu fallback ke render canvas lokal jika terjadi error pada tag img', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Tag img memiliki listener @error
  assert.match(dialog, /@error="handleQrImageError"/)

  // handleQrImageError merender emvcoPayload lokal
  assert.match(
    dialog,
    /const handleQrImageError\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*if\s*\(emvcoPayload\.value\s*&&\s*!store\.checkoutQrDataUrl\)[\s\S]*await store\.renderQr\(emvcoPayload\.value\)/
  )
})
