import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Daftar Invoice UDEV direfaktor menjadi card list responsif dengan QVirtualScroll dan QPagination', async () => {
  const table = await readFile(
    new URL('../src/pages/Invoice/comp/InvoiceTable.vue', import.meta.url),
    'utf8'
  )

  // Menggunakan QVirtualScroll dan QPagination
  assert.match(table, /q-virtual-scroll/)
  assert.match(table, /class="invoice-virtual-scroll"/)
  assert.match(table, /q-pagination/)
  assert.match(table, /v-model="pageModel"/)
  assert.match(table, /v-model="rowsPerPageModel"/)

  // Elemen-elemen card: Aplikasi, Pelanggan, Paket, Periode, Nominal, Diskon, Referral, Tanggal, Status
  assert.match(table, /applicationName\(invoice\)/)
  assert.match(table, /invoice\.customer\?\.name/)
  assert.match(table, /invoice\.plan\?\.name/)
  assert.match(table, /invoice\.period_count/)
  assert.match(table, /invoice\.duration_days/)
  assert.match(
    table,
    /formatSubscriptionPrice\(\s*invoice\.pricing\?\.final_price/
  )
  assert.match(table, /invoice\.pricing\?\.discount_amount/)
  assert.match(table, /referralName\(invoice\)/)
  assert.match(table, /formatSubscriptionDate\(invoice\.issued_at\)/)
  assert.match(table, /formatSubscriptionDate\(invoice\.due_at\)/)
  assert.match(table, /getInvoiceStatus\(invoice\.status\)/)

  // Provider berdasarkan transaksi aktual, bukan mapping default
  assert.match(table, /getLatestAttempt\(invoice\)/)
  assert.match(table, /Belum memilih gateway/)
  assert.match(table, /Midtrans Sandbox/)
  assert.match(table, /DANA Sandbox/)
  assert.match(table, /formatPaymentMethod\(getLatestAttempt\(invoice\)\)/)

  // Riwayat lengkap jika ada > 1 percobaan
  assert.match(table, /invoice\.payment_attempts\?\.length > 1/)
  assert.match(table, /history-expansion/)
  assert.match(table, /Lihat Riwayat Lengkap/)

  // Tombol aksi detail
  assert.match(table, /\$emit\('detail', invoice\)/)
})

test('Halaman Invoice dan Store mendukung pencarian, filter, dan sorting', async () => {
  const indexPage = await readFile(
    new URL('../src/pages/Invoice/IndexPage.vue', import.meta.url),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )
  const table = await readFile(
    new URL('../src/pages/Invoice/comp/InvoiceTable.vue', import.meta.url),
    'utf8'
  )

  // Search input di FilterPanel
  assert.match(indexPage, /v-model="store\.search"/)
  assert.match(indexPage, /Cari invoice \/ pelanggan/)

  // Filter aplikasi, pelanggan, status
  assert.match(indexPage, /v-model="store\.applicationId"/)
  assert.match(indexPage, /v-model="store\.customerId"/)
  assert.match(indexPage, /v-model="store\.status"/)

  // Sorting di InvoiceTable
  assert.match(table, /sortOptions/)
  assert.match(table, /currentSortOption/)
  assert.match(table, /onSortChange/)

  // Store meneruskan search dan sort
  assert.match(store, /search:\s*''/)
  assert.match(store, /search:\s*this\.search \|\| undefined/)
})
