import { Notify } from 'quasar'

const notificationWindow = 1500
let lastNotification = { message: '', shownAt: 0 }

const messages = {
  connection: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
  forbidden: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
  notFound: 'Data yang Anda cari tidak ditemukan.',
  rateLimited:
    'Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba kembali.',
  server: 'Layanan sedang mengalami gangguan. Silakan coba kembali.',
  sessionExpired: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
  validation: 'Data yang dikirim belum valid. Periksa kembali isian Anda.',
  fallback: 'Permintaan tidak dapat diproses. Silakan coba kembali.'
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function getApiErrorMessage(error, fallback = messages.fallback) {
  if (!error?.response) return messages.connection

  switch (error.response.status) {
    case 401:
      return messages.sessionExpired
    case 403:
      return messages.forbidden
    case 404:
      return messages.notFound
    case 422:
      return error.response.data?.message || messages.validation
    case 429:
      return messages.rateLimited
    default:
      return error.response.status >= 500 ? messages.server : fallback
  }
}

export function getApiValidationErrors(error) {
  const errors = error?.response?.data?.errors

  if (!isRecord(errors)) return {}

  return Object.fromEntries(
    Object.entries(errors).filter(
      ([, value]) =>
        Array.isArray(value) &&
        value.every(message => typeof message === 'string')
    )
  )
}

export function notifyApiError(error) {
  const message = getApiErrorMessage(error)
  const shownAt = Date.now()

  if (
    lastNotification.message === message &&
    shownAt - lastNotification.shownAt < notificationWindow
  ) {
    return
  }

  lastNotification = { message, shownAt }
  Notify.create({
    message,
    color: 'negative',
    textColor: 'white',
    icon: 'error_outline',
    position: 'top',
    timeout: 5000
  })
}

export const apiErrorMessages = messages
