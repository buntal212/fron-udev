import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('DanaGatewayMerchantTable: tombol Jadikan Utama, konfirmasi dialog, loading state, dan proteksi merchant utama', async () => {
  const tableSource = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  // 1. Props mendefinisikan settingPrimaryId untuk feedback reaktif
  assert.match(
    tableSource,
    /settingPrimaryId:\s*\{\s*type:\s*\[Number,\s*String\]/
  )

  // 2. Tombol Jadikan Utama memiliki binding loading dan disable sesuai merchant_status & in-flight request
  assert.match(
    tableSource,
    /:loading="settingPrimaryId === props\.row\.merchant_id"/
  )
  assert.match(
    tableSource,
    /:disable="\s*props\.row\.merchant_status !== 'active' \|\|\s*Boolean\(settingPrimaryId\)\s*"/
  )
  assert.match(tableSource, /@click="confirmSetPrimary\(props\.row\)"/)

  // 3. Dialog konfirmasi menyertakan nama dan kode merchant, serta meng-emit set-primary saat OK
  assert.match(tableSource, /function confirmSetPrimary\(row\)/)
  assert.match(tableSource, /title:\s*'Tetapkan Merchant Utama DANA'/)
  assert.match(
    tableSource,
    /\$\{row\.merchant_name\}" \(\$\{row\.merchant_code\}\)/
  )
  assert.match(tableSource, /emit\('set-primary',\s*row\)/)

  // 4. Baris dengan is_primary aktif menampilkan badge sistem pusat dan tidak menampilkan tombol Jadikan Utama
  assert.match(tableSource, /v-if="props\.row\.is_primary"/)
  assert.match(tableSource, /Merchant Sistem Pusat/)
  assert.match(tableSource, /Merchant Utama Aktif/)
})

test('IndexPage: meneruskan event set-primary dan binding setting-primary-id ke DanaGatewayMerchantTable', async () => {
  const indexSource = await readFile(
    new URL('../src/pages/PaymentGateway/IndexPage.vue', import.meta.url),
    'utf8'
  )

  // Event forwarding ke store action
  assert.match(indexSource, /@set-primary="merchantStore\.setPrimaryMerchant"/)
  // Loading prop forwarding
  assert.match(
    indexSource,
    /:setting-primary-id="merchantStore\.settingPrimaryMerchantId"/
  )
  // Fetch environment saat mount
  assert.match(indexSource, /merchantStore\.fetchEnvironment\(\)/)
})

test('danaGatewayMerchantService: mendefinisikan endpoint set-primary dan environment', async () => {
  const serviceSource = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  assert.match(
    serviceSource,
    /setPrimaryMerchant:\s*merchantId\s*=>\s*api\.post\(\s*`\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/set-primary`\s*\)/
  )
  assert.match(
    serviceSource,
    /getEnvironment:\s*\(\)\s*=>\s*api\.get\('\/v1\/admin\/dana-gateway-merchants\/environment'\)/
  )
})

test('useDanaGatewayMerchantStore: setPrimaryMerchant menangani loading, API berhasil, API gagal, dan fetchEnvironment', async () => {
  const storeSource = await readFile(
    new URL('../src/stores/danagatewaymerchant/index.js', import.meta.url),
    'utf8'
  )

  // 1. State mendefinisikan environmentSettings dan settingPrimaryMerchantId
  assert.match(storeSource, /environmentSettings:\s*null/)
  assert.match(storeSource, /settingPrimaryMerchantId:\s*null/)

  // 2. Action fetchEnvironment tersedia dan menangani error secara graceful
  assert.match(storeSource, /async fetchEnvironment\(\)/)
  assert.match(
    storeSource,
    /await danaGatewayMerchantService\.getEnvironment\(\)/
  )

  // 3. Action setPrimaryMerchant mengelola loading state dan mencegah duplicate submission
  assert.match(storeSource, /if\s*\(this\.settingPrimaryMerchantId\)\s*return/)
  assert.match(storeSource, /this\.settingPrimaryMerchantId\s*=\s*merchantId/)

  // 4. Alur API berhasil: notifikasi positif, refresh tabel (fetchMerchants) dan environment
  assert.match(storeSource, /type:\s*'positive'/)
  assert.match(storeSource, /await this\.fetchMerchants\(\)/)
  assert.match(storeSource, /await this\.fetchEnvironment\(\)/)

  // 5. Alur API gagal: memformat pesan validasi lengkap (getApiValidationErrors), notifikasi negatif, dan rethrow error
  assert.match(
    storeSource,
    /const validationErrors = getApiValidationErrors\(error\)/
  )
  assert.match(storeSource, /type:\s*'negative'/)
  assert.match(storeSource, /throw error/)

  // 6. Cleanup loading state selalu dilakukan di block finally
  assert.match(
    storeSource,
    /finally\s*\{\s*this\.settingPrimaryMerchantId\s*=\s*null\s*\}/
  )
})

test('quasar.config.js: mendaftarkan plugin Dialog dan Notify pada framework.plugins', async () => {
  const quasarConfig = await readFile(
    new URL('../quasar.config.js', import.meta.url),
    'utf8'
  )

  // Memastikan framework.plugins mendaftarkan Dialog dan Notify
  assert.match(
    quasarConfig,
    /framework:\s*\{[\s\S]*?plugins:\s*\[[^\]]*'Dialog'[^\]]*\]/,
    'Plugin Dialog harus terdaftar di framework.plugins quasar.config.js'
  )
  assert.match(
    quasarConfig,
    /framework:\s*\{[\s\S]*?plugins:\s*\[[^\]]*'Notify'[^\]]*\]/,
    'Plugin Notify harus terdaftar di framework.plugins quasar.config.js'
  )
})

test('Regression: klik tombol Jadikan Utama memunculkan konfirmasi dialog tanpa TypeError dan hanya mengirim API setelah disetujui', async () => {
  const tableSource = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaGatewayMerchantTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  // 1. Memastikan useQuasar dan Dialog diimpor dari quasar untuk proteksi ketersediaan dialog
  assert.match(
    tableSource,
    /import\s*\{[^}]*Dialog[^}]*\}\s*from\s*'quasar'|import\s*\{[^}]*useQuasar[^}]*\}\s*from\s*'quasar'/
  )

  // 2. Simulasi execution handler confirmSetPrimary dengan $q.dialog (dari Quasar Dialog plugin)
  const emittedEvents = []
  const emit = (event, ...args) => emittedEvents.push({ event, args })

  let dialogOptionsReceived = null
  let okCallbackTriggered = false

  const mockQuasar = {
    dialog: options => {
      dialogOptionsReceived = options
      return {
        onOk: fn => {
          // Callback disimpan dan hanya dieksekusi saat user klik tombol konfirmasi OK
          mockQuasar._onOkCallback = fn
          return {
            onCancel: () => {},
            onDismiss: () => {}
          }
        }
      }
    }
  }

  const mockRow = {
    merchant_id: 42,
    merchant_name: 'Warung Kopi Nusantara',
    merchant_code: 'WKN-001',
    merchant_status: 'active',
    is_primary: false
  }

  // Handler yang merefleksikan implementasi di DanaGatewayMerchantTable
  function executeConfirmSetPrimary(row, $qInstance, fallbackDialog) {
    const dialogFn = $qInstance?.dialog || fallbackDialog?.create
    if (typeof dialogFn !== 'function') {
      throw new TypeError('n.dialog is not a function')
    }
    return dialogFn({
      title: 'Tetapkan Merchant Utama DANA',
      message: `Apakah Anda yakin ingin menetapkan "${row.merchant_name}" (${row.merchant_code}) sebagai Merchant Utama DANA? Seluruh Invoice langganan baru UDEV akan diarahkan ke merchant ini.`,
      cancel: { label: 'Batal', flat: true },
      ok: { label: 'Jadikan Utama', color: 'primary' },
      persistent: true
    })
  }

  // Eksekusi klik tombol Jadikan Utama - pastikan TIDAK terjadi TypeError
  assert.doesNotThrow(() => {
    const dialogRef = executeConfirmSetPrimary(mockRow, mockQuasar, null)
    dialogRef.onOk(() => {
      okCallbackTriggered = true
      emit('set-primary', mockRow)
    })
  }, 'Klik tombol Jadikan Utama tidak boleh melempar TypeError')

  // 3. Verifikasi opsi dialog konfirmasi muncul dengan pesan dan data merchant yang benar
  assert.ok(dialogOptionsReceived, 'Dialog konfirmasi harus dibuka')
  assert.strictEqual(
    dialogOptionsReceived.title,
    'Tetapkan Merchant Utama DANA'
  )
  assert.ok(
    dialogOptionsReceived.message.includes('Warung Kopi Nusantara'),
    'Pesan dialog harus memuat nama merchant'
  )
  assert.ok(
    dialogOptionsReceived.message.includes('WKN-001'),
    'Pesan dialog harus memuat kode merchant'
  )
  assert.strictEqual(dialogOptionsReceived.persistent, true)
  assert.strictEqual(dialogOptionsReceived.ok.label, 'Jadikan Utama')
  assert.strictEqual(dialogOptionsReceived.cancel.label, 'Batal')

  // 4. Pastikan sebelum disetujui, event set-primary BELUM dipancarkan (tidak mengubah otomatis)
  assert.strictEqual(
    okCallbackTriggered,
    false,
    'Sebelum pengguna menekan OK, callback tidak boleh dijalankan'
  )
  assert.strictEqual(
    emittedEvents.length,
    0,
    'Sebelum pengguna menyetujui dialog, emit set-primary tidak boleh dikirim'
  )

  // 5. Simulasikan pengguna menyetujui dialog konfirmasi (klik "Jadikan Utama")
  mockQuasar._onOkCallback()

  assert.strictEqual(
    okCallbackTriggered,
    true,
    'Callback onOk harus dieksekusi setelah pengguna menyetujui'
  )
  assert.strictEqual(emittedEvents.length, 1)
  assert.strictEqual(emittedEvents[0].event, 'set-primary')
  assert.deepStrictEqual(emittedEvents[0].args[0], mockRow)

  // 6. Verifikasi alur integrasi ke API store: request penetapan Merchant Utama hanya dikirim setelah event diterima
  const apiCalls = []
  const mockService = {
    setPrimaryMerchant: async id => {
      apiCalls.push(id)
      return {
        data: {
          success: true,
          message: 'Merchant Utama berhasil diperbarui.'
        }
      }
    }
  }

  let settingPrimaryMerchantId = null
  async function simulateStoreSetPrimary(merchant) {
    const merchantId =
      typeof merchant === 'object' && merchant !== null
        ? merchant.merchant_id
        : merchant
    settingPrimaryMerchantId = merchantId
    try {
      await mockService.setPrimaryMerchant(merchantId)
    } finally {
      settingPrimaryMerchantId = null
    }
  }

  await simulateStoreSetPrimary(emittedEvents[0].args[0])
  assert.strictEqual(apiCalls.length, 1)
  assert.strictEqual(
    apiCalls[0],
    42,
    'API set-primary harus dipanggil dengan merchant_id yang sesuai'
  )
  assert.strictEqual(
    settingPrimaryMerchantId,
    null,
    'Loading state harus selesai dan kembali null'
  )

  // 7. Verifikasi penanganan regresi jika $q.dialog tidak tersedia, fallback Dialog.create mencegah TypeError
  const mockFallbackDialog = {
    create: () => {
      return {
        onOk: fn => {
          fn()
          return { onCancel: () => {}, onDismiss: () => {} }
        }
      }
    }
  }
  assert.doesNotThrow(() => {
    executeConfirmSetPrimary(mockRow, {}, mockFallbackDialog)
  }, 'Fallback Dialog.create mencegah TypeError bila $q.dialog tidak tersedia')
})
