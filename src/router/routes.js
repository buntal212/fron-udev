const routes = [
  {
    path: '/login',
    component: () => import('@/pages/Login/IndexPage.vue'),
    meta: { guestOnly: true }
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
        path: 'pelanggan-aplikasi',
        component: () => import('@/pages/PelangganAplikasi/IndexPage.vue')
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
