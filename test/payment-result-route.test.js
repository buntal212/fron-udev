import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import routes from '../src/router/routes.js'

test('route hasil pembayaran menggunakan layout publik tanpa autentikasi', () => {
  const paymentRoute = routes.find(route => route.path === '/payment')

  assert.ok(paymentRoute)
  assert.equal(paymentRoute.meta?.requiresAuth, undefined)
  assert.equal(paymentRoute.children?.length, 2)
  assert.equal(paymentRoute.children?.[0].path, 'result')
})

test('hasil Sandbox memakai route turunan layout aman dan membutuhkan admin', () => {
  const paymentRoute = routes.find(route => route.path === '/payment')
  const sandboxResult = paymentRoute?.children?.find(
    route => route.path === 'sandbox-result'
  )

  assert.ok(sandboxResult)
  assert.equal(sandboxResult.meta?.requiresAuth, true)
})

test('layout hasil pembayaran menyediakan QLayout dan QPageContainer', async () => {
  const layout = await readFile(
    new URL('../src/layouts/PaymentResultLayout.vue', import.meta.url),
    'utf8'
  )

  assert.match(layout, /<q-layout\b/)
  assert.match(layout, /<q-page-container>/)
  assert.match(layout, /<router-view\s*\/>/)
})

test('halaman hasil Sandbox tidak menjadikan redirect sebagai status paid', async () => {
  const page = await readFile(
    new URL('../src/pages/SandboxPaymentResult/IndexPage.vue', import.meta.url),
    'utf8'
  )

  assert.match(page, /danaGatewayMerchantService\.sandboxPaymentResult/)
  assert.match(
    page,
    /Redirect tidak dianggap sebagai bukti pembayaran berhasil/
  )
  assert.match(page, /MAX_POLL_ATTEMPTS = 24/)
})
