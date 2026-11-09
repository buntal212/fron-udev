import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Detail Pembayaran Sandbox Payment Audit responsif tanpa QDialog, menggunakan panel expandable dengan overview dan instruksi checkout lengkap', async () => {
  const component = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Verifikasi tidak ada QDialog (modal overlay dihapus)
  assert.doesNotMatch(component, /<q-dialog/)

  // Struktur QExpansionItem dan Panel Audit Inline
  assert.match(component, /<q-expansion-item/)
  assert.match(component, /class="[^"]*payment-detail-audit/)
  assert.match(component, /class="[^"]*payment-overview/)
  assert.match(component, /class="[^"]*audit-meta-grid/)

  // Bagian Checkout & Instruksi Pembayaran
  assert.match(component, /label="Buka Checkout Sandbox"/)
  assert.match(component, /qrisPayload/)
  assert.match(component, /class="qris-image"/)
  assert.match(component, /alt="QRIS DANA Sandbox yang dibuat lokal"/)
  assert.match(component, /label="Unduh QRIS"/)
  assert.match(component, /Teks payload QRIS \(cadangan\)/)
  assert.match(component, /Data checkout belum tersedia pada transaksi ini/)
  assert.match(component, /import QRCode from 'qrcode'/)
})

test('komponen modal Detail Pembayaran memvalidasi QRIS EMVCo TLV & CRC, menangani error gambar, serta hanya merender teks untuk Custom Checkout non-MPM', async () => {
  const component = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  // 1. Validasi TLV dan CRC menggunakan utilitas emvco-qris
  assert.match(
    component,
    /import\s*\{\s*validateEmvcoQris\s*\}\s*from\s*['"]@\/utils\/emvco-qris['"]/
  )
  assert.match(component, /const\s+qrisValidation\s*=\s*computed\(/)
  assert.match(component, /validateEmvcoQris\(/)

  // 2. Tidak hanya memeriksa prefix 000201: hanya tipe qris_mpm dengan payload valid yang diizinkan
  assert.match(component, /instruction\?\.type\s*!==\s*['"]qris_mpm['"]/)

  // 3. Penanganan error rendering gambar di browser
  assert.match(component, /@error="handleQrisImageError"/)
  assert.match(component, /function\s+handleQrisImageError\(\)/)

  // 4. Tombol Unduh QRIS hanya aktif jika PNG valid
  assert.match(
    component,
    /:disable="!qrisDataUrl\s*\|\|\s*!isPngDataUrl\(qrisDataUrl\)"/
  )

  // 5. Kasus payload tidak valid EMVCo menampilkan pesan error informatif
  assert.match(component, /Payload QRIS tidak valid sesuai standar EMVCo\./)

  // 6. Custom Checkout non-MPM atau Virtual Account dirender sebagai teks tanpa gambar QRIS
  assert.match(
    component,
    /v-else-if="detail\.payment_instruction\.payment_code"/
  )
  assert.match(component, /class="payment-code/)
  assert.match(component, /copyPaymentCode/)
})
