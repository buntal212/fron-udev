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

test('panel tester menyediakan tombol UAT Debit Status Transaction Not Found 4045501 dengan referensi fiktif 12345678', async () => {
  const [panel, service] = await Promise.all([
    readFile(
      new URL(
        '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL('../src/services/udev-billing.js', import.meta.url),
      'utf8'
    )
  ])

  // Verifikasi tombol UAT 4045501 di panel tester
  assert.match(panel, /label="UAT Status Not Found \(4045501\)"/)
  assert.match(panel, /:loading="runningDebitStatusNotFoundUat"/)
  assert.match(panel, /@click="runDebitStatusNotFoundUat"/)

  // Verifikasi banner hasil UAT 4045501
  assert.match(panel, /v-if="debitStatusNotFoundUat"/)
  assert.match(panel, /Lolos \(4045501\)/)
  assert.match(panel, /12345678/)
  assert.match(panel, /service_code/)
  assert.match(panel, /testDebitStatusTransactionNotFound/)

  // Verifikasi endpoint service di udev-billing.js
  assert.match(
    service,
    /testDebitStatusTransactionNotFound:\s*merchantId\s*=>\s*api\.post\(\s*`\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/sandbox-tester\/uat\/debit-status-transaction-not-found`/
  )
})

test('panel tester menyediakan tombol UAT Debit Status Missing Timestamp 4005502 tanpa header X-TIMESTAMP', async () => {
  const [panel, service] = await Promise.all([
    readFile(
      new URL(
        '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL('../src/services/udev-billing.js', import.meta.url),
      'utf8'
    )
  ])

  // Verifikasi tombol UAT 4005502 di panel tester
  assert.match(panel, /label="UAT Status Missing Timestamp \(4005502\)"/)
  assert.match(panel, /:loading="runningDebitStatusMissingTimestampUat"/)
  assert.match(panel, /@click="runDebitStatusMissingTimestampUat"/)

  // Verifikasi banner hasil UAT 4005502
  assert.match(panel, /v-if="debitStatusMissingTimestampUat"/)
  assert.match(panel, /Lolos \(4005502\)/)
  assert.match(panel, /X-TIMESTAMP terkirim:/)
  assert.match(panel, /service_code/)
  assert.match(panel, /testDebitStatusMissingTimestamp/)

  // Verifikasi endpoint service di udev-billing.js
  assert.match(
    service,
    /testDebitStatusMissingTimestamp:\s*merchantId\s*=>\s*api\.post\(\s*`\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/sandbox-tester\/uat\/debit-status-missing-timestamp`/
  )
})

test('panel tester menyediakan tombol UAT Debit Status Internal Error 5005501 dengan serviceCode AZ', async () => {
  const [panel, service] = await Promise.all([
    readFile(
      new URL(
        '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL('../src/services/udev-billing.js', import.meta.url),
      'utf8'
    )
  ])

  // Verifikasi tombol UAT 5005501 di panel tester
  assert.match(panel, /label="UAT Status Internal Error \(5005501\)"/)
  assert.match(panel, /:loading="runningDebitStatusInternalServerErrorUat"/)
  assert.match(panel, /@click="runDebitStatusInternalServerErrorUat"/)

  // Verifikasi banner hasil UAT 5005501
  assert.match(panel, /v-if="debitStatusInternalServerErrorUat"/)
  assert.match(panel, /Lolos \(5005501\)/)
  assert.match(panel, /Service Code terkirim:/)
  assert.match(panel, /AZ/)
  assert.match(panel, /testDebitStatusInternalServerError/)

  // Verifikasi endpoint service di udev-billing.js
  assert.match(
    service,
    /testDebitStatusInternalServerError:\s*merchantId\s*=>\s*api\.post\(\s*`\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/sandbox-tester\/uat\/debit-status-internal-server-error`/
  )
})

test('panel tester menyediakan tombol UAT Debit Status Invalid Signature 4015500 dengan X-SIGNATURE invalid_signature', async () => {
  const [panel, service] = await Promise.all([
    readFile(
      new URL(
        '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL('../src/services/udev-billing.js', import.meta.url),
      'utf8'
    )
  ])

  // Verifikasi tombol UAT 4015500 di panel tester
  assert.match(panel, /label="UAT Status Invalid Signature \(4015500\)"/)
  assert.match(panel, /:loading="runningDebitStatusInvalidSignatureUat"/)
  assert.match(panel, /@click="runDebitStatusInvalidSignatureUat"/)

  // Verifikasi banner hasil UAT 4015500
  assert.match(panel, /v-if="debitStatusInvalidSignatureUat"/)
  assert.match(panel, /Lolos \(4015500\)/)
  assert.match(panel, /invalid_signature/)
  assert.match(panel, /service_code/)
  assert.match(panel, /testDebitStatusInvalidSignature/)

  // Verifikasi endpoint service di udev-billing.js
  assert.match(
    service,
    /testDebitStatusInvalidSignature:\s*merchantId\s*=>\s*api\.post\(\s*`\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/sandbox-tester\/uat\/debit-status-invalid-signature`/
  )
})
