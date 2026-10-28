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
  assert.match(panel, /UAT General Error \(5005400\)/)
  assert.match(panel, /runIpgGeneralErrorUat/)
  assert.match(panel, /UAT Transaction Not Permitted \(4035415\)/)
  assert.match(panel, /runIpgTransactionNotPermittedUat/)

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
  assert.match(panel, /supportDeepLinkCheckoutUrl/)
  assert.match(panel, /productCode/)
  assert.match(panel, /validUpTo:\s*15\s*menit/)
  assert.match(panel, /ipgMissingTimestampUat\.received\?\.response_code/)
  assert.match(panel, /ipgMissingTimestampUat\.request\?\.x_timestamp_sent/)
  assert.match(panel, /ipgGeneralErrorUat\.received\?\.response_code/)
  assert.match(panel, /505400\.00/)
  assert.match(
    panel,
    /ipgTransactionNotPermittedUat\.received\?\.response_code/
  )
  assert.match(panel, /435415\.00/)

  // Verifikasi riwayat otomatis diperbarui setelah UAT IPG
  const runIpgSuccessCode = panel
    .split('async function runIpgCreateOrderSuccessUat')[1]
    ?.split('async function runIpgMissingTimestampUat')[0]
  assert.match(runIpgSuccessCode, /await refreshHistory\(\)/)
  const runIpgMissingCode = panel
    .split('async function runIpgMissingTimestampUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgMissingCode, /await refreshHistory\(\)/)
  const runIpgTxNotPermittedCode = panel
    .split('async function runIpgTransactionNotPermittedUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgTxNotPermittedCode, /await refreshHistory\(\)/)

  // Verifikasi label aktivitas riwayat UAT IPG
  assert.match(
    panel,
    /ipg_create_order_success_tested:\s*'UAT IPG Cashier Pay \(2005400\)'/
  )
  assert.match(
    panel,
    /ipg_create_order_general_error_tested:\s*'UAT IPG General Error \(5005400\)'/
  )
  assert.match(
    panel,
    /ipg_create_order_tx_not_permitted_tested:\s*'UAT IPG Transaction Not Permitted \(4035415\)'/
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
  assert.match(service, /testIpgCreateOrderGeneralError/)
  assert.match(service, /sandbox-tester\/uat\/ipg-create-order-general-error/)
  assert.match(service, /testIpgCreateOrderTransactionNotPermitted/)
  assert.match(
    service,
    /sandbox-tester\/uat\/ipg-create-order-transaction-not-permitted/
  )
})
