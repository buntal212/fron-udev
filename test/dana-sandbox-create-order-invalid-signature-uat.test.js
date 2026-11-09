import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel menyediakan UAT PG Invalid Signature (4015400) terpisah dari Cashier Pay dengan diagnostik aman', async () => {
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

  // Tombol UAT PG Invalid Signature (4015400) terpisah
  assert.match(panel, /UAT PG Invalid Signature \(4015400\)/)
  assert.match(panel, /runCreateOrderInvalidSignatureUat/)
  assert.match(panel, /runningCreateOrderInvalidSignatureUat/)
  assert.match(panel, /createOrderInvalidSignatureUat\.received\?\.response_code/)
  assert.match(panel, /createOrderInvalidSignatureUat\.received\?\.response_message/)
  assert.match(panel, /createOrderInvalidSignatureUat\.request\?\.signature_override/)
  assert.match(panel, /UAT 4015400 belum terpenuhi:/)
  assert.match(panel, /4015400/)

  // Pastikan tidak mengekspos private key atau kredensial rahasia
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(uatSection, /private_key|api_key/)

  // Service helper
  assert.match(service, /testCreateOrderInvalidSignature/)
  assert.match(
    service,
    /sandbox-tester\/uat\/create-order-invalid-signature/
  )
})
