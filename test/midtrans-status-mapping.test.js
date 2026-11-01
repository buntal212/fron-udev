import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getMidtransStatusColor,
  getMidtransStatusInfo,
  getMidtransStatusLabel,
  MIDTRANS_FILTER_STATUS_OPTIONS,
  MIDTRANS_STATUS_MAP
} from '../src/utils/midtrans-status.js'

test('MIDTRANS_STATUS_MAP dibekukan dan berisi pemetaan status standar Midtrans', () => {
  assert.ok(Object.isFrozen(MIDTRANS_STATUS_MAP))
  assert.equal(MIDTRANS_STATUS_MAP.settlement.label, 'Berhasil')
  assert.equal(MIDTRANS_STATUS_MAP.pending.label, 'Menunggu Pembayaran')
  assert.equal(MIDTRANS_STATUS_MAP.expire.label, 'Kedaluwarsa')
  assert.equal(MIDTRANS_STATUS_MAP.cancel.label, 'Dibatalkan')
  assert.equal(MIDTRANS_STATUS_MAP.deny.label, 'Ditolak')
})

test('helper getMidtransStatusLabel memetakan status pembayaran Midtrans ke Bahasa Indonesia secara akurat', () => {
  // Sukses / Settlement
  assert.equal(getMidtransStatusLabel('settlement'), 'Berhasil')
  assert.equal(getMidtransStatusLabel('capture'), 'Berhasil')
  assert.equal(getMidtransStatusLabel('succeeded'), 'Berhasil')
  assert.equal(getMidtransStatusLabel('paid'), 'Berhasil')
  assert.equal(getMidtransStatusLabel('success'), 'Berhasil')

  // Pending / Menunggu Pembayaran
  assert.equal(getMidtransStatusLabel('pending'), 'Menunggu Pembayaran')
  assert.equal(getMidtransStatusLabel('initiated'), 'Menunggu Pembayaran')
  assert.equal(getMidtransStatusLabel('challenge'), 'Memerlukan Verifikasi')
  assert.equal(getMidtransStatusLabel('authorize'), 'Diotorisasi')

  // Expired / Kedaluwarsa
  assert.equal(getMidtransStatusLabel('expire'), 'Kedaluwarsa')
  assert.equal(getMidtransStatusLabel('expired'), 'Kedaluwarsa')

  // Cancel / Dibatalkan
  assert.equal(getMidtransStatusLabel('cancel'), 'Dibatalkan')
  assert.equal(getMidtransStatusLabel('cancelled'), 'Dibatalkan')

  // Deny / Ditolak
  assert.equal(getMidtransStatusLabel('deny'), 'Ditolak')
  assert.equal(getMidtransStatusLabel('denied'), 'Ditolak')

  // Failed / Gagal
  assert.equal(getMidtransStatusLabel('failed'), 'Gagal')
  assert.equal(getMidtransStatusLabel('failure'), 'Gagal')

  // Refund / Pengembalian
  assert.equal(getMidtransStatusLabel('refund'), 'Dikembalikan')
  assert.equal(
    getMidtransStatusLabel('partial_refund'),
    'Dikembalikan Sebagian'
  )
})

test('helper getMidtransStatusLabel mendukung case-insensitive dan trimming whitespace', () => {
  assert.equal(getMidtransStatusLabel('SETTLEMENT'), 'Berhasil')
  assert.equal(getMidtransStatusLabel('  pending  '), 'Menunggu Pembayaran')
  assert.equal(getMidtransStatusLabel('Expire'), 'Kedaluwarsa')
  assert.equal(getMidtransStatusLabel('CANCEL'), 'Dibatalkan')
  assert.equal(getMidtransStatusLabel('Deny'), 'Ditolak')
  assert.equal(getMidtransStatusLabel('FAILED'), 'Gagal')
})

test('helper getMidtransStatusLabel menangani status tidak diketahui, kosong, null, atau undefined dengan aman', () => {
  assert.equal(getMidtransStatusLabel(null), 'Tidak Diketahui')
  assert.equal(getMidtransStatusLabel(undefined), 'Tidak Diketahui')
  assert.equal(getMidtransStatusLabel(''), 'Tidak Diketahui')
  assert.equal(
    getMidtransStatusLabel('custom_unknown_status'),
    'custom_unknown_status'
  )
})

test('helper getMidtransStatusColor mengembalikan warna badge Quasar yang konsisten sesuai standar UI', () => {
  // Positif (hijau)
  assert.equal(getMidtransStatusColor('settlement'), 'positive')
  assert.equal(getMidtransStatusColor('capture'), 'positive')
  assert.equal(getMidtransStatusColor('succeeded'), 'positive')
  assert.equal(getMidtransStatusColor('paid'), 'positive')
  assert.equal(getMidtransStatusColor('success'), 'positive')

  // Warning (kuning/amber)
  assert.equal(getMidtransStatusColor('pending'), 'warning')
  assert.equal(getMidtransStatusColor('challenge'), 'warning')
  assert.equal(getMidtransStatusColor('authorize'), 'warning')

  // Negative (merah)
  assert.equal(getMidtransStatusColor('expire'), 'negative')
  assert.equal(getMidtransStatusColor('expired'), 'negative')
  assert.equal(getMidtransStatusColor('deny'), 'negative')
  assert.equal(getMidtransStatusColor('denied'), 'negative')
  assert.equal(getMidtransStatusColor('failed'), 'negative')

  // Grey (abu-abu)
  assert.equal(getMidtransStatusColor('cancel'), 'grey-7')
  assert.equal(getMidtransStatusColor('cancelled'), 'grey-7')

  // Info (biru/cyan)
  assert.equal(getMidtransStatusColor('refund'), 'info')
  assert.equal(getMidtransStatusColor('partial_refund'), 'info')

  // Fallback
  assert.equal(getMidtransStatusColor(null), 'grey-6')
  assert.equal(getMidtransStatusColor('unrecognized'), 'grey-6')
})

test('helper getMidtransStatusInfo menyediakan metadata lengkap tanpa memutasi raw status asli', () => {
  const infoSettlement = getMidtransStatusInfo('settlement')
  assert.deepEqual(infoSettlement, {
    label: 'Berhasil',
    color: 'positive',
    raw: 'settlement'
  })

  const infoPending = getMidtransStatusInfo('pending')
  assert.deepEqual(infoPending, {
    label: 'Menunggu Pembayaran',
    color: 'warning',
    raw: 'pending'
  })

  const infoExpire = getMidtransStatusInfo('expire')
  assert.deepEqual(infoExpire, {
    label: 'Kedaluwarsa',
    color: 'negative',
    raw: 'expire'
  })

  const infoCancel = getMidtransStatusInfo('cancel')
  assert.deepEqual(infoCancel, {
    label: 'Dibatalkan',
    color: 'grey-7',
    raw: 'cancel'
  })

  const infoDeny = getMidtransStatusInfo('deny')
  assert.deepEqual(infoDeny, {
    label: 'Ditolak',
    color: 'negative',
    raw: 'deny'
  })
})

test('MIDTRANS_FILTER_STATUS_OPTIONS menyediakan opsi filter transaksi dalam Bahasa Indonesia dengan value API asli', () => {
  assert.ok(Array.isArray(MIDTRANS_FILTER_STATUS_OPTIONS))
  assert.ok(MIDTRANS_FILTER_STATUS_OPTIONS.length >= 6)

  const pendingOption = MIDTRANS_FILTER_STATUS_OPTIONS.find(
    opt => opt.value === 'pending'
  )
  assert.ok(pendingOption, 'Opsi filter pending harus tersedia')
  assert.match(pendingOption.label, /Menunggu Pembayaran/i)

  const successOption = MIDTRANS_FILTER_STATUS_OPTIONS.find(
    opt => opt.value === 'succeeded'
  )
  assert.ok(successOption, 'Opsi filter succeeded harus tersedia')
  assert.match(successOption.label, /Berhasil/i)

  const expiredOption = MIDTRANS_FILTER_STATUS_OPTIONS.find(
    opt => opt.value === 'expired'
  )
  assert.ok(expiredOption, 'Opsi filter expired harus tersedia')
  assert.match(expiredOption.label, /Kedaluwarsa/i)

  const cancelledOption = MIDTRANS_FILTER_STATUS_OPTIONS.find(
    opt => opt.value === 'cancelled'
  )
  assert.ok(cancelledOption, 'Opsi filter cancelled harus tersedia')
  assert.match(cancelledOption.label, /Dibatalkan/i)
})

test('MidtransBillingTransactions mengimpor dan menggunakan helper mapping status terpusat', async () => {
  const fileContent = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransBillingTransactions.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan import helper
  assert.match(fileContent, /getMidtransStatusLabel/)
  assert.match(fileContent, /getMidtransStatusColor/)
  assert.match(fileContent, /@\/utils\/midtrans-status/)

  // Memastikan template memakai helper terpusat
  assert.match(
    fileContent,
    /getMidtransStatusColor\(props\.row\.payment_attempt\?\.status\)/
  )
  assert.match(
    fileContent,
    /getMidtransStatusLabel\(props\.row\.payment_attempt\?\.status\)/
  )

  // Memastikan dialog detail memakai helper terpusat
  assert.match(
    fileContent,
    /getMidtransStatusColor\(\s*store\.selectedBillingTransaction\.payment_attempt\?\.status\s*\)/
  )
  assert.match(
    fileContent,
    /getMidtransStatusLabel\(\s*store\.selectedBillingTransaction\.payment_attempt\?\.status\s*\)/
  )

  // Memastikan fungsi lokal statusColor yang terduplikasi telah dihapus
  assert.doesNotMatch(fileContent, /function statusColor\(/)
})

test('MidtransSandboxTester mengimpor dan menggunakan helper mapping status terpusat pada hasil dan riwayat simulasi', async () => {
  const fileContent = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransSandboxTester.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan import helper
  assert.match(fileContent, /getMidtransStatusLabel/)
  assert.match(fileContent, /getMidtransStatusColor/)
  assert.match(fileContent, /@\/utils\/midtrans-status/)

  // Memastikan badge hasil transaksi sandbox memakai helper
  assert.match(
    fileContent,
    /getMidtransStatusColor\(\s*store\.testPaymentResult\.transaction_status\s*\)/
  )
  assert.match(
    fileContent,
    /getMidtransStatusLabel\(\s*store\.testPaymentResult\.transaction_status\s*\)/
  )

  // Memastikan badge riwayat simulasi sandbox memakai helper
  assert.match(
    fileContent,
    /getMidtransStatusColor\(\s*props\.row\.metadata\?\.transaction_status \|\| props\.row\.status\s*\)/
  )
  assert.match(
    fileContent,
    /getMidtransStatusLabel\(\s*props\.row\.metadata\?\.transaction_status \|\| props\.row\.status\s*\)/
  )

  // Memastikan fungsi lokal statusColor yang terduplikasi telah dihapus
  assert.doesNotMatch(fileContent, /function statusColor\(/)
})

test('MidtransDashboard menampilkan metrik transaksi berhasil dalam Bahasa Indonesia', async () => {
  const fileContent = await readFile(
    new URL(
      '../src/pages/PaymentGatewayMidtrans/comp/MidtransDashboard.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(fileContent, /successful_billing_transactions[\s\S]*?berhasil/i)
  assert.doesNotMatch(
    fileContent,
    /successful_billing_transactions[\s\S]*?sukses\)/i
  )
})

test('Store paymentgatewaymidtrans mengimpor helper getMidtransStatusLabel untuk pesan notifikasi query status', async () => {
  const fileContent = await readFile(
    new URL('../src/stores/paymentgatewaymidtrans/index.js', import.meta.url),
    'utf8'
  )

  assert.match(
    fileContent,
    /import \{[^}]*getMidtransStatusLabel[^}]*\} from '@\/utils\/midtrans-status'/
  )
  assert.match(
    fileContent,
    /getMidtransStatusLabel\(\s*this\.statusQueryResult\.transaction_status\s*\)/
  )
})
