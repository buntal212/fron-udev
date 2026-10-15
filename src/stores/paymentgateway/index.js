import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import {
  applicationService,
  paymentGatewayService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  application_id: null,
  provider: 'dana',
  environment: 'sandbox',
  gateway_merchant_code: null,
  is_active: true
})

export const usePaymentGatewayStore = defineStore('payment-gateway', {
  state: () => ({
    items: [],
    applications: [],
    merchantOptions: [],
    loading: false,
    error: null,
    applicationId: null,
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
    formMode: 'create',
    editingId: null
  }),

  actions: {
    async fetchApplications() {
      const response = await applicationService.list({
        per_page: 100,
        sort: 'name',
        direction: 'asc',
        is_active: true
      })
      this.applications = response.data.data
    },

    async fetchMappings(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }

      try {
        const response = await paymentGatewayService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          application_id: this.applicationId || undefined,
          environment: this.environment || undefined,
          provider: 'dana'
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

    async fetchMerchantOptions(environment = this.form.environment) {
      try {
        const response =
          await paymentGatewayService.merchantOptions(environment)
        this.merchantOptions = response.data.data
      } catch (error) {
        this.merchantOptions = []
        this.error = getApiErrorMessage(error)
      }
    },

    async openCreateDialog() {
      this.form = emptyForm()
      this.formErrors = {}
      this.formMode = 'create'
      this.editingId = null
      this.formDialogOpen = true
      await this.fetchMerchantOptions()
    },

    async openEditDialog(mapping) {
      this.form = {
        application_id: mapping.application_id,
        provider: mapping.provider,
        environment: mapping.environment,
        gateway_merchant_code: mapping.gateway_merchant_code,
        is_active: mapping.is_active
      }
      this.formErrors = {}
      this.formMode = 'edit'
      this.editingId = mapping.id
      this.formDialogOpen = true
      await this.fetchMerchantOptions(mapping.environment)
    },

    async changeFormEnvironment(environment) {
      this.form.environment = environment
      this.form.gateway_merchant_code = null
      await this.fetchMerchantOptions(environment)
    },

    async saveMapping() {
      this.saving = true
      this.formErrors = {}

      try {
        const payload = {
          application_id: this.form.application_id,
          provider: 'dana',
          environment: this.form.environment,
          gateway_merchant_code: this.form.gateway_merchant_code,
          is_active: this.form.is_active
        }

        if (this.formMode === 'edit') {
          delete payload.application_id
          delete payload.provider
          await paymentGatewayService.update(this.editingId, payload)
        } else {
          await paymentGatewayService.create(payload)
        }

        this.formDialogOpen = false
        Notify.create({
          message: 'Konfigurasi payment gateway tersimpan.',
          color: 'positive',
          icon: 'check_circle',
          position: 'top'
        })
        await this.fetchMappings()
      } catch (error) {
        this.formErrors = getApiValidationErrors(error)
        if (!Object.keys(this.formErrors).length)
          this.error = getApiErrorMessage(error)
      } finally {
        this.saving = false
      }
    },

    async setMappingActive(mapping, isActive) {
      try {
        await paymentGatewayService.update(mapping.id, { is_active: isActive })
        await this.fetchMappings()
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    }
  }
})
