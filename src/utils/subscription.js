const TIME_ZONE = 'Asia/Jakarta'
const EXPIRING_SOON_DAYS = 7

export const formatSubscriptionDate = value => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: TIME_ZONE
  }).format(new Date(value))
}

export const formatSubscriptionPrice = (price, currency = 'IDR') => {
  const amount = Number(price)

  if (!Number.isFinite(amount)) return '—'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency || 'IDR',
    maximumFractionDigits: 2
  }).format(amount)
}

export const getPeriodStatus = (expiresAt, now = new Date()) => {
  const expiry = new Date(expiresAt)

  if (!expiresAt || Number.isNaN(expiry.getTime())) {
    return { label: 'Tidak diketahui', color: 'grey-7' }
  }

  const remaining = expiry.getTime() - now.getTime()

  if (remaining <= 0) return { label: 'Kedaluwarsa', color: 'negative' }
  if (remaining <= EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000) {
    return { label: 'Akan berakhir', color: 'warning' }
  }

  return { label: 'Aktif', color: 'positive' }
}

export const getDatabaseStatus = status => {
  const statuses = {
    active: { label: 'Aktif', color: 'positive' },
    expired: { label: 'Kedaluwarsa', color: 'negative' },
    cancelled: { label: 'Dibatalkan', color: 'grey-7' }
  }

  return statuses[status] || { label: 'Tidak diketahui', color: 'grey-7' }
}

export const getInvoiceStatus = status => {
  const statuses = {
    pending: { label: 'Menunggu pembayaran', color: 'warning' },
    paid: { label: 'Lunas', color: 'positive' },
    expired: { label: 'Kedaluwarsa', color: 'negative' },
    cancelled: { label: 'Dibatalkan', color: 'grey-7' }
  }

  return statuses[status] || { label: 'Tidak diketahui', color: 'grey-7' }
}

export const getPaymentAttemptStatus = status => {
  const statuses = {
    initiated: { label: 'Dimulai', color: 'info' },
    pending: { label: 'Menunggu pembayaran', color: 'warning' },
    succeeded: { label: 'Berhasil', color: 'positive' },
    failed: { label: 'Gagal', color: 'negative' },
    expired: { label: 'Kedaluwarsa', color: 'negative' },
    cancelled: { label: 'Dibatalkan', color: 'grey-7' }
  }

  return statuses[status] || { label: 'Tidak diketahui', color: 'grey-7' }
}

export const getReconciliationStatus = status => {
  const statuses = {
    processing: { label: 'Sedang disinkronkan', color: 'info' },
    pending: { label: 'Menunggu sinkronisasi', color: 'warning' },
    retryable: { label: 'Akan dicoba lagi', color: 'warning' },
    paid: { label: 'Terverifikasi dan lunas', color: 'positive' },
    terminal: { label: 'Gateway selesai', color: 'grey-7' },
    failed: { label: 'Sinkronisasi gagal', color: 'negative' },
    skipped: { label: 'Tidak perlu disinkronkan', color: 'grey-7' }
  }

  return statuses[status] || { label: 'Belum disinkronkan', color: 'grey-7' }
}

export const getRetryAfterMilliseconds = error => {
  const header = error?.response?.headers?.['retry-after']
  const retryAfter =
    header ??
    (typeof error?.response?.headers?.get === 'function'
      ? error.response.headers.get('retry-after')
      : null)

  if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
    return Math.max(0, Math.ceil(retryAfter * 1000))
  }

  if (typeof retryAfter !== 'string' || !retryAfter.trim()) return 0

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds * 1000))

  const retryAt = Date.parse(retryAfter)
  return Number.isNaN(retryAt) ? 0 : Math.max(0, retryAt - Date.now())
}

export const formatRetryAfter = milliseconds => {
  const seconds = Math.max(1, Math.ceil(milliseconds / 1000))
  return seconds < 60 ? `${seconds} detik` : `${Math.ceil(seconds / 60)} menit`
}
