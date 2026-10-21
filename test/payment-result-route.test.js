import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import routes from '../src/router/routes.js'

test('route hasil pembayaran menggunakan layout publik tanpa autentikasi', () => {
  const paymentRoute = routes.find(route => route.path === '/payment')

  assert.ok(paymentRoute)
  assert.equal(paymentRoute.meta?.requiresAuth, undefined)
  assert.equal(paymentRoute.children?.length, 1)
  assert.equal(paymentRoute.children?.[0].path, 'result')
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
