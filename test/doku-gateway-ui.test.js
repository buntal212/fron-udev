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

test('DokuMerchantTable dan DokuMerchantFormDialog menyediakan Daftar Merchant DOKU, pencarian, status filter, toggle, dan CRUD', async () => {
  const table = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuMerchantTable.vue',
      import.meta.url
    ),
    'utf8'
  )
  const dialog = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuMerchantFormDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Table assertions
  assert.match(table, /Daftar Merchant DOKU/)
  assert.match(table, /store\.merchants/)
  assert.match(table, /store\.merchantFilter\.search/)
  assert.match(table, /store\.merchantFilter\.status/)
  assert.match(table, /store\.toggleMerchantStatus/)
  assert.match(table, /store\.openCreateMerchantDialog/)
  assert.match(table, /store\.openEditMerchantDialog/)
  assert.match(table, /store\.confirmDeleteMerchant/)
  assert.match(table, /Konfirmasi Hapus Merchant/)

  // Dialog assertions
  assert.match(dialog, /store\.merchantFormDialogOpen/)
  assert.match(dialog, /store\.merchantForm\.merchant_code/)
  assert.match(dialog, /store\.merchantForm\.merchant_name/)
  assert.match(dialog, /store\.merchantForm\.client_id/)
  assert.match(dialog, /store\.merchantForm\.is_active/)
  assert.match(dialog, /store\.saveMerchant/)
})

test('DokuApplicationMappingTable dan Dialog mendukung mapping aplikasi ke DOKU provider sandbox', async () => {
  const table = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuApplicationMappingTable.vue',
      import.meta.url
    ),
    'utf8'
  )
  const dialog = await readFile(
    new URL(
      '../src/pages/PaymentGatewayDoku/comp/DokuApplicationMappingDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Table assertions
  assert.match(table, /Mapping Aplikasi ke DOKU Gateway/)
  assert.match(table, /store\.mappings/)
  assert.match(table, /store\.openCreateMappingDialog/)
  assert.match(table, /store\.openEditMappingDialog/)
  assert.match(table, /store\.toggleMappingStatus/)
  assert.match(table, /store\.deleteMapping/)

  // Dialog assertions
  assert.match(dialog, /store\.mappingDialogOpen/)
  assert.match(dialog, /store\.mappingForm\.application_id/)
  assert.match(dialog, /store\.mappingForm\.gateway_merchant_code/)
  assert.match(dialog, /store\.saveMapping/)
})

test('PaymentGatewayDoku IndexPage menyatukan 5 tab navigasi dengan tema Black & Gold', async () => {
  const page = await readFile(
    new URL('../src/pages/PaymentGatewayDoku/IndexPage.vue', import.meta.url),
    'utf8'
  )

  assert.match(page, /name="merchants".*label="Daftar Merchant"/)
  assert.match(page, /name="mappings".*label="Mapping Aplikasi"/)
  assert.match(page, /name="credentials".*label="Kredensial & RSA Sandbox"/)
  assert.match(page, /name="tester".*label="Uji SNAP B2B Token"/)
  assert.match(page, /name="audits".*label="Audit Log Gateway"/)
  assert.match(page, /DokuMerchantTable/)
  assert.match(page, /DokuApplicationMappingTable/)
  assert.match(page, /DokuCredentialForm/)
  assert.match(page, /DokuTokenTester/)
  assert.match(page, /DokuAuditTable/)
})
