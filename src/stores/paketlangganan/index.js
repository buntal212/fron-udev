import { defineStore } from 'pinia'
import {
  applicationService,
  subscriptionPlanService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  application_id: null,
  code: '',
  name: '',
  description: '',
  duration_months: '',
  price: '',
  currency: 'IDR',
  is_active: true
})

export const usePaketLanggananStore = defineStore('paket-langganan', {
  state: () => ({
    items: [],
    applications: [],
    loading: false,
    error: null,
    search: '',
    applicationId: null,
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
    deleteDialogOpen: false,
    deleting: false,
    selectedPlan: null
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

    async fetchPlans(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }

      try {
        const response = await subscriptionPlanService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          application_id: this.applicationId || undefined,
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
        this.error = getApiErrorMessage(error)
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

    async openEditDialog(plan) {
      this.formErrors = {}
      this.formMode = 'edit'
      this.editingId = plan.id
      this.formDialogOpen = true

      try {
        const response = await subscriptionPlanService.get(plan.id)
        const detail = response.data.data
        this.form = {
          application_id: detail.application_id,
          code: detail.code,
          name: detail.name,
          description: detail.description || '',
          duration_months: String(detail.duration_months),
          price: String(detail.price),
          currency: detail.currency || 'IDR',
          is_active: detail.is_active
        }
      } catch (error) {
        this.formDialogOpen = false
        this.error = getApiErrorMessage(error)
      }
    },

    async savePlan() {
      this.saving = true
      this.formErrors = {}

      try {
        const payload = {
          ...this.form,
          code: this.form.code.trim().toUpperCase(),
          name: this.form.name.trim(),
          description: this.form.description || null,
          duration_months: Number(this.form.duration_months),
          price: String(this.form.price).trim().replace(',', '.'),
          currency: this.form.currency.toUpperCase()
        }

        if (this.formMode === 'edit') {
          await subscriptionPlanService.update(this.editingId, payload)
        } else {
          await subscriptionPlanService.create(payload)
        }

        this.formDialogOpen = false
        await this.fetchPlans()
      } catch (error) {
        this.formErrors = getApiValidationErrors(error)
        if (!Object.keys(this.formErrors).length)
          this.error = getApiErrorMessage(error)
      } finally {
        this.saving = false
      }
    },

    async setPlanActive(plan, isActive) {
      try {
        await subscriptionPlanService.update(plan.id, { is_active: isActive })
        await this.fetchPlans()
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    },

    requestDelete(plan) {
      this.selectedPlan = plan
      this.deleteDialogOpen = true
    },

    async deletePlan() {
      if (!this.selectedPlan) return

      this.deleting = true
      try {
        await subscriptionPlanService.remove(this.selectedPlan.id)
        this.deleteDialogOpen = false
        this.selectedPlan = null
        await this.fetchPlans()
      } catch (error) {
        this.error = getApiErrorMessage(error)
        this.deleteDialogOpen = false
      } finally {
        this.deleting = false
      }
    }
  }
})
