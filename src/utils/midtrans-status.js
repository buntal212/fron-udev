/**
 * Helper terpusat untuk pemetaan status pembayaran Midtrans Sandbox ke Bahasa Indonesia.
 * Digunakan secara konsisten di seluruh modul fron-udev (Dashboard, Uji Sandbox, Transaksi Billing, Detail, & Riwayat).
 */

export const MIDTRANS_STATUS_MAP = Object.freeze({
  // Sukses / Settlement
  settlement: { label: 'Berhasil', color: 'positive' },
  capture: { label: 'Berhasil', color: 'positive' },
  succeeded: { label: 'Berhasil', color: 'positive' },
  paid: { label: 'Berhasil', color: 'positive' },
  success: { label: 'Berhasil', color: 'positive' },

  // Pending / Menunggu Pembayaran
  pending: { label: 'Menunggu Pembayaran', color: 'warning' },
  initiated: { label: 'Menunggu Pembayaran', color: 'warning' },
  challenge: { label: 'Memerlukan Verifikasi', color: 'warning' },
  authorize: { label: 'Diotorisasi', color: 'warning' },

  // Expired / Kedaluwarsa
  expire: { label: 'Kedaluwarsa', color: 'negative' },
  expired: { label: 'Kedaluwarsa', color: 'negative' },

  // Cancel / Dibatalkan
  cancel: { label: 'Dibatalkan', color: 'grey-7' },
  cancelled: { label: 'Dibatalkan', color: 'grey-7' },

  // Deny / Ditolak
  deny: { label: 'Ditolak', color: 'negative' },
  denied: { label: 'Ditolak', color: 'negative' },

  // Failed / Gagal
  failed: { label: 'Gagal', color: 'negative' },
  failure: { label: 'Gagal', color: 'negative' },

  // Refund / Pengembalian Dana
  refund: { label: 'Dikembalikan', color: 'info' },
  partial_refund: { label: 'Dikembalikan Sebagian', color: 'info' }
})

/**
 * Opsi status pembayaran untuk dropdown filter transaksi Midtrans.
 */
export const MIDTRANS_FILTER_STATUS_OPTIONS = Object.freeze([
  { label: 'Semua Status', value: null },
  { label: 'Menunggu Pembayaran', value: 'pending' },
  { label: 'Berhasil', value: 'succeeded' },
  { label: 'Kedaluwarsa', value: 'expired' },
  { label: 'Dibatalkan', value: 'cancelled' },
  { label: 'Ditolak', value: 'deny' },
  { label: 'Gagal', value: 'failed' }
])

/**
 * Mengambil metadata lengkap status (label Bahasa Indonesia, warna badge, nilai asli).
 *
 * @param {string|null|undefined} status
 * @returns {{ label: string, color: string, raw: any }}
 */
export function getMidtransStatusInfo(status) {
  if (status === null || status === undefined || status === '') {
    return { label: 'Tidak Diketahui', color: 'grey-6', raw: status }
  }

  const normalized = String(status).trim().toLowerCase()
  const matched = MIDTRANS_STATUS_MAP[normalized]

  if (matched) {
    return {
      label: matched.label,
      color: matched.color,
      raw: status
    }
  }

  return {
    label: String(status),
    color: 'grey-6',
    raw: status
  }
}

/**
 * Mengambil label status dalam Bahasa Indonesia.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function getMidtransStatusLabel(status) {
  return getMidtransStatusInfo(status).label
}

/**
 * Mengambil warna Quasar badge sesuai status pembayaran.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function getMidtransStatusColor(status) {
  return getMidtransStatusInfo(status).color
}
