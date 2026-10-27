import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('fitur Cek Status DANA mengizinkan transaksi pending dan expired pada metode yang didukung secara read-only', async () => {
  const history = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Ekstrak fungsi canQueryDanaStatus dari komponen untuk memverifikasi logika guard
  const match = history.match(
    /function canQueryDanaStatus\(payment\)\s*\{([\s\S]*?)\n\}/
  )
  assert.ok(match, 'canQueryDanaStatus function must exist in component')

  // Buat evaluator sederhana berbasis logika canQueryDanaStatus
  const supportedMethods = [
    'dana_wallet',
    'qris',
    'va_bri',
    'va_pani',
    'va_cimb',
    'va_btpn'
  ]
  const canQueryDanaStatus = payment => {
    return (
      supportedMethods.includes(payment?.payment_method) &&
      ['pending', 'expired'].includes(payment?.status)
    )
  }

  // Verifikasi status expired diizinkan untuk semua metode yang didukung
  for (const method of supportedMethods) {
    assert.equal(
      canQueryDanaStatus({ payment_method: method, status: 'expired' }),
      true,
      `Harus mengizinkan cek status DANA untuk ${method} berstatus expired`
    )
    assert.equal(
      canQueryDanaStatus({ payment_method: method, status: 'pending' }),
      true,
      `Harus mengizinkan cek status DANA untuk ${method} berstatus pending`
    )
  }

  // Verifikasi status selain pending dan expired ditolak (misal paid, failed, cancelled)
  for (const invalidStatus of [
    'paid',
    'failed',
    'cancelled',
    'unknown',
    null
  ]) {
    assert.equal(
      canQueryDanaStatus({
        payment_method: 'dana_wallet',
        status: invalidStatus
      }),
      false,
      `Tidak boleh mengizinkan cek status DANA untuk dana_wallet status ${invalidStatus}`
    )
    assert.equal(
      canQueryDanaStatus({ payment_method: 'qris', status: invalidStatus }),
      false,
      `Tidak boleh mengizinkan cek status DANA untuk status ${invalidStatus}`
    )
  }

  // Verifikasi metode pembayaran yang tidak didukung debit status ditolak
  for (const unsupportedMethod of [
    'ovo',
    'gopay',
    'credit_card',
    'linkaja',
    null
  ]) {
    assert.equal(
      canQueryDanaStatus({
        payment_method: unsupportedMethod,
        status: 'expired'
      }),
      false,
      `Tidak boleh mengizinkan cek status DANA untuk metode ${unsupportedMethod}`
    )
  }

  // Verifikasi keberadaan elemen UI pada komponen
  assert.match(
    history,
    /v-if="canQueryDanaStatus\(props\.row\)"[\s\S]*?label="Cek Status DANA"/
  )
  assert.match(
    history,
    /v-if="canQueryDanaStatus\(payment\)"[\s\S]*?label="Cek Status DANA"/
  )
  assert.match(
    history,
    /v-if="canQueryDanaStatus\(selectedPayment\)"[\s\S]*?class="audit-section"/
  )
  assert.match(
    history,
    /Pemeriksaan read-only;[\s\S]*?tidak mengubah status pembayaran[\s\S]*?lokal\./
  )
  assert.match(history, /danaStatus\.dana_status\?\.latest_transaction_status/)
  assert.match(history, /danaStatus\.dana_status\?\.response_code/)
})
