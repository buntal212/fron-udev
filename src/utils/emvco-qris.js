/**
 * Checksum CRC-16/CCITT-FALSE (Polynomial 0x1021, Init 0xFFFF).
 * Digunakan oleh spesifikasi EMVCo MPM & QRIS Bank Indonesia (ASPI).
 *
 * @param {string} str
 * @returns {string} 4-karakter hex uppercase (contoh: '6D16')
 */
export function computeCrc16Ccitt(str) {
  if (typeof str !== 'string') return ''
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Melakukan parsing data TLV (Tag-Length-Value) EMVCo secara berurutan.
 *
 * @param {string} payload
 * @returns {{ valid: boolean, error?: string, tlvs?: Array<{ tag: string, length: number, value: string }> }}
 */
export function parseEmvcoTlv(payload) {
  if (typeof payload !== 'string' || payload.trim() === '') {
    return { valid: false, error: 'Payload QRIS kosong atau bukan teks.' }
  }

  const clean = payload.trim()
  if (clean.length < 14) {
    return { valid: false, error: 'Panjang payload QRIS terlalu pendek.' }
  }

  if (!clean.startsWith('000201')) {
    return {
      valid: false,
      error: 'Payload tidak diawali Tag 00 format EMVCo (000201).'
    }
  }

  let offset = 0
  const tlvs = []

  while (offset < clean.length) {
    if (offset + 4 > clean.length) {
      return { valid: false, error: 'Struktur header TLV terpotong.' }
    }

    const tag = clean.slice(offset, offset + 2)
    const lenStr = clean.slice(offset + 2, offset + 4)

    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      return {
        valid: false,
        error: `Format tag atau panjang tidak valid pada offset ${offset}.`
      }
    }

    const len = parseInt(lenStr, 10)
    if (offset + 4 + len > clean.length) {
      return {
        valid: false,
        error: `Value untuk tag ${tag} terpotong (ekspektasi ${len} karakter).`
      }
    }

    const value = clean.slice(offset + 4, offset + 4 + len)
    tlvs.push({ tag, length: len, value })
    offset += 4 + len
  }

  if (offset !== clean.length) {
    return { valid: false, error: 'Terdapat sisa data di luar struktur TLV.' }
  }

  return { valid: true, tlvs }
}

/**
 * Memvalidasi kepatuhan payload terhadap standar EMVCo MPM & QRIS (termasuk TLV dan CRC).
 *
 * @param {string} payload
 * @returns {{ valid: boolean, error?: string, tlvs?: Array<{ tag: string, length: number, value: string }> }}
 */
export function validateEmvcoQris(payload) {
  const parsed = parseEmvcoTlv(payload)
  if (!parsed.valid) {
    return parsed
  }

  const { tlvs } = parsed
  const clean = payload.trim()

  // 1. Tag pertama harus Tag 00 dengan nilai '01'
  if (tlvs[0].tag !== '00' || tlvs[0].value !== '01') {
    return {
      valid: false,
      error: 'Tag 00 (Payload Format Indicator) harus bernilai "01".'
    }
  }

  // 2. Tag terakhir harus Tag 63 (CRC) dengan panjang 4
  const lastTlv = tlvs[tlvs.length - 1]
  if (lastTlv.tag !== '63' || lastTlv.length !== 4) {
    return {
      valid: false,
      error: 'Tag terakhir harus merupakan CRC (Tag 63 dengan panjang 04).'
    }
  }

  if (!/^[0-9A-Fa-f]{4}$/.test(lastTlv.value)) {
    return {
      valid: false,
      error: 'Nilai CRC pada Tag 63 harus berupa 4 karakter heksadesimal.'
    }
  }

  // Tag 63 tidak boleh muncul di posisi selain terakhir
  for (let i = 0; i < tlvs.length - 1; i++) {
    if (tlvs[i].tag === '63') {
      return {
        valid: false,
        error: 'Tag 63 (CRC) tidak boleh muncul sebelum akhir payload.'
      }
    }
  }

  // 3. Validasi Checksum CRC-16/CCITT
  // Dihitung dari karakter pertama hingga tag dan panjang "6304" (tanpa 4 karakter nilai CRC itu sendiri)
  const dataToCrc = clean.slice(0, -4)
  const calculatedCrc = computeCrc16Ccitt(dataToCrc)
  const actualCrc = lastTlv.value.toUpperCase()

  if (calculatedCrc !== actualCrc) {
    return {
      valid: false,
      error: `Checksum CRC tidak cocok (dihitung: ${calculatedCrc}, tertulis: ${actualCrc}).`
    }
  }

  // 4. Memastikan keberadaan Merchant Account Information (Tag 26 s/d 51)
  const hasMerchantAccount = tlvs.some(item => {
    const tagNum = parseInt(item.tag, 10)
    return tagNum >= 26 && tagNum <= 51
  })
  if (!hasMerchantAccount) {
    return {
      valid: false,
      error:
        'Payload QRIS harus memuat minimal satu Merchant Account Information (Tag 26-51).'
    }
  }

  return { valid: true, tlvs }
}

/**
 * Helper boolean untuk memeriksa apakah payload merupakan QRIS EMVCo valid.
 *
 * @param {any} payload
 * @returns {boolean}
 */
export function isValidEmvcoQris(payload) {
  if (typeof payload !== 'string') return false
  return validateEmvcoQris(payload).valid
}
