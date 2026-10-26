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
  assert.match(panel, /qr_image/)
  assert.match(panel, /qr_url/)
  assert.match(panel, /payment_code/)
  assert.match(panel, /hanya berasal dari webhook DANA yang tervalidasi/)
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
