import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('InvoiceDetailDialog tidak menggunakan URL proxy langsung pada img src tanpa autentikasi', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan fungsi helper isProxyUrl mendeteksi endpoint proxy admin Sanctum
  assert.match(dialog, /const isProxyUrl\s*=\s*url\s*=>/)
  assert.match(dialog, /\/api\/v1\/admin\/payment-attempts\//)
  assert.match(dialog, /\/qr-image/)

  // displayQrSource tidak pernah mengembalikan proxy URL langsung ke tag img
  assert.match(dialog, /const displayQrSource\s*=\s*computed\(/)
  assert.match(
    dialog,
    /if\s*\(proxyBlobUrl\.value\)\s*\{\s*return proxyBlobUrl\.value\s*\}/
  )
  assert.match(dialog, /!isProxyUrl\(rawMidtransQrUrl\.value\)/)

  // rawMidtransQrUrl memfilter URL proxy agar simulator hanya menyalin URL resmi Midtrans
  assert.match(dialog, /const rawMidtransQrUrl\s*=\s*computed\(/)
  assert.match(dialog, /return url && !isProxyUrl\(url\)\s*\?\s*url\s*:\s*null/)
})

test('Proxy QR diambil melalui Axios terautentikasi dengan responseType blob dan ditampilkan memakai URL.createObjectURL', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  // Service menggunakan Axios instance terautentikasi dengan responseType: blob
  assert.match(service, /qrImageBlob:\s*idOrUrl\s*=>/)
  assert.match(service, /responseType:\s*'blob'/)
  assert.match(service, /headers:\s*\{\s*'Cache-Control':\s*'no-store'/)

  // Store mengonversi blob menjadi Object URL
  assert.match(store, /async\s+fetchProxyQrBlob\(/)
  assert.match(store, /paymentAttemptService\.qrImageBlob/)
  assert.match(store, /window\.URL\.createObjectURL\(response\.data\)/)

  // Dialog memanggil store.fetchProxyQrBlob dan menyimpan ke proxyBlobUrl
  assert.match(dialog, /const loadProxyQrBlob\s*=\s*async\s*\(\)\s*=>/)
  assert.match(dialog, /store\.fetchProxyQrBlob/)
  assert.match(dialog, /proxyBlobUrl\.value\s*=\s*blobUrl/)
})

test('InvoiceDetailDialog menerapkan hierarki fallback: Proxy Blob -> QR Resmi -> Payload EMVCo lokal', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // displayQrSource mengutamakan proxy blob, lalu QR resmi (non-proxy), lalu canvas EMVCo lokal
  assert.match(
    dialog,
    /if\s*\(proxyBlobUrl\.value\)\s*\{\s*return proxyBlobUrl\.value\s*\}/
  )
  assert.match(
    dialog,
    /if\s*\(\s*rawMidtransQrUrl\.value\s*&&\s*!qrImageLoadFailed\.value\s*&&\s*!isProxyUrl\(rawMidtransQrUrl\.value\)\s*\)/
  )
  assert.match(
    dialog,
    /if\s*\(store\.checkoutQrDataUrl\)\s*\{\s*return store\.checkoutQrDataUrl\s*\}/
  )

  // handleQrImageError memicu fetch proxy terlebih dahulu, lalu fallback ke render canvas EMVCo lokal
  assert.match(dialog, /const handleQrImageError\s*=\s*async\s*\(\)\s*=>/)
  assert.match(dialog, /qrImageLoadFailed\.value\s*=\s*true/)
  assert.match(dialog, /await loadProxyQrBlob\(\)/)
  assert.match(dialog, /await store\.renderQr\(emvcoPayload\.value\)/)

  // Payload EMVCo tersedia untuk salin payload
  assert.match(dialog, /const emvcoPayload\s*=\s*computed\(/)
  assert.match(dialog, /copyPayload\(\s*emvcoPayload/)
})

test('InvoiceDetailDialog dan store membersihkan Object URL saat ganti attempt, dialog ditutup, unmount, dan kedaluwarsa', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // Helper cleanup di dialog memanggil revokeObjectURL
  assert.match(dialog, /const cleanupProxyBlobUrl\s*=\s*\(\)\s*=>/)
  assert.match(dialog, /revokeObjectURL\(proxyBlobUrl\.value\)/)
  assert.match(dialog, /proxyBlobUrl\.value\s*=\s*null/)

  // Cleanup dijalankan pada sebelum dialog ditutup (@before-hide)
  assert.match(dialog, /@before-hide="onDialogClose"/)
  assert.match(dialog, /const onDialogClose\s*=\s*\(\)\s*=>/)
  assert.match(dialog, /cleanupProxyBlobUrl\(\)/)
  assert.match(dialog, /store\.closeDetailDialog\(\)/)

  // Cleanup dijalankan pada unmount
  assert.match(
    dialog,
    /onBeforeUnmount\(\(\)\s*=>\s*\{[\s\S]*cleanupProxyBlobUrl\(\)[\s\S]*store\.stopCheckoutSession\(\)/
  )

  // Store juga membersihkan checkoutQrBlobUrl saat stopCheckoutSession dan fetchProxyQrBlob baru
  assert.match(store, /window\.URL\.revokeObjectURL\(this\.checkoutQrBlobUrl\)/)
})

test('InvoiceDetailDialog menangani kedaluwarsa QRIS Midtrans dengan aman', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // Status expired menyembunyikan QR (displayQrSource mengembalikan null)
  assert.match(dialog, /if\s*\(isCheckoutExpired\.value\)\s*return null/)

  // Watcher expiry membersihkan object URL
  assert.match(dialog, /watch\(\s*\(\)\s*=>\s*isCheckoutExpired\.value/)
  assert.match(dialog, /if\s*\(expired\)\s*\{\s*cleanupProxyBlobUrl\(\)/)

  // Store menangani respons HTTP 410 dari proxy admin
  assert.match(store, /err\?\.response\?\.status\s*===\s*410/)
  assert.match(store, /this\.checkoutIsExpired\s*=\s*true/)

  // Tampilan kedaluwarsa muncul dan unduh QR dinonaktifkan
  assert.match(dialog, /v-if="isCheckoutExpired"/)
  assert.match(dialog, /Kode QRIS Telah Kedaluwarsa/)
  assert.match(dialog, /!isCheckoutExpired\.value/)
})

test('Regression: Proxy terautentikasi menjadi sumber utama tanpa terblokir oleh keberadaan rawMidtransQrUrl', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Watcher tidak lagi mensyaratkan !rawMidtransQrUrl untuk memuat proxy blob
  assert.doesNotMatch(dialog, /!rawMidtransQrUrl\.value\s*&&/)
  assert.match(
    dialog,
    /currentAttemptMethod\.value === 'qris'[\s\S]*\(proxyQrUrl\.value \|\| latestAttempt\.value\?\.id\)[\s\S]*await loadProxyQrBlob\(\)/
  )
})

test('Regression: Watcher mencegah reset src dan pencabutan prematur object URL saat attempt ID tidak berubah', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Pelacakan currentAttemptId dan perbandingan attemptChanged
  assert.match(dialog, /const currentAttemptId\s*=\s*ref\(null\)/)
  assert.match(
    dialog,
    /const attemptChanged\s*=\s*attemptId\s*!==\s*currentAttemptId\.value/
  )
  assert.match(
    dialog,
    /if\s*\(attemptChanged\)\s*\{\s*currentAttemptId\.value\s*=\s*attemptId[\s\S]*cleanupProxyBlobUrl\(\)/
  )

  // Img tag memiliki handler @load untuk konfirmasi gambar berhasil tampil
  assert.match(dialog, /@load="onQrImageLoad"/)
  assert.match(dialog, /const onQrImageLoad\s*=\s*\(\)\s*=>/)
})

test('Regression: Service udev-billing dan store invoice memvalidasi response blob bukan JSON error', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // Service menyertakan Accept image untuk mencegah respons proxy diperlakukan sebagai JSON
  assert.match(service, /Accept:\s*'image\/png,\s*image\/\*'/)

  // Store memeriksa bahwa blob bukan bertipe application/json
  assert.match(store, /data\.type\s*===\s*'application\/json'/)

  // Store menangani jika respons berupa ArrayBuffer/binary dan mengonversi ke image/png Blob
  assert.match(store, /new Blob\(\[data\],\s*\{\s*type:\s*'image\/png'\s*\}\)/)
})
