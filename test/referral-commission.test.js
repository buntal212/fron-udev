import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

test('referralCommissionService mendefinisikan API end-to-end untuk komisi dan referral', () => {
  const serviceFile = path.join(rootDir, 'src/services/udev-billing.js')
  const content = fs.readFileSync(serviceFile, 'utf8')

  assert.match(
    content,
    /summary:\s*\(\)\s*=>\s*api\.get\('\/v1\/admin\/referral-commissions\/summary'\)/,
    'referralCommissionService harus mendefinisikan endpoint GET summary'
  )
  assert.match(
    content,
    /list:\s*params\s*=>\s*getList\('\/v1\/admin\/referral-commissions',\s*params\)/,
    'referralCommissionService harus mendefinisikan endpoint GET list'
  )
  assert.match(
    content,
    /warungs:\s*params\s*=>\s*getList\('\/v1\/admin\/referral-warungs',\s*params\)/,
    'referralCommissionService harus mendefinisikan endpoint GET warungs'
  )
  assert.match(
    content,
    /reverse:\s*\(id,\s*payload\)\s*=>\s*api\.post\(`\/v1\/admin\/referral-commissions\/\$\{id\}\/reverse`,\s*payload\)/,
    'referralCommissionService harus mendefinisikan endpoint POST reverse'
  )
})

test('Pinia store referral mengelola state dashboard ringkasan, riwayat komisi, warung, dan kode', () => {
  const storeFile = path.join(rootDir, 'src/stores/referral/index.js')
  const content = fs.readFileSync(storeFile, 'utf8')

  // State checks
  assert.match(
    content,
    /activeTab:\s*'summary'/,
    'Store harus memiliki state activeTab'
  )
  assert.match(content, /summary:\s*null/, 'Store harus memiliki state summary')
  assert.match(
    content,
    /commissions:\s*\[\]/,
    'Store harus memiliki state commissions'
  )
  assert.match(
    content,
    /commissionsHasMore:\s*true/,
    'Store harus memiliki state commissionsHasMore'
  )
  assert.match(content, /warungs:\s*\[\]/, 'Store harus memiliki state warungs')
  assert.match(
    content,
    /warungsHasMore:\s*true/,
    'Store harus memiliki state warungsHasMore'
  )
  assert.match(
    content,
    /reversalDialog:/,
    'Store harus memiliki state reversalDialog'
  )

  // Action checks
  assert.match(
    content,
    /async\s+fetchSummary\s*\(/,
    'Store harus menyediakan action fetchSummary'
  )
  assert.match(
    content,
    /async\s+fetchCommissions\s*\(/,
    'Store harus menyediakan action fetchCommissions'
  )
  assert.match(
    content,
    /async\s+loadMoreCommissions\s*\(/,
    'Store harus menyediakan action loadMoreCommissions untuk infinite scroll'
  )
  assert.match(
    content,
    /async\s+fetchWarungs\s*\(/,
    'Store harus menyediakan action fetchWarungs'
  )
  assert.match(
    content,
    /async\s+loadMoreWarungs\s*\(/,
    'Store harus menyediakan action loadMoreWarungs untuk infinite scroll'
  )
  assert.match(
    content,
    /async\s+submitReversal\s*\(/,
    'Store harus menyediakan action submitReversal'
  )
})

test('Halaman Referral mengimplementasikan tab navigasi lengkap, StatCard ringkasan, dan card list infinite scroll', () => {
  const pageFile = path.join(rootDir, 'src/pages/Referral/IndexPage.vue')
  const content = fs.readFileSync(pageFile, 'utf8')

  // Tabs
  assert.match(
    content,
    /name="summary"[^>]*label="Ringkasan Komisi"/,
    'Halaman harus memiliki tab Ringkasan Komisi'
  )
  assert.match(
    content,
    /name="commissions"[^>]*label="Riwayat Komisi"/,
    'Halaman harus memiliki tab Riwayat Komisi'
  )
  assert.match(
    content,
    /name="warung"[^>]*label="Warung Referral"/,
    'Halaman harus memiliki tab Warung Referral'
  )
  assert.match(
    content,
    /name="kode"[^>]*label="Kode Referral"/,
    'Halaman harus memiliki tab Kode Referral'
  )

  // StatCards on summary tab
  assert.match(
    content,
    /StatCard[\s\S]*label="Total Mitra Aktif"/,
    'Tab ringkasan harus menampilkan StatCard Total Mitra'
  )
  assert.match(
    content,
    /StatCard[\s\S]*label="Warung Referral"/,
    'Tab ringkasan harus menampilkan StatCard Warung Referral'
  )
  assert.match(
    content,
    /StatCard[\s\S]*label="Total Penghasilan"/,
    'Tab ringkasan harus menampilkan StatCard Total Penghasilan'
  )
  assert.match(
    content,
    /StatCard[\s\S]*label="Saldo Tersedia"/,
    'Tab ringkasan harus menampilkan StatCard Saldo Tersedia'
  )
  assert.match(
    content,
    /StatCard[\s\S]*label="Saldo Tertahan"/,
    'Tab ringkasan harus menampilkan StatCard Saldo Tertahan'
  )

  // Infinite scroll
  assert.match(
    content,
    /<q-infinite-scroll[^>]*@load="store\.loadMoreCommissions"/,
    'Riwayat komisi harus menggunakan q-infinite-scroll'
  )
  assert.match(
    content,
    /<q-infinite-scroll[^>]*@load="store\.loadMoreWarungs"/,
    'Warung referral harus menggunakan q-infinite-scroll'
  )

  // Reversal dialog
  assert.match(
    content,
    /v-model="store\.reversalDialog\.open"/,
    'Harus menyediakan dialog reversal komisi'
  )
  assert.match(
    content,
    /v-model="store\.reversalDialog\.reason"/,
    'Dialog reversal harus menyediakan textarea alasan'
  )
})

test('Halaman Mitra Mandiri menampilkan saldo dan warung referral pada tabel dan detail dialog', () => {
  const pageFile = path.join(rootDir, 'src/pages/MitraMandiri/IndexPage.vue')
  const content = fs.readFileSync(pageFile, 'utf8')

  assert.match(
    content,
    /referred_warungs_count/,
    'Kolom tabel harus menyertakan jumlah warung referral'
  )
  assert.match(
    content,
    /available_balance/,
    'Kolom tabel harus menyertakan saldo tersedia'
  )
  assert.match(
    content,
    /store\.detail\.balances\?\.available_balance/,
    'Detail dialog harus menampilkan saldo tersedia'
  )
  assert.match(
    content,
    /store\.detail\.balances\?\.pending_balance/,
    'Detail dialog harus menampilkan saldo tertahan'
  )
  assert.match(
    content,
    /store\.detail\.balances\?\.total_earnings/,
    'Detail dialog harus menampilkan total penghasilan'
  )
})

test('InvoiceDetailDialog menampilkan komisi referral, jenis komisi, status, dan riwayat reversal', () => {
  const dialogFile = path.join(
    rootDir,
    'src/pages/Invoice/comp/InvoiceDetailDialog.vue'
  )
  const content = fs.readFileSync(dialogFile, 'utf8')

  assert.match(
    content,
    /v-if="referralCommission"/,
    'Dialog invoice harus memeriksa referralCommission'
  )
  assert.match(
    content,
    /Komisi Referral/,
    'Dialog invoice harus menampilkan label Komisi Referral'
  )
  assert.match(
    content,
    /referralCommission\.commission_type/,
    'Dialog invoice harus membedakan jenis komisi'
  )
  assert.match(
    content,
    /referralCommission\.status/,
    'Dialog invoice harus menampilkan status komisi'
  )
  assert.match(
    content,
    /referralCommission\?\.reversal/,
    'Dialog invoice harus menampilkan rincian jika komisi dibalikkan'
  )
})
