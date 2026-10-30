const routes = [
  {
    path: '/login',
    component: () => import('@/pages/Login/IndexPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/payment',
    component: () => import('@/layouts/PaymentResultLayout.vue'),
    children: [
      {
        path: 'result',
        component: () => import('@/pages/PaymentResult/IndexPage.vue')
      },
      {
        path: 'sandbox-result',
        component: () => import('@/pages/SandboxPaymentResult/IndexPage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/pages/Dashboard/IndexPage.vue') },
      {
        path: 'aplikasi',
        component: () => import('@/pages/Aplikasi/IndexPage.vue')
      },
      {
        path: 'mitra-mandiri',
        component: () => import('@/pages/MitraMandiri/IndexPage.vue')
      },
      {
        path: 'referral',
        component: () => import('@/pages/Referral/IndexPage.vue')
      },
      {
        path: 'pelanggan-aplikasi',
        component: () => import('@/pages/PelangganAplikasi/IndexPage.vue')
      },
      {
        path: 'paket-langganan',
        component: () => import('@/pages/PaketLangganan/IndexPage.vue')
      },
      {
        path: 'langganan-pelanggan',
        component: () => import('@/pages/LanggananPelanggan/IndexPage.vue')
      },
      {
        path: 'invoice',
        component: () => import('@/pages/Invoice/IndexPage.vue')
      },
      {
        path: 'riwayat-pembayaran',
        component: () => import('@/pages/RiwayatPembayaran/IndexPage.vue')
      },
      {
        path: 'payment-gateway',
        component: () => import('@/pages/PaymentGateway/IndexPage.vue')
      },
      {
        path: 'payment-gateway-dana',
        redirect: '/payment-gateway'
      },
      {
        path: 'payment-gateway-doku',
        component: () => import('@/pages/PaymentGatewayDoku/IndexPage.vue')
      },
      {
        path: 'payment-gateway/doku',
        redirect: '/payment-gateway-doku'
      },
      { path: 'merchant', redirect: '/aplikasi' }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes
