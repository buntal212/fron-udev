import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

test('danaGatewayMerchantService mendefinisikan API end-to-end untuk aturan biaya DANA', () => {
  const serviceFile = path.join(rootDir, 'src/services/udev-billing.js')
  const content = fs.readFileSync(serviceFile, 'utf8')

  assert.match(
    content,
    /fees:\s*params\s*=>\s*api\.get\('\/v1\/admin\/dana-gateway\/fees'/,
    'danaGatewayMerchantService harus mendefinisikan endpoint GET fees'
  )
  assert.match(
    content,
    /createFee:\s*payload\s*=>\s*api\.post\('\/v1\/admin\/dana-gateway\/fees'/,
    'danaGatewayMerchantService harus mendefinisikan endpoint POST createFee'
  )
  assert.match(
    content,
    /showFee:\s*id\s*=>\s*api\.get\(`\/v1\/admin\/dana-gateway\/fees\/\$\{id\}`/,
    'danaGatewayMerchantService harus mendefinisikan endpoint GET showFee'
  )
  assert.match(
    content,
    /updateFee:\s*\(id,\s*payload\)\s*=>\s*api\.put\(`\/v1\/admin\/dana-gateway\/fees\/\$\{id\}`/,
    'danaGatewayMerchantService harus mendefinisikan endpoint PUT updateFee'
  )
  assert.match(
    content,
    /toggleFeeStatus:\s*\(id,\s*isActive\)\s*=>\s*api\.patch\(`\/v1\/admin\/dana-gateway\/fees\/\$\{id\}\/status`/,
    'danaGatewayMerchantService harus mendefinisikan endpoint PATCH toggleFeeStatus'
  )
  assert.match(
    content,
    /deleteFee:\s*id\s*=>\s*api\.delete\(`\/v1\/admin\/dana-gateway\/fees\/\$\{id\}`/,
    'danaGatewayMerchantService harus mendefinisikan endpoint DELETE deleteFee'
  )
  assert.match(
    content,
    /calculateFee:\s*payload\s*=>\s*api\.post\('\/v1\/admin\/dana-gateway\/calculate-fee'/,
    'danaGatewayMerchantService harus mendefinisikan endpoint POST calculateFee'
  )
})

test('Store danagatewaymerchant mengelola state dan action CRUD biaya DANA serta simulasi', () => {
  const storeFile = path.join(
    rootDir,
    'src/stores/danagatewaymerchant/index.js'
  )
  const content = fs.readFileSync(storeFile, 'utf8')

  assert.match(content, /fees:\s*\[\]/, 'Store harus memiliki state fees')
  assert.match(
    content,
    /feesLoading:\s*false/,
    'Store harus memiliki state feesLoading'
  )
  assert.match(
    content,
    /feesHasMore:\s*true/,
    'Store harus memiliki state feesHasMore'
  )
  assert.match(
    content,
    /feeFilter:\s*\{/,
    'Store harus memiliki state feeFilter'
  )
  assert.match(
    content,
    /feeCalcForm:\s*\{/,
    'Store harus memiliki state feeCalcForm untuk simulasi'
  )
  assert.match(
    content,
    /feeCalcResult:\s*null/,
    'Store harus memiliki state feeCalcResult untuk hasil kalkulasi'
  )
  assert.match(
    content,
    /async\s+fetchFees\s*\(/,
    'Store harus menyediakan action fetchFees'
  )
  assert.match(
    content,
    /async\s+loadMoreFees\s*\(/,
    'Store harus menyediakan action loadMoreFees untuk infinite scroll'
  )
  assert.match(
    content,
    /openCreateFeeDialog\s*\(/,
    'Store harus menyediakan action openCreateFeeDialog'
  )
  assert.match(
    content,
    /openEditFeeDialog\s*\(/,
    'Store harus menyediakan action openEditFeeDialog'
  )
  assert.match(
    content,
    /async\s+saveFee\s*\(/,
    'Store harus menyediakan action saveFee untuk create/edit'
  )
  assert.match(
    content,
    /async\s+toggleFeeStatus\s*\(/,
    'Store harus menyediakan action toggleFeeStatus'
  )
  assert.match(
    content,
    /async\s+deleteFee\s*\(/,
    'Store harus menyediakan action deleteFee'
  )
  assert.match(
    content,
    /async\s+calculateFeePreview\s*\(/,
    'Store harus menyediakan action calculateFeePreview untuk kalkulator biaya'
  )
})

test('Payment Gateway IndexPage mendaftarkan tab Pengaturan Biaya dengan komponen DanaFeeManagement dan dialog', () => {
  const indexPageFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/IndexPage.vue'
  )
  const content = fs.readFileSync(indexPageFile, 'utf8')

  assert.match(
    content,
    /<q-tab\s+name="fees"\s+icon="payments"\s+label="Pengaturan Biaya"/,
    'IndexPage harus memiliki tab fees untuk Pengaturan Biaya'
  )
  assert.match(
    content,
    /<q-tab-panel\s+name="fees"/,
    'IndexPage harus memiliki panel untuk tab fees'
  )
  assert.match(
    content,
    /<DanaFeeManagement\s+[^>]*\/>/,
    'IndexPage harus memuat komponen DanaFeeManagement'
  )
  assert.match(
    content,
    /<DanaFeeFormDialog\s+[^>]*\/>/,
    'IndexPage harus memuat dialog DanaFeeFormDialog'
  )
  assert.match(
    content,
    /validTabs\s*=\s*\[[^\]]*'fees'/,
    'validTabs harus mendaftarkan tab fees'
  )
})

test('Komponen DanaFeeManagement mengimplementasikan Card List Item, Infinite Scroll, dan Kalkulator Simulasi', () => {
  const compFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeManagement.vue'
  )
  const content = fs.readFileSync(compFile, 'utf8')

  assert.match(
    content,
    /<q-infinite-scroll/,
    'Komponen harus menggunakan q-infinite-scroll'
  )
  assert.match(
    content,
    /class="fee-item-card/,
    'Komponen harus menggunakan fee-item-card untuk setiap metode'
  )
  assert.match(
    content,
    /store\.loadMoreFees/,
    'q-infinite-scroll harus memicu store.loadMoreFees'
  )
  assert.match(
    content,
    /store\.openCreateFeeDialog/,
    'Komponen harus memiliki tombol tambah biaya'
  )
  assert.match(
    content,
    /store\.calculateFeePreview/,
    'Komponen harus menyediakan fitur simulasi perhitungan biaya'
  )
  assert.match(
    content,
    /Tagihan Pokok/,
    'Komponen harus menampilkan tagihan pokok'
  )
  assert.match(
    content,
    /Total Bayar Pelanggan/,
    'Komponen harus menampilkan total bayar pelanggan'
  )
  assert.match(
    content,
    /Hak Pemilik Aplikasi/,
    'Komponen harus menampilkan hak pemilik aplikasi yang utuh'
  )
})

test('Komponen DanaFeeFormDialog mendukung tarif default global, khusus aplikasi, dan rekomendasi tarif resmi', () => {
  const formFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeFormDialog.vue'
  )
  const content = fs.readFileSync(formFile, 'utf8')

  assert.match(
    content,
    /Default Global \(Semua Aplikasi\)/,
    'Dialog harus mendukung opsi Default Global'
  )
  assert.match(
    content,
    /Khusus Aplikasi Tertentu/,
    'Dialog harus mendukung opsi Khusus Aplikasi Tertentu'
  )
  assert.match(
    content,
    /Biaya DANA \(Gateway\)/,
    'Dialog harus mendukung opsi Biaya DANA'
  )
  assert.match(
    content,
    /Biaya UDEV \(Platform\)/,
    'Dialog harus mendukung opsi Biaya UDEV'
  )
  assert.match(
    content,
    /Persentase \(%\)/,
    'Dialog harus mendukung satuan Persentase'
  )
  assert.match(
    content,
    /Nominal Tetap \(Rp\)/,
    'Dialog harus mendukung satuan Nominal Tetap'
  )
  assert.match(
    content,
    /officialRates/,
    'Dialog harus mendefinisikan tarif resmi DANA sebagai rekomendasi'
  )
  assert.match(
    content,
    /Gunakan tarif resmi/,
    'Dialog harus memiliki shortcut untuk menerapkan tarif resmi DANA'
  )
})

test('Frontend mendukung konfigurasi biaya per gateway_merchant_code untuk isolasi multi-merchant DANA', () => {
  const storeFile = path.join(
    rootDir,
    'src/stores/danagatewaymerchant/index.js'
  )
  const storeContent = fs.readFileSync(storeFile, 'utf8')
  assert.match(
    storeContent,
    /gateway_merchant_code:\s*null/,
    'Store harus memiliki gateway_merchant_code di feeForm dan feeFilter'
  )
  assert.match(
    storeContent,
    /gateway_merchant_code:\s*this\.feeFilter\.gateway_merchant_code\s*\|\|\s*undefined/,
    'fetchFees harus meneruskan gateway_merchant_code ke params API'
  )
  assert.match(
    storeContent,
    /gateway_merchant_code:\s*this\.feeForm\.scope_type\s*===\s*'merchant'\s*\?\s*this\.feeForm\.gateway_merchant_code\s*:\s*null/,
    'saveFee harus mengirim gateway_merchant_code jika scope_type merchant'
  )
  assert.match(
    storeContent,
    /gateway_merchant_code:\s*this\.feeCalcForm\.gateway_merchant_code\s*\|\|\s*undefined/,
    'calculateFeePreview harus mengirim gateway_merchant_code untuk simulasi per merchant'
  )

  const formDialogFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeFormDialog.vue'
  )
  const formContent = fs.readFileSync(formDialogFile, 'utf8')
  assert.match(
    formContent,
    /Khusus Merchant DANA/,
    'Form dialog harus memiliki pilihan cakupan Khusus Merchant DANA'
  )
  assert.match(
    formContent,
    /v-model="store\.feeForm\.gateway_merchant_code"/,
    'Form dialog harus mengikat input merchant ke store.feeForm.gateway_merchant_code'
  )
  assert.match(
    formContent,
    /merchantOptions/,
    'Form dialog harus menyediakan options merchant yang terdaftar'
  )

  const managementFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeManagement.vue'
  )
  const mgmtContent = fs.readFileSync(managementFile, 'utf8')
  assert.match(
    mgmtContent,
    /store\.feeFilter\.gateway_merchant_code/,
    'Management view harus menyediakan filter merchant DANA'
  )
  assert.match(
    mgmtContent,
    /store\.feeCalcForm\.gateway_merchant_code/,
    'Kalkulator simulasi harus mendukung pilihan merchant DANA'
  )
  assert.match(
    mgmtContent,
    /fee\.gateway_merchant_code/,
    'Card view harus menampilkan badge atau label gateway_merchant_code'
  )
})

test('Dropdown Pilih Merchant DANA memetakan merchant_code dan merchant_name dengan benar tanpa undefined', () => {
  const formDialogFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeFormDialog.vue'
  )
  const formContent = fs.readFileSync(formDialogFile, 'utf8')

  assert.match(
    formContent,
    /merchant_code/,
    'Form dialog harus memetakan merchant_code dari API response'
  )
  assert.match(
    formContent,
    /merchant_name/,
    'Form dialog harus memetakan merchant_name dari API response'
  )
  assert.match(
    formContent,
    /use-input/,
    'Select merchant harus mendukung input pencarian'
  )
  assert.match(
    formContent,
    /@filter="filterMerchantFn"/,
    'Select merchant harus memiliki filter handler untuk pencarian'
  )
  assert.doesNotMatch(
    formContent,
    /\$\{m\.name\}\s*\(\$\{m\.code\}\)/,
    'Form dialog tidak boleh menggunakan m.name atau m.code yang menghasilkan undefined'
  )

  const managementFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeManagement.vue'
  )
  const mgmtContent = fs.readFileSync(managementFile, 'utf8')
  assert.match(
    mgmtContent,
    /merchant_code/,
    'Management filter harus memetakan merchant_code dari API response'
  )
  assert.doesNotMatch(
    mgmtContent,
    /\$\{m\.name\}\s*\(\$\{m\.code\}\)/,
    'Management filter tidak boleh menggunakan m.name atau m.code yang menghasilkan undefined'
  )
})

test('Filter Environment DANA mendukung Semua Environment (default null) dan Production sehingga aturan Production tampil benar', () => {
  const storeFile = path.join(
    rootDir,
    'src/stores/danagatewaymerchant/index.js'
  )
  const storeContent = fs.readFileSync(storeFile, 'utf8')

  // feeFilter.environment harus default null (Semua Environment)
  assert.match(
    storeContent,
    /feeFilter:\s*\{[\s\S]*?environment:\s*null/,
    'feeFilter.environment harus default null agar semua aturan (termasuk Production) tampil saat pertama kali dimuat'
  )

  // openCreateFeeDialog mendukung fallback production jika production aktif
  assert.match(
    storeContent,
    /else\s+if\s*\(this\.isProductionActive\)\s*\{\s*this\.feeForm\.environment\s*=\s*'production'/,
    'openCreateFeeDialog harus menginisialisasi environment ke production jika production sedang aktif'
  )

  // saveFee menyelaraskan feeFilter.environment jika ada filter yang tidak cocok
  assert.match(
    storeContent,
    /this\.feeFilter\.environment\s*=\s*payload\.environment/,
    'saveFee harus menyelaraskan feeFilter.environment agar aturan yang baru dibuat langsung terlihat'
  )

  const managementFile = path.join(
    rootDir,
    'src/pages/PaymentGateway/comp/DanaFeeManagement.vue'
  )
  const mgmtContent = fs.readFileSync(managementFile, 'utf8')

  // Options environment pada management view
  assert.match(
    mgmtContent,
    /label:\s*'Semua Environment',\s*value:\s*null/,
    'Filter environment harus menyediakan pilihan Semua Environment dengan value null'
  )
  assert.match(
    mgmtContent,
    /label:\s*'Production',\s*value:\s*'production'/,
    'Filter environment harus menyediakan pilihan Production'
  )
})
