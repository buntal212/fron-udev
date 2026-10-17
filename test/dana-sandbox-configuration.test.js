import assert from 'node:assert/strict'
import test from 'node:test'
import { isSecureFrontendProtocol } from '../src/pages/PaymentGateway/comp/dana-sandbox-configuration.js'

test('peringatan transport hanya aktif untuk frontend HTTP', () => {
  assert.equal(isSecureFrontendProtocol('https:'), true)
  assert.equal(isSecureFrontendProtocol('http:'), false)
})
