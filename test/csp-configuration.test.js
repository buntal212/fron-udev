import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Frontend index.html mendefinisikan CSP dengan img-src yang mengizinkan blob, data, dan Midtrans sandbox', async () => {
  const indexHtml = await readFile(
    new URL('../index.html', import.meta.url),
    'utf8'
  )

  // 1. Memastikan hanya ada 1 meta tag Content-Security-Policy aktif (tidak ada CSP ganda di HTML)
  const cspMatches = [
    ...indexHtml.matchAll(
      /<meta\s+[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"/gi
    )
  ]
  assert.strictEqual(
    cspMatches.length,
    1,
    'Harus tepat ada 1 meta tag Content-Security-Policy aktif di index.html'
  )

  const cspContent = cspMatches[0][1]

  // 2. Verifikasi img-src mengizinkan 'self', blob:, data:, dan https://api.sandbox.midtrans.com
  assert.match(
    cspContent,
    /img-src\s+[^;]*'self'/,
    "img-src harus menyertakan 'self'"
  )
  assert.match(
    cspContent,
    /img-src\s+[^;]*blob:/,
    'img-src harus menyertakan blob:'
  )
  assert.match(
    cspContent,
    /img-src\s+[^;]*data:/,
    'img-src harus menyertakan data:'
  )
  assert.match(
    cspContent,
    /img-src\s+[^;]*https:\/\/api\.sandbox\.midtrans\.com/,
    'img-src harus menyertakan https://api.sandbox.midtrans.com'
  )

  // 3. Verifikasi directive keamanan lainnya tidak dihapus atau dilonggarkan
  assert.match(
    cspContent,
    /default-src\s+'self'/,
    "default-src harus tetap 'self'"
  )
  assert.match(
    cspContent,
    /connect-src\s+'self'\s+https:\/\/apiudev\.udumbara\.my\.id/,
    'connect-src harus tetap mengunci ke self dan backend apiudev tanpa dilonggarkan'
  )
  assert.match(
    cspContent,
    /script-src\s+'self'/,
    "script-src harus tetap 'self' tanpa unsafe-eval atau domain eksternal"
  )
  assert.doesNotMatch(
    cspContent,
    /script-src[^;]*'unsafe-eval'/,
    'script-src tidak boleh dilonggarkan dengan unsafe-eval'
  )
  assert.doesNotMatch(
    cspContent,
    /script-src[^;]*\*/,
    'script-src tidak boleh menggunakan wildcard'
  )
  assert.match(
    cspContent,
    /style-src\s+'self'\s+'unsafe-inline'/,
    "style-src harus tetap 'self' 'unsafe-inline'"
  )
})

test('Workflow deploy memverifikasi CSP pada build PWA dan mencegah header CSP ganda yang memblokir gambar', async () => {
  const workflow = await readFile(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  )

  // 1. Verifikasi pada Job Build
  assert.match(
    workflow,
    /grep\s+-q\s+"img-src\s+'self'\s+blob:\s+data:\s+https:\/\/api\.sandbox\.midtrans\.com"\s+dist\/pwa\/index\.html/,
    'Job build harus memvalidasi keberadaan img-src pada dist/pwa/index.html'
  )
  assert.match(
    workflow,
    /grep\s+-q\s+"default-src\s+'self'"\s+dist\/pwa\/index\.html/,
    'Job build harus memvalidasi default-src'
  )
  assert.match(
    workflow,
    /grep\s+-q\s+"connect-src\s+'self'\s+https:\/\/apiudev\.udumbara\.my\.id"\s+dist\/pwa\/index\.html/,
    'Job build harus memvalidasi connect-src'
  )

  // 2. Verifikasi pada Job Deploy (aaPanel)
  assert.match(
    workflow,
    /grep\s+-q\s+"img-src\s+'self'\s+blob:\s+data:\s+https:\/\/api\.sandbox\.midtrans\.com"\s+"\$DEPLOY_PATH\/index\.html"/,
    'Job deploy harus memverifikasi deployed index.html'
  )
  assert.match(
    workflow,
    /SERVER_CSP=\$\(curl[\s\S]*content-security-policy:[\s\S]*\)/,
    'Job deploy harus memeriksa keberadaan header HTTP CSP dari server'
  )
  assert.match(
    workflow,
    /Conflicting server HTTP CSP header detected that blocks QRIS images/,
    'Job deploy harus gagal jika ada CSP server yang bertentangan / memblokir gambar'
  )
})
