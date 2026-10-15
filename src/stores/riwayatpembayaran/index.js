import { defineStore } from 'pinia'
import {
  applicationCustomerService,
  applicationService,
  invoiceService,
  paymentAttemptService
} from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'

export const useRiwayatPembayaranStore = defineStore('riwayat-pembayaran', {
  state: () => ({
    items: [],
    applications: [],
    customers: [],
    invoices: [],
    loading: false,
    error: null,
    applicationId: null,
    customerId: null,
    invoiceId: null,
    provider: null,
    status: null,
    pagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0,
      sortBy: 'created_at',
      descending: true
    },
    detailDialogOpen: false,
    detailLoading: false,
    selectedAttempt: null
  }),

  actions: {
    async fetchApplications() {
      try {
        const response = await applicationService.list({
          per_page: 100,
          sort: 'name',
          direction: 'asc'
        })
        this.applications = response.data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    },

    async fetchCustomers() {
      try {
        const response = await applicationCustomerService.list({
          per_page: 100,
          application_id: this.applicationId || undefined,
          is_active: true,
          sort: 'name',
          direction: 'asc'
        })
        this.customers = response.data.data
      } catch (error) {
        this.customers = []
        this.error = getApiErrorMessage(error)
      }
    },

    async fetchInvoicesForFilter() {
      try {
        const response = await invoiceService.list({
          per_page: 100,
          application_id: this.applicationId || undefined,
          application_customer_id: this.customerId || undefined,
          sort: 'created_at',
          direction: 'desc'
        })
        this.invoices = response.data.data
      } catch (error) {
        this.invoices = []
        this.error = getApiErrorMessage(error)
      }
    },

    async onApplicationChanged() {
      this.customerId = null
      this.invoiceId = null
      await this.fetchCustomers()
      await this.fetchInvoicesForFilter()
      await this.fetchPaymentAttempts({ page: 1 })
    },

    async onCustomerChanged() {
      this.invoiceId = null
      await this.fetchInvoicesForFilter()
      await this.fetchPaymentAttempts({ page: 1 })
    },

    async fetchPaymentAttempts(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }

      try {
        const response = await paymentAttemptService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          application_id: this.applicationId || undefined,
          application_customer_id: this.customerId || undefined,
          invoice_id: this.invoiceId || undefined,
          provider: this.provider || undefined,
          status: this.status || undefined,
          sort: this.pagination.sortBy || 'created_at',
          direction: this.pagination.descending ? 'desc' : 'asc'
        })
        const { data, meta } = response.data

        this.items = data
        this.pagination = {
          ...this.pagination,
          page: meta.current_page,
          rowsPerPage: meta.per_page,
          rowsNumber: meta.total
        }
      } catch (error) {
        this.items = []
        this.error = getApiErrorMessage(error)
      } finally {
        this.loading = false
      }
    },

    async openDetailDialog(paymentAttempt) {
      this.detailDialogOpen = true
      this.detailLoading = true
      this.selectedAttempt = null

      try {
        const response = await paymentAttemptService.get(paymentAttempt.id)
        this.selectedAttempt = response.data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    }
  }
})
