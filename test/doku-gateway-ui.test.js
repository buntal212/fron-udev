import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('DokuCredentialForm menyediakan input private key PEM dan masked client ID', async () => {
  const form = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuCredentialForm.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(form, /AES-256-GCM/)
  assert.match(form, /store\.form\.merchant_code/)
  assert.match(form, /store\.form\.client_id/)
  assert.match(form, /store\.form\.private_key/)
  assert.match(form, /store\.saveConfiguration/)
  assert.match(form, /RSA Private Key/)
})

test('DokuTokenTester mendukung pengujian SNAP B2B, responseCode 2007300, dan buffer cache 60s', async () => {
  const tester = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuTokenTester.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(tester, /Uji Koneksi SNAP B2B/)
  assert.match(tester, /store\.testConnection/)
  assert.match(tester, /2007300/)
  assert.match(tester, /client_credentials/)
  assert.match(tester, /RSA-SHA256/)
  assert.match(tester, /Buffer 60s|buffer 60 detik/i)
  assert.match(tester, /Masked Access Token/)
})

test('DokuAuditTable menyediakan audit log dan modal detail aman tanpa secret', async () => {
  const auditTable = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuAuditTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(auditTable, /Audit Trail/)
  assert.match(auditTable, /store\.audits/)
  assert.match(auditTable, /response_code/)
  assert.match(auditTable, /latency_ms/)
  assert.match(auditTable, /detailDialogOpen/)
})

test('store paymentgatewaydoku memproses konfigurasi dan pengujian token sesuai kontrak', async () => {
  const store = await readFile(
    new URL('../src/stores/paymentgatewaydoku/index.js', import.meta.url),
    'utf8'
  )

  assert.match(store, /dokuGatewayService\.merchants/)
  assert.match(store, /dokuGatewayService\.configuration/)
  assert.match(store, /dokuGatewayService\.saveConfiguration/)
  assert.match(store, /dokuGatewayService\.testToken/)
  assert.match(store, /dokuGatewayService\.audits/)
  assert.match(store, /this\.form\.private_key = ''/) // membersihkan plaintext dari state setelah simpan
})

test('service udev-billing mendaftarkan endpoint admin DOKU Gateway', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(service, /dokuGatewayService = {/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/merchants/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/configuration/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/test-token/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/audits/)
})
