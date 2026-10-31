import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import {
  applicationService,
  dokuGatewayService,
  paymentGatewayService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  merchant_code: 'udev-central',
  merchant_name: 'UDEV Central Billing',
  client_id: '',
  private_key: '',
  environment: 'sandbox',
  is_active: true
})

const emptyMerchantForm = () => ({
  merchant_code: '',
  merchant_name: '',
  client_id: '',
  is_active: true
})

const emptyMappingForm = () => ({
  id: null,
  application_id: null,
  provider: 'doku',
  environment: 'sandbox',
  gateway_merchant_code: 'udev-central',
  is_active: true
})

export const usePaymentGatewayDokuStore = defineStore('payment-gateway-doku', {
  state: () => ({
    activeTab: 'merchants',

    // Daftar Merchant & Seleksi
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

    // Status pemuatan konfigurasi
    loading: false,
    saving: false,
    testing: false,
    auditsLoading: false,
    error: null,
    testError: null,

    // Konfigurasi terdaftar (termasking, tanpa private key)
    config: null,

    // Form input konfigurasi
    form: emptyForm(),
    formErrors: {},

    // Hasil uji koneksi SNAP B2B
    testResult: null,

    // Status aksi RSA Key Pair & Konfigurasi
    generatingKey: false,
    recoveringKey: false,
    deletingConfig: false,
    rotateDialogOpen: false,
    deleteDialogOpen: false,

    // Data audit log
    audits: [],
    auditPagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0
    },
    auditFilter: {
      search: '',
      status: null
    },

    // Mapping Aplikasi DOKU
    mappings: [],
    mappingsLoading: false,
    mappingsPagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0
    },
    mappingFilter: {
      application_id: null,
      is_active: null
    },
    mappingDialogOpen: false,
    mappingDialogMode: 'create', // 'create' | 'edit'
    mappingForm: emptyMappingForm(),
    mappingFormErrors: {},
    mappingSaving: false,
    applicationOptions: [],
    merchantMappingOptions: []
  }),

  actions: {
    async fetchMerchants(customFilter = null) {
      if (customFilter) {
        this.merchantFilter = { ...this.merchantFilter, ...customFilter }
      }
      this.merchantsLoading = true
      try {
        const params = {
          search: this.merchantFilter.search || undefined,
          status: this.merchantFilter.status || undefined
        }
        const response = await dokuGatewayService.merchants(params)
        this.merchants = response.data?.data || []
      } catch (err) {
        this.error = getApiErrorMessage(err)
      } finally {
        this.merchantsLoading = false
      }
    },

    openCreateMerchantDialog() {
      this.merchantForm = emptyMerchantForm()
      this.merchantFormErrors = {}
      this.merchantFormMode = 'create'
      this.merchantFormDialogOpen = true
    },

    openEditMerchantDialog(merchant) {
      this.merchantForm = {
        merchant_code: merchant.merchant_code,
        merchant_name: merchant.merchant_name,
        client_id: merchant.client_id || '',
        is_active: Boolean(merchant.is_active)
      }
      this.merchantFormErrors = {}
      this.merchantFormMode = 'edit'
      this.merchantFormDialogOpen = true
    },

    async saveMerchant() {
      this.merchantSaving = true
      this.merchantFormErrors = {}
      try {
        if (this.merchantFormMode === 'create') {
          const payload = {
            merchant_code: this.merchantForm.merchant_code.trim().toLowerCase(),
            merchant_name: this.merchantForm.merchant_name.trim(),
            client_id: this.merchantForm.client_id
              ? this.merchantForm.client_id.trim()
              : null,
            is_active: this.merchantForm.is_active
          }
          const response = await dokuGatewayService.createMerchant(payload)
          Notify.create({
            type: 'positive',
            message:
              response.data?.message || 'Merchant DOKU berhasil ditambahkan.'
          })
        } else {
          const payload = {
            merchant_name: this.merchantForm.merchant_name.trim(),
            client_id: this.merchantForm.client_id
              ? this.merchantForm.client_id.trim()
              : null,
            is_active: this.merchantForm.is_active
          }
          const response = await dokuGatewayService.updateMerchant(
            this.merchantForm.merchant_code,
            payload
          )
          Notify.create({
            type: 'positive',
            message:
              response.data?.message ||
              'Data merchant DOKU berhasil diperbarui.'
          })
        }
        this.merchantFormDialogOpen = false
        await this.fetchMerchants()
        return true
      } catch (err) {
        this.merchantFormErrors = getApiValidationErrors(err)
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal menyimpan merchant DOKU.'
        })
        return false
      } finally {
        this.merchantSaving = false
      }
    },

    async toggleMerchantStatus(merchant, isActive) {
      try {
        const response = await dokuGatewayService.toggleMerchantStatus(
          merchant.merchant_code,
          isActive
        )
        merchant.is_active = isActive
        Notify.create({
          type: 'positive',
          message:
            response.data?.message || 'Status merchant berhasil diperbarui.'
        })
        await this.fetchMerchants()
      } catch (err) {
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal mengubah status merchant.'
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
        const response = await dokuGatewayService.deleteMerchant(
          this.merchantToDelete.merchant_code
        )
        Notify.create({
          type: 'positive',
          message: response.data?.message || 'Merchant DOKU berhasil dihapus.'
        })
        this.merchantDeleteConfirmDialogOpen = false
        this.merchantToDelete = null
        await this.fetchMerchants()
      } catch (err) {
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal menghapus merchant DOKU.'
        })
      } finally {
        this.merchantDeleting = false
      }
    },

    async configureMerchant(merchantCode) {
      await this.selectMerchant(merchantCode)
      this.activeTab = 'credentials'
    },

    async selectMerchant(merchantCode) {
      this.selectedMerchant = merchantCode
      const merchant = this.merchants.find(
        m => m.merchant_code === merchantCode
      )
      this.form.merchant_code = merchantCode
      this.form.merchant_name = merchant?.merchant_name || merchantCode
      this.form.private_key = ''
      this.form.client_id = ''
      this.formErrors = {}
      this.testResult = null
      this.testError = null

      await Promise.all([this.fetchConfiguration(), this.fetchAudits(1)])
    },

    async fetchConfiguration() {
      this.loading = true
      this.error = null
      try {
        const response = await dokuGatewayService.configuration(
          this.selectedMerchant
        )
        this.config = response.data?.data || null
      } catch (err) {
        this.error = getApiErrorMessage(err)
      } finally {
        this.loading = false
      }
    },

    async saveConfiguration() {
      this.saving = true
      this.formErrors = {}
      try {
        const payload = {
          merchant_code: this.form.merchant_code,
          merchant_name: this.form.merchant_name,
          client_id: this.form.client_id,
          private_key: this.form.private_key,
          environment: 'sandbox',
          is_active: this.form.is_active
        }

        const response = await dokuGatewayService.saveConfiguration(payload)

        Notify.create({
          type: 'positive',
          message:
            response.data?.message ||
            'Kredensial DOKU Sandbox berhasil disimpan terenkripsi.'
        })

        // Kosongkan form private_key agar tidak tertinggal di browser memory
        this.form.private_key = ''
        this.form.client_id = ''

        await Promise.all([this.fetchConfiguration(), this.fetchAudits(1)])
        return true
      } catch (err) {
        this.formErrors = getApiValidationErrors(err)
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal menyimpan kredensial DOKU Sandbox.'
        })
        return false
      } finally {
        this.saving = false
      }
    },

    async deleteConfiguration() {
      this.deletingConfig = true
      try {
        const response = await dokuGatewayService.deleteConfiguration(
          this.selectedMerchant
        )

        this.deleteDialogOpen = false

        Notify.create({
          type: 'positive',
          message:
            response.data?.message ||
            'Konfigurasi DOKU Sandbox berhasil dihapus.'
        })

        this.form = emptyForm()
        this.form.merchant_code = this.selectedMerchant
        const currentMerchant = this.merchants.find(
          m => m.merchant_code === this.selectedMerchant
        )
        this.form.merchant_name =
          currentMerchant?.merchant_name || this.selectedMerchant
        this.testResult = null
        this.testError = null

        await Promise.all([
          this.fetchMerchants(),
          this.fetchConfiguration(),
          this.fetchAudits(1)
        ])
        return { success: true, data: response.data?.data }
      } catch (err) {
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal menghapus konfigurasi DOKU Sandbox.'
        })
        return { success: false, error: err }
      } finally {
        this.deletingConfig = false
      }
    },

    async generateRsaKey(confirmRotation = false) {
      if (!confirmRotation && this.config?.has_private_key) {
        this.rotateDialogOpen = true
        return { confirmationRequired: true }
      }

      this.generatingKey = true
      try {
        const response = await dokuGatewayService.generateKey(
          this.selectedMerchant,
          confirmRotation
        )

        this.rotateDialogOpen = false

        Notify.create({
          type: 'positive',
          message:
            response.data?.message ||
            'Pasangan RSA Key Pair 2048-bit berhasil dibuat dan disimpan terenkripsi.'
        })

        await Promise.all([this.fetchConfiguration(), this.fetchAudits(1)])
        return { success: true, data: response.data?.data }
      } catch (err) {
        if (err.response?.status === 409) {
          this.rotateDialogOpen = true
          return { confirmationRequired: true, data: err.response?.data?.data }
        }

        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal membuat pasangan RSA Key Pair.'
        })
        return { success: false, error: err }
      } finally {
        this.generatingKey = false
      }
    },

    async recoverPreviousKey() {
      this.recoveringKey = true
      try {
        const response = await dokuGatewayService.recoverKey(
          this.selectedMerchant
        )

        Notify.create({
          type: 'positive',
          message:
            response.data?.message ||
            'Pasangan kunci RSA sebelumnya berhasil dipulihkan.'
        })

        await Promise.all([this.fetchConfiguration(), this.fetchAudits(1)])
        return { success: true, data: response.data?.data }
      } catch (err) {
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal memulihkan kunci RSA sebelumnya.'
        })
        return { success: false, error: err }
      } finally {
        this.recoveringKey = false
      }
    },

    async testConnection(forceRefresh = false) {
      this.testing = true
      this.testError = null
      try {
        const response = await dokuGatewayService.testToken(
          this.selectedMerchant,
          forceRefresh
        )

        this.testResult = response.data?.data || null

        Notify.create({
          type: 'positive',
          message: `SNAP B2B Token Berhasil! ResponseCode: ${this.testResult?.response_code} (${this.testResult?.is_cached ? 'Cache Hit' : 'Fresh Token'})`
        })

        await Promise.all([this.fetchConfiguration(), this.fetchAudits(1)])
        return true
      } catch (err) {
        const message = getApiErrorMessage(err)
        this.testError = message
        this.testResult = err.response?.data?.data || null

        Notify.create({
          type: 'negative',
          message: message || 'Pengujian SNAP B2B Token gagal.'
        })
        return false
      } finally {
        this.testing = false
      }
    },

    async fetchAudits(page = 1) {
      this.auditsLoading = true
      try {
        const params = {
          merchant_code: this.selectedMerchant,
          page,
          per_page: this.auditPagination.rowsPerPage,
          search: this.auditFilter.search || undefined,
          status: this.auditFilter.status || undefined
        }

        const response = await dokuGatewayService.audits(params)
        this.audits = response.data?.data || []
        const meta = response.data?.meta || {}
        this.auditPagination.page = meta.current_page || 1
        this.auditPagination.rowsNumber = meta.total || this.audits.length
      } catch (err) {
        console.error('Gagal memuat audit log DOKU:', err)
      } finally {
        this.auditsLoading = false
      }
    },

    // Mapping Aplikasi Actions
    async fetchMappings(nextPagination = {}) {
      this.mappingsLoading = true
      this.mappingsPagination = {
        ...this.mappingsPagination,
        ...nextPagination
      }
      try {
        const response = await paymentGatewayService.list({
          provider: 'doku',
          environment: 'sandbox',
          page: this.mappingsPagination.page,
          per_page: this.mappingsPagination.rowsPerPage,
          application_id: this.mappingFilter.application_id || undefined,
          is_active: this.mappingFilter.is_active ?? undefined
        })
        const { data, meta } = response.data
        this.mappings = data ?? []
        this.mappingsPagination = {
          ...this.mappingsPagination,
          page: meta?.current_page ?? this.mappingsPagination.page,
          rowsPerPage: meta?.per_page ?? this.mappingsPagination.rowsPerPage,
          rowsNumber: meta?.total ?? 0
        }
      } catch (err) {
        this.mappings = []
        Notify.create({
          type: 'negative',
          message:
            getApiErrorMessage(err) || 'Gagal memuat mapping aplikasi DOKU.'
        })
      } finally {
        this.mappingsLoading = false
      }
    },

    async fetchMappingDropdowns() {
      try {
        const [appRes, merchRes] = await Promise.all([
          applicationService.list({ per_page: 100, is_active: true }),
          paymentGatewayService.merchantOptions('sandbox', 'doku')
        ])
        this.applicationOptions = (appRes.data?.data || []).map(a => ({
          label: `${a.name} (${a.code})`,
          value: a.id
        }))
        this.merchantMappingOptions = (merchRes.data?.data || []).map(m => ({
          label: m.name,
          caption: m.code,
          value: m.code,
          ready: m.readiness?.ready ?? false
        }))
      } catch (err) {
        console.error('Gagal memuat dropdown mapping DOKU:', err)
      }
    },

    async openCreateMappingDialog() {
      this.mappingForm = emptyMappingForm()
      this.mappingFormErrors = {}
      this.mappingDialogMode = 'create'
      this.mappingDialogOpen = true
      await this.fetchMappingDropdowns()
    },

    async openEditMappingDialog(mapping) {
      this.mappingForm = {
        id: mapping.id,
        application_id: mapping.application?.id || mapping.application_id,
        provider: 'doku',
        environment: 'sandbox',
        gateway_merchant_code: mapping.gateway_merchant_code,
        is_active: Boolean(mapping.is_active)
      }
      this.mappingFormErrors = {}
      this.mappingDialogMode = 'edit'
      this.mappingDialogOpen = true
      await this.fetchMappingDropdowns()
    },

    async saveMapping() {
      this.mappingSaving = true
      this.mappingFormErrors = {}
      try {
        const payload = {
          application_id: this.mappingForm.application_id,
          provider: 'doku',
          environment: 'sandbox',
          gateway_merchant_code: this.mappingForm.gateway_merchant_code,
          is_active: this.mappingForm.is_active
        }

        if (this.mappingDialogMode === 'create') {
          await paymentGatewayService.create(payload)
          Notify.create({
            type: 'positive',
            message: 'Mapping aplikasi DOKU berhasil ditambahkan.'
          })
        } else {
          await paymentGatewayService.update(this.mappingForm.id, payload)
          Notify.create({
            type: 'positive',
            message: 'Mapping aplikasi DOKU berhasil diperbarui.'
          })
        }

        this.mappingDialogOpen = false
        await this.fetchMappings()
        await this.fetchMerchants()
        return true
      } catch (err) {
        this.mappingFormErrors = getApiValidationErrors(err)
        const message = getApiErrorMessage(err)
        Notify.create({
          type: 'negative',
          message: message || 'Gagal menyimpan mapping aplikasi.'
        })
        return false
      } finally {
        this.mappingSaving = false
      }
    },

    async toggleMappingStatus(mapping, isActive) {
      try {
        await paymentGatewayService.update(mapping.id, { is_active: isActive })
        mapping.is_active = isActive
        Notify.create({
          type: 'positive',
          message: 'Status mapping aplikasi berhasil diperbarui.'
        })
      } catch (err) {
        Notify.create({
          type: 'negative',
          message:
            getApiErrorMessage(err) || 'Gagal memperbarui status mapping.'
        })
      }
    },

    async deleteMapping(mapping) {
      try {
        await paymentGatewayService.delete(mapping.id)
        Notify.create({
          type: 'positive',
          message: 'Mapping aplikasi DOKU berhasil dihapus.'
        })
        await this.fetchMappings()
        await this.fetchMerchants()
      } catch (err) {
        Notify.create({
          type: 'negative',
          message:
            getApiErrorMessage(err) || 'Gagal menghapus mapping aplikasi.'
        })
      }
    },

    resetForm() {
      this.form = emptyForm()
      this.formErrors = {}
      if (this.config) {
        this.form.merchant_code = this.config.merchant_code
        this.form.merchant_name = this.config.merchant_name
        this.form.is_active = this.config.is_active
      }
    }
  }
})
