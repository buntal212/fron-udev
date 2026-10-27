import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('sidebar menggunakan single scrollbar dari header/logo hingga menu terakhir tanpa nested scrollbar', async () => {
  const sidebar = await readFile(
    new URL('../src/components/AppSidebar.vue', import.meta.url),
    'utf8'
  )

  // Pastikan q-scroll-area membungkus seluruh sidebar (dari brand header hingga list menu)
  const brandIndex = sidebar.indexOf('<div class="sidebar-brand')
  const scrollAreaOpenIndex = sidebar.indexOf('<q-scroll-area')
  const scrollAreaCloseIndex = sidebar.indexOf('</q-scroll-area>')
  const listIndex = sidebar.indexOf('<q-list')

  assert.ok(scrollAreaOpenIndex !== -1, 'q-scroll-area harus ada')
  assert.ok(
    scrollAreaOpenIndex < brandIndex,
    'header/logo brand harus berada di dalam q-scroll-area agar satu scrollbar mencakup seluruh sidebar'
  )
  assert.ok(
    brandIndex < listIndex,
    'brand header harus berada di atas q-list di dalam scroll area'
  )
  assert.ok(
    listIndex < scrollAreaCloseIndex,
    'q-list harus berada di dalam q-scroll-area sebelum penutupnya'
  )

  // Pastikan overflow pada drawer content dinonaktifkan untuk mencegah scrollbar ganda
  assert.match(
    sidebar,
    /overflow:\s*hidden\s*!important/,
    'drawer content harus overflow: hidden agar tidak terjadi scrollbar vertikal kedua'
  )

  // Pastikan overscroll-behavior: contain dipasang agar tidak membuat halaman utama ikut scroll
  assert.match(
    sidebar,
    /overscroll-behavior:\s*contain/,
    'overscroll-behavior: contain harus ada untuk mencegah chaining scroll ke halaman utama'
  )

  // Pastikan list menu memiliki bottom padding agar menu paling bawah tidak terpotong
  assert.match(
    sidebar,
    /<q-list[^>]*class="[^"]*q-pb-/,
    'q-list harus memiliki padding-bottom agar menu terbawah tidak terpotong'
  )

  // Pastikan desain Black & Gold, menu aktif, dan routing dipertahankan
  assert.match(sidebar, /background:\s*#0c0c0d/, 'Background sidebar hitam')
  assert.match(sidebar, /menu-active/, 'Class menu-active dipertahankan')
  assert.match(sidebar, /#d6ad4d/, 'Aksen gold dipertahankan')
})
