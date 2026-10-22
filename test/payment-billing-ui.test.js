import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  formatRetryAfter,
  getRetryAfterMilliseconds,
  getReconciliationStatus
} from '../src/utils/subscription.js'

test('status rekonsiliasi memiliki label aman untuk UI', () => {
  assert.equal(getReconciliationStatus('paid').label, 'Terverifikasi dan lunas')
  assert.equal(getReconciliationStatus('retryable').color, 'warning')
  assert.equal(getReconciliationStatus('unknown').label, 'Belum disinkronkan')
})

test('Retry-After dihormati tanpa retry otomatis', () => {
  const milliseconds = getRetryAfterMilliseconds({
    response: { headers: { 'retry-after': '42' } }
  })

  assert.equal(milliseconds, 42000)
  assert.equal(formatRetryAfter(milliseconds), '42 detik')
})

test('UI invoice menggunakan endpoint checkout backend dan idempotency key', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  assert.match(service, /\/v1\/admin\/invoices\/\$\{id\}\/checkout/)
  assert.match(service, /'Idempotency-Key': idempotencyKey/)
  assert.match(store, /checkoutLoading/)
  assert.match(store, /window\.location\.assign\(this\.checkoutUrl\)/)
  assert.match(store, /protocol === 'https:'/)
})

test('UI riwayat menyediakan retry rekonsiliasi admin dan tidak memaksa paid', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )
  const detail = await readFile(
    new URL(
      '../src/pages/RiwayatPembayaran/comp/RiwayatPembayaranDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(service, /payment-attempts\/\$\{id\}\/reconcile/)
  assert.match(service, /payment-attempts\/\$\{id\}\/checkout\/retry/)
  assert.match(service, /invoices\/\$\{id\}\/subscription\/recover/)
  assert.match(detail, /Sinkronkan Ulang/)
  assert.match(detail, /Coba Checkout Lagi/)
  assert.match(detail, /Pulihkan Langganan/)
  assert.match(detail, /store\.synchronizeSelected/)
  assert.doesNotMatch(detail, /status\s*=\s*['"]paid['"]|status: ['"]paid['"]/)

  const store = await readFile(
    new URL('../src/stores/riwayatpembayaran/index.js', import.meta.url),
    'utf8'
  )
  assert.match(store, /retryCheckoutBlockedUntil/)
  assert.match(store, /recoverSubscriptionBlockedUntil/)
  assert.match(store, /getRetryAfterMilliseconds\(error\)/)
})

test('detail subscription menampilkan period event serta invoice terkait', async () => {
  const page = await readFile(
    new URL(
      '../src/pages/LanggananPelanggan/comp/LanggananDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(page, /subscription\.period_events/)
  assert.match(page, /subscription\.invoices/)
  assert.match(page, /previous_expires_at/)
  assert.match(page, /payment_attempts/)
  assert.match(page, /activation/)
  assert.match(page, /latest_invoice/)
})
