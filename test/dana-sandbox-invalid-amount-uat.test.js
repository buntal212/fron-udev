import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel menyediakan UAT Create Order 4005401 format amount tidak valid dengan diagnostik aman', async () => {
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

  assert.match(panel, /UAT format amount \(4005401\)/)
  assert.match(panel, /runInvalidAmountUat/)
  assert.match(panel, /invalidAmountUat\.received\?\.response_code/)
  assert.match(panel, /invalidAmountUat\.request\?\.amount_format_valid/)
  assert.match(panel, /4005401/)
  assert.match(panel, /Invalid Field Format amount/)
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(uatSection, /private_key|api_key|X-SIGNATURE/)
  assert.match(service, /testCreateOrderInvalidAmountFormat/)
  assert.match(
    service,
    /sandbox-tester\/uat\/create-order-invalid-amount-format/
  )
})
