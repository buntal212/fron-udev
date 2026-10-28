import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel menyediakan UAT IPG Cashier Pay (2005400 dan 4005402) dengan target /rest/redirection/v1.0/debit/payment-host-to-host dan diagnostik aman', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  // Verifikasi tombol UAT IPG Cashier Pay
  assert.match(panel, /UAT IPG Sukses \(2005400\)/)
  assert.match(panel, /runIpgCreateOrderSuccessUat/)
  assert.match(panel, /UAT IPG Missing Timestamp \(4005402\)/)
  assert.match(panel, /runIpgMissingTimestampUat/)

  // Verifikasi banner diagnostik dan target endpoint
  assert.match(panel, /\/rest\/redirection\/v1\.0\/debit\/payment-host-to-host/)
  assert.match(panel, /ipgCreateOrderSuccessUat\.received\?\.response_code/)
  assert.match(panel, /ipgCreateOrderSuccessUat\.received\?\.reference_no/)
  assert.match(panel, /ipgCreateOrderSuccessUat\.received\?\.web_redirect_url/)
  assert.match(
    panel,
    /ipgCreateOrderSuccessUat\.request\?\.partner_reference_no/
  )
  assert.match(panel, /ipgCreateOrderSuccessUat\.request\?\.amount_value/)
  assert.match(panel, /ipgMissingTimestampUat\.received\?\.response_code/)
  assert.match(panel, /ipgMissingTimestampUat\.request\?\.x_timestamp_sent/)

  // Verifikasi riwayat otomatis diperbarui setelah UAT IPG
  const runIpgSuccessCode = panel
    .split('async function runIpgCreateOrderSuccessUat')[1]
    ?.split('async function runIpgMissingTimestampUat')[0]
  assert.match(runIpgSuccessCode, /await refreshHistory\(\)/)
  const runIpgMissingCode = panel
    .split('async function runIpgMissingTimestampUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgMissingCode, /await refreshHistory\(\)/)

  // Verifikasi label aktivitas riwayat UAT IPG
  assert.match(
    panel,
    /ipg_create_order_success_tested:\s*'UAT IPG Cashier Pay \(2005400\)'/
  )

  // Verifikasi tidak ada kebocoran kunci atau signature rahasia
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(uatSection, /private_key|api_key|X-SIGNATURE/)

  // Verifikasi service API client methods
  assert.match(service, /testIpgCreateOrderSuccess/)
  assert.match(service, /sandbox-tester\/uat\/ipg-create-order-success/)
  assert.match(service, /testIpgCreateOrderMissingTimestamp/)
  assert.match(
    service,
    /sandbox-tester\/uat\/ipg-create-order-missing-timestamp/
  )
})
