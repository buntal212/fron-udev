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

test('store paymentgatewaydoku memproses konfigurasi, RSA key pair, dan pengujian token sesuai kontrak', async () => {
  const store = await readFile(
    new URL('../src/stores/paymentgatewaydoku/index.js', import.meta.url),
    'utf8'
  )

  assert.match(store, /dokuGatewayService\.merchants/)
  assert.match(store, /dokuGatewayService\.configuration/)
  assert.match(store, /dokuGatewayService\.saveConfiguration/)
  assert.match(store, /dokuGatewayService\.deleteConfiguration/)
  assert.match(store, /dokuGatewayService\.testToken/)
  assert.match(store, /dokuGatewayService\.audits/)
  assert.match(store, /dokuGatewayService\.generateKey/)
  assert.match(store, /dokuGatewayService\.recoverKey/)
  assert.match(store, /generatingKey/)
  assert.match(store, /recoveringKey/)
  assert.match(store, /deletingConfig/)
  assert.match(store, /rotateDialogOpen/)
  assert.match(store, /deleteDialogOpen/)
  assert.match(store, /generateRsaKey\(confirmRotation = false\)/)
  assert.match(store, /recoverPreviousKey\(\)/)
  assert.match(store, /deleteConfiguration\(\)/)
  assert.match(store, /this\.form\.private_key = ''/) // membersihkan plaintext dari state setelah simpan
})

test('service udev-billing mendaftarkan endpoint admin DOKU Gateway dan RSA key management', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(service, /dokuGatewayService = {/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/merchants/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/configuration/)
  assert.match(service, /deleteConfiguration:/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/test-token/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/audits/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/generate-key/)
  assert.match(service, /\/v1\/admin\/doku-gateway\/recover-key/)
})

test('DokuCredentialForm menyediakan fitur Generate RSA Key Pair, dialog rotasi aman, pulihkan kunci, hapus konfigurasi, dan bedakan reset form', async () => {
  const form = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuCredentialForm.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Fitur RSA
  assert.match(form, /Generate RSA Key Pair|Rotasi RSA Key Pair/)
  assert.match(form, /store\.generateRsaKey/)
  assert.match(form, /store\.rotateDialogOpen/)
  assert.match(form, /Konfirmasi Rotasi Kunci RSA/)
  assert.match(form, /store\.recoveringKey/)
  assert.match(form, /store\.config\?\.has_recovery_backup/)
  assert.match(form, /Pulihkan Kunci Sebelumnya/)
  assert.match(form, /store\.recoverPreviousKey/)
  assert.match(form, /Salin Public Key/)
  assert.match(form, /copyPublicKey/)
  assert.match(form, /store\.config\?\.public_key/)
  assert.match(form, /store\.config\?\.public_key_fingerprint/)

  // Fitur Hapus Konfigurasi & Pembedaan Reset Form
  assert.match(form, /Hapus Konfigurasi/)
  assert.match(form, /store\.deleteDialogOpen/)
  assert.match(form, /store\.deletingConfig/)
  assert.match(form, /confirmDeleteConfig/)
  assert.match(form, /Konfirmasi Hapus Konfigurasi/)
  assert.match(form, /Reset Form/)
  assert.match(form, /store\.resetForm/)
})
