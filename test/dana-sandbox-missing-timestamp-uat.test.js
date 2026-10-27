import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel menyediakan UAT Create Order tanpa X-TIMESTAMP dengan diagnostik aman', async () => {
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

  assert.match(panel, /UAT tanpa X-TIMESTAMP/)
  assert.match(panel, /runMissingTimestampUat/)
  assert.match(panel, /missingTimestampUat\.received\?\.response_code/)
  assert.match(panel, /missingTimestampUat\.request\?\.x_timestamp_sent/)
  assert.match(panel, /4005402/)
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(uatSection, /private_key|api_key|X-SIGNATURE/)
  assert.match(service, /testCreateOrderMissingTimestamp/)
  assert.match(service, /sandbox-tester\/uat\/create-order-missing-timestamp/)
})
