import { defineStore } from 'pinia'
import {
  applicationIntegrationService,
  applicationIntegrationTestService,
  applicationService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  application_url: '',
  contact_email: '',
  is_active: true
})

const requestError = error => getApiErrorMessage(error)

export const useAplikasiStore = defineStore('aplikasi', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    search: '',
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
    saving: false,
    formDialogOpen: false,
    formMode: 'create',
    editingId: null,
    detailDialogOpen: false,
    detailLoading: false,
    selectedApplication: null,
    integrationTokens: [],
    integrationAudits: [],
    integrationLoading: false,
    integrationError: null,
    tokenSaving: false,
    tokenForm: {
      name: '',
      scopes: [],
      expires_at: ''
    },
    newTokenPlaintext: null,
    integrationTest: {
      form: {
        external_customer_id: 'UAT-CUSTOMER-001',
        name: '',
        owner_name: '',
        phone: '',
        email: '',
        status: 'active'
      },
      saving: false,
      loading: false,
      error: null,
      result: null,
      audits: [],
      auditsLoading: false
    }
  }),

  actions: {
    async fetchApplications(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }

      try {
        const response = await applicationService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          search: this.search || undefined,
          is_active: this.status ?? undefined,
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
        this.error = requestError(error)
      } finally {
        this.loading = false
      }
    },

    openCreateDialog() {
      this.form = emptyForm()
      this.formErrors = {}
      this.formMode = 'create'
      this.editingId = null
      this.formDialogOpen = true
    },

    openEditDialog(application) {
      this.form = {
        code: application.code,
        name: application.name,
        description: application.description || '',
        application_url: application.application_url || '',
        contact_email: application.contact_email || '',
        is_active: application.is_active
      }
      this.formErrors = {}
      this.formMode = 'edit'
      this.editingId = application.id
      this.formDialogOpen = true
    },

    async openDetailDialog(application) {
      this.detailDialogOpen = true
      this.detailLoading = true
      this.selectedApplication = null
      this.integrationTokens = []
      this.integrationAudits = []
      this.integrationError = null
      this.newTokenPlaintext = null
      this.resetIntegrationTest()

      try {
        const response = await applicationService.get(application.id)
        this.selectedApplication = response.data.data
        this.resetIntegrationTest(this.selectedApplication)
        await this.fetchIntegrationData(this.selectedApplication.id)
      } catch (error) {
        this.error = requestError(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    },

    async fetchIntegrationData(applicationId) {
      this.integrationLoading = true
      this.integrationError = null
      try {
        const [tokensResponse, auditsResponse] = await Promise.all([
          applicationIntegrationService.tokens(applicationId),
          applicationIntegrationService.audits(applicationId, {
            per_page: 10
          })
        ])
        this.integrationTokens = tokensResponse.data.data
        this.integrationAudits = auditsResponse.data.data
      } catch (error) {
        this.integrationError = requestError(error)
      } finally {
        this.integrationLoading = false
      }
    },

    resetTokenForm() {
      this.tokenForm = {
        name: '',
        scopes: [],
        expires_at: ''
      }
    },

    async createIntegrationToken() {
      if (!this.selectedApplication) return
      this.tokenSaving = true
      this.integrationError = null
      try {
        const response = await applicationIntegrationService.createToken(
          this.selectedApplication.id,
          {
            ...this.tokenForm,
            expires_at: this.tokenForm.expires_at || null
          }
        )
        this.newTokenPlaintext = response.data.token
        this.integrationTokens.unshift(response.data.data)
        this.resetTokenForm()
      } catch (error) {
        this.integrationError = requestError(error)
      } finally {
        this.tokenSaving = false
      }
    },

    async revokeIntegrationToken(token) {
      if (!this.selectedApplication) return
      this.tokenSaving = true
      this.integrationError = null
      try {
        const response = await applicationIntegrationService.revokeToken(
          this.selectedApplication.id,
          token.id
        )
        const index = this.integrationTokens.findIndex(
          item => item.id === token.id
        )
        if (index !== -1) this.integrationTokens[index] = response.data.data
        await this.fetchIntegrationData(this.selectedApplication.id)
      } catch (error) {
        this.integrationError = requestError(error)
      } finally {
        this.tokenSaving = false
      }
    },

    clearNewToken() {
      this.newTokenPlaintext = null
    },

    resetIntegrationTest(application = null) {
      const code = application?.code || 'CUSTOMER'
      this.integrationTest = {
        form: {
          external_customer_id: `UAT-${code}-001`,
          name: '',
          owner_name: '',
          phone: '',
          email: '',
          status: 'active'
        },
        saving: false,
        loading: false,
        error: null,
        result: null,
        audits: [],
        auditsLoading: false
      }
    },

    async sendIntegrationTestCustomer() {
      if (!this.selectedApplication) return
      this.integrationTest.saving = true
      this.integrationTest.error = null
      try {
        const response = await applicationIntegrationTestService.create(
          this.selectedApplication.id,
          this.testCustomerPayload()
        )
        this.integrationTest.result = response.data
        await this.fetchIntegrationTestAudits()
      } catch (error) {
        this.integrationTest.error = requestError(error)
      } finally {
        this.integrationTest.saving = false
      }
    },

    async duplicateIntegrationTestCustomer() {
      if (!this.selectedApplication) return
      this.integrationTest.saving = true
      this.integrationTest.error = null
      try {
        await applicationIntegrationTestService.create(
          this.selectedApplication.id,
          this.testCustomerPayload()
        )
        const response = await applicationIntegrationTestService.create(
          this.selectedApplication.id,
          this.testCustomerPayload()
        )
        this.integrationTest.result = {
          ...response.data,
          duplicate_check: response.data.test?.created === false
        }
        await this.fetchIntegrationTestAudits()
      } catch (error) {
        this.integrationTest.error = requestError(error)
      } finally {
        this.integrationTest.saving = false
      }
    },

    async checkIntegrationTestCustomer() {
      if (!this.selectedApplication) return
      this.integrationTest.loading = true
      this.integrationTest.error = null
      try {
        const response = await applicationIntegrationTestService.get(
          this.selectedApplication.id,
          this.integrationTest.form.external_customer_id
        )
        this.integrationTest.result = response.data
        await this.fetchIntegrationTestAudits()
      } catch (error) {
        this.integrationTest.error = requestError(error)
      } finally {
        this.integrationTest.loading = false
      }
    },

    async updateIntegrationTestCustomer() {
      if (!this.selectedApplication) return
      this.integrationTest.saving = true
      this.integrationTest.error = null
      try {
        const response = await applicationIntegrationTestService.update(
          this.selectedApplication.id,
          this.integrationTest.form.external_customer_id,
          {
            name: this.integrationTest.form.name,
            owner_name: this.integrationTest.form.owner_name || null,
            phone: this.integrationTest.form.phone || null,
            email: this.integrationTest.form.email || null,
            status: this.integrationTest.form.status
          }
        )
        this.integrationTest.result = response.data
        await this.fetchIntegrationTestAudits()
      } catch (error) {
        this.integrationTest.error = requestError(error)
      } finally {
        this.integrationTest.saving = false
      }
    },

    async fetchIntegrationTestAudits() {
      if (!this.selectedApplication) return
      this.integrationTest.auditsLoading = true
      try {
        const response = await applicationIntegrationTestService.audits(
          this.selectedApplication.id,
          { per_page: 20 }
        )
        this.integrationTest.audits = response.data.data
      } catch (error) {
        this.integrationTest.error = requestError(error)
      } finally {
        this.integrationTest.auditsLoading = false
      }
    },

    testCustomerPayload() {
      return {
        external_customer_id: this.integrationTest.form.external_customer_id,
        name: this.integrationTest.form.name,
        owner_name: this.integrationTest.form.owner_name || null,
        phone: this.integrationTest.form.phone || null,
        email: this.integrationTest.form.email || null,
        status: this.integrationTest.form.status
      }
    },

    async saveApplication() {
      this.saving = true
      this.formErrors = {}

      try {
        const payload = {
          ...this.form,
          code: this.form.code.trim().toUpperCase(),
          description: this.form.description || null,
          application_url: this.form.application_url || null,
          contact_email: this.form.contact_email || null
        }

        if (this.formMode === 'edit') {
          await applicationService.update(this.editingId, payload)
        } else {
          await applicationService.create(payload)
        }

        this.formDialogOpen = false
        await this.fetchApplications()
      } catch (error) {
        this.formErrors = getApiValidationErrors(error)

        if (!Object.keys(this.formErrors).length) {
          this.error = requestError(error)
        }
      } finally {
        this.saving = false
      }
    }
  }
})
