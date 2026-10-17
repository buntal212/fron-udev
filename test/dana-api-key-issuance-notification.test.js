import assert from 'node:assert/strict'
import test from 'node:test'
import { notificationForApiKeyIssuance } from '../src/pages/PaymentGateway/comp/dana-api-key-issuance-notification.js'

test('status issuance terminal tidak memunculkan notifikasi sukses', () => {
  for (const status of ['expired', 'cancelled', 'manual_review']) {
    const notification = notificationForApiKeyIssuance(status, status)

    assert.equal(notification.type, 'warning')
    assert.match(notification.message, /tidak berhasil/)
  }
})

test('status issuance nonterminal mempertahankan notifikasi diproses', () => {
  const notification = notificationForApiKeyIssuance('pending', 'Menunggu')

  assert.deepEqual(notification, {
    type: 'positive',
    message: 'Issuance API key diproses.'
  })
})
