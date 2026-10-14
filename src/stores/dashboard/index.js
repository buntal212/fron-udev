import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    loading: false,
    dateRange: '',
    summary: {
      applications: 3,
      customers: 3,
      activeSubscriptions: 2,
      unpaidInvoices: 2,
      verifiedPayments: 5250000,
      pendingPayments: 1
    },
    paymentTrend: [
      { label: 'Mei', value: 42 },
      { label: 'Jun', value: 55 },
      { label: 'Jul', value: 48 },
      { label: 'Agu', value: 70 },
      { label: 'Sep', value: 62 },
      { label: 'Okt', value: 88 }
    ],
    recentInvoices: [
      {
        number: 'INV-DEMO-003',
        customer: 'Warung B (DEMO)',
        application: 'Larissama',
        amount: 1250000,
        status: 'Menunggu verifikasi'
      },
      {
        number: 'INV-DEMO-002',
        customer: 'Warung A (DEMO)',
        application: 'SI RUKEM',
        amount: 750000,
        status: 'Belum dibayar'
      },
      {
        number: 'INV-DEMO-001',
        customer: 'Desa Rowo Leces (DEMO)',
        application: 'SI RUKEM',
        amount: 3250000,
        status: 'Terverifikasi'
      }
    ]
  })
})
