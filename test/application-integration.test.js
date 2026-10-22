import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('kontrak UI integrasi pelanggan tidak mengekspos token selain saat dibuat', async () => {
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )
  const dialog = await readFile(
    new URL(
      '../src/pages/Aplikasi/comp/AplikasiDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(service, /integration-tokens/)
  assert.match(service, /integration-audits/)
  assert.match(dialog, /Token baru tampil sekali/)
  assert.match(dialog, /Salin/)
  assert.match(dialog, /customers:read/)
  assert.match(dialog, /customers:write/)
  assert.match(dialog, /Pelanggan tersinkronisasi/)
})

test('halaman pelanggan menampilkan sumber dan status sinkronisasi', async () => {
  const page = await readFile(
    new URL('../src/pages/PelangganAplikasi/IndexPage.vue', import.meta.url),
    'utf8'
  )
  const table = await readFile(
    new URL(
      '../src/pages/PelangganAplikasi/comp/PelangganTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(page, /Sumber sinkronisasi/)
  assert.match(table, /sync_status/)
  assert.match(table, /source/)
})
