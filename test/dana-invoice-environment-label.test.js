import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('InvoiceTable menampilkan label DANA Production jika gateway_environment = production dan DANA Sandbox jika sandbox', async () => {
  const table = await readFile(
    new URL('../src/pages/Invoice/comp/InvoiceTable.vue', import.meta.url),
    'utf8'
  )

  // Memastikan helper deteksi environment attempt aktual tersedia
  assert.match(table, /const isProductionAttempt\s*=\s*attempt\s*=>/)
  assert.match(table, /const getDanaEnvironmentLabel\s*=\s*attempt\s*=>/)

  // Menampilkan "DANA Production" jika production, dan "DANA Sandbox" jika sandbox
  assert.match(table, /'DANA Production'/)
  assert.match(table, /'DANA Sandbox'/)

  // Badge provider aktual menggunakan getDanaEnvironmentLabel
  assert.match(
    table,
    /getLatestAttempt\(invoice\)\.provider === 'dana'[\s\S]*?getDanaEnvironmentLabel\(getLatestAttempt\(invoice\)\)/
  )

  // Riwayat percobaan pembayaran (expandable) juga menggunakan getDanaEnvironmentLabel
  assert.match(
    table,
    /att\.provider === 'dana'[\s\S]*?getDanaEnvironmentLabel\(att\)/
  )

  // Simulasi logika isProductionAttempt dan getDanaEnvironmentLabel
  const isProductionAttempt = attempt => {
    if (!attempt) return false
    const env =
      attempt.gateway_environment ||
      attempt.environment ||
      attempt.metadata?.gateway_environment ||
      attempt.metadata?.environment ||
      ''
    return String(env).trim().toLowerCase() === 'production'
  }

  const getDanaEnvironmentLabel = attempt => {
    return isProductionAttempt(attempt) ? 'DANA Production' : 'DANA Sandbox'
  }

  // Uji transaksi Sandbox
  const sandboxAttempt = {
    id: 1,
    provider: 'dana',
    gateway_environment: 'sandbox'
  }
  assert.equal(isProductionAttempt(sandboxAttempt), false)
  assert.equal(getDanaEnvironmentLabel(sandboxAttempt), 'DANA Sandbox')

  // Uji transaksi Production
  const productionAttempt = {
    id: 2,
    provider: 'dana',
    gateway_environment: 'production'
  }
  assert.equal(isProductionAttempt(productionAttempt), true)
  assert.equal(getDanaEnvironmentLabel(productionAttempt), 'DANA Production')

  // Uji transaksi dengan environment di metadata (fallback backend)
  const metadataProdAttempt = {
    id: 3,
    provider: 'dana',
    metadata: { gateway_environment: 'production' }
  }
  assert.equal(isProductionAttempt(metadataProdAttempt), true)
  assert.equal(getDanaEnvironmentLabel(metadataProdAttempt), 'DANA Production')

  // Uji invoice tanpa transaksi (attempt null)
  assert.equal(isProductionAttempt(null), false)
  assert.equal(getDanaEnvironmentLabel(null), 'DANA Sandbox')
})

test('InvoiceDetailDialog menampilkan DANA Production dan DANA Sandbox secara konsisten', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Gateway toggle options
  assert.match(
    dialog,
    /label:\s*isAttemptProduction\.value\s*\?\s*'DANA Production'\s*:\s*'DANA Sandbox'/
  )

  // isAttemptProduction memprioritaskan payment attempt / transaksi aktual
  assert.match(dialog, /const isAttemptProduction\s*=\s*computed/)
  assert.match(
    dialog,
    /const attempt\s*=\s*latestAttempt\.value\s*\|\|\s*store\.checkoutAttempt/
  )

  // attemptProviderLabel pada riwayat attempt dialog
  assert.match(dialog, /const attemptProviderLabel\s*=\s*attempt\s*=>/)
  assert.match(dialog, /attemptProviderLabel\(attempt\)[\s\S]*?Percobaan #/)

  // QRIS section label
  assert.match(
    dialog,
    /isAttemptProduction[\s\S]*?'DANA Production'[\s\S]*?'DANA Sandbox'/
  )
})

test('RiwayatPembayaran dan LanggananDetailDialog konsisten menampilkan label DANA Production dan Sandbox', async () => {
  const historyTable = await readFile(
    new URL(
      '../src/pages/RiwayatPembayaran/comp/RiwayatPembayaranTable.vue',
      import.meta.url
    ),
    'utf8'
  )
  const historyDialog = await readFile(
    new URL(
      '../src/pages/RiwayatPembayaran/comp/RiwayatPembayaranDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const subDialog = await readFile(
    new URL(
      '../src/pages/LanggananPelanggan/comp/LanggananDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // RiwayatPembayaranTable
  assert.match(historyTable, /#body-cell-provider="props"/)
  assert.match(historyTable, /'DANA Production'/)
  assert.match(historyTable, /'DANA Sandbox'/)

  // RiwayatPembayaranDetailDialog
  assert.match(historyDialog, /'DANA Production'/)
  assert.match(historyDialog, /'DANA Sandbox'/)

  // LanggananDetailDialog
  assert.match(subDialog, /'DANA Production'/)
  assert.match(subDialog, /'DANA Sandbox'/)
})
