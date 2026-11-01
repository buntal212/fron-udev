import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Daftar Invoice UDEV direfaktor menjadi card list responsif dengan QInfiniteScroll tanpa QPagination manual', async () => {
  const table = await readFile(
    new URL('../src/pages/Invoice/comp/InvoiceTable.vue', import.meta.url),
    'utf8'
  )

  // Menggunakan QInfiniteScroll, bukan QVirtualScroll atau QPagination
  assert.match(table, /<q-infinite-scroll/)
  assert.match(table, /class="invoice-infinite-scroll"/)
  assert.match(table, /onInfiniteLoad/)
  assert.match(table, /#loading/)
  assert.match(table, /end-indicator/)
  assert.doesNotMatch(table, /<q-virtual-scroll/)
  assert.doesNotMatch(table, /<q-pagination/)
  assert.doesNotMatch(table, /rowsPerPageModel/)

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

test('Halaman Invoice dan Store mendukung pencarian, filter, sorting, dan infinite scroll', async () => {
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

  // Store mendukung infinite scroll: reset, append data, deduplikasi, race condition guard
  assert.match(store, /resetAndFetchInvoices/)
  assert.match(store, /loadMoreInvoices/)
  assert.match(store, /existingIds/)
  assert.match(store, /fetchVersion/)
  assert.match(store, /loadingMore/)
  assert.match(store, /hasMore/)
  assert.match(store, /search:\s*''/)
  assert.match(store, /search:\s*this\.search \|\| undefined/)
})
