import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('PaymentGatewayFormDialog mengunci environment dan aplikasi pada mode edit untuk mencegah penimpaan antar-environment', async () => {
  const dialog = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/PaymentGatewayFormDialog.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Aplikasi di-disable saat edit
  assert.match(
    dialog,
    /:disable="store\.formMode === 'edit'"[\s\S]*?label="Aplikasi"|label="Aplikasi"[\s\S]*?:disable="store\.formMode === 'edit'"/
  )

  // Environment di-disable saat edit agar tidak menimpa mapping environment lain
  assert.match(
    dialog,
    /:disable="store\.formMode === 'edit'"[\s\S]*?label="Environment"|label="Environment"[\s\S]*?:disable="store\.formMode === 'edit'"/
  )

  // Banner edukasi dual mapping bersamaan
  assert.match(
    dialog,
    /Satu aplikasi dapat memiliki mapping Sandbox dan Production/
  )
})

test('PaymentGatewayTable menyediakan badge environment, toggle status mandiri, edit, dan delete action', async () => {
  const table = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/PaymentGatewayTable.vue',
      import.meta.url
    ),
    'utf8'
  )

  // Badge environment membedakan production (deep-orange) dan sandbox (blue-grey)
  assert.match(
    table,
    /props\.value === 'production' \? 'deep-orange' : 'blue-grey'/
  )

  // Toggle status mandiri
  assert.match(
    table,
    /@update:model-value="\$emit\('change-status', props\.row, \$event\)"/
  )

  // Tombol aksi edit dan delete
  assert.match(table, /@click="\$emit\('edit', props\.row\)"/)
  assert.match(table, /@click="\$emit\('delete', props\.row\)"/)
  assert.match(
    table,
    /defineEmits\(\['request', 'edit', 'change-status', 'delete'\]\)/
  )
})

test('store paymentgateway mendukung penyimpanan independen tanpa mengubah environment saat edit dan mendukung delete mapping', async () => {
  const store = await readFile(
    new URL('../src/stores/paymentgateway/index.js', import.meta.url),
    'utf8'
  )

  // Saat edit, environment tidak dikirim/diubah sehingga tidak menimpa environment lain
  assert.match(store, /delete payload\.environment/)

  // Memiliki state dan fungsi konfirmasi penghapusan mapping
  assert.match(store, /mappingDeleteConfirmDialogOpen:\s*false/)
  assert.match(store, /mappingToDelete:\s*null/)
  assert.match(store, /confirmDeleteMapping\(mapping\)/)
  assert.match(store, /async deleteMapping\(\)/)
})

test('IndexPage mengintegrasikan dialog konfirmasi hapus mapping dan menghubungkan delete action', async () => {
  const page = await readFile(
    new URL('../src/pages/PaymentGateway/IndexPage.vue', import.meta.url),
    'utf8'
  )

  assert.match(page, /@delete="store\.confirmDeleteMapping"/)
  assert.match(page, /v-model="store\.mappingDeleteConfirmDialogOpen"/)
  assert.match(page, /Konfirmasi Hapus Mapping/)
  assert.match(page, /@click="store\.deleteMapping"/)
})
