import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel menyediakan UAT Finish Notify 5005601 terisolasi dengan diagnostik aman', async () => {
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

  assert.match(panel, /UAT Webhook Internal Error \(5005601\)/)
  assert.match(panel, /armWebhook500/)
  assert.match(panel, /armedWebhook500Uat/)
  assert.match(panel, /5005601/)
  assert.match(panel, /Internal Server Error/)
  assert.match(panel, /1x pakai, 10 menit/)
  assert.doesNotMatch(panel, /<q-dialog/)
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(uatSection, /private_key|api_key|X-SIGNATURE/)
  assert.match(service, /armSandboxWebhookSimulated500/)
  assert.match(service, /sandbox-tester\/uat\/arm-webhook-500/)
})

test('audit webhook menampilkan HTTP status 500, responseCode 5005601, pagination 5 data, tanpa QDialog', async () => {
  const history = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(history, /uat_simulated_500/)
  assert.match(history, /5005601/)
  assert.match(history, /Internal Server Error/)
  assert.match(history, /HTTP 500|webhook\.http_status === 500/)
  assert.match(history, /<q-list/)
  assert.match(history, /<q-item/)
  assert.match(history, /<q-pagination/)
  assert.match(history, /per_page: 5/)
  assert.doesNotMatch(history, /<q-dialog/)
})
