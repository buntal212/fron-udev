import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('modal Detail Pembayaran Sandbox Payment Audit responsif, memiliki max-height, header tetap, konten scroll vertikal, dan footer aksi', async () => {
  const component = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Struktur Dialog, Header, dan Close button
  assert.match(component, /<q-dialog\s+v-model="detailOpen"/)
  assert.match(component, /class="payment-detail-dialog"/)
  assert.match(component, /class="dialog-header\s+row\s+items-center/)
  assert.match(component, /<h3>Detail Pembayaran<\/h3>/)
  assert.match(component, /<q-btn[^>]*icon="close"[^>]*v-close-popup/)

  // Scrollable container yang membungkus konten
  assert.match(component, /<div\s+class="dialog-scrollable">/)
  assert.match(component, /class="dialog-body"/)

  // Footer / Tombol aksi yang tetap dapat diakses
  assert.match(component, /<q-card-actions[^>]*class="dialog-actions"/)
  assert.match(component, /<q-btn[^>]*v-close-popup[^>]*label="Tutup"/)

  // CSS max-height dan flexbox pada modal
  assert.match(
    component,
    /\.payment-detail-dialog\s*\{[^}]*max-height:\s*min\(90vh,\s*860px\)/
  )
  assert.match(component, /\.payment-detail-dialog\s*\{[^}]*display:\s*flex/)
  assert.match(
    component,
    /\.payment-detail-dialog\s*\{[^}]*flex-direction:\s*column/
  )

  // CSS header & actions flex-shrink: 0 agar tidak terdorong
  assert.match(component, /\.dialog-header\s*\{[^}]*flex-shrink:\s*0/)
  assert.match(component, /\.dialog-actions\s*\{[^}]*flex-shrink:\s*0/)

  // CSS scrollable body overflow-y: auto
  assert.match(component, /\.dialog-scrollable\s*\{[^}]*overflow-y:\s*auto/)
  assert.match(component, /\.dialog-scrollable\s*\{[^}]*min-height:\s*0/)

  // Responsif mobile
  assert.match(
    component,
    /@media\s*\(max-width:\s*599px\)\s*\{[\s\S]*\.payment-detail-dialog\s*\{[^}]*max-height:\s*92vh/
  )

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
})
