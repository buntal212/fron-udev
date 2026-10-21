import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('riwayat aktivitas mengirim halaman yang dipilih dan mengabaikan respons lama', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(panel, /const historyRequestId = ref\(0\)/)
  assert.match(panel, /page: requestedPage/)
  assert.match(panel, /requestId !== historyRequestId\.value/)
  assert.doesNotMatch(panel, /historyLoading\.value\) return/)
})

test('riwayat pembayaran memakai audit gateway yang terverifikasi dan metadata webhook aman', async () => {
  const [history, service] = await Promise.all([
    readFile(
      new URL(
        '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL('../src/services/udev-billing.js', import.meta.url),
      'utf8'
    )
  ])

  assert.match(history, /Audit Pembayaran Sandbox/)
  assert.match(history, /gateway yang telah\s+diverifikasi/)
  assert.match(history, /status === 'paid'/)
  assert.match(history, /gateway_verified_at/)
  assert.match(history, /sandboxPaymentWebhooks/)
  assert.match(history, /sandboxPaymentSummary/)
  assert.match(history, /sandboxPaymentDetail/)
  assert.match(service, /sandboxPayments:/)
  assert.match(service, /sandboxPaymentDetail:/)
  assert.match(service, /sandboxPaymentWebhooks:/)
  assert.match(service, /sandboxPaymentSummary:/)
})
