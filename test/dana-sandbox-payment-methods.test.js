import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel tester Sandbox mengirim metode yang diizinkan dan menampilkan instruksi aman', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )

  for (const paymentMethod of [
    'dana_wallet',
    'qris',
    'va_bri',
    'va_pani',
    'va_cimb',
    'va_btpn'
  ]) {
    assert.match(panel, new RegExp(`value: '${paymentMethod}'`))
  }

  assert.match(panel, /payment_method: paymentMethod\.value/)
  assert.match(panel, /transaction\.payment_instruction/)
  assert.match(panel, /payment_code/)
  assert.match(panel, /Salin Kode/)
  assert.match(panel, /instruction\?\.type === 'qris_mpm'/)
  assert.match(panel, /instruction\.qr_content/)
  assert.match(panel, /payment_instruction\.payment_code && !qrisPayload/)
  assert.match(panel, /transaction\.payment_instruction\.type === 'qris_mpm'/)
  assert.match(panel, /transaction\.payment_instruction\.qr_image/)
  assert.doesNotMatch(panel, /qrserver|quickchart|googleapis/i)
  assert.match(panel, /hanya berasal dari webhook DANA yang tervalidasi/)
  assert.match(panel, /label="Cek Status DANA"/)
  assert.match(panel, /queryDanaSandboxPaymentStatus/)
  assert.match(panel, /Status lokal/)
  assert.match(panel, /Status DANA/)
  assert.match(panel, /Response code/)
  assert.match(panel, /latest_transaction_status/)
  assert.match(panel, /read-only dan tidak mengubah status lokal/)
})

test('riwayat Sandbox menampilkan metode tanpa mengekspos instruksi atau credential', async () => {
  const history = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(history, /payment_method/)
  assert.match(history, /paymentMethodLabel/)
  assert.doesNotMatch(history, /private_key/)
  assert.doesNotMatch(history, /dana_webhook_public_key/)
})

test('panel mengikat retry pada snapshot tindakan dan membuat key baru saat nominal atau metode berubah', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(panel, /pendingTransactionAction/)
  assert.match(
    panel,
    /sameTransactionAction\(pendingTransactionAction\.value, payload\)/
  )
  assert.match(panel, /idempotencyKey: globalThis\.crypto\.randomUUID\(\)/)
  assert.match(panel, /action\.idempotencyKey/)
  assert.match(panel, /Mulai Tindakan Baru/)
  assert.match(panel, /pendingTransactionAction\.value = null/)
})

test('form konfigurasi merchant menyediakan External Store ID Sandbox tanpa memasukkannya ke riwayat transaksi', async () => {
  const form = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const history = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(form, /configurationForm\.external_store_id/)
  assert.match(form, /External Store ID Sandbox \(untuk QRIS\)/)
  assert.match(form, /ID resmi dari DANA Sandbox/)
  assert.match(form, /maxRule\(150\)/)
  assert.doesNotMatch(history, /external_store_id/)
})
