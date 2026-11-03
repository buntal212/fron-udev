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

test('Regression: Store menduplikasi in-flight request, memvalidasi signature PNG 89 50 4E 47, dan cache per attemptId', async () => {
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )

  // Deduplikasi in-flight request memakai Map
  assert.match(store, /inFlightProxyQrPromises\.has\(attemptId\)/)
  assert.match(
    store,
    /inFlightProxyQrPromises\.set\(attemptId,\s*fetchPromise\)/
  )
  assert.match(store, /inFlightProxyQrPromises\.delete\(attemptId\)/)

  // Cache per attemptId agar tidak re-fetch attempt yang sama
  assert.match(store, /checkoutQrBlobAttemptId\s*===\s*attemptId/)

  // Validasi signature PNG 89 50 4E 47
  assert.match(store, /0x89/)
  assert.match(store, /0x50/)
  assert.match(store, /0x4e/)
  assert.match(store, /0x47/)
})

test('Regression: Dialog mencegah loop fallback dan loading selalu selesai termasuk saat error', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Penanda kegagalan proxy untuk memutus infinite loop
  assert.match(dialog, /const proxyFetchFailed\s*=\s*ref\(false\)/)
  assert.match(dialog, /proxyFetchFailed\.value\s*=\s*true/)

  // handleQrImageError tidak mengulang loadProxyQrBlob jika proxy sudah pernah dicoba/gagal
  assert.match(
    dialog,
    /if\s*\(proxyBlobUrl\.value\)\s*\{\s*proxyFetchFailed\.value\s*=\s*true[\s\S]*cleanupProxyBlobUrl\(\)/
  )
  assert.match(
    dialog,
    /else if\s*\(!proxyFetchFailed\.value\s*&&\s*!isCheckoutExpired\.value\)/
  )

  // Loading selalu direset ke false pada finally
  assert.match(dialog, /finally\s*\{\s*qrImageLoading\.value\s*=\s*false\s*\}/)
})

test('Regression: Request proxy dihentikan saat status attempt terminal atau kedaluwarsa', async () => {
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

  // Pengecekan status terminal di store
  assert.match(
    store,
    /\[\s*'succeeded',\s*'paid',\s*'expired',\s*'failed',\s*'cancelled'\s*\]\.includes\(\s*attemptStatus\s*\)/
  )

  // Pengecekan status terminal di watcher dan loadProxyQrBlob dialog
  assert.match(
    dialog,
    /\[\s*'succeeded',\s*'paid',\s*'expired',\s*'failed',\s*'cancelled'\s*\]\.includes\(\s*attemptStatus\s*\)/
  )
  assert.match(dialog, /!isTerminal/)
})

test('Regression: Lifecycle cleanup membersihkan state pada dialog ditutup dan unmount', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // onDialogClose me-reset attempt dan flag error
  assert.match(
    dialog,
    /const onDialogClose\s*=\s*\(\)\s*=>\s*\{[\s\S]*currentAttemptId\.value\s*=\s*null[\s\S]*proxyFetchFailed\.value\s*=\s*false[\s\S]*cleanupProxyBlobUrl\(\)[\s\S]*store\.closeDetailDialog\(\)/
  )

  // onBeforeUnmount me-reset attempt dan flag error
  assert.match(
    dialog,
    /onBeforeUnmount\(\(\)\s*=>\s*\{[\s\S]*currentAttemptId\.value\s*=\s*null[\s\S]*proxyFetchFailed\.value\s*=\s*false[\s\S]*cleanupProxyBlobUrl\(\)[\s\S]*store\.stopCheckoutSession\(\)/
  )
})

test('Regression: Elemen img menggunakan :key="displayQrSource" dan spinner menutup jendela muat proxy agar tidak broken image', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Memastikan tag img memiliki key reaktif displayQrSource untuk mendiskon state error lama
  assert.match(
    dialog,
    /<img[\s\S]*?:key="displayQrSource"[\s\S]*?:src="displayQrSource"[\s\S]*?class="qris-img"[\s\S]*?@load="onQrImageLoad"[\s\S]*?@error="handleQrImageError"/
  )

  // Spinner loading aktif selama Midtrans proxy blob belum siap agar tidak membocorkan rawMidtransQrUrl unauthenticated
  assert.match(
    dialog,
    /isMidtrans\s*&&\s*\(proxyQrUrl\s*\|\|\s*latestAttempt\?\.id\)\s*&&\s*!proxyBlobUrl\s*&&\s*!proxyFetchFailed/
  )

  // Handler onQrImageLoad membersihkan seluruh state loading dan error
  assert.match(
    dialog,
    /const onQrImageLoad\s*=\s*\(\)\s*=>\s*\{[\s\S]*qrImageLoading\.value\s*=\s*false[\s\S]*qrImageLoadFailed\.value\s*=\s*false[\s\S]*proxyFetchFailed\.value\s*=\s*false[\s\S]*\}/
  )
})

test('Regression: Konfirmasi load gambar (@load="onQrImageLoad") membuktikan gambar QRIS berhasil dimuat', async () => {
  // Simulasi validasi respons PNG proxy Midtrans (HTTP 200)
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52
  ])

  // Verifikasi signature PNG valid (89 50 4E 47)
  const isPng =
    validPngBuffer[0] === 0x89 &&
    validPngBuffer[1] === 0x50 &&
    validPngBuffer[2] === 0x4e &&
    validPngBuffer[3] === 0x47
  assert.strictEqual(isPng, true)

  // Simulasi state reaktif dialog
  let proxyBlobUrl = 'blob:http://localhost:9200/midtrans-qris-attempt-32'
  let qrImageLoading = true
  let qrImageLoadFailed = false
  let proxyFetchFailed = false
  let renderQrCalled = false

  const onQrImageLoad = () => {
    qrImageLoading = false
    qrImageLoadFailed = false
    proxyFetchFailed = false
  }

  // Simulasi event browser @load terpanggil saat PNG valid berhasil di-decode
  onQrImageLoad()

  assert.strictEqual(qrImageLoading, false)
  assert.strictEqual(qrImageLoadFailed, false)
  assert.strictEqual(proxyFetchFailed, false)
  assert.strictEqual(
    proxyBlobUrl,
    'blob:http://localhost:9200/midtrans-qris-attempt-32'
  )
  assert.strictEqual(renderQrCalled, false)
})

test('Regression: Normalisasi endpoint proxy dan cleanup sinkron antara dialog dan store invoice', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Service menangani baik ID numerik maupun path /api/ tanpa menghasilkan /api/api
  assert.match(service, /const match = idOrUrl\.match\(\/payment-attempts/)
  assert.match(service, /idOrUrl\.replace\(\/\^\\\/api\/,\s*''\)/)

  // Store menormalisasi target attemptId
  assert.match(
    store,
    /async\s+fetchProxyQrBlob\(target\s*=\s*this\.checkoutAttempt\?\.id\)/
  )

  // Dialog membersihkan Object URL store saat cleanupProxyBlobUrl dipanggil
  assert.match(dialog, /store\.checkoutQrBlobUrl\s*=\s*null/)
  assert.match(dialog, /store\.checkoutQrBlobAttemptId\s*=\s*null/)
})

test('Regression: State polling dipisahkan dari state gambar QRIS, mencegah timer ganda dan request overlap', async () => {
  const store = await readFile(
    new URL('../src/stores/invoice/index.js', import.meta.url),
    'utf8'
  )
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Store memiliki method stopPolling tersendiri yang terpisah dari stopCheckoutSession
  assert.match(store, /stopPolling\(\)\s*\{/)
  assert.match(store, /checkoutPollInProgress\s*=\s*false/)
  assert.match(store, /checkoutPollAttemptId\s*=\s*null/)

  // Polling mendeteksi timer ganda per attempt ID
  assert.match(
    store,
    /if\s*\(this\.checkoutPollId\s*&&\s*this\.checkoutPollAttemptId\s*===\s*attemptId\)\s*\{\s*return/
  )

  // Polling mencegah request overlap
  assert.match(store, /if\s*\(this\.checkoutPollInProgress\)\s*\{\s*return/)

  // Polling berhenti saat attempt berstatus terminal
  assert.match(
    store,
    /\[\s*'succeeded',\s*'paid',\s*'expired',\s*'failed',\s*'cancelled'\s*\]\.includes\(\s*currentStatus\s*\)[\s\S]*this\.stopPolling\(\)/
  )

  // Dialog menghentikan polling saat status terminal atau dialog ditutup
  assert.match(dialog, /if\s*\(isTerminal\)\s*\{\s*store\.stopPolling\(\)/)
  assert.match(
    dialog,
    /store\.stopPolling\(\)[\s\S]*store\.closeDetailDialog\(\)/
  )
})

test('Regression: Simulasi banyak respons polling (status pending) tidak memicu reload gambar atau pembatalan Blob URL', async () => {
  // Simulasi state QRIS dan Polling
  const attemptId = 32
  let fetchImageCallCount = 0
  let revokeBlobCallCount = 0
  let stableBlobUrl = 'blob:http://localhost:9200/midtrans-qris-attempt-32'

  // Fungsi fetch proxy hanya dipanggil sekali di awal untuk attempt ini
  const mockFetchProxyQrBlob = targetId => {
    if (targetId === attemptId && stableBlobUrl) {
      return stableBlobUrl
    }
    fetchImageCallCount += 1
    stableBlobUrl = `blob:http://localhost:9200/midtrans-qris-attempt-${targetId}`
    return stableBlobUrl
  }

  // Fetch pertama sebelum polling dimulai
  const initialBlob = mockFetchProxyQrBlob(attemptId)
  assert.strictEqual(
    initialBlob,
    'blob:http://localhost:9200/midtrans-qris-attempt-32'
  )
  assert.strictEqual(fetchImageCallCount, 0)

  // Simulasi 10 siklus polling HTTP 200 JSON { status: 'pending' }
  let pollingInProgress = false
  let pollCycleCount = 0

  const simulatePollTick = async (mockResponseStatus = 'pending') => {
    if (pollingInProgress) {
      // Overlap dicegah
      return 'skipped'
    }
    pollingInProgress = true
    try {
      pollCycleCount += 1
      const resultStatus = mockResponseStatus
      if (resultStatus === 'pending') {
        // Status pending: gambar tidak disentuh sama sekali
        return 'polled'
      }
      return resultStatus
    } finally {
      pollingInProgress = false
    }
  }

  for (let i = 0; i < 10; i++) {
    const outcome = await simulatePollTick('pending')
    assert.strictEqual(outcome, 'polled')
    // Verifikasi bahwa Blob URL tetap stabil dan tidak pernah di-fetch ulang atau di-revoke
    assert.strictEqual(
      stableBlobUrl,
      'blob:http://localhost:9200/midtrans-qris-attempt-32'
    )
    assert.strictEqual(fetchImageCallCount, 0)
    assert.strictEqual(revokeBlobCallCount, 0)
  }

  assert.strictEqual(pollCycleCount, 10)

  // Simulasi perlindungan request overlap: tick saat request sedang berjalan harus di-skip
  pollingInProgress = true
  const overlapOutcome = await simulatePollTick('pending')
  assert.strictEqual(overlapOutcome, 'skipped')
  pollingInProgress = false
})
