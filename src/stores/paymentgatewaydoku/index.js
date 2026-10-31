import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import { dokuGatewayService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  merchant_code: 'udev-central',
  merchant_name: 'UDEV Central Billing',
  client_id: '',
  private_key: '',
  environment: 'sandbox',
  is_active: true
})

export const usePaymentGatewayDokuStore = defineStore('payment-gateway-doku', {
  state: () => ({
    merchants: [],
    selectedMerchant: 'udev-central',
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
    }
  }),

  actions: {
    async fetchMerchants() {
      try {
        const response = await dokuGatewayService.merchants()
        this.merchants = response.data?.data || []
      } catch (err) {
        this.error = getApiErrorMessage(err)
      }
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
