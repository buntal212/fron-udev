import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel menyediakan UAT Create Order 4045418 inconsistent request dengan dua request dan diagnostik aman', async () => {
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

  assert.match(panel, /UAT Inconsistent Request \(4045418\)/)
  assert.match(panel, /runInconsistentRequestUat/)
  assert.match(panel, /inconsistentRequestUat\.first_request\?\.response_code/)
  assert.match(panel, /inconsistentRequestUat\.second_request\?\.response_code/)
  assert.match(panel, /inconsistentRequestUat\.request\?\.partner_reference_no/)
  assert.match(panel, /Request 1 \(Rp100\.000\)/)
  assert.match(panel, /Request 2 \(Rp200\.000\)/)
  assert.match(panel, /UAT 4045418 belum terpenuhi:/)
  assert.match(panel, /4045418/)
  assert.match(panel, /Inconsistent Request/)
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(uatSection, /private_key|api_key|X-SIGNATURE/)
  assert.match(service, /testCreateOrderInconsistentRequest/)
  assert.match(
    service,
    /sandbox-tester\/uat\/create-order-inconsistent-request/
  )
})
