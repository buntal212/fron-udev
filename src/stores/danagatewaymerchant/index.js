import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  code: '',
  name: '',
  email: ''
})

const emptyFeeForm = () => ({
  id: null,
  gateway_merchant_code: null,
  application_id: null,
  scope_type: 'default',
  payment_method: 'qris',
  environment: 'sandbox',
  fee_type: 'dana',
  fee_value: 0.7,
  fee_unit: 'percent',
  is_active: true,
  notes: ''
})

let pendingMerchantRequest = null
let merchantRequestSequence = 0

function retryAfterMilliseconds(error) {
  const retryAfter = error?.response?.headers?.['retry-after']
  if (typeof retryAfter !== 'string' && typeof retryAfter !== 'number') return 0

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000)

  const retryAt = Date.parse(retryAfter)
  return Number.isNaN(retryAt) ? 0 : Math.max(0, retryAt - Date.now())
}

function rateLimitMessage(until) {
  const seconds = Math.max(1, Math.ceil((until - Date.now()) / 1000))
  return `Terlalu banyak permintaan. Tunggu sekitar ${seconds} detik sebelum memuat ulang.`
}

function merchantErrorMessage(error) {
  if (error?.response?.status === 409) {
    return 'Kode merchant sudah digunakan atau permintaan sebelumnya berbeda.'
  }

  return getApiErrorMessage(error)
}

export const useDanaGatewayMerchantStore = defineStore(
  'dana-gateway-merchant',
  {
    state: () => ({
      items: [],
      loading: false,
      error: null,
      rateLimitedUntil: 0,
      search: '',
      environment: null,
      pagination: {
        page: 1,
        rowsPerPage: 15,
        rowsNumber: 0
      },
      form: emptyForm(),
      formErrors: {},
      saving: false,
      formDialogOpen: false,
      detailDialogOpen: false,
      detailLoading: false,
      selectedMerchant: null,
      environmentSettings: null,
      settingPrimaryMerchantId: null,
      environmentLoading: false,
      submittingEnvironment: false,
      activateDialogOpen: false,
      switchSandboxDialogOpen: false,
      activationPhrase: '',
      activationNotes: '',
      switchSandboxNotes: '',

      // Fee Management
      fees: [],
      feesLoading: false,
      feesHasMore: true,
      feesPage: 1,
      feeFilter: {
        search: '',
        environment: null,
        gateway_merchant_code: null,
        application_id: null,
        fee_type: null,
        status: null
      },
      feeFormDialogOpen: false,
      feeFormMode: 'create',
      feeForm: emptyFeeForm(),
      feeFormErrors: {},
      feeSaving: false,
      feeDeleting: false,
      feeDeleteConfirmDialogOpen: false,
      feeToDelete: null,

      // Fee Simulation Preview
      feeCalcForm: {
        amount: 100000,
        payment_method: 'qris',
        gateway_merchant_code: null,
        environment: 'sandbox',
        application_id: null
      },
      feeCalcResult: null,
      feeCalcLoading: false
    }),

    getters: {
      activeEnvironment: state =>
        state.environmentSettings?.active_environment || 'sandbox',
      isProductionActive: state =>
        (state.environmentSettings?.active_environment || 'sandbox') ===
        'production',
      primaryMerchantCode: state =>
        state.environmentSettings?.primary_merchant_code || 'udev-central',
      isProductionReady: state =>
        Boolean(state.environmentSettings?.is_production_ready),
      productionReadiness: state => state.environmentSettings?.readiness || null
    },

    actions: {
      async fetchMerchants(nextPagination = {}) {
        const pagination = { ...this.pagination, ...nextPagination }
        const params = {
          page: pagination.page,
          per_page: pagination.rowsPerPage,
          search: this.search || undefined,
          environment: this.environment || undefined
        }
        const requestKey = JSON.stringify(params)

        if (this.rateLimitedUntil > Date.now()) {
          this.error = rateLimitMessage(this.rateLimitedUntil)
          return
        }

        if (pendingMerchantRequest?.key === requestKey) {
          return pendingMerchantRequest.promise
        }

        this.loading = true
        this.error = null
        this.pagination = pagination
        const requestSequence = ++merchantRequestSequence

        const request = danaGatewayMerchantService
          .list(params)
          .then(response => {
            if (requestSequence !== merchantRequestSequence) return
            const { data, meta } = response.data
            this.items = data ?? []
            this.pagination = {
              ...this.pagination,
              page: meta?.current_page ?? this.pagination.page,
              rowsPerPage: meta?.per_page ?? this.pagination.rowsPerPage,
              rowsNumber: meta?.total ?? 0
            }
            this.rateLimitedUntil = 0
          })
          .catch(error => {
            if (requestSequence !== merchantRequestSequence) return
            if (error?.response?.status === 429) {
              const retryAfter = retryAfterMilliseconds(error)
              this.rateLimitedUntil = Date.now() + retryAfter
              this.error = retryAfter
                ? rateLimitMessage(this.rateLimitedUntil)
                : merchantErrorMessage(error)
              return
            }

            // Pertahankan data terakhir agar QTable tidak memicu request baru
            // hanya karena respons sebelumnya gagal.
            this.error = merchantErrorMessage(error)
          })
          .finally(() => {
            if (requestSequence === merchantRequestSequence) {
              pendingMerchantRequest = null
              this.loading = false
            }
          })

        pendingMerchantRequest = { key: requestKey, promise: request }
        return request
      },

      openCreateDialog() {
        this.form = emptyForm()
        this.formErrors = {}
        this.formDialogOpen = true
      },

      async saveMerchant() {
        if (this.saving) return

        this.saving = true
        this.formErrors = {}

        try {
          const response = await danaGatewayMerchantService.create({
            code: this.form.code.trim(),
            name: this.form.name.trim(),
            email: this.form.email.trim() || null
          })

          this.formDialogOpen = false
          await this.fetchMerchants({ page: 1 })
          Notify.create({
            message: `Merchant ${response.data.data.merchant_code} berhasil diprovisikan. Bootstrap credential masih diperlukan sebelum checkout.`,
            color: 'positive',
            icon: 'check_circle',
            position: 'top',
            timeout: 6000
          })
        } catch (error) {
          this.formErrors = getApiValidationErrors(error)
          if (!Object.keys(this.formErrors).length) {
            this.error = merchantErrorMessage(error)
          }
        } finally {
          this.saving = false
        }
      },

      async showMerchant(merchantId) {
        this.detailLoading = true
        this.selectedMerchant = null
        this.detailDialogOpen = true

        try {
          const response = await danaGatewayMerchantService.get(merchantId)
          this.selectedMerchant = response.data?.data ?? null
        } catch (error) {
          this.detailDialogOpen = false
          this.error = merchantErrorMessage(error)
        } finally {
          this.detailLoading = false
        }
      },

      async toggleMerchantStatus(merchant, isActive) {
        try {
          const res = await danaGatewayMerchantService.toggleStatus(
            merchant.merchant_id,
            isActive
          )
          Notify.create({
            type: 'positive',
            message: res.data?.message || 'Status merchant berhasil diperbarui.'
          })
          await this.fetchMerchants()
        } catch (error) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(error)
          })
          throw error
        }
      },

      async deleteMerchant(merchant) {
        try {
          const res = await danaGatewayMerchantService.delete(
            merchant.merchant_id
          )
          Notify.create({
            type: 'positive',
            message: res.data?.message || 'Merchant berhasil dihapus.'
          })
          await this.fetchMerchants()
        } catch (error) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(error)
          })
          throw error
        }
      },

      async setPrimaryMerchant(merchant) {
        const merchantId =
          typeof merchant === 'object' && merchant !== null
            ? merchant.merchant_id
            : merchant

        if (this.settingPrimaryMerchantId) return

        this.settingPrimaryMerchantId = merchantId
        try {
          const res =
            await danaGatewayMerchantService.setPrimaryMerchant(merchantId)
          Notify.create({
            type: 'positive',
            message:
              res.data?.message || 'Merchant Utama DANA berhasil diperbarui.',
            position: 'top'
          })
          await this.fetchMerchants()
          await this.fetchEnvironment()
          return res.data
        } catch (error) {
          const validationErrors = getApiValidationErrors(error)
          const firstKey = Object.keys(validationErrors)[0]
          const detailedMessage =
            firstKey &&
            Array.isArray(validationErrors[firstKey]) &&
            validationErrors[firstKey].length
              ? validationErrors[firstKey].join(' ')
              : getApiErrorMessage(error)

          Notify.create({
            type: 'negative',
            message: detailedMessage,
            position: 'top',
            timeout: 6000
          })
          throw error
        } finally {
          this.settingPrimaryMerchantId = null
        }
      },

      openActivateDialog() {
        this.activationPhrase = ''
        this.activationNotes = ''
        this.activateDialogOpen = true
      },

      closeActivateDialog() {
        this.activateDialogOpen = false
      },

      openSwitchSandboxDialog() {
        this.switchSandboxNotes = ''
        this.switchSandboxDialogOpen = true
      },

      closeSwitchSandboxDialog() {
        this.switchSandboxDialogOpen = false
      },

      async activateProduction(notes) {
        if (this.submittingEnvironment) return
        this.submittingEnvironment = true
        try {
          const payload = {
            confirmation_phrase: this.activationPhrase,
            notes: this.activationNotes || notes || null
          }
          const res =
            await danaGatewayMerchantService.activateProduction(payload)
          Notify.create({
            type: 'positive',
            message:
              res.data?.message ||
              'Environment DANA Production berhasil diaktifkan.',
            position: 'top'
          })
          this.activateDialogOpen = false
          await this.fetchEnvironment()
          await this.fetchMerchants()
          return res.data
        } catch (error) {
          const validationErrors = getApiValidationErrors(error)
          const firstKey = Object.keys(validationErrors)[0]
          const detailedMessage =
            firstKey &&
            Array.isArray(validationErrors[firstKey]) &&
            validationErrors[firstKey].length
              ? validationErrors[firstKey].join(' ')
              : getApiErrorMessage(error)

          Notify.create({
            type: 'negative',
            message: detailedMessage,
            position: 'top',
            timeout: 6000
          })
          throw error
        } finally {
          this.submittingEnvironment = false
        }
      },

      async switchSandbox(notes) {
        if (this.submittingEnvironment) return
        this.submittingEnvironment = true
        try {
          const payload = {
            notes: this.switchSandboxNotes || notes || null
          }
          const res = await danaGatewayMerchantService.switchSandbox(payload)
          Notify.create({
            type: 'positive',
            message:
              res.data?.message ||
              'Environment DANA berhasil dikembalikan ke Sandbox.',
            position: 'top'
          })
          this.switchSandboxDialogOpen = false
          await this.fetchEnvironment()
          await this.fetchMerchants()
          return res.data
        } catch (error) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(error),
            position: 'top',
            timeout: 6000
          })
          throw error
        } finally {
          this.submittingEnvironment = false
        }
      },

      async fetchEnvironment() {
        this.environmentLoading = true
        try {
          const res = await danaGatewayMerchantService.getEnvironment()
          this.environmentSettings = res.data?.data ?? null
          return this.environmentSettings
        } catch {
          return null
        } finally {
          this.environmentLoading = false
        }
      },

      async fetchFees(reset = false) {
        if (reset) {
          this.feesPage = 1
          this.fees = []
          this.feesHasMore = true
        }
        this.feesLoading = true
        try {
          const params = {
            page: this.feesPage,
            per_page: 15,
            environment: this.feeFilter.environment || undefined,
            gateway_merchant_code:
              this.feeFilter.gateway_merchant_code || undefined,
            application_id:
              this.feeFilter.application_id === 'default'
                ? 'default'
                : this.feeFilter.application_id || undefined,
            fee_type: this.feeFilter.fee_type || undefined,
            status: this.feeFilter.status || undefined,
            search: this.feeFilter.search || undefined
          }

          const res = await danaGatewayMerchantService.fees(params)
          const newItems = res.data?.data || []
          if (reset) {
            this.fees = newItems
          } else {
            this.fees = [...this.fees, ...newItems]
          }

          const meta = res.data?.meta
          if (meta) {
            this.feesHasMore = this.feesPage < meta.last_page
          } else {
            this.feesHasMore = newItems.length >= 15
          }
          return this.fees
        } catch (error) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              error,
              'Gagal memuat daftar biaya DANA.'
            ),
            position: 'top'
          })
          return []
        } finally {
          this.feesLoading = false
        }
      },

      async loadMoreFees(index, done) {
        if (!this.feesHasMore || this.feesLoading) {
          if (typeof done === 'function') done(true)
          return
        }

        this.feesPage += 1
        await this.fetchFees(false)
        if (typeof done === 'function') {
          done(!this.feesHasMore)
        }
      },

      openCreateFeeDialog() {
        this.feeFormMode = 'create'
        this.feeForm = emptyFeeForm()
        if (this.feeFilter.environment) {
          this.feeForm.environment = this.feeFilter.environment
        }
        if (this.feeFilter.gateway_merchant_code) {
          this.feeForm.scope_type = 'merchant'
          this.feeForm.gateway_merchant_code =
            this.feeFilter.gateway_merchant_code
        } else if (
          this.feeFilter.application_id &&
          this.feeFilter.application_id !== 'default'
        ) {
          this.feeForm.scope_type = 'application'
          this.feeForm.application_id = this.feeFilter.application_id
        }
        this.feeFormErrors = {}
        this.feeFormDialogOpen = true
      },

      openEditFeeDialog(fee) {
        this.feeFormMode = 'edit'
        let scopeType = 'default'
        if (fee.gateway_merchant_code) {
          scopeType = 'merchant'
        } else if (fee.application_id) {
          scopeType = 'application'
        }

        this.feeForm = {
          id: fee.id,
          gateway_merchant_code: fee.gateway_merchant_code ?? null,
          application_id: fee.application_id ?? null,
          scope_type: scopeType,
          payment_method: fee.payment_method,
          environment: fee.environment,
          fee_type: fee.fee_type,
          fee_value: Number(fee.fee_value),
          fee_unit: fee.fee_unit,
          is_active: Boolean(fee.is_active),
          notes: fee.notes || ''
        }
        this.feeFormErrors = {}
        this.feeFormDialogOpen = true
      },

      confirmDeleteFee(fee) {
        this.feeToDelete = fee
        this.feeDeleteConfirmDialogOpen = true
      },

      async saveFee() {
        this.feeSaving = true
        this.feeFormErrors = {}
        try {
          const payload = {
            gateway_merchant_code:
              this.feeForm.scope_type === 'merchant'
                ? this.feeForm.gateway_merchant_code
                : null,
            application_id:
              this.feeForm.scope_type === 'application'
                ? this.feeForm.application_id
                : null,
            payment_method: this.feeForm.payment_method,
            environment: this.feeForm.environment,
            fee_type: this.feeForm.fee_type,
            fee_value: Number(this.feeForm.fee_value),
            fee_unit: this.feeForm.fee_unit,
            is_active: this.feeForm.is_active,
            notes: this.feeForm.notes || null
          }

          if (this.feeFormMode === 'create') {
            await danaGatewayMerchantService.createFee(payload)
            Notify.create({
              type: 'positive',
              message: 'Aturan biaya DANA berhasil ditambahkan.',
              position: 'top'
            })
          } else {
            await danaGatewayMerchantService.updateFee(this.feeForm.id, payload)
            Notify.create({
              type: 'positive',
              message: 'Aturan biaya DANA berhasil diperbarui.',
              position: 'top'
            })
          }

          if (
            this.feeFilter.environment &&
            this.feeFilter.environment !== payload.environment
          ) {
            this.feeFilter.environment = payload.environment
          }

          this.feeFormDialogOpen = false
          await this.fetchFees(true)
        } catch (error) {
          this.feeFormErrors = getApiValidationErrors(error)
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              error,
              'Gagal menyimpan aturan biaya DANA.'
            ),
            position: 'top',
            timeout: 6000
          })
          throw error
        } finally {
          this.feeSaving = false
        }
      },

      async toggleFeeStatus(fee) {
        const targetStatus = !fee.is_active
        fee.is_active = targetStatus
        try {
          await danaGatewayMerchantService.toggleFeeStatus(fee.id, targetStatus)
          Notify.create({
            type: 'positive',
            message: `Status biaya ${fee.payment_method.toUpperCase()} (${fee.fee_type.toUpperCase()}) berhasil ${
              targetStatus ? 'diaktifkan' : 'dinonaktifkan'
            }.`,
            position: 'top'
          })
        } catch (error) {
          fee.is_active = !targetStatus
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              error,
              'Gagal mengubah status aturan biaya.'
            ),
            position: 'top'
          })
        }
      },

      async deleteFee() {
        if (!this.feeToDelete) return
        this.feeDeleting = true
        try {
          await danaGatewayMerchantService.deleteFee(this.feeToDelete.id)
          Notify.create({
            type: 'positive',
            message: 'Aturan biaya DANA berhasil dihapus.',
            position: 'top'
          })
          this.feeDeleteConfirmDialogOpen = false
          this.feeToDelete = null
          await this.fetchFees(true)
        } catch (error) {
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              error,
              'Gagal menghapus aturan biaya DANA.'
            ),
            position: 'top'
          })
        } finally {
          this.feeDeleting = false
        }
      },

      async calculateFeePreview() {
        this.feeCalcLoading = true
        try {
          const payload = {
            amount: Number(this.feeCalcForm.amount),
            payment_method: this.feeCalcForm.payment_method,
            environment: this.feeCalcForm.environment,
            gateway_merchant_code:
              this.feeCalcForm.gateway_merchant_code || undefined,
            application_id: this.feeCalcForm.application_id || undefined
          }
          const res = await danaGatewayMerchantService.calculateFee(payload)
          this.feeCalcResult = res.data?.data || null
          return this.feeCalcResult
        } catch (error) {
          this.feeCalcResult = null
          Notify.create({
            type: 'negative',
            message: getApiErrorMessage(
              error,
              'Gagal menghitung simulasi biaya DANA.'
            ),
            position: 'top'
          })
          return null
        } finally {
          this.feeCalcLoading = false
        }
      }
    }
  }
)
