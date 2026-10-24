import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('master paket langganan mengirim dan menampilkan durasi hari tetap', async () => {
  const store = await readFile(
    new URL('../src/stores/paketlangganan/index.js', import.meta.url),
    'utf8'
  )
  const form = await readFile(
    new URL(
      '../src/pages/PaketLangganan/comp/PaketLanggananFormDialog.vue',
      import.meta.url
    ),
    'utf8'
  )
  const table = await readFile(
    new URL(
      '../src/pages/PaketLangganan/comp/PaketLanggananTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(store, /duration_days/)
  assert.match(form, /Durasi \(Hari\)/)
  assert.match(form, /kelipatan 30 hari/)
  assert.match(table, /duration_days/)
  assert.match(table, /hari/)
  assert.doesNotMatch(store, /duration_months/)
})

test('invoice memakai snapshot durasi hari', async () => {
  const form = await readFile(
    new URL('../src/pages/Invoice/comp/InvoiceFormDialog.vue', import.meta.url),
    'utf8'
  )
  const detail = await readFile(
    new URL(
      '../src/pages/Invoice/comp/InvoiceDetailDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(form, /selectedPlan\.duration_days/)
  assert.match(detail, /invoice\.duration_days/)
  assert.doesNotMatch(form, /duration_months/)
  assert.doesNotMatch(detail, /duration_months/)
})
