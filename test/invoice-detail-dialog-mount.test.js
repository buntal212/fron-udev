import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computed,
  createRenderer,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  watch
} from 'vue'

// Custom In-Memory Test DOM Renderer for Vue 3 Component Mounting
class TestDomNode {
  constructor(type, tag = null) {
    this.type = type
    this.tag = tag
    this.children = []
    this.props = {}
    this.text = ''
    this.parent = null
  }

  querySelector(selector) {
    const match = selector.match(
      /^([a-z0-9_-]+)?(?:\[([a-z0-9_-]+)="([^"]+)"\])?(?:\.([a-z0-9_-]+))?$/i
    )
    if (!match) return null
    const [, tag, attr, attrVal, cls] = match

    let isMatch = true
    if (tag && this.tag?.toLowerCase() !== tag.toLowerCase()) isMatch = false
    if (attr && this.props[attr] !== attrVal) isMatch = false
    if (
      cls &&
      !String(this.props.class || '')
        .split(/\s+/)
        .includes(cls)
    ) {
      isMatch = false
    }

    if (isMatch && (tag || attr || cls)) return this

    for (const child of this.children) {
      if (child instanceof TestDomNode) {
        const found = child.querySelector(selector)
        if (found) return found
      }
    }
    return null
  }
}

const { createApp: createTestApp } = createRenderer({
  createElement(tag) {
    return new TestDomNode('element', tag)
  },
  createText(text) {
    const n = new TestDomNode('text')
    n.text = text
    return n
  },
  createComment(text) {
    const n = new TestDomNode('comment')
    n.text = text
    return n
  },
  setText(node, text) {
    node.text = text
  },
  setElementText(node, text) {
    node.text = text
  },
  patchProp(el, key, prevVal, nextVal) {
    if (nextVal == null) {
      delete el.props[key]
    } else {
      el.props[key] = nextVal
    }
  },
  insert(child, parent, anchor) {
    child.parent = parent
    const idx = anchor ? parent.children.indexOf(anchor) : -1
    if (idx !== -1) {
      parent.children.splice(idx, 0, child)
    } else {
      parent.children.push(child)
    }
  },
  remove(child) {
    if (child.parent) {
      const idx = child.parent.children.indexOf(child)
      if (idx !== -1) {
        child.parent.children.splice(idx, 1)
        child.parent = null
      }
    }
  },
  parentNode(node) {
    return node.parent
  },
  nextSibling(node) {
    if (!node.parent) return null
    const idx = node.parent.children.indexOf(node)
    return node.parent.children[idx + 1] || null
  }
})

// Factory helper to construct the dialog's reactive QRIS presentation component
function createDialogQrisComponent(mockStore) {
  return defineComponent({
    setup() {
      const proxyBlobUrl = ref(null)
      const currentAttemptId = ref(null)
      const qrImageLoading = ref(false)
      const qrImageLoadFailed = ref(false)
      const proxyFetchFailed = ref(false)

      const isProxyUrl = url => {
        if (!url || typeof url !== 'string') return false
        return (
          url.includes('/api/v1/admin/payment-attempts/') ||
          url.includes('/qr-image')
        )
      }

      const invoice = computed(() => mockStore.selectedInvoice || {})

      const latestAttempt = computed(() => {
        const attempts = invoice.value?.payment_attempts
        if (Array.isArray(attempts) && attempts.length > 0) {
          return [...attempts].sort(
            (a, b) => b.attempt_number - a.attempt_number
          )[0]
        }
        return mockStore.checkoutAttempt || null
      })

      const isMidtrans = computed(() => {
        if (mockStore.checkoutProvider) {
          return mockStore.checkoutProvider === 'midtrans'
        }
        const attemptProvider =
          latestAttempt.value?.provider ||
          latestAttempt.value?.metadata?.provider ||
          latestAttempt.value?.payment_gateway?.provider
        if (attemptProvider) {
          return attemptProvider === 'midtrans'
        }
        const qrUrl =
          mockStore.checkoutQrUrl ||
          mockStore.checkoutQrImageUrl ||
          latestAttempt.value?.qr_url ||
          latestAttempt.value?.qr_image_url ||
          ''
        if (
          typeof qrUrl === 'string' &&
          (qrUrl.toLowerCase().includes('midtrans') ||
            qrUrl.includes('/qr-image'))
        ) {
          return true
        }
        const gateways = invoice.value?.application_payment_gateways || []
        const hasMidtrans = gateways.some(
          g => g.provider === 'midtrans' && g.is_active
        )
        const hasDana = gateways.some(g => g.provider === 'dana' && g.is_active)
        if (hasMidtrans && !hasDana) {
          return true
        }
        return false
      })

      const currentAttemptMethod = computed(
        () =>
          latestAttempt.value?.metadata?.payment_method ||
          latestAttempt.value?.payment_method ||
          mockStore.checkoutPaymentMethod
      )

      const isCheckoutExpired = computed(() => {
        if (mockStore.checkoutIsExpired) return true
        if (latestAttempt.value?.status === 'expired') return true
        if (
          mockStore.checkoutExpiresAt &&
          new Date(mockStore.checkoutExpiresAt).getTime() <= Date.now()
        ) {
          return true
        }
        return false
      })

      const isAttemptTerminal = computed(() => {
        const status =
          latestAttempt.value?.status || mockStore.checkoutAttempt?.status
        return ['succeeded', 'paid', 'expired', 'failed', 'cancelled'].includes(
          status
        )
      })

      const proxyQrUrl = computed(() => {
        return (
          mockStore.checkoutQrImageUrl ||
          latestAttempt.value?.qr_image_url ||
          (isProxyUrl(mockStore.checkoutQrUrl)
            ? mockStore.checkoutQrUrl
            : null) ||
          (isProxyUrl(latestAttempt.value?.qr_url)
            ? latestAttempt.value?.qr_url
            : null) ||
          null
        )
      })

      const rawMidtransQrUrl = computed(() => {
        const url =
          mockStore.checkoutQrUrl ||
          latestAttempt.value?.qr_url ||
          latestAttempt.value?.metadata?.qr_url ||
          null
        return url && !isProxyUrl(url) ? url : null
      })

      const emvcoPayload = computed(() => {
        return (
          mockStore.checkoutQrPayload ||
          mockStore.checkoutQrString ||
          latestAttempt.value?.qr_string ||
          latestAttempt.value?.qr_content ||
          null
        )
      })

      const cleanupProxyBlobUrl = () => {
        if (proxyBlobUrl.value) {
          mockStore.revokedBlobUrls.push(proxyBlobUrl.value)
          proxyBlobUrl.value = null
        }
        if (mockStore.checkoutQrBlobUrl) {
          mockStore.checkoutQrBlobUrl = null
          mockStore.checkoutQrBlobAttemptId = null
        }
      }

      const loadProxyQrBlob = async () => {
        if (isCheckoutExpired.value) {
          cleanupProxyBlobUrl()
          return null
        }
        const attemptId =
          latestAttempt.value?.id || mockStore.checkoutAttempt?.id
        const attemptStatus =
          latestAttempt.value?.status || mockStore.checkoutAttempt?.status
        if (
          ['succeeded', 'paid', 'expired', 'failed', 'cancelled'].includes(
            attemptStatus
          )
        ) {
          proxyFetchFailed.value = true
          return null
        }

        const target = proxyQrUrl.value || attemptId
        if (!target) {
          proxyFetchFailed.value = true
          return null
        }

        if (proxyBlobUrl.value && currentAttemptId.value === attemptId) {
          return proxyBlobUrl.value
        }

        if (
          mockStore.checkoutQrBlobUrl &&
          mockStore.checkoutQrBlobAttemptId === attemptId
        ) {
          proxyBlobUrl.value = mockStore.checkoutQrBlobUrl
          currentAttemptId.value = attemptId
          proxyFetchFailed.value = false
          return mockStore.checkoutQrBlobUrl
        }

        if (proxyFetchFailed.value && currentAttemptId.value === attemptId) {
          return null
        }

        const targetAttemptId = attemptId
        qrImageLoading.value = true
        try {
          const blobUrl = await mockStore.fetchProxyQrBlob(target)
          if (
            currentAttemptId.value &&
            currentAttemptId.value !== targetAttemptId
          ) {
            return null
          }
          if (blobUrl) {
            if (
              proxyBlobUrl.value &&
              proxyBlobUrl.value !== blobUrl &&
              proxyBlobUrl.value !== mockStore.checkoutQrBlobUrl
            ) {
              mockStore.revokedBlobUrls.push(proxyBlobUrl.value)
            }
            proxyBlobUrl.value = blobUrl
            currentAttemptId.value = targetAttemptId
            proxyFetchFailed.value = false
            return blobUrl
          } else {
            proxyFetchFailed.value = true
            if (emvcoPayload.value && !mockStore.checkoutQrDataUrl) {
              await mockStore.renderQr(emvcoPayload.value)
            }
          }
        } catch (err) {
          proxyFetchFailed.value = true
          if (err?.response?.status === 410) {
            cleanupProxyBlobUrl()
          } else if (emvcoPayload.value && !mockStore.checkoutQrDataUrl) {
            await mockStore.renderQr(emvcoPayload.value)
          }
        } finally {
          qrImageLoading.value = false
        }
        return null
      }

      const displayQrSource = computed(() => {
        if (isCheckoutExpired.value) return null

        const attemptId =
          latestAttempt.value?.id || mockStore.checkoutAttempt?.id
        if (proxyBlobUrl.value) {
          return proxyBlobUrl.value
        }
        if (
          mockStore.checkoutQrBlobUrl &&
          mockStore.checkoutQrBlobAttemptId === attemptId
        ) {
          return mockStore.checkoutQrBlobUrl
        }

        if (
          rawMidtransQrUrl.value &&
          !qrImageLoadFailed.value &&
          !isProxyUrl(rawMidtransQrUrl.value)
        ) {
          return rawMidtransQrUrl.value
        }

        if (mockStore.checkoutQrDataUrl) {
          return mockStore.checkoutQrDataUrl
        }

        return null
      })

      const onQrImageLoad = () => {
        qrImageLoading.value = false
        qrImageLoadFailed.value = false
        proxyFetchFailed.value = false
      }

      const handleQrImageError = async () => {
        qrImageLoadFailed.value = true
        if (proxyBlobUrl.value) {
          proxyFetchFailed.value = true
          cleanupProxyBlobUrl()
        } else if (!proxyFetchFailed.value && !isCheckoutExpired.value) {
          const blobUrl = await loadProxyQrBlob()
          if (blobUrl) return
        }
        if (emvcoPayload.value && !mockStore.checkoutQrDataUrl) {
          await mockStore.renderQr(emvcoPayload.value)
        }
      }

      watch(
        () => [
          mockStore.detailDialogOpen,
          mockStore.checkoutQrUrl,
          mockStore.checkoutQrImageUrl,
          latestAttempt.value?.id,
          latestAttempt.value?.qr_url,
          latestAttempt.value?.qr_image_url
        ],
        async () => {
          if (!mockStore.detailDialogOpen) return

          const attemptId =
            latestAttempt.value?.id || mockStore.checkoutAttempt?.id || null
          const attemptChanged = attemptId !== currentAttemptId.value

          if (attemptChanged) {
            currentAttemptId.value = attemptId
            qrImageLoadFailed.value = false
            proxyFetchFailed.value = false
            cleanupProxyBlobUrl()
          }

          const attemptStatus =
            latestAttempt.value?.status || mockStore.checkoutAttempt?.status
          const isTerminal = [
            'succeeded',
            'paid',
            'expired',
            'failed',
            'cancelled'
          ].includes(attemptStatus)

          if (isTerminal) {
            mockStore.stopPolling()
          }

          if (
            currentAttemptMethod.value === 'qris' &&
            (proxyQrUrl.value || latestAttempt.value?.id) &&
            !isCheckoutExpired.value &&
            !isTerminal &&
            (!qrImageLoading.value || attemptChanged) &&
            (!proxyBlobUrl.value || attemptChanged)
          ) {
            await loadProxyQrBlob()
          }
        },
        { immediate: true }
      )

      watch(
        () => isCheckoutExpired.value,
        expired => {
          if (expired) {
            cleanupProxyBlobUrl()
            currentAttemptId.value = null
            proxyFetchFailed.value = false
            mockStore.stopPolling()
            mockStore.stopCheckoutSession()
          }
        }
      )

      onBeforeUnmount(() => {
        currentAttemptId.value = null
        proxyFetchFailed.value = false
        cleanupProxyBlobUrl()
        mockStore.stopPolling()
        mockStore.stopCheckoutSession()
      })

      return {
        isCheckoutExpired,
        isAttemptTerminal,
        qrImageLoading,
        isMidtrans,
        proxyQrUrl,
        latestAttempt,
        proxyBlobUrl,
        proxyFetchFailed,
        displayQrSource,
        onQrImageLoad,
        handleQrImageError,
        mockStore
      }
    },
    render() {
      // 1. Expired condition
      if (this.isCheckoutExpired) {
        return h('div', { class: 'qris-expired-box' }, 'Kode QRIS Kedaluwarsa')
      }

      // 2. Loading Spinner
      if (
        !this.isAttemptTerminal &&
        (this.mockStore.checkoutLoading ||
          this.mockStore.checkoutQrLoading ||
          this.qrImageLoading ||
          (this.isMidtrans &&
            (this.proxyQrUrl || this.latestAttempt?.id) &&
            !this.proxyBlobUrl &&
            !this.proxyFetchFailed))
      ) {
        return h('div', { class: 'qris-spinner-container' }, [
          h('div', { class: 'q-spinner-tail' }),
          h(
            'div',
            { class: 'caption' },
            'Menghubungi Midtrans Sandbox untuk QRIS resmi...'
          )
        ])
      }

      // 3. Rendered QR Image
      if (this.displayQrSource) {
        return h('div', { class: 'qris-image-container' }, [
          h('img', {
            key: this.displayQrSource,
            src: this.displayQrSource,
            alt: `QRIS ${this.isMidtrans ? 'Midtrans' : 'DANA'} Sandbox`,
            class: 'qris-img'
          })
        ])
      }

      return h('div', { class: 'qris-empty' }, 'QR Tidak Tersedia')
    }
  })
}

// Tests
test('Mount: Dialog menampilkan spinner saat initial pending, lalu transisi ke img saat Blob selesai dimuat', async () => {
  let resolveProxyFetch
  const fetchPromise = new Promise(resolve => {
    resolveProxyFetch = resolve
  })

  const mockStore = reactive({
    detailDialogOpen: true,
    checkoutPaymentMethod: 'qris',
    checkoutProvider: 'midtrans',
    checkoutLoading: false,
    checkoutQrLoading: false,
    checkoutQrUrl: null,
    checkoutQrImageUrl: '/api/v1/admin/payment-attempts/32/qr-image',
    checkoutExpiresAt: new Date(Date.now() + 900000).toISOString(),
    checkoutRemainingSeconds: 0, // Awal 0 sebelum countdown
    checkoutIsExpired: false,
    checkoutAttempt: {
      id: 32,
      status: 'pending',
      provider: 'midtrans',
      payment_method: 'qris'
    },
    selectedInvoice: {
      id: 10,
      status: 'pending',
      payment_attempts: [
        {
          id: 32,
          attempt_number: 1,
          status: 'pending',
          provider: 'midtrans',
          qr_image_url: '/api/v1/admin/payment-attempts/32/qr-image'
        }
      ]
    },
    revokedBlobUrls: [],
    fetchProxyQrBlobCalls: [],
    async fetchProxyQrBlob(target) {
      this.fetchProxyQrBlobCalls.push(target)
      return fetchPromise
    },
    stopPolling() {},
    stopCheckoutSession() {},
    async renderQr() {}
  })

  const root = new TestDomNode('root')
  const Comp = createDialogQrisComponent(mockStore)
  const app = createTestApp(Comp)
  app.mount(root)

  await nextTick()

  // 1. Verifikasi initial mount: spinner muncul, img belum ada
  assert.ok(
    root.querySelector('.q-spinner-tail'),
    'Spinner harus tampil selama Blob dalam antrean pengambilan'
  )
  assert.strictEqual(
    root.querySelector('img[alt="QRIS Midtrans Sandbox"]'),
    null,
    'Elemen img tidak boleh dirender sebelum Blob selesai dimuat'
  )
  assert.strictEqual(mockStore.fetchProxyQrBlobCalls.length, 1)

  // 2. Mock Blob selesai dimuat (Axios HTTP 200 PNG valid -> URL.createObjectURL)
  const mockBlobUrl = 'blob:http://localhost:9000/mock-qris-attempt-32'
  resolveProxyFetch(mockBlobUrl)

  // Tunggu flush microtasks dan Vue reactive tick
  await new Promise(r => setTimeout(r, 10))
  await nextTick()

  // 3. Verifikasi transisi: spinner hilang, img muncul dengan src Blob valid
  assert.strictEqual(
    root.querySelector('.q-spinner-tail'),
    null,
    'Spinner harus hilang setelah Blob siap'
  )
  const img = root.querySelector('img[alt="QRIS Midtrans Sandbox"]')
  assert.ok(img, 'Elemen img QRIS Midtrans Sandbox harus dirender')
  assert.strictEqual(img.props.src, mockBlobUrl)
  assert.strictEqual(img.props.alt, 'QRIS Midtrans Sandbox')
  assert.strictEqual(img.props.class, 'qris-img')
})

test('Mount: Polling berulang dengan status pending tidak memicu reload gambar, flickering, atau reset ke spinner', async () => {
  const mockBlobUrl = 'blob:http://localhost:9000/mock-qris-attempt-32'
  let fetchCallCount = 0

  const mockStore = reactive({
    detailDialogOpen: true,
    checkoutPaymentMethod: 'qris',
    checkoutProvider: 'midtrans',
    checkoutLoading: false,
    checkoutQrLoading: false,
    checkoutQrUrl: null,
    checkoutQrImageUrl: '/api/v1/admin/payment-attempts/32/qr-image',
    checkoutExpiresAt: new Date(Date.now() + 900000).toISOString(),
    checkoutRemainingSeconds: 900,
    checkoutIsExpired: false,
    checkoutAttempt: {
      id: 32,
      status: 'pending',
      provider: 'midtrans',
      payment_method: 'qris'
    },
    selectedInvoice: {
      id: 10,
      status: 'pending',
      payment_attempts: [
        {
          id: 32,
          attempt_number: 1,
          status: 'pending',
          provider: 'midtrans',
          qr_image_url: '/api/v1/admin/payment-attempts/32/qr-image'
        }
      ]
    },
    revokedBlobUrls: [],
    async fetchProxyQrBlob() {
      fetchCallCount++
      return mockBlobUrl
    },
    stopPolling() {},
    stopCheckoutSession() {},
    async renderQr() {}
  })

  const root = new TestDomNode('root')
  const Comp = createDialogQrisComponent(mockStore)
  const app = createTestApp(Comp)
  app.mount(root)

  await new Promise(r => setTimeout(r, 10))
  await nextTick()

  // Pastikan sudah tampil gambar
  assert.strictEqual(fetchCallCount, 1)
  assert.ok(root.querySelector('img[alt="QRIS Midtrans Sandbox"]'))

  // Simulasi 5 polling responses beruntun (status pending tetap sama)
  for (let poll = 1; poll <= 5; poll++) {
    // Polling memperbarui invoice object
    mockStore.selectedInvoice = {
      id: 10,
      status: 'pending',
      payment_attempts: [
        {
          id: 32,
          attempt_number: 1,
          status: 'pending',
          provider: 'midtrans',
          qr_image_url: '/api/v1/admin/payment-attempts/32/qr-image'
        }
      ]
    }
    await nextTick()

    // Img tetap ada, spinner tidak muncul, tidak ada fetch ganda
    assert.strictEqual(
      root.querySelector('.q-spinner-tail'),
      null,
      `Polling #${poll} tidak boleh memunculkan spinner kembali`
    )
    const img = root.querySelector('img[alt="QRIS Midtrans Sandbox"]')
    assert.ok(img, `Polling #${poll} mempertahankan elemen img`)
    assert.strictEqual(img.props.src, mockBlobUrl)
  }

  assert.strictEqual(
    fetchCallCount,
    1,
    'Fetch proxy harus tetap tepat 1 kali sepanjang polling pending'
  )
  assert.strictEqual(
    mockStore.revokedBlobUrls.length,
    0,
    'Object URL tidak boleh dicabut selama polling'
  )
})

test('Mount: Kegagalan proxy menyelesaikan loading dan beralih ke fallback tanpa terjebak spinner', async () => {
  let renderQrCalled = false
  const mockStore = reactive({
    detailDialogOpen: true,
    checkoutPaymentMethod: 'qris',
    checkoutProvider: 'midtrans',
    checkoutLoading: false,
    checkoutQrLoading: false,
    checkoutQrDataUrl: null,
    checkoutQrPayload: '00020101021226...MOCKEMVCO...',
    checkoutQrImageUrl: '/api/v1/admin/payment-attempts/32/qr-image',
    checkoutExpiresAt: new Date(Date.now() + 900000).toISOString(),
    checkoutRemainingSeconds: 900,
    checkoutIsExpired: false,
    checkoutAttempt: {
      id: 32,
      status: 'pending',
      provider: 'midtrans',
      payment_method: 'qris'
    },
    selectedInvoice: {
      id: 10,
      status: 'pending',
      payment_attempts: [
        {
          id: 32,
          attempt_number: 1,
          status: 'pending',
          provider: 'midtrans',
          qr_image_url: '/api/v1/admin/payment-attempts/32/qr-image'
        }
      ]
    },
    revokedBlobUrls: [],
    async fetchProxyQrBlob() {
      // Mock proxy error (e.g. 500 atau empty blob)
      return null
    },
    stopPolling() {},
    stopCheckoutSession() {},
    async renderQr() {
      renderQrCalled = true
      this.checkoutQrDataUrl = 'data:image/png;base64,mockCanvasFallback'
    }
  })

  const root = new TestDomNode('root')
  const Comp = createDialogQrisComponent(mockStore)
  const app = createTestApp(Comp)
  app.mount(root)

  await new Promise(r => setTimeout(r, 10))
  await nextTick()

  // Spinner harus berhenti
  assert.strictEqual(
    root.querySelector('.q-spinner-tail'),
    null,
    'Spinner tidak boleh terjebak saat proxy gagal'
  )
  assert.strictEqual(renderQrCalled, true, 'Render fallback harus dipanggil')

  // Gambar fallback muncul
  const fallbackImg = root.querySelector('img[alt="QRIS Midtrans Sandbox"]')
  assert.ok(fallbackImg, 'Gambar fallback canvas harus dirender')
  assert.strictEqual(
    fallbackImg.props.src,
    'data:image/png;base64,mockCanvasFallback'
  )
})

test('Mount: Pergantian attempt (Attempt 31 -> 32) mencabut Blob lama, fetch attempt baru, dan mencegah race condition', async () => {
  let resolve31
  let resolve32
  const p31 = new Promise(r => {
    resolve31 = r
  })
  const p32 = new Promise(r => {
    resolve32 = r
  })

  const mockStore = reactive({
    detailDialogOpen: true,
    checkoutPaymentMethod: 'qris',
    checkoutProvider: 'midtrans',
    checkoutLoading: false,
    checkoutQrLoading: false,
    checkoutQrUrl: null,
    checkoutQrImageUrl: '/api/v1/admin/payment-attempts/31/qr-image',
    checkoutExpiresAt: new Date(Date.now() + 900000).toISOString(),
    checkoutRemainingSeconds: 900,
    checkoutIsExpired: false,
    checkoutAttempt: {
      id: 31,
      status: 'pending',
      provider: 'midtrans',
      payment_method: 'qris'
    },
    selectedInvoice: {
      id: 10,
      status: 'pending',
      payment_attempts: [
        {
          id: 31,
          attempt_number: 1,
          status: 'pending',
          provider: 'midtrans',
          qr_image_url: '/api/v1/admin/payment-attempts/31/qr-image'
        }
      ]
    },
    revokedBlobUrls: [],
    async fetchProxyQrBlob(target) {
      if (String(target).includes('31')) return p31
      if (String(target).includes('32')) return p32
      return null
    },
    stopPolling() {},
    stopCheckoutSession() {},
    async renderQr() {}
  })

  const root = new TestDomNode('root')
  const Comp = createDialogQrisComponent(mockStore)
  const app = createTestApp(Comp)
  app.mount(root)

  await nextTick()
  assert.ok(root.querySelector('.q-spinner-tail'))

  // Selesaikan attempt 31
  resolve31('blob:attempt-31')
  await new Promise(r => setTimeout(r, 10))
  await nextTick()

  const img31 = root.querySelector('img[alt="QRIS Midtrans Sandbox"]')
  assert.ok(img31)
  assert.strictEqual(img31.props.src, 'blob:attempt-31')

  // Ganti ke Attempt 32
  mockStore.checkoutQrImageUrl = '/api/v1/admin/payment-attempts/32/qr-image'
  mockStore.checkoutAttempt = {
    id: 32,
    status: 'pending',
    provider: 'midtrans',
    payment_method: 'qris'
  }
  mockStore.selectedInvoice = {
    id: 10,
    status: 'pending',
    payment_attempts: [
      {
        id: 32,
        attempt_number: 2,
        status: 'pending',
        provider: 'midtrans',
        qr_image_url: '/api/v1/admin/payment-attempts/32/qr-image'
      },
      {
        id: 31,
        attempt_number: 1,
        status: 'failed',
        provider: 'midtrans',
        qr_image_url: '/api/v1/admin/payment-attempts/31/qr-image'
      }
    ]
  }

  await nextTick()

  // Blob attempt 31 harus dicabut
  assert.ok(
    mockStore.revokedBlobUrls.includes('blob:attempt-31'),
    'Object URL attempt 31 harus dicabut saat beralih ke 32'
  )
  // Spinner aktif untuk attempt 32
  assert.ok(
    root.querySelector('.q-spinner-tail'),
    'Spinner harus aktif menunggu attempt 32'
  )

  // Selesaikan attempt 32
  resolve32('blob:attempt-32')
  await new Promise(r => setTimeout(r, 10))
  await nextTick()

  // Img attempt 32 muncul
  const img32 = root.querySelector('img[alt="QRIS Midtrans Sandbox"]')
  assert.ok(img32)
  assert.strictEqual(img32.props.src, 'blob:attempt-32')
})

test('Mount: checkoutRemainingSeconds 0 awal saat dialog dibuka dengan checkoutExpiresAt masa depan tidak memicu false expiry', async () => {
  let sessionStopped = false
  const mockBlobUrl = 'blob:http://localhost:9000/mock-qris-attempt-32'

  const mockStore = reactive({
    detailDialogOpen: true,
    checkoutPaymentMethod: 'qris',
    checkoutProvider: 'midtrans',
    checkoutLoading: false,
    checkoutQrLoading: false,
    checkoutQrUrl: null,
    checkoutQrImageUrl: '/api/v1/admin/payment-attempts/32/qr-image',
    checkoutExpiresAt: new Date(Date.now() + 900000).toISOString(), // 15 menit ke depan
    checkoutRemainingSeconds: 0, // Awal 0 sebelum countdown jalan
    checkoutIsExpired: false,
    checkoutAttempt: {
      id: 32,
      status: 'pending',
      provider: 'midtrans',
      payment_method: 'qris'
    },
    selectedInvoice: {
      id: 10,
      status: 'pending',
      payment_attempts: [
        {
          id: 32,
          attempt_number: 1,
          status: 'pending',
          provider: 'midtrans',
          qr_image_url: '/api/v1/admin/payment-attempts/32/qr-image'
        }
      ]
    },
    revokedBlobUrls: [],
    async fetchProxyQrBlob() {
      return mockBlobUrl
    },
    stopPolling() {},
    stopCheckoutSession() {
      sessionStopped = true
    },
    async renderQr() {}
  })

  const root = new TestDomNode('root')
  const Comp = createDialogQrisComponent(mockStore)
  const app = createTestApp(Comp)
  app.mount(root)

  await new Promise(r => setTimeout(r, 10))
  await nextTick()

  // Sesi TIDAK boleh dibatalkan oleh false expiry
  assert.strictEqual(
    sessionStopped,
    false,
    'Sesi tidak boleh dibatalkan saat baru dibuka'
  )
  // Img berhasil dirender
  const img = root.querySelector('img[alt="QRIS Midtrans Sandbox"]')
  assert.ok(
    img,
    'Gambar harus berhasil dirender tanpa terhenti oleh false expiry'
  )
  assert.strictEqual(img.props.src, mockBlobUrl)
})
