import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import {
  applicationService,
  midtransGatewayService,
  paymentGatewayService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'
import { getMidtransStatusLabel } from '@/utils/midtrans-status'

const emptyMerchantForm = () => ({
  merchant_code: '',
  merchant_name: '',
  midtrans_merchant_id: '',
  client_key: '',
  is_active: true
})

const emptyConfigForm = () => ({
  merchant_code: 'udev-central',
  midtrans_merchant_id: '',
  client_key: '',
  server_key: '',
  signature_secret_key: '',
  is_active: true
})

const emptyMappingForm = () => ({
  id: null,
  application_id: null,
  provider: 'midtrans',
  environment: 'sandbox',
  gateway_merchant_code: 'udev-central',
  is_active: true
})

const emptyTestPaymentForm = () => ({
  order_id: '',
  amount: 10000,
  payment_type: 'qris',
  bank: 'bca'
})

const emptyFeeForm = () => ({
  id: null,
  merchant_code: 'udev-central',
  payment_method: 'qris',
  payment_method_name: '',
  fee_type: 'percent',
  fee_rate: 0.7,
  fixed_amount: 0,
  min_fee: null,
  max_fee: null,
  is_active: true,
  notes: ''
})

export const usePaymentGatewayMidtransStore = defineStore(
  'payment-gateway-midtrans',
  {
    state: () => ({
      activeTab: 'dashboard',

      // Environment Settings & Production Activation
      activeEnvironment: 'sandbox',
      environmentSettings: null,
      productionReadiness: null,
      environmentLoading: false,
      activatingProduction: false,
      switchingSandbox: false,
      selectedConfigEnvironment: 'sandbox',
      environmentConnectionResult: null,
      testingEnvironmentConnection: false,

      // Dashboard
      dashboardSummary: null,
      dashboardLoading: false,

      // Merchants
      merchants: [],
      selectedMerchant: 'udev-central',
      merchantsLoading: false,
      merchantFilter: {
        search: '',
        status: null
      },
      merchantFormDialogOpen: false,
      merchantFormMode: 'create', // 'create' | 'edit'
      merchantForm: emptyMerchantForm(),
      merchantFormErrors: {},
      merchantSaving: false,
      merchantDeleting: false,
      merchantDeleteConfirmDialogOpen: false,
      merchantToDelete: null,

      // Configuration
      config: null,
      configLoading: false,
      configSaving: false,
      configDeleting: false,
      configForm: emptyConfigForm(),
      configFormErrors: {},
      deleteConfigDialogOpen: false,

      // Application Mappings
      mappings: [],
      mappingsLoading: false,
      mappingsPagination: {
        page: 1,
        rowsPerPage: 15,
        rowsNumber: 0
      },
      mappingFilter: {
        application_id: null
      },
      mappingFormDialogOpen: false,
      mappingFormMode: 'create',
      mappingForm: emptyMappingForm(),
      mappingFormErrors: {},
      mappingSaving: false,
      mappingDeleting: false,
      mappingDeleteConfirmDialogOpen: false,
      mappingToDelete: null,
      applications: [],

      // Billing Transactions
      billingTransactions: [],
      billingLoading: false,
      billingPagination: {
        page: 1,
        rowsPerPage: 15,
        rowsNumber: 0
      },
      billingFilter: {
        application_id: null,
        customer: '',
        invoice_number: '',
        status: null,
        date_from: null,
        date_to: null
      },
      selectedBillingTransaction: null,
      billingDetailDialogOpen: false,
      billingDetailLoading: false,

      // Sandbox Tester
      testingConnection: false,
      connectionResult: null,
      creatingTestPayment: false,
      testPaymentForm: emptyTestPaymentForm(),
      testPaymentResult: null,
      queryingStatus: false,
      statusQueryResult: null,
      sandboxHistory: [],
      sandboxHistoryLoading: false,
      sandboxHistoryPagination: {
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0
      },

      // Audits
      audits: [],
      auditsLoading: false,
      auditPagination: {
        page: 1,
        rowsPerPage: 15,
        rowsNumber: 0
      },
      auditFilter: {
        search: '',
        status: null
      },
      selectedAudit: null,
      auditDetailDialogOpen: false,

      // Payment Method Admin Fees
      fees: [],
      feesLoading: false,
      feesHasMore: true,
      feesPage: 1,
      feeFilter: {
        search: '',
        fee_type: null,
        status: null
      },
      feeFormDialogOpen: false,
      feeFormMode: 'create', // 'create' | 'edit'
      feeForm: emptyFeeForm(),
      feeFormErrors: {},
      feeSaving: false,
      feeDeleting: false,
      feeDeleteConfirmDialogOpen: false,
      feeToDelete: null,

      // Error message general
      error: null
    }),

    getters: {
      isProductionActive: state => state.activeEnvironment === 'production',
      isReadyForProduction: state =>
        Boolean(state.productionReadiness?.is_ready_for_production),
      isConfigured: state => Boolean(state.config?.has_server_key),
      isReady: state =>
        Boolean(state.config?.has_server_key && state.config?.is_active),
      currentMerchantObj: state =>
        state.merchants.find(m => m.merchant_code === state.selectedMerchant) ||
        null
    },

    actions: {
      // ----------------------------------------------------
      // ENVIRONMENT & PRODUCTION MANAGEMENT
      // ----------------------------------------------------
      async fetchEnvironmentSettings() {
        this.environmentLoading = true
        try {
          const resp = await midtransGatewayService.environment()
          const data = resp.data?.data ?? null
          this.environmentSettings = data
          this.activeEnvironment = data?.active_environment || 'sandbox'
          this.productionReadiness = data?.readiness || null
          return data
        } catch (err) {
          console.error('Failed to load Midtrans environment settings:', err)
          return null
        } finally {
          this.environmentLoading = false
        }
      },

      async activateProduction(confirmationPhrase, notes = null) {
        this.activatingProduction = true
        try {
          const resp = await midtransGatewayService.activateProduction({
            confirmation_phrase: confirmationPhrase,
            notes
          })
          Notify.create({
            type: 'positive',
            message:
              resp.data?.message ||
              'Midtrans mode Production berhasil diaktifkan.',
            position: 'top'
          })
          await this.fetchEnvironmentSettings()
          await this.fetchDashboardSummary()
          await this.fetchMerchants()
          return true
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal mengaktifkan Midtrans Production.'
            ),
            position: 'top'
          })
          return false
        } finally {
          this.activatingProduction = false
        }
      },

      async switchSandbox(notes = null) {
        this.switchingSandbox = true
        try {
          const resp = await midtransGatewayService.switchSandbox({ notes })
          Notify.create({
            type: 'positive',
            message:
              resp.data?.message ||
              'Midtrans berhasil dialihkan kembali ke Sandbox.',
            position: 'top'
          })
          await this.fetchEnvironmentSettings()
          await this.fetchDashboardSummary()
          await this.fetchMerchants()
          return true
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal mengalihkan Midtrans ke Sandbox.'
            ),
            position: 'top'
          })
          return false
        } finally {
          this.switchingSandbox = false
        }
      },

      async setConfigEnvironment(environment) {
        this.selectedConfigEnvironment = environment
        await this.fetchConfiguration(this.selectedMerchant, environment)
      },

      async testEnvironmentConnection(
        merchantCode = this.selectedMerchant,
        environment = this.selectedConfigEnvironment
      ) {
        this.testingEnvironmentConnection = true
        this.environmentConnectionResult = null
        try {
          const resp = await midtransGatewayService.testConnection(
            merchantCode,
            environment
          )
          this.environmentConnectionResult = resp.data
          const isSuccess = resp.data?.is_connected === true
          Notify.create({
            type: isSuccess ? 'positive' : 'warning',
            message:
              resp.data?.message ||
              `Uji koneksi ${environment.toUpperCase()} selesai.`,
            position: 'top'
          })
          await this.fetchEnvironmentSettings()
          await this.fetchConfiguration(merchantCode, environment)
          return resp.data
        } catch (err) {
          this.environmentConnectionResult = {
            is_connected: false,
            message: getApiErrorMessage(
              err,
              `Uji koneksi ${environment.toUpperCase()} gagal.`
            )
          }
          Notify.create({
            type: 'negative',
            message: this.environmentConnectionResult.message,
            position: 'top'
          })
          return this.environmentConnectionResult
        } finally {
          this.testingEnvironmentConnection = false
        }
      },

      // ----------------------------------------------------
      // DASHBOARD
      // ----------------------------------------------------
      async fetchDashboardSummary() {
        this.dashboardLoading = true
        try {
          const resp = await midtransGatewayService.dashboardSummary()
          this.dashboardSummary = resp.data?.data ?? null
        } catch (err) {
          console.error('Failed to load Midtrans dashboard summary:', err)
        } finally {
          this.dashboardLoading = false
        }
      },

      // ----------------------------------------------------
      // MERCHANTS
      // ----------------------------------------------------
      async fetchMerchants() {
        this.merchantsLoading = true
        try {
          const params = {}
          if (this.merchantFilter.search)
            params.search = this.merchantFilter.search
          if (this.merchantFilter.status)
            params.status = this.merchantFilter.status

          const resp = await midtransGatewayService.merchants(params)
          this.merchants = resp.data?.data ?? []

          // If current selected merchant is not in list, select first available
          if (
            this.merchants.length > 0 &&
            !this.merchants.some(m => m.merchant_code === this.selectedMerchant)
          ) {
            this.selectMerchant(this.merchants[0].merchant_code)
          }
        } catch (err) {
          this.error = getApiErrorMessage(
            err,
            'Gagal memuat daftar merchant Midtrans.'
          )
          Notify.create({
            type: 'negative',
            message: this.error,
            position: 'top'
          })
        } finally {
          this.merchantsLoading = false
        }
      },

      async selectMerchant(merchantCode) {
        this.selectedMerchant = merchantCode
        await Promise.all([
          this.fetchConfiguration(merchantCode),
          this.fetchAudits({ page: 1 }),
          this.fetchFees(true)
        ])
      },

      openCreateMerchantDialog() {
        this.merchantFormMode = 'create'
        this.merchantForm = emptyMerchantForm()
        this.merchantFormErrors = {}
        this.merchantFormDialogOpen = true
      },

      openEditMerchantDialog(merchant) {
        this.merchantFormMode = 'edit'
        this.merchantForm = {
          merchant_code: merchant.merchant_code,
          merchant_name: merchant.merchant_name,
          midtrans_merchant_id: merchant.midtrans_merchant_id || '',
          client_key: merchant.client_key || '',
          is_active: merchant.is_active
        }
        this.merchantFormErrors = {}
        this.merchantFormDialogOpen = true
      },

      async saveMerchant() {
        this.merchantSaving = true
        this.merchantFormErrors = {}

        try {
          if (this.merchantFormMode === 'create') {
            await midtransGatewayService.createMerchant(this.merchantForm)
            Notify.create({
              type: 'positive',
              message: 'Merchant Midtrans berhasil ditambahkan.',
              position: 'top'
            })
          } else {
            await midtransGatewayService.updateMerchant(
              this.merchantForm.merchant_code,
              {
                merchant_name: this.merchantForm.merchant_name,
                midtrans_merchant_id: this.merchantForm.midtrans_merchant_id,
                client_key: this.merchantForm.client_key,
                is_active: this.merchantForm.is_active
              }
            )
            Notify.create({
              type: 'positive',
              message: 'Data merchant Midtrans berhasil diperbarui.',
              position: 'top'
            })
          }

          this.merchantFormDialogOpen = false
          await this.fetchMerchants()
          await this.fetchDashboardSummary()
        } catch (err) {
          this.merchantFormErrors = getApiValidationErrors(err)
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal menyimpan data merchant.'),
            position: 'top'
          })
        } finally {
          this.merchantSaving = false
        }
      },

      async toggleMerchantStatus(merchant) {
        const nextStatus = !merchant.is_active
        try {
          await midtransGatewayService.toggleMerchantStatus(
            merchant.merchant_code,
            nextStatus
          )
          merchant.is_active = nextStatus
          Notify.create({
            type: 'positive',
            message: `Status merchant ${merchant.merchant_name} berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
            position: 'top'
          })
          if (merchant.merchant_code === this.selectedMerchant) {
            await this.fetchConfiguration(merchant.merchant_code)
          }
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal mengubah status merchant.'),
            position: 'top'
          })
        }
      },

      confirmDeleteMerchant(merchant) {
        this.merchantToDelete = merchant
        this.merchantDeleteConfirmDialogOpen = true
      },

      async deleteMerchant() {
        if (!this.merchantToDelete) return
        this.merchantDeleting = true

        try {
          await midtransGatewayService.deleteMerchant(
            this.merchantToDelete.merchant_code
          )
          Notify.create({
            type: 'positive',
            message: 'Merchant Midtrans berhasil dihapus.',
            position: 'top'
          })
          this.merchantDeleteConfirmDialogOpen = false
          this.merchantToDelete = null
          await this.fetchMerchants()
          await this.fetchDashboardSummary()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal menghapus merchant.'),
            position: 'top'
          })
        } finally {
          this.merchantDeleting = false
        }
      },

      // ----------------------------------------------------
      // CONFIGURATION & CREDENTIALS
      // ----------------------------------------------------
      async fetchConfiguration(
        merchantCode = this.selectedMerchant,
        environment = this.selectedConfigEnvironment
      ) {
        this.configLoading = true
        try {
          const resp = await midtransGatewayService.configuration(
            merchantCode,
            environment
          )
          this.config = resp.data?.data ?? null

          // Populate form with existing values (excluding blank secrets)
          if (this.config) {
            this.configForm = {
              merchant_code: this.config.merchant_code,
              environment: this.config.environment || environment || 'sandbox',
              midtrans_merchant_id: this.config.midtrans_merchant_id || '',
              client_key: this.config.client_key || '',
              server_key: '',
              signature_secret_key: '',
              is_active: this.config.is_active
            }
          } else {
            this.configForm = {
              merchant_code: merchantCode,
              environment: environment || 'sandbox',
              midtrans_merchant_id: '',
              client_key: '',
              server_key: '',
              signature_secret_key: '',
              is_active: true
            }
          }
        } catch (err) {
          console.error('Failed to load Midtrans configuration:', err)
        } finally {
          this.configLoading = false
        }
      },

      async saveConfiguration(environment = this.selectedConfigEnvironment) {
        this.configSaving = true
        this.configFormErrors = {}

        try {
          const targetEnv =
            environment || this.configForm.environment || 'sandbox'
          const payload = {
            merchant_code: this.selectedMerchant,
            environment: targetEnv,
            midtrans_merchant_id: this.configForm.midtrans_merchant_id,
            client_key: this.configForm.client_key,
            is_active: this.configForm.is_active
          }

          if (this.configForm.server_key) {
            payload.server_key = this.configForm.server_key
          }
          if (this.configForm.signature_secret_key) {
            payload.signature_secret_key = this.configForm.signature_secret_key
          }

          await midtransGatewayService.saveConfiguration(payload)
          Notify.create({
            type: 'positive',
            message: `Kredensial API Midtrans (${targetEnv.toUpperCase()}) berhasil disimpan terenkripsi di backend.`,
            position: 'top'
          })

          // Clear plaintext password inputs from memory
          this.configForm.server_key = ''
          this.configForm.signature_secret_key = ''

          await this.fetchConfiguration(this.selectedMerchant, targetEnv)
          await this.fetchEnvironmentSettings()
          await this.fetchMerchants()
          await this.fetchDashboardSummary()
        } catch (err) {
          this.configFormErrors = getApiValidationErrors(err)
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal menyimpan konfigurasi Midtrans.'
            ),
            position: 'top'
          })
        } finally {
          this.configSaving = false
        }
      },

      async deleteConfiguration(environment = this.selectedConfigEnvironment) {
        this.configDeleting = true
        try {
          const targetEnv = environment || 'sandbox'
          await midtransGatewayService.deleteConfiguration(
            this.selectedMerchant,
            targetEnv
          )
          Notify.create({
            type: 'positive',
            message: `Kredensial Midtrans (${targetEnv.toUpperCase()}) berhasil dihapus dari sistem.`,
            position: 'top'
          })
          this.deleteConfigDialogOpen = false
          await this.fetchConfiguration(this.selectedMerchant, targetEnv)
          await this.fetchEnvironmentSettings()
          await this.fetchMerchants()
          await this.fetchDashboardSummary()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal menghapus kredensial Midtrans.'
            ),
            position: 'top'
          })
        } finally {
          this.configDeleting = false
        }
      },

      // ----------------------------------------------------
      // APPLICATION MAPPINGS
      // ----------------------------------------------------
      async fetchApplications() {
        try {
          const resp = await applicationService.list({ per_page: 100 })
          this.applications = resp.data?.data ?? []
        } catch (err) {
          console.error('Failed to load applications:', err)
        }
      },

      async fetchMappings(props = {}) {
        this.mappingsLoading = true
        try {
          const page = props.pagination?.page ?? this.mappingsPagination.page
          const rowsPerPage =
            props.pagination?.rowsPerPage ?? this.mappingsPagination.rowsPerPage

          const params = {
            provider: 'midtrans',
            page,
            per_page: rowsPerPage
          }

          if (this.mappingFilter.environment) {
            params.environment = this.mappingFilter.environment
          }

          if (this.mappingFilter.application_id) {
            params.application_id = this.mappingFilter.application_id
          }

          const resp = await paymentGatewayService.list(params)
          this.mappings = resp.data?.data ?? []

          if (resp.data?.meta) {
            this.mappingsPagination = {
              page: resp.data.meta.current_page,
              rowsPerPage: resp.data.meta.per_page,
              rowsNumber: resp.data.meta.total
            }
          }
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal memuat mapping aplikasi Midtrans.'
            ),
            position: 'top'
          })
        } finally {
          this.mappingsLoading = false
        }
      },

      openCreateMappingDialog(environment = null) {
        this.mappingFormMode = 'create'
        this.mappingForm = {
          ...emptyMappingForm(),
          environment:
            environment ||
            this.selectedConfigEnvironment ||
            this.activeEnvironment ||
            'sandbox',
          gateway_merchant_code: this.selectedMerchant || 'udev-central'
        }
        this.mappingFormErrors = {}
        this.mappingFormDialogOpen = true
      },

      openEditMappingDialog(mapping) {
        this.mappingFormMode = 'edit'
        this.mappingForm = {
          id: mapping.id,
          application_id: mapping.application?.id || mapping.application_id,
          provider: 'midtrans',
          environment: mapping.environment || 'sandbox',
          gateway_merchant_code: mapping.gateway_merchant_code,
          is_active: mapping.is_active
        }
        this.mappingFormErrors = {}
        this.mappingFormDialogOpen = true
      },

      async saveMapping() {
        this.mappingSaving = true
        this.mappingFormErrors = {}

        try {
          if (this.mappingFormMode === 'create') {
            await paymentGatewayService.create(this.mappingForm)
            Notify.create({
              type: 'positive',
              message: 'Mapping aplikasi Midtrans berhasil dibuat.',
              position: 'top'
            })
          } else {
            await paymentGatewayService.update(this.mappingForm.id, {
              gateway_merchant_code: this.mappingForm.gateway_merchant_code,
              environment: this.mappingForm.environment || 'sandbox',
              is_active: this.mappingForm.is_active
            })
            Notify.create({
              type: 'positive',
              message: 'Mapping aplikasi berhasil diperbarui.',
              position: 'top'
            })
          }

          this.mappingFormDialogOpen = false
          await this.fetchMappings()
          await this.fetchEnvironmentSettings()
          await this.fetchMerchants()
          await this.fetchDashboardSummary()
        } catch (err) {
          this.mappingFormErrors = getApiValidationErrors(err)
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal menyimpan mapping.'),
            position: 'top'
          })
        } finally {
          this.mappingSaving = false
        }
      },

      async toggleMappingStatus(mapping) {
        const nextStatus = !mapping.is_active
        try {
          await paymentGatewayService.update(mapping.id, {
            is_active: nextStatus
          })
          mapping.is_active = nextStatus
          Notify.create({
            type: 'positive',
            message: `Mapping berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
            position: 'top'
          })
          await this.fetchEnvironmentSettings()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal mengubah status mapping.'),
            position: 'top'
          })
        }
      },

      confirmDeleteMapping(mapping) {
        this.mappingToDelete = mapping
        this.mappingDeleteConfirmDialogOpen = true
      },

      async deleteMapping() {
        if (!this.mappingToDelete) return
        this.mappingDeleting = true

        try {
          await paymentGatewayService.delete(this.mappingToDelete.id)
          Notify.create({
            type: 'positive',
            message: 'Mapping aplikasi berhasil dihapus.',
            position: 'top'
          })
          this.mappingDeleteConfirmDialogOpen = false
          this.mappingToDelete = null
          await this.fetchMappings()
          await this.fetchEnvironmentSettings()
          await this.fetchMerchants()
          await this.fetchDashboardSummary()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal menghapus mapping.'),
            position: 'top'
          })
        } finally {
          this.mappingDeleting = false
        }
      },

      // ----------------------------------------------------
      // BILLING TRANSACTIONS
      // ----------------------------------------------------
      async fetchBillingTransactions(props = {}) {
        this.billingLoading = true
        try {
          const page = props.pagination?.page ?? this.billingPagination.page
          const rowsPerPage =
            props.pagination?.rowsPerPage ?? this.billingPagination.rowsPerPage

          const params = {
            provider: 'midtrans',
            page,
            per_page: rowsPerPage
          }

          if (this.billingFilter.application_id)
            params.application_id = this.billingFilter.application_id
          if (this.billingFilter.customer)
            params.customer = this.billingFilter.customer
          if (this.billingFilter.invoice_number)
            params.invoice_number = this.billingFilter.invoice_number
          if (this.billingFilter.status)
            params.status = this.billingFilter.status
          if (this.billingFilter.date_from)
            params.date_from = this.billingFilter.date_from
          if (this.billingFilter.date_to)
            params.date_to = this.billingFilter.date_to

          const resp = await midtransGatewayService.billingTransactions(params)
          this.billingTransactions = resp.data?.data ?? []

          if (resp.data?.meta) {
            this.billingPagination = {
              page: resp.data.meta.current_page,
              rowsPerPage: resp.data.meta.per_page,
              rowsNumber: resp.data.meta.total
            }
          }
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal memuat transaksi billing Midtrans.'
            ),
            position: 'top'
          })
        } finally {
          this.billingLoading = false
        }
      },

      async showBillingTransactionDetail(id) {
        this.billingDetailLoading = true
        this.billingDetailDialogOpen = true
        try {
          const resp = await midtransGatewayService.billingTransactionDetail(id)
          this.selectedBillingTransaction = resp.data?.data ?? null
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(err, 'Gagal memuat detail transaksi.'),
            position: 'top'
          })
          this.billingDetailDialogOpen = false
        } finally {
          this.billingDetailLoading = false
        }
      },

      // ----------------------------------------------------
      // SANDBOX TESTER & SIMULATOR
      // ----------------------------------------------------
      async testConnection(environment = this.selectedConfigEnvironment) {
        this.testingConnection = true
        this.connectionResult = null
        try {
          const resp = await midtransGatewayService.testConnection(
            this.selectedMerchant,
            environment
          )
          this.connectionResult = resp.data
          const isSuccess = resp.data?.is_connected === true
          Notify.create({
            type: isSuccess ? 'positive' : 'warning',
            message: resp.data?.message || 'Uji koneksi selesai.',
            position: 'top'
          })
          await this.fetchConfiguration(this.selectedMerchant, environment)
          await this.fetchEnvironmentSettings()
          await this.fetchDashboardSummary()
        } catch (err) {
          this.connectionResult = {
            status: 'failed',
            is_connected: false,
            message: getApiErrorMessage(
              err,
              `Gagal melakukan uji koneksi Midtrans ${environment?.toUpperCase() || ''}.`
            )
          }
          Notify.create({
            type: 'negative',
            message: this.connectionResult.message,
            position: 'top'
          })
        } finally {
          this.testingConnection = false
        }
      },

      async createSandboxPayment() {
        this.creatingTestPayment = true
        this.testPaymentResult = null
        this.statusQueryResult = null

        try {
          const payload = {
            merchant_code: this.selectedMerchant,
            amount: Number(this.testPaymentForm.amount) || 10000,
            payment_type: this.testPaymentForm.payment_type || 'qris'
          }
          if (this.testPaymentForm.payment_type === 'bank_transfer') {
            payload.bank = this.testPaymentForm.bank || 'bca'
          }
          if (this.testPaymentForm.order_id) {
            payload.order_id = this.testPaymentForm.order_id
          }

          const resp =
            await midtransGatewayService.createSandboxPayment(payload)
          this.testPaymentResult = resp.data?.data ?? resp.data

          Notify.create({
            type: 'positive',
            message: 'Pembayaran Sandbox berhasil disimulasikan.',
            position: 'top'
          })

          await this.fetchSandboxHistory()
          await this.fetchDashboardSummary()
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal membuat pembayaran sandbox.'
            ),
            position: 'top'
          })
        } finally {
          this.creatingTestPayment = false
        }
      },

      async querySandboxStatus(orderId) {
        if (!orderId) return
        this.queryingStatus = true
        try {
          const resp = await midtransGatewayService.querySandboxPayment(
            orderId,
            this.selectedMerchant
          )
          this.statusQueryResult = resp.data?.data ?? resp.data

          // Update testPaymentResult if matches
          if (this.testPaymentResult?.order_id === orderId) {
            this.testPaymentResult.transaction_status =
              this.statusQueryResult.transaction_status
          }

          const statusLabel = getMidtransStatusLabel(
            this.statusQueryResult.transaction_status
          )
          Notify.create({
            type: 'info',
            message: `Status transaksi: ${statusLabel}`,
            position: 'top'
          })
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal memeriksa status pembayaran.'
            ),
            position: 'top'
          })
        } finally {
          this.queryingStatus = false
        }
      },

      async fetchSandboxHistory() {
        this.sandboxHistoryLoading = true
        try {
          const resp = await midtransGatewayService.sandboxTransactions({
            merchant_code: this.selectedMerchant,
            per_page: this.sandboxHistoryPagination.rowsPerPage
          })
          this.sandboxHistory = resp.data?.data ?? []
        } catch (err) {
          console.error('Failed to load sandbox history:', err)
        } finally {
          this.sandboxHistoryLoading = false
        }
      },

      // ----------------------------------------------------
      // AUDITS
      // ----------------------------------------------------
      async fetchAudits(props = {}) {
        this.auditsLoading = true
        try {
          const page = props.pagination?.page ?? this.auditPagination.page
          const rowsPerPage =
            props.pagination?.rowsPerPage ?? this.auditPagination.rowsPerPage

          const params = {
            page,
            per_page: rowsPerPage,
            merchant_code: this.selectedMerchant
          }

          if (this.auditFilter.search) params.search = this.auditFilter.search
          if (this.auditFilter.status) params.status = this.auditFilter.status

          const resp = await midtransGatewayService.audits(params)
          this.audits = resp.data?.data ?? []

          if (resp.data) {
            this.auditPagination = {
              page: resp.data.current_page || 1,
              rowsPerPage: resp.data.per_page || 15,
              rowsNumber: resp.data.total || 0
            }
          }
        } catch (err) {
          console.error('Failed to load audits:', err)
        } finally {
          this.auditsLoading = false
        }
      },

      viewAuditDetail(audit) {
        this.selectedAudit = audit
        this.auditDetailDialogOpen = true
      },

      // ----------------------------------------------------
      // Fee Management Actions (Card List & Infinite Scroll)
      // ----------------------------------------------------
      async fetchFees(reset = false) {
        if (reset) {
          this.feesPage = 1
          this.fees = []
          this.feesHasMore = true
        }
        this.feesLoading = true
        try {
          const params = {
            merchant_code: this.selectedMerchant,
            page: this.feesPage,
            per_page: 10
          }
          if (this.feeFilter.search) params.search = this.feeFilter.search
          if (this.feeFilter.fee_type) params.fee_type = this.feeFilter.fee_type
          if (this.feeFilter.status) params.status = this.feeFilter.status

          const resp = await midtransGatewayService.fees(params)
          const items = resp.data?.data ?? []
          const meta = resp.data?.meta

          if (this.feesPage === 1) {
            this.fees = items
          } else {
            // Deduplicate incoming items by id
            const existingIds = new Set(this.fees.map(f => f.id))
            const newItems = items.filter(f => !existingIds.has(f.id))
            this.fees.push(...newItems)
          }

          this.feesHasMore = meta ? meta.has_more : items.length >= 10
        } catch (err) {
          console.error('Failed to load Midtrans fees:', err)
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal memuat daftar biaya metode pembayaran.'
            )
          })
        } finally {
          this.feesLoading = false
        }
      },

      async loadMoreFees(index, done) {
        if (!this.feesHasMore || this.feesLoading) {
          if (typeof done === 'function') done()
          return
        }
        this.feesPage += 1
        await this.fetchFees(false)
        if (typeof done === 'function') done(!this.feesHasMore)
      },

      openCreateFeeDialog() {
        this.feeFormMode = 'create'
        this.feeForm = emptyFeeForm()
        this.feeForm.merchant_code = this.selectedMerchant
        this.feeFormErrors = {}
        this.feeFormDialogOpen = true
      },

      openEditFeeDialog(fee) {
        this.feeFormMode = 'edit'
        this.feeForm = {
          id: fee.id,
          merchant_code: fee.merchant_code,
          payment_method: fee.payment_method,
          payment_method_name: fee.payment_method_name,
          fee_type: fee.fee_type,
          fee_rate: Number(fee.fee_rate || 0),
          fixed_amount: Number(fee.fixed_amount || 0),
          min_fee: fee.min_fee !== null ? Number(fee.min_fee) : null,
          max_fee: fee.max_fee !== null ? Number(fee.max_fee) : null,
          is_active: Boolean(fee.is_active),
          notes: fee.notes || ''
        }
        this.feeFormErrors = {}
        this.feeFormDialogOpen = true
      },

      async saveFee() {
        this.feeSaving = true
        this.feeFormErrors = {}
        try {
          const payload = {
            merchant_code: this.feeForm.merchant_code || this.selectedMerchant,
            payment_method: this.feeForm.payment_method,
            payment_method_name: this.feeForm.payment_method_name,
            fee_type: this.feeForm.fee_type,
            fee_rate:
              this.feeForm.fee_type === 'percent'
                ? Number(this.feeForm.fee_rate || 0)
                : 0,
            fixed_amount:
              this.feeForm.fee_type === 'fixed'
                ? Number(this.feeForm.fixed_amount || 0)
                : 0,
            min_fee:
              this.feeForm.min_fee !== null && this.feeForm.min_fee !== ''
                ? Number(this.feeForm.min_fee)
                : null,
            max_fee:
              this.feeForm.max_fee !== null && this.feeForm.max_fee !== ''
                ? Number(this.feeForm.max_fee)
                : null,
            is_active: Boolean(this.feeForm.is_active),
            notes: this.feeForm.notes || null
          }

          if (this.feeFormMode === 'create') {
            await midtransGatewayService.createFee(payload)
            Notify.create({
              type: 'positive',
              message: 'Biaya metode pembayaran berhasil ditambahkan.'
            })
          } else {
            await midtransGatewayService.updateFee(this.feeForm.id, payload)
            Notify.create({
              type: 'positive',
              message: 'Biaya metode pembayaran berhasil diperbarui.'
            })
          }

          this.feeFormDialogOpen = false
          await this.fetchFees(true)
        } catch (err) {
          this.feeFormErrors = getApiValidationErrors(err)
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal menyimpan biaya metode pembayaran.'
            )
          })
        } finally {
          this.feeSaving = false
        }
      },

      async toggleFeeStatus(fee) {
        const newStatus = !fee.is_active
        try {
          await midtransGatewayService.toggleFeeStatus(fee.id, newStatus)
          fee.is_active = newStatus
          Notify.create({
            type: 'positive',
            message: `Metode ${fee.payment_method_name} berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}.`
          })
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal mengubah status biaya metode pembayaran.'
            )
          })
        }
      },

      confirmDeleteFee(fee) {
        this.feeToDelete = fee
        this.feeDeleteConfirmDialogOpen = true
      },

      async deleteFee() {
        if (!this.feeToDelete) return
        this.feeDeleting = true
        try {
          await midtransGatewayService.deleteFee(this.feeToDelete.id)
          Notify.create({
            type: 'positive',
            message: 'Konfigurasi biaya metode pembayaran berhasil dihapus.'
          })
          this.feeDeleteConfirmDialogOpen = false
          this.feeToDelete = null
          await this.fetchFees(true)
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              err,
              'Gagal menghapus biaya metode pembayaran.'
            )
          })
        } finally {
          this.feeDeleting = false
        }
      }
    }
  }
)
