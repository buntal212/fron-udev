import { defineStore } from 'pinia'
import { applicationService } from '@/services/udev-billing'
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
    selectedApplication: null
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

      try {
        const response = await applicationService.get(application.id)
        this.selectedApplication = response.data.data
      } catch (error) {
        this.error = requestError(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
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
