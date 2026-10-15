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
