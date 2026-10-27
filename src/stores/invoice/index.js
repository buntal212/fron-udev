import { defineStore } from 'pinia'
import QRCode from 'qrcode'
import {
  applicationCustomerService,
  applicationService,
  invoiceService,
  paymentResultService,
  subscriptionPlanService,
  subscriptionService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const isQrisPayload = value =>
  typeof value === 'string' && value.trim().startsWith('00020101')

const emptyForm = () => ({
  application_id: null,
  application_customer_id: null,
  subscription_plan_id: null,
  subscription_id: null,
  period_count: 1,
  due_at: ''
})

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `invoice-${crypto.randomUUID()}`
  }

  return `invoice-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

const isSecureCheckoutUrl = value => {
  if (typeof value !== 'string' || !value) return false

  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

async function fetchAllPages(request) {
  const records = []
  let page = 1
  let lastPage = 1

  do {
    const response = await request(page)
    const payload = response.data

    if (Array.isArray(payload?.data)) {
      records.push(...payload.data)
    }

    lastPage = Math.max(page, Number(payload?.meta?.last_page) || page)
    page += 1
  } while (page <= lastPage)

  return records
}

export const useInvoiceStore = defineStore('invoice', {
  state: () => ({
    items: [],
    applications: [],
    listCustomers: [],
    formCustomers: [],
    plans: [],
    subscriptions: [],
    applicationsLoading: false,
    formCustomersLoading: false,
    plansLoading: false,
    subscriptionsLoading: false,
    applicationsError: '',
    formCustomersError: '',
    plansError: '',
    subscriptionsError: '',
    formLookupVersion: 0,
    loading: false,
    error: null,
    applicationId: null,
    customerId: null,
    status: null,
    pagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0,
      sortBy: 'created_at',
      descending: true
    },
    form: emptyForm(),
    formErrors: {},
    formMessage: '',
    formDialogOpen: false,
    saving: false,
    idempotencyKey: '',
    detailDialogOpen: false,
    detailLoading: false,
    selectedInvoice: null,
    checkoutLoading: false,
    checkoutError: '',
    checkoutAttempt: null,
    checkoutUrl: null,
    checkoutIdempotencyKey: null,
    checkoutPaymentMethod: 'qris',
    checkoutQrDataUrl: null,
    checkoutQrPayload: null,
    checkoutPaymentCode: null,
    checkoutQrLoading: false,
    checkoutQrError: null,
    checkoutExpiresAt: null,
    checkoutRemainingSeconds: 0,
    checkoutTimerId: null,
    checkoutPollId: null,
    reconcileLoading: false,
    reconcileError: '',
    simulateLoading: false,
    simulateError: '',
    simulateMessage: ''
  }),

  actions: {
    async fetchApplications() {
      this.applicationsLoading = true
      this.applicationsError = ''

      try {
        this.applications = await fetchAllPages(page =>
          applicationService.list({
            page,
            per_page: 100,
            sort: 'name',
            direction: 'asc'
          })
        )
      } catch (error) {
        this.applications = []
        this.applicationsError = getApiErrorMessage(error)
      } finally {
        this.applicationsLoading = false
      }
    },

    async fetchListCustomers() {
      try {
        const response = await applicationCustomerService.list({
          per_page: 100,
          application_id: this.applicationId || undefined,
          is_active: true,
          sort: 'name',
          direction: 'asc'
        })
        this.listCustomers = response.data.data
      } catch (error) {
        this.listCustomers = []
        this.error = getApiErrorMessage(error)
      }
    },

    async fetchFormCustomers(
      applicationId = this.form.application_id,
      lookupVersion = this.formLookupVersion
    ) {
      if (!applicationId) {
        this.formCustomers = []
        return
      }

      this.formCustomersLoading = true
      this.formCustomersError = ''

      try {
        const customers = await fetchAllPages(page =>
          applicationCustomerService.list({
            page,
            per_page: 100,
            application_id: applicationId,
            is_active: true,
            sort: 'name',
            direction: 'asc'
          })
        )

        if (
          this.formLookupVersion === lookupVersion &&
          this.form.application_id === applicationId
        ) {
          this.formCustomers = customers
        }
      } catch (error) {
        if (this.formLookupVersion === lookupVersion) {
          this.formCustomers = []
          this.formCustomersError = getApiErrorMessage(error)
        }
      } finally {
        if (this.formLookupVersion === lookupVersion) {
          this.formCustomersLoading = false
        }
      }
    },

    async fetchPlans(
      applicationId = this.form.application_id,
      lookupVersion = this.formLookupVersion
    ) {
      if (!applicationId) {
        this.plans = []
        return
      }

      this.plansLoading = true
      this.plansError = ''

      try {
        const plans = await fetchAllPages(page =>
          subscriptionPlanService.list({
            page,
            per_page: 100,
            application_id: applicationId,
            is_active: true,
            sort: 'name',
            direction: 'asc'
          })
        )

        if (
          this.formLookupVersion === lookupVersion &&
          this.form.application_id === applicationId
        ) {
          this.plans = plans
        }
      } catch (error) {
        if (this.formLookupVersion === lookupVersion) {
          this.plans = []
          this.plansError = getApiErrorMessage(error)
        }
      } finally {
        if (this.formLookupVersion === lookupVersion) {
          this.plansLoading = false
        }
      }
    },

    async fetchSubscriptionsForForm(
      applicationId = this.form.application_id,
      customerId = this.form.application_customer_id,
      planId = null,
      lookupVersion = this.formLookupVersion
    ) {
      if (!applicationId || !customerId) {
        this.subscriptions = []
        return
      }

      this.subscriptionsLoading = true
      this.subscriptionsError = ''

      try {
        const subscriptions = await fetchAllPages(page =>
          subscriptionService.list({
            page,
            per_page: 100,
            application_id: applicationId,
            application_customer_id: customerId,
            sort: 'expires_at',
            direction: 'desc'
          })
        )

        if (
          this.formLookupVersion === lookupVersion &&
          this.form.application_id === applicationId &&
          this.form.application_customer_id === customerId
        ) {
          this.subscriptions = subscriptions
        }
      } catch (error) {
        if (this.formLookupVersion === lookupVersion) {
          this.subscriptions = []
          this.subscriptionsError = getApiErrorMessage(error)
        }
      } finally {
        if (this.formLookupVersion === lookupVersion) {
          this.subscriptionsLoading = false
        }
      }
    },

    async fetchInvoices(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }

      try {
        const response = await invoiceService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          application_id: this.applicationId || undefined,
          application_customer_id: this.customerId || undefined,
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

    async onListApplicationChanged() {
      this.customerId = null
      await this.fetchListCustomers()
      await this.fetchInvoices({ page: 1 })
    },

    async openCreateDialog() {
      this.formLookupVersion += 1
      this.form = emptyForm()
      this.formErrors = {}
      this.formMessage = ''
      this.formCustomers = []
      this.plans = []
      this.subscriptions = []
      this.formCustomersError = ''
      this.plansError = ''
      this.subscriptionsError = ''
      this.idempotencyKey = createIdempotencyKey()
      this.formDialogOpen = true

      if (!this.applications.length && !this.applicationsLoading) {
        await this.fetchApplications()
      }
    },

    async onFormApplicationChanged() {
      const applicationId = this.form.application_id
      const lookupVersion = ++this.formLookupVersion
      this.form.application_customer_id = null
      this.form.subscription_plan_id = null
      this.form.subscription_id = null
      this.formErrors = {}
      this.formCustomers = []
      this.plans = []
      this.subscriptions = []
      this.formCustomersError = ''
      this.plansError = ''
      this.subscriptionsError = ''

      if (!applicationId) return

      await Promise.all([
        this.fetchFormCustomers(applicationId, lookupVersion),
        this.fetchPlans(applicationId, lookupVersion)
      ])
    },

    async onFormCustomerChanged() {
      const applicationId = this.form.application_id
      const customerId = this.form.application_customer_id
      const lookupVersion = ++this.formLookupVersion
      this.form.subscription_id = null
      this.subscriptions = []
      this.subscriptionsError = ''
      await this.fetchSubscriptionsForForm(
        applicationId,
        customerId,
        null,
        lookupVersion
      )
    },

    async onFormPlanChanged() {
      const applicationId = this.form.application_id
      const customerId = this.form.application_customer_id
      const lookupVersion = ++this.formLookupVersion
      this.form.subscription_id = null
      this.subscriptions = []
      this.subscriptionsError = ''
      await this.fetchSubscriptionsForForm(
        applicationId,
        customerId,
        null,
        lookupVersion
      )
    },

    retryFormCustomers() {
      return this.fetchFormCustomers(
        this.form.application_id,
        this.formLookupVersion
      )
    },

    retryPlans() {
      return this.fetchPlans(this.form.application_id, this.formLookupVersion)
    },

    retrySubscriptions() {
      return this.fetchSubscriptionsForForm(
        this.form.application_id,
        this.form.application_customer_id,
        this.form.subscription_plan_id,
        this.formLookupVersion
      )
    },

    async saveInvoice() {
      this.saving = true
      this.formErrors = {}
      this.formMessage = ''

      try {
        await invoiceService.create(
          {
            application_customer_id: this.form.application_customer_id,
            subscription_plan_id: this.form.subscription_plan_id,
            subscription_id: this.form.subscription_id || null,
            period_count: this.form.period_count,
            due_at: this.form.due_at
          },
          { 'Idempotency-Key': this.idempotencyKey }
        )

        this.formDialogOpen = false
        await this.fetchInvoices()
      } catch (error) {
        this.formErrors = getApiValidationErrors(error)
        this.formMessage =
          this.formErrors.invoice?.[0] ||
          (Object.keys(this.formErrors).length ? '' : getApiErrorMessage(error))
      } finally {
        this.saving = false
      }
    },

    applicationName(invoice) {
      const applicationId =
        invoice.customer?.application_id || invoice.plan?.application_id
      return (
        this.applications.find(application => application.id === applicationId)
          ?.name || '—'
      )
    },

    stopCheckoutSession() {
      if (this.checkoutTimerId) {
        clearInterval(this.checkoutTimerId)
        this.checkoutTimerId = null
      }
      if (this.checkoutPollId) {
        clearInterval(this.checkoutPollId)
        this.checkoutPollId = null
      }
    },

    startCountdown(expiresAt) {
      if (this.checkoutTimerId) {
        clearInterval(this.checkoutTimerId)
        this.checkoutTimerId = null
      }
      const calculate = () => {
        const ms = new Date(expiresAt).getTime() - Date.now()
        this.checkoutRemainingSeconds = Math.max(0, Math.floor(ms / 1000))
        if (this.checkoutRemainingSeconds <= 0 && this.checkoutTimerId) {
          clearInterval(this.checkoutTimerId)
          this.checkoutTimerId = null
        }
      }
      calculate()
      if (this.checkoutRemainingSeconds > 0) {
        this.checkoutTimerId = setInterval(calculate, 1000)
      }
    },

    startPolling() {
      if (this.checkoutPollId) {
        clearInterval(this.checkoutPollId)
        this.checkoutPollId = null
      }
      this.checkoutPollId = setInterval(async () => {
        if (!this.selectedInvoice?.id || !this.detailDialogOpen) {
          this.stopCheckoutSession()
          return
        }
        try {
          const latestAttempt = Array.isArray(
            this.selectedInvoice?.payment_attempts
          )
            ? [...this.selectedInvoice.payment_attempts].sort(
                (a, b) => b.attempt_number - a.attempt_number
              )[0]
            : null
          const gatewayPaymentId =
            this.checkoutAttempt?.gateway_payment_id ||
            latestAttempt?.gateway_payment_id

          if (gatewayPaymentId) {
            const resultRes = await paymentResultService.get(gatewayPaymentId)
            const resultStatus = resultRes.data?.data?.status
            if (resultStatus === 'paid') {
              this.stopCheckoutSession()
              const invoiceRes = await invoiceService.get(
                this.selectedInvoice.id
              )
              this.selectedInvoice =
                invoiceRes.data?.data || this.selectedInvoice
              const index = this.items.findIndex(
                item => item.id === this.selectedInvoice.id
              )
              if (index !== -1) {
                this.items[index] = this.selectedInvoice
              }
              this.checkoutQrPayload = null
              this.checkoutQrDataUrl = null
              this.checkoutPaymentCode = null
              return
            } else if (
              resultStatus === 'failed' ||
              resultStatus === 'expired' ||
              resultStatus === 'cancelled'
            ) {
              this.stopCheckoutSession()
              const invoiceRes = await invoiceService.get(
                this.selectedInvoice.id
              )
              this.selectedInvoice =
                invoiceRes.data?.data || this.selectedInvoice
              return
            }
          } else {
            const res = await invoiceService.get(this.selectedInvoice.id)
            this.selectedInvoice = res.data?.data || this.selectedInvoice
            if (this.selectedInvoice.status === 'paid') {
              this.stopCheckoutSession()
              this.checkoutQrPayload = null
              this.checkoutQrDataUrl = null
              this.checkoutPaymentCode = null
            } else if (this.selectedInvoice.status !== 'pending') {
              this.stopCheckoutSession()
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 4000)
    },

    async renderQr(payload) {
      if (!payload) {
        this.checkoutQrDataUrl = null
        return
      }
      this.checkoutQrLoading = true
      this.checkoutQrError = null
      try {
        this.checkoutQrDataUrl = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320
        })
      } catch {
        this.checkoutQrError = 'Gambar QRIS tidak dapat dibuat di browser.'
      } finally {
        this.checkoutQrLoading = false
      }
    },

    closeDetailDialog() {
      this.stopCheckoutSession()
      this.detailDialogOpen = false
    },

    async openDetailDialog(invoice) {
      this.stopCheckoutSession()
      this.detailDialogOpen = true
      this.detailLoading = true
      this.selectedInvoice = null
      this.checkoutError = ''
      this.checkoutAttempt = null
      this.checkoutUrl = null
      this.checkoutPaymentMethod = 'qris'
      this.checkoutQrDataUrl = null
      this.checkoutQrPayload = null
      this.checkoutPaymentCode = null
      this.checkoutQrLoading = false
      this.checkoutQrError = null
      this.checkoutExpiresAt = null
      this.checkoutRemainingSeconds = 0
      this.checkoutIdempotencyKey = createIdempotencyKey()
      this.reconcileLoading = false
      this.reconcileError = ''
      this.simulateLoading = false
      this.simulateError = ''
      this.simulateMessage = ''

      try {
        const response = await invoiceService.get(invoice.id)
        this.selectedInvoice = response.data.data

        const latestAttempt = Array.isArray(
          this.selectedInvoice?.payment_attempts
        )
          ? [...this.selectedInvoice.payment_attempts].sort(
              (a, b) => b.attempt_number - a.attempt_number
            )[0]
          : null

        if (latestAttempt && this.selectedInvoice.status === 'pending') {
          const method =
            latestAttempt.metadata?.payment_method ||
            latestAttempt.payment_method ||
            'qris'
          this.checkoutPaymentMethod = method
          this.checkoutAttempt = latestAttempt
          this.checkoutUrl = latestAttempt.checkout_url || null
          this.checkoutExpiresAt = latestAttempt.checkout_expires_at || null

          const rawPayload =
            latestAttempt.qr_content ||
            latestAttempt.metadata?.qr_content ||
            latestAttempt.metadata?.payment_code ||
            latestAttempt.checkout_url

          if (
            (method === 'qris' || method.startsWith('va_')) &&
            rawPayload &&
            latestAttempt.status === 'pending'
          ) {
            if (isQrisPayload(rawPayload)) {
              this.checkoutQrPayload = rawPayload
              this.checkoutPaymentCode = null
              await this.renderQr(rawPayload)
            } else {
              this.checkoutQrPayload = null
              this.checkoutQrDataUrl = null
              this.checkoutPaymentCode =
                typeof rawPayload === 'string' ? rawPayload : null
            }
            if (this.checkoutExpiresAt) {
              this.startCountdown(this.checkoutExpiresAt)
              this.startPolling()
            }
          }
        }
      } catch (error) {
        this.error = getApiErrorMessage(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    },

    async startCheckout(method = this.checkoutPaymentMethod) {
      if (
        this.checkoutLoading ||
        !this.selectedInvoice?.id ||
        this.selectedInvoice.status !== 'pending'
      ) {
        return
      }

      this.stopCheckoutSession()
      this.checkoutLoading = true
      this.checkoutError = ''
      this.checkoutUrl = null
      this.checkoutQrDataUrl = null
      this.checkoutQrPayload = null
      this.checkoutPaymentCode = null
      this.checkoutQrError = null
      this.checkoutPaymentMethod = method

      try {
        const response = await invoiceService.checkout(
          this.selectedInvoice.id,
          this.checkoutIdempotencyKey || createIdempotencyKey(),
          { payment_method: method }
        )
        const checkout = response.data?.data || {}
        this.checkoutAttempt = checkout
        this.checkoutUrl = checkout.checkout_url || null
        this.checkoutExpiresAt = checkout.expires_at || null

        const detailResponse = await invoiceService.get(this.selectedInvoice.id)
        this.selectedInvoice = detailResponse.data.data

        if (method === 'dana_wallet') {
          if (
            isSecureCheckoutUrl(this.checkoutUrl) &&
            typeof window !== 'undefined'
          ) {
            window.location.assign(this.checkoutUrl)
            return
          }

          this.checkoutError =
            this.checkoutUrl && !isSecureCheckoutUrl(this.checkoutUrl)
              ? 'Tautan checkout yang diterima tidak aman. Silakan coba lagi atau hubungi administrator.'
              : checkout.checkout_status === 'processing'
                ? 'Checkout sedang disiapkan. Muat detail beberapa saat lagi.'
                : 'Tautan checkout belum tersedia. Silakan coba lagi nanti.'
        } else {
          const rawPayload =
            checkout.qr_content ||
            checkout.payment_code ||
            checkout.checkout_url
          if (rawPayload) {
            if (isQrisPayload(rawPayload)) {
              this.checkoutQrPayload = rawPayload
              this.checkoutPaymentCode = null
              await this.renderQr(rawPayload)
            } else {
              this.checkoutQrPayload = null
              this.checkoutQrDataUrl = null
              this.checkoutPaymentCode =
                typeof rawPayload === 'string' ? rawPayload : null
            }
            if (this.checkoutExpiresAt) {
              this.startCountdown(this.checkoutExpiresAt)
              this.startPolling()
            }
          } else {
            this.checkoutError =
              checkout.checkout_status === 'processing'
                ? 'Kode QRIS sedang disiapkan oleh gateway. Muat beberapa saat lagi.'
                : 'Kode QRIS belum tersedia dari gateway. Coba beberapa saat lagi.'
          }
        }
      } catch (error) {
        this.checkoutError = getApiErrorMessage(error)
      } finally {
        this.checkoutLoading = false
      }
    },

    async retryCheckout() {
      this.stopCheckoutSession()
      this.checkoutIdempotencyKey = createIdempotencyKey()
      this.checkoutQrDataUrl = null
      this.checkoutQrPayload = null
      this.checkoutPaymentCode = null
      this.checkoutError = ''
      await this.startCheckout(this.checkoutPaymentMethod)
    },

    async reconcileInvoice(invoiceId = this.selectedInvoice?.id) {
      if (!invoiceId || this.reconcileLoading) return

      this.reconcileLoading = true
      this.reconcileError = ''
      try {
        const response = await invoiceService.reconcile(invoiceId)
        this.selectedInvoice = response.data.data
        const index = this.items.findIndex(item => item.id === invoiceId)
        if (index !== -1) {
          this.items[index] = response.data.data
        }
      } catch (error) {
        this.reconcileError = getApiErrorMessage(error)
      } finally {
        this.reconcileLoading = false
      }
    },

    async simulateSandboxPayment(
      action = 'paid',
      invoiceId = this.selectedInvoice?.id
    ) {
      if (!invoiceId || this.simulateLoading) return

      this.simulateLoading = true
      this.simulateError = ''
      this.simulateMessage = ''
      try {
        const response = await invoiceService.simulateSandboxPayment(
          invoiceId,
          { action }
        )
        this.selectedInvoice = response.data.data
        this.simulateMessage =
          response.data.test?.message || 'Simulasi berhasil diproses.'
        const index = this.items.findIndex(item => item.id === invoiceId)
        if (index !== -1) {
          this.items[index] = response.data.data
        }
      } catch (error) {
        this.simulateError = getApiErrorMessage(error)
      } finally {
        this.simulateLoading = false
      }
    }
  }
})
