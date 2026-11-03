import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

test('midtransGatewayService mendefinisikan API end-to-end untuk biaya admin Midtrans', () => {
  const serviceFile = path.join(rootDir, 'src/services/udev-billing.js')
  const content = fs.readFileSync(serviceFile, 'utf8')

  assert.match(
    content,
    /fees:\s*params\s*=>\s*api\.get\('\/v1\/admin\/midtrans-gateway\/fees'/,
    'midtransGatewayService harus mendefinisikan endpoint GET fees'
  )
  assert.match(
    content,
    /createFee:\s*payload\s*=>\s*api\.post\('\/v1\/admin\/midtrans-gateway\/fees'/,
    'midtransGatewayService harus mendefinisikan endpoint POST createFee'
  )
  assert.match(
    content,
    /updateFee:\s*\(id,\s*payload\)\s*=>\s*api\.put\(`\/v1\/admin\/midtrans-gateway\/fees\/\$\{id\}`/,
    'midtransGatewayService harus mendefinisikan endpoint PUT updateFee'
  )
  assert.match(
    content,
    /toggleFeeStatus:\s*\(id,\s*isActive\)\s*=>\s*api\.patch\(`\/v1\/admin\/midtrans-gateway\/fees\/\$\{id\}\/status`/,
    'midtransGatewayService harus mendefinisikan endpoint PATCH toggleFeeStatus'
  )
  assert.match(
    content,
    /deleteFee:\s*id\s*=>\s*api\.delete\(`\/v1\/admin\/midtrans-gateway\/fees\/\$\{id\}`/,
    'midtransGatewayService harus mendefinisikan endpoint DELETE deleteFee'
  )
  assert.match(
    content,
    /calculateFee:\s*payload\s*=>\s*api\.post\('\/v1\/admin\/midtrans-gateway\/calculate-fee'/,
    'midtransGatewayService harus mendefinisikan endpoint POST calculateFee'
  )
})

test('Store paymentgatewaymidtrans mengelola state dan action CRUD biaya admin', () => {
  const storeFile = path.join(
    rootDir,
    'src/stores/paymentgatewaymidtrans/index.js'
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
})

test('Payment Gateway Midtrans IndexPage mendaftarkan tab Biaya Admin dengan komponen Card List dan Dialog', () => {
  const indexPageFile = path.join(
    rootDir,
    'src/pages/PaymentGatewayMidtrans/IndexPage.vue'
  )
  const content = fs.readFileSync(indexPageFile, 'utf8')

  assert.match(
    content,
    /<q-tab\s+name="fees"\s+icon="payments"\s+label="Biaya Admin"/,
    'IndexPage harus memiliki tab fees untuk Biaya Admin'
  )
  assert.match(
    content,
    /<q-tab-panel\s+name="fees"/,
    'IndexPage harus memiliki panel untuk tab fees'
  )
  assert.match(
    content,
    /<MidtransFeeManagement\s*\/>/,
    'IndexPage harus memuat komponen MidtransFeeManagement'
  )
  assert.match(
    content,
    /<MidtransFeeFormDialog\s*\/>/,
    'IndexPage harus memuat dialog MidtransFeeFormDialog'
  )
})

test('Komponen MidtransFeeManagement mengimplementasikan pola Card List Item dan Infinite Scroll', () => {
  const compFile = path.join(
    rootDir,
    'src/pages/PaymentGatewayMidtrans/comp/MidtransFeeManagement.vue'
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
    'Komponen harus menggunakan fee-item-card untuk setiap metode pembayaran'
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
    /store\.openEditFeeDialog/,
    'Komponen harus memiliki tombol edit biaya'
  )
  assert.match(
    content,
    /store\.confirmDeleteFee/,
    'Komponen harus memiliki tombol hapus biaya'
  )
})

test('Komponen MidtransFeeFormDialog mendukung input biaya persentase dan nominal tetap', () => {
  const dialogFile = path.join(
    rootDir,
    'src/pages/PaymentGatewayMidtrans/comp/MidtransFeeFormDialog.vue'
  )
  const content = fs.readFileSync(dialogFile, 'utf8')

  assert.match(
    content,
    /value:\s*'percent'/,
    'Dialog harus mendukung tipe persentase'
  )
  assert.match(
    content,
    /value:\s*'fixed'/,
    'Dialog harus mendukung tipe nominal tetap'
  )
  assert.match(
    content,
    /store\.feeForm\.fee_rate/,
    'Dialog harus memiliki binding input tarif persentase'
  )
  assert.match(
    content,
    /store\.feeForm\.fixed_amount/,
    'Dialog harus memiliki binding input nominal tetap'
  )
})

test('InvoiceDetailDialog menampilkan rincian paket, diskon, subtotal, metode, biaya admin, dan total bayar', () => {
  const dialogFile = path.join(
    rootDir,
    'src/pages/Invoice/comp/InvoiceDetailDialog.vue'
  )
  const content = fs.readFileSync(dialogFile, 'utf8')

  assert.match(
    content,
    /Paket Langganan/,
    'Dialog harus menampilkan label Paket Langganan'
  )
  assert.match(
    content,
    /Harga Normal/,
    'Dialog harus menampilkan label Harga Normal'
  )
  assert.match(
    content,
    /Potongan Diskon/,
    'Dialog harus menampilkan label Potongan Diskon'
  )
  assert.match(
    content,
    /Subtotal Tagihan/,
    'Dialog harus menampilkan label Subtotal Tagihan'
  )
  assert.match(
    content,
    /Metode Transaksi/,
    'Dialog harus menampilkan label Metode Transaksi'
  )
  assert.match(
    content,
    /Biaya Admin/,
    'Dialog harus menampilkan label Biaya Admin'
  )
  assert.match(
    content,
    /TOTAL PEMBAYARAN/,
    'Dialog harus menampilkan label TOTAL PEMBAYARAN'
  )
  assert.match(
    content,
    /activeAdminFee/,
    'Dialog harus menggunakan activeAdminFee reaktif'
  )
  assert.match(
    content,
    /recalculateAdminFee/,
    'Dialog harus memiliki fungsi recalculateAdminFee saat metode berubah'
  )
  assert.match(
    content,
    /attempt\.fee_breakdown/,
    'Dialog harus menampilkan snapshot fee_breakdown pada riwayat pembayaran'
  )
})

test('InvoiceFormDialog menampilkan rincian paket, diskon, subtotal, dan total tagihan pada preview', () => {
  const formDialogFile = path.join(
    rootDir,
    'src/pages/Invoice/comp/InvoiceFormDialog.vue'
  )
  const content = fs.readFileSync(formDialogFile, 'utf8')

  assert.match(
    content,
    /Rincian Pembayaran & Tagihan/,
    'Preview harus memiliki judul Rincian Pembayaran & Tagihan'
  )
  assert.match(
    content,
    /Subtotal setelah diskon/,
    'Preview harus menampilkan Subtotal setelah diskon'
  )
  assert.match(
    content,
    /Biaya admin gateway/,
    'Preview harus mencantumkan catatan biaya admin gateway'
  )
  assert.match(
    content,
    /Total Tagihan Paket/,
    'Preview harus menampilkan Total Tagihan Paket'
  )
})

test('RiwayatPembayaranDetailDialog menampilkan snapshot rincian transaksi', () => {
  const dialogFile = path.join(
    rootDir,
    'src/pages/RiwayatPembayaran/comp/RiwayatPembayaranDetailDialog.vue'
  )
  const content = fs.readFileSync(dialogFile, 'utf8')

  assert.match(
    content,
    /Snapshot Rincian Biaya & Tagihan/,
    'Detail riwayat harus menampilkan Snapshot Rincian Biaya & Tagihan'
  )
  assert.match(
    content,
    /feeBreakdown\.subtotal_amount/,
    'Detail riwayat harus menampilkan subtotal dari snapshot'
  )
  assert.match(
    content,
    /feeBreakdown\.fee_amount/,
    'Detail riwayat harus menampilkan fee_amount dari snapshot'
  )
})
