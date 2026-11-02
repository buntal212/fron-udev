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

const isQrisMpmInstruction = instruction =>
  instruction?.type === 'qris_mpm' &&
  typeof instruction.qr_content === 'string' &&
  instruction.qr_content !== ''

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
    loadingMore: false,
    hasMore: true,
    page: 1,
    perPage: 15,
    totalRows: 0,
    fetchVersion: 0,
    sortBy: 'created_at',
    descending: true,
    error: null,
    applicationId: null,
    customerId: null,
    status: null,
    search: '',
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
    checkoutLastMethod: null,
    checkoutLastProvider: null,
    checkoutLastBank: null,
    checkoutPaymentMethod: 'qris',
    checkoutProvider: null,
    checkoutBank: 'bca',
    checkoutQrUrl: null,
    checkoutQrDataUrl: null,
    checkoutQrPayload: null,
    checkoutPaymentCode: null,
    checkoutPaymentInstruction: null,
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

    async resetAndFetchInvoices() {
      this.fetchVersion += 1
      const version = this.fetchVersion
      this.loading = true
      this.loadingMore = false
      this.error = null
      this.page = 1
      this.hasMore = true
      this.items = []

      try {
        const response = await invoiceService.list({
          page: 1,
          per_page: this.perPage,
          application_id: this.applicationId || undefined,
          application_customer_id: this.customerId || undefined,
          status: this.status || undefined,
          search: this.search || undefined,
          sort: this.sortBy || 'created_at',
          direction: this.descending ? 'desc' : 'asc'
        })

        if (version !== this.fetchVersion) return

        const { data, meta } = response.data
        this.items = Array.isArray(data) ? data : []
        this.page = meta?.current_page || 1
        this.totalRows = meta?.total || this.items.length
        this.hasMore = (meta?.current_page || 1) < (meta?.last_page || 1)
        this.pagination = {
          ...this.pagination,
          page: this.page,
          rowsPerPage: this.perPage,
          rowsNumber: this.totalRows,
          sortBy: this.sortBy,
          descending: this.descending
        }
      } catch (error) {
        if (version === this.fetchVersion) {
          this.items = []
          this.error = getApiErrorMessage(error)
        }
      } finally {
        if (version === this.fetchVersion) {
          this.loading = false
        }
      }
    },

    async loadMoreInvoices(done) {
      if (this.loading || this.loadingMore || !this.hasMore) {
        if (typeof done === 'function') done(!this.hasMore)
        return
      }

      this.loadingMore = true
      const targetPage = this.page + 1
      const version = this.fetchVersion

      try {
        const response = await invoiceService.list({
          page: targetPage,
          per_page: this.perPage,
          application_id: this.applicationId || undefined,
          application_customer_id: this.customerId || undefined,
          status: this.status || undefined,
          search: this.search || undefined,
          sort: this.sortBy || 'created_at',
          direction: this.descending ? 'desc' : 'asc'
        })

        if (version !== this.fetchVersion) {
          if (typeof done === 'function') done(!this.hasMore)
          return
        }

        const { data, meta } = response.data
        if (Array.isArray(data) && data.length > 0) {
          const existingIds = new Set(this.items.map(item => item.id))
          const freshItems = data.filter(item => !existingIds.has(item.id))
          this.items.push(...freshItems)
        }

        this.page = meta?.current_page || targetPage
        this.totalRows = meta?.total || this.items.length
        this.hasMore =
          (meta?.current_page || targetPage) < (meta?.last_page || 1)
        this.pagination = {
          ...this.pagination,
          page: this.page,
          rowsPerPage: this.perPage,
          rowsNumber: this.totalRows
        }

        if (typeof done === 'function') {
          done(!this.hasMore)
        }
      } catch (error) {
        if (version === this.fetchVersion) {
          this.error = getApiErrorMessage(error)
        }
        if (typeof done === 'function') {
          done(true)
        }
      } finally {
        this.loadingMore = false
      }
    },

    async fetchInvoices(options = {}) {
      if (options.sortBy) {
        this.sortBy = options.sortBy
        this.pagination.sortBy = options.sortBy
      }
      if (options.descending !== undefined) {
        this.descending = options.descending
        this.pagination.descending = options.descending
      }
      if (options.page && options.page > 1) {
        return this.loadMoreInvoices()
      }
      return this.resetAndFetchInvoices()
    },

    async onListApplicationChanged() {
      this.customerId = null
      await this.fetchListCustomers()
      await this.resetAndFetchInvoices()
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
      this.checkoutProvider = null
      this.checkoutBank = 'bca'
      this.checkoutQrUrl = null
      this.checkoutQrDataUrl = null
      this.checkoutQrPayload = null
      this.checkoutPaymentCode = null
      this.checkoutPaymentInstruction = null
      this.checkoutQrLoading = false
      this.checkoutQrError = null
      this.checkoutExpiresAt = null
      this.checkoutRemainingSeconds = 0
      this.checkoutIdempotencyKey = createIdempotencyKey()
      this.checkoutLastMethod = null
      this.checkoutLastProvider = null
      this.checkoutLastBank = null
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
          this.checkoutProvider = latestAttempt.provider || null
          this.checkoutBank = latestAttempt.metadata?.bank || 'bca'
          this.checkoutAttempt = latestAttempt
          this.checkoutUrl = latestAttempt.checkout_url || null
          this.checkoutExpiresAt = latestAttempt.checkout_expires_at || null
          this.checkoutPaymentInstruction =
            latestAttempt.metadata?.payment_instruction || null

          const qrUrl =
            latestAttempt.qr_url ||
            latestAttempt.metadata?.qr_url ||
            this.checkoutPaymentInstruction?.qr_url ||
            (typeof latestAttempt.checkout_url === 'string' &&
            latestAttempt.checkout_url.includes('qr')
              ? latestAttempt.checkout_url
              : null)
          this.checkoutQrUrl = qrUrl

          const rawPayload = isQrisMpmInstruction(
            this.checkoutPaymentInstruction
          )
            ? this.checkoutPaymentInstruction.qr_content
            : latestAttempt.payment_code ||
              latestAttempt.metadata?.payment_code ||
              latestAttempt.qr_content ||
              latestAttempt.metadata?.qr_content ||
              (latestAttempt.checkout_url &&
              !latestAttempt.checkout_url.startsWith('http')
                ? latestAttempt.checkout_url
                : null)

          if (
            (method === 'qris' ||
              method.startsWith('va_') ||
              method === 'bank_transfer' ||
              method === 'echannel') &&
            latestAttempt.status === 'pending'
          ) {
            if (method === 'qris') {
              if (rawPayload) {
                this.checkoutQrPayload = rawPayload
                this.checkoutPaymentCode = null
                await this.renderQr(rawPayload)
              } else if (qrUrl) {
                this.checkoutQrPayload = null
                this.checkoutPaymentCode = null
              }
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
        } else if (this.selectedInvoice) {
          const gateways = Array.isArray(
            this.selectedInvoice.application_payment_gateways
          )
            ? this.selectedInvoice.application_payment_gateways
            : []
          const hasMidtrans = gateways.some(
            g => g.provider === 'midtrans' && g.is_active
          )
          const hasDana = gateways.some(
            g => g.provider === 'dana' && g.is_active
          )
          if (hasMidtrans && !hasDana) {
            this.checkoutProvider = 'midtrans'
          } else if (hasDana) {
            this.checkoutProvider = 'dana'
          }
        }
      } catch (error) {
        this.error = getApiErrorMessage(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    },

    async startCheckout(
      method = this.checkoutPaymentMethod,
      provider = this.checkoutProvider,
      bank = this.checkoutBank
    ) {
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
      this.checkoutPaymentInstruction = null
      this.checkoutQrError = null
      this.checkoutPaymentMethod = method
      this.checkoutProvider = provider
      this.checkoutBank = bank

      if (
        !this.checkoutIdempotencyKey ||
        this.checkoutLastMethod !== method ||
        this.checkoutLastProvider !== provider ||
        this.checkoutLastBank !== bank
      ) {
        this.checkoutIdempotencyKey = createIdempotencyKey()
        this.checkoutLastMethod = method
        this.checkoutLastProvider = provider
        this.checkoutLastBank = bank
      }

      try {
        const payload = { payment_method: method }
        if (provider) payload.provider = provider
        if (bank) payload.bank = bank

        const response = await invoiceService.checkout(
          this.selectedInvoice.id,
          this.checkoutIdempotencyKey || createIdempotencyKey(),
          payload
        )
        const checkout = response.data?.data || {}
        this.checkoutAttempt = checkout
        this.checkoutUrl = checkout.checkout_url || null
        this.checkoutExpiresAt = checkout.expires_at || null
        this.checkoutPaymentInstruction = checkout.payment_instruction || null
        this.checkoutQrUrl =
          checkout.qr_url ||
          checkout.payment_instruction?.qr_url ||
          (typeof checkout.checkout_url === 'string' &&
          checkout.checkout_url.includes('qr')
            ? checkout.checkout_url
            : null)

        const detailResponse = await invoiceService.get(this.selectedInvoice.id)
        this.selectedInvoice = detailResponse.data.data

        const latestAttempt = Array.isArray(
          this.selectedInvoice?.payment_attempts
        )
          ? [...this.selectedInvoice.payment_attempts].sort(
              (a, b) => b.attempt_number - a.attempt_number
            )[0]
          : null

        if (latestAttempt) {
          const recoveredQrUrl =
            latestAttempt.qr_url ||
            latestAttempt.metadata?.qr_url ||
            this.checkoutQrUrl
          if (recoveredQrUrl) {
            this.checkoutQrUrl = recoveredQrUrl
          }
        }

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
        } else if (method === 'gopay') {
          if (
            isSecureCheckoutUrl(this.checkoutUrl) &&
            typeof window !== 'undefined'
          ) {
            window.open(this.checkoutUrl, '_blank')
          }
          if (this.checkoutExpiresAt) {
            this.startCountdown(this.checkoutExpiresAt)
            this.startPolling()
          }
        } else if (method === 'qris') {
          const rawPayload = isQrisMpmInstruction(
            this.checkoutPaymentInstruction
          )
            ? this.checkoutPaymentInstruction.qr_content
            : checkout.qr_content ||
              latestAttempt?.metadata?.qr_content ||
              checkout.payment_code
          if (rawPayload) {
            this.checkoutQrPayload = rawPayload
            this.checkoutPaymentCode = null
            await this.renderQr(rawPayload)
          } else if (this.checkoutQrUrl) {
            this.checkoutQrPayload = null
            this.checkoutPaymentCode = null
          }
          if (rawPayload || this.checkoutQrUrl) {
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
        } else {
          const rawPayload =
            checkout.payment_code ||
            latestAttempt?.metadata?.payment_code ||
            checkout.checkout_url
          if (rawPayload) {
            this.checkoutQrPayload = null
            this.checkoutQrDataUrl = null
            this.checkoutPaymentCode =
              typeof rawPayload === 'string' ? rawPayload : null
            if (this.checkoutExpiresAt) {
              this.startCountdown(this.checkoutExpiresAt)
              this.startPolling()
            }
          } else {
            this.checkoutError =
              checkout.checkout_status === 'processing'
                ? 'Instruksi pembayaran sedang disiapkan oleh gateway. Muat beberapa saat lagi.'
                : 'Instruksi pembayaran belum tersedia dari gateway. Coba beberapa saat lagi.'
          }
        }
      } catch (error) {
        const status = error?.response?.status
        if (status === 409) {
          this.checkoutIdempotencyKey = createIdempotencyKey()
          this.checkoutError =
            error.response?.data?.message ||
            'Permintaan checkout berkonflik dengan transaksi sebelumnya. Silakan klik tombol untuk membuat instruksi baru.'
        } else if (
          error?.code === 'ECONNABORTED' ||
          error?.message?.includes('timeout') ||
          error?.message?.includes('Network Error')
        ) {
          this.checkoutError =
            'Koneksi ke gateway pembayaran mengalami timeout jaringan. Periksa koneksi dan coba lagi.'
        } else if (status === 502 || status === 504) {
          this.checkoutError =
            'Gateway pembayaran sedang mengalami gangguan atau tidak dapat dijangkau. Coba beberapa saat lagi.'
        } else if (status === 202) {
          this.checkoutError =
            'Instruksi pembayaran sedang disiapkan oleh gateway. Silakan muat status beberapa saat lagi.'
        } else {
          const validationErrors = getApiValidationErrors(error)
          this.checkoutError =
            validationErrors.invoice?.[0] || getApiErrorMessage(error)
        }
      } finally {
        this.checkoutLoading = false
      }
    },

    async retryCheckout() {
      this.stopCheckoutSession()
      this.checkoutIdempotencyKey = createIdempotencyKey()
      this.checkoutLastMethod = this.checkoutPaymentMethod
      this.checkoutLastProvider = this.checkoutProvider
      this.checkoutLastBank = this.checkoutBank
      this.checkoutQrDataUrl = null
      this.checkoutQrPayload = null
      this.checkoutPaymentCode = null
      this.checkoutError = ''
      await this.startCheckout(
        this.checkoutPaymentMethod,
        this.checkoutProvider,
        this.checkoutBank
      )
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

        const latest = Array.isArray(this.selectedInvoice?.payment_attempts)
          ? [...this.selectedInvoice.payment_attempts].sort(
              (a, b) => b.attempt_number - a.attempt_number
            )[0]
          : null

        if (latest) {
          const recoveredQrUrl =
            latest.qr_url ||
            latest.metadata?.qr_url ||
            latest.metadata?.payment_instruction?.qr_url ||
            (typeof latest.checkout_url === 'string' &&
            latest.checkout_url.includes('qr')
              ? latest.checkout_url
              : null)
          if (recoveredQrUrl) {
            this.checkoutQrUrl = recoveredQrUrl
          }
          const recoveredPayload =
            latest.qr_content ||
            latest.metadata?.qr_content ||
            latest.metadata?.payment_instruction?.qr_content
          if (recoveredPayload && !this.checkoutQrDataUrl) {
            this.checkoutQrPayload = recoveredPayload
            await this.renderQr(recoveredPayload)
          }
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
