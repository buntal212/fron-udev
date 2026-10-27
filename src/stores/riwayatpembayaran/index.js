import { defineStore } from 'pinia'
import {
  applicationCustomerService,
  applicationService,
  invoiceService,
  paymentAttemptService
} from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'
import {
  formatRetryAfter,
  getRetryAfterMilliseconds
} from '@/utils/subscription'

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
    selectedAttempt: null,
    retryCheckoutLoading: false,
    retryCheckoutError: '',
    retryCheckoutMessage: '',
    retryCheckoutBlockedUntil: 0,
    recoverSubscriptionLoading: false,
    recoverSubscriptionError: '',
    recoverSubscriptionBlockedUntil: 0,
    syncLoading: false,
    syncError: '',
    syncBlockedUntil: 0
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
      this.retryCheckoutError = ''
      this.retryCheckoutMessage = ''
      this.retryCheckoutBlockedUntil = 0
      this.recoverSubscriptionError = ''
      this.recoverSubscriptionBlockedUntil = 0
      this.syncError = ''
      this.syncBlockedUntil = 0

      try {
        const response = await paymentAttemptService.get(paymentAttempt.id)
        this.selectedAttempt = response.data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    },

    async synchronizeSelected() {
      if (
        this.syncLoading ||
        !this.selectedAttempt?.id ||
        Date.now() < this.syncBlockedUntil
      ) {
        return
      }

      this.syncLoading = true
      this.syncError = ''

      try {
        const response = await paymentAttemptService.reconcile(
          this.selectedAttempt.id
        )
        this.selectedAttempt = response.data.data
        const index = this.items.findIndex(
          item => item.id === this.selectedAttempt.id
        )
        if (index >= 0) this.items[index] = this.selectedAttempt
      } catch (error) {
        this.syncError = getApiErrorMessage(error)
        const retryAfter = getRetryAfterMilliseconds(error)
        if (error.response?.status === 429 && retryAfter > 0) {
          this.syncBlockedUntil = Date.now() + retryAfter
          this.syncError = `${this.syncError} Coba lagi dalam ${formatRetryAfter(retryAfter)}.`
          if (typeof window !== 'undefined') {
            window.setTimeout(() => {
              this.syncBlockedUntil = 0
            }, retryAfter)
          }
        }
      } finally {
        this.syncLoading = false
      }
    },

    async retryCheckoutSelected() {
      if (
        this.retryCheckoutLoading ||
        !this.selectedAttempt?.id ||
        this.selectedAttempt.checkout?.status !== 'failed' ||
        Date.now() < this.retryCheckoutBlockedUntil
      ) {
        return
      }

      this.retryCheckoutLoading = true
      this.retryCheckoutError = ''
      this.retryCheckoutMessage = ''

      try {
        const response = await paymentAttemptService.retryCheckout(
          this.selectedAttempt.id
        )
        this.selectedAttempt = response.data.data
        const index = this.items.findIndex(
          item => item.id === this.selectedAttempt.id
        )
        if (index >= 0) this.items[index] = this.selectedAttempt

        const checkoutUrl = this.selectedAttempt.checkout_url
        if (typeof checkoutUrl === 'string' && checkoutUrl) {
          try {
            if (
              new URL(checkoutUrl).protocol === 'https:' &&
              typeof window !== 'undefined'
            ) {
              window.location.assign(checkoutUrl)
              return
            }
          } catch {
            // Fall through to the safe error below.
          }
        }

        const paymentCode =
          this.selectedAttempt.payment_code ||
          this.selectedAttempt.payment_instruction?.payment_code
        if (typeof paymentCode === 'string' && paymentCode) {
          this.retryCheckoutMessage =
            'Checkout parsial berhasil dipulihkan. Instruksi pembayaran tersedia pada detail invoice; status tetap menunggu konfirmasi gateway.'
          return
        }

        this.retryCheckoutError =
          this.selectedAttempt.checkout?.status === 'processing'
            ? 'Checkout sedang diproses. Buka detail lagi beberapa saat kemudian.'
            : 'Retry checkout belum menghasilkan tautan yang aman. Silakan coba lagi nanti.'
      } catch (error) {
        this.retryCheckoutError = getApiErrorMessage(error)
        const retryAfter = getRetryAfterMilliseconds(error)
        if (error.response?.status === 429 && retryAfter > 0) {
          this.retryCheckoutBlockedUntil = Date.now() + retryAfter
          this.retryCheckoutError = `${this.retryCheckoutError} Coba lagi dalam ${formatRetryAfter(retryAfter)}.`
          if (typeof window !== 'undefined') {
            window.setTimeout(() => {
              this.retryCheckoutBlockedUntil = 0
            }, retryAfter)
          }
        }
      } finally {
        this.retryCheckoutLoading = false
      }
    },

    async recoverSubscriptionSelected() {
      if (
        this.recoverSubscriptionLoading ||
        !this.selectedAttempt?.invoice?.id ||
        this.selectedAttempt.invoice.status !== 'paid' ||
        this.selectedAttempt.invoice.subscription ||
        !this.selectedAttempt.settlement ||
        Date.now() < this.recoverSubscriptionBlockedUntil
      ) {
        return
      }

      this.recoverSubscriptionLoading = true
      this.recoverSubscriptionError = ''

      try {
        const response = await invoiceService.recoverSubscription(
          this.selectedAttempt.invoice.id
        )
        const recoveredInvoice = response.data.data
        this.selectedAttempt = {
          ...this.selectedAttempt,
          invoice: {
            ...this.selectedAttempt.invoice,
            ...recoveredInvoice,
            subscription: recoveredInvoice.subscription || null
          }
        }
        const index = this.items.findIndex(
          item => item.id === this.selectedAttempt.id
        )
        if (index >= 0) this.items[index] = this.selectedAttempt
      } catch (error) {
        this.recoverSubscriptionError = getApiErrorMessage(error)
        const retryAfter = getRetryAfterMilliseconds(error)
        if (error.response?.status === 429 && retryAfter > 0) {
          this.recoverSubscriptionBlockedUntil = Date.now() + retryAfter
          this.recoverSubscriptionError = `${this.recoverSubscriptionError} Coba lagi dalam ${formatRetryAfter(retryAfter)}.`
          if (typeof window !== 'undefined') {
            window.setTimeout(() => {
              this.recoverSubscriptionBlockedUntil = 0
            }, retryAfter)
          }
        }
      } finally {
        this.recoverSubscriptionLoading = false
      }
    }
  }
})
