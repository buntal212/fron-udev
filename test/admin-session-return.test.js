import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getSafePostLoginRedirect,
  hasAdminSession,
  isAdminSessionRejected
} from '../src/utils/admin-session.js'

test('sesi admin yang masih valid tetap dapat dipakai setelah kembali dari checkout', () => {
  assert.equal(
    hasAdminSession('token-admin-yang-tidak-dimasukkan-ke-url', {
      id: 1,
      username: 'admin'
    }),
    true
  )
  assert.equal(isAdminSessionRejected({ response: { status: 503 } }), false)
  assert.equal(isAdminSessionRejected(new Error('network error')), false)
})

test('sesi kedaluwarsa atau tanpa hak akses dibersihkan hanya setelah penolakan backend', () => {
  assert.equal(isAdminSessionRejected({ response: { status: 401 } }), true)
  assert.equal(isAdminSessionRejected({ response: { status: 403 } }), true)
})

test('login mengembalikan admin ke hasil Sandbox yang sama tanpa open redirect', () => {
  const resultPath =
    '/payment/sandbox-result?context=Abcdefghijklmnopqrstuvwxyz0123456789_-ABCDE'

  assert.equal(getSafePostLoginRedirect(resultPath), resultPath)
  assert.equal(getSafePostLoginRedirect('https://attacker.example'), '/')
  assert.equal(getSafePostLoginRedirect('//attacker.example'), '/')
})

test('checkout Sandbox menggunakan tab yang sama agar sessionStorage kembali tersedia', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(panel, /globalThis\.location\.assign\(checkoutUrl\)/)
  assert.doesNotMatch(panel, /globalThis\.open\(/)
})
