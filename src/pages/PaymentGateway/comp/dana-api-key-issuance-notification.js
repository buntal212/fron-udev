const unsuccessfulIssuanceStatuses = new Set([
  'expired',
  'cancelled',
  'manual_review'
])

export function notificationForApiKeyIssuance(status, statusLabel) {
  if (unsuccessfulIssuanceStatuses.has(status)) {
    return {
      type: 'warning',
      message: `Issuance tidak berhasil: ${statusLabel}. Periksa riwayat penerbitan.`
    }
  }

  return { type: 'positive', message: 'Issuance API key diproses.' }
}
