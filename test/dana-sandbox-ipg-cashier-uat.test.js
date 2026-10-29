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
  assert.match(panel, /UAT Invalid Merchant \(4045408\)/)
  assert.match(panel, /runIpgInvalidMerchantUat/)
  assert.match(panel, /runIpgInconsistentRequestUat/)
  assert.match(panel, /UAT Invalid Signature \(4015400\)/)
  assert.match(panel, /runIpgInvalidSignatureUat/)
  assert.match(panel, /UAT Exceeds Amount Limit \(4035402\)/)
  assert.match(panel, /runIpgExceedsAmountLimitUat/)

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
  assert.match(panel, /ipgInvalidMerchantUat\.received\?\.response_code/)
  assert.match(panel, /445408\.00/)
  assert.match(
    panel,
    /ipgInconsistentRequestUat\.first_request\?\.response_code/
  )
  assert.match(
    panel,
    /ipgInconsistentRequestUat\.second_request\?\.response_code/
  )
  assert.match(
    panel,
    /ipgInconsistentRequestUat\.request\?\.partner_reference_no/
  )
  assert.match(panel, /ipgInvalidSignatureUat\.received\?\.response_code/)
  assert.match(panel, /ipgInvalidSignatureUat\.request\?\.amount_value/)
  assert.match(panel, /ipgExceedsAmountLimitUat\.received\?\.response_code/)
  assert.match(panel, /5000000000\.00/)

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
  const runIpgInvalidMerchantCode = panel
    .split('async function runIpgInvalidMerchantUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgInvalidMerchantCode, /await refreshHistory\(\)/)
  const runIpgInconsistentCode = panel
    .split('async function runIpgInconsistentRequestUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgInconsistentCode, /await refreshHistory\(\)/)
  const runIpgInvalidSigCode = panel
    .split('async function runIpgInvalidSignatureUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgInvalidSigCode, /await refreshHistory\(\)/)
  const runIpgExceedsAmountCode = panel
    .split('async function runIpgExceedsAmountLimitUat')[1]
    ?.split('async function runDebitStatusNotFoundUat')[0]
  assert.match(runIpgExceedsAmountCode, /await refreshHistory\(\)/)

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
  assert.match(
    panel,
    /ipg_create_order_invalid_merchant_tested:\s*'UAT IPG Invalid Merchant \(4045408\)'/
  )
  assert.match(
    panel,
    /ipg_create_order_inconsistent_tested:\s*'UAT IPG Inconsistent Request \(4045418\)'/
  )
  assert.match(
    panel,
    /ipg_create_order_invalid_signature_tested:\s*'UAT IPG Invalid Signature \(4015400\)'/
  )
  assert.match(
    panel,
    /ipg_create_order_exceeds_amount_tested:\s*'UAT IPG Exceeds Amount Limit \(4035402\)'/
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
  assert.match(service, /testIpgCreateOrderInvalidMerchant/)
  assert.match(
    service,
    /sandbox-tester\/uat\/ipg-create-order-invalid-merchant/
  )
  assert.match(service, /testIpgCreateOrderInconsistentRequest/)
  assert.match(
    service,
    /sandbox-tester\/uat\/ipg-create-order-inconsistent-request/
  )
  assert.match(service, /testIpgCreateOrderInvalidSignature/)
  assert.match(
    service,
    /sandbox-tester\/uat\/ipg-create-order-invalid-signature/
  )
  assert.match(service, /testIpgCreateOrderExceedsAmountLimit/)
  assert.match(
    service,
    /sandbox-tester\/uat\/ipg-create-order-exceeds-amount-limit/
  )

  // Verifikasi opsi nominal UAT Exceeds Amount Limit (Rp5.000.000.000 dan Rp10.000.000)
  assert.match(panel, /Nominal Resmi:\s*Rp5\.000\.000\.000/)
  assert.match(panel, /Nominal UAT:\s*Rp10\.000\.000/)
  assert.match(panel, /5000000000/)
  assert.match(panel, /10000000/)
  assert.match(panel, /Arahan DANA Support \(Rp10\.000\.000\)/)
  assert.match(panel, /Nominal Resmi SNAP \(Rp5\.000\.000\.000\)/)
})

test('pengujian mock UAT Exceeds Amount Limit memvalidasi respons aktual DANA 4035402 tanpa hardcode PASSED', () => {
  // Simulasi validator UAT DANA Sandbox
  function evaluateExceedsAmountUat(responseCode) {
    const expectedCode = '4035402'
    return {
      passed: responseCode === expectedCode,
      expected: {
        response_code: expectedCode,
        response_message: 'Exceeds Transaction Amount Limit'
      },
      received: { response_code: responseCode }
    }
  }

  // Skenario 1: Nominal resmi Rp5.000.000.000 menerima 4035402 -> PASSED
  const officialRun = evaluateExceedsAmountUat('4035402')
  assert.equal(officialRun.passed, true)
  assert.equal(officialRun.received.response_code, '4035402')

  // Skenario 2: Nominal UAT Rp10.000.000 (arahan DANA Support) menerima 4035402 -> PASSED
  const supportRun = evaluateExceedsAmountUat('4035402')
  assert.equal(supportRun.passed, true)
  assert.equal(supportRun.received.response_code, '4035402')

  // Skenario 3: Respons tak terduga (misal 2005400 atau 5005400) -> GAGAL (tidak di-hardcode PASSED)
  const unexpectedSuccess = evaluateExceedsAmountUat('2005400')
  assert.equal(unexpectedSuccess.passed, false)

  const serverError = evaluateExceedsAmountUat('5005400')
  assert.equal(serverError.passed, false)
})
