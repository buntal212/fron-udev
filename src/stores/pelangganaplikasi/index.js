import { defineStore } from 'pinia'
import {
  applicationCustomerService,
  applicationService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  application_id: null,
  external_customer_id: '',
  name: '',
  owner_name: '',
  email: '',
  phone_number: '',
  is_active: true
})
const requestError = error => getApiErrorMessage(error)

export const usePelangganAplikasiStore = defineStore('pelanggan-aplikasi', {
  state: () => ({
    items: [],
    applications: [],
    loading: false,
    error: null,
    search: '',
    applicationId: null,
    status: null,
    source: null,
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
    selectedCustomer: null
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
        this.error = requestError(error)
      }
    },
    async fetchCustomers(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }
      try {
        const response = await applicationCustomerService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          search: this.search || undefined,
          application_id: this.applicationId || undefined,
          is_active: this.status ?? undefined,
          source: this.source || undefined,
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
    openEditDialog(customer) {
      this.form = {
        application_id: customer.application_id,
        external_customer_id: customer.external_customer_id,
        name: customer.name,
        owner_name: customer.owner_name || '',
        email: customer.email || '',
        phone_number: customer.phone_number || '',
        is_active: customer.is_active
      }
      this.formErrors = {}
      this.formMode = 'edit'
      this.editingId = customer.id
      this.formDialogOpen = true
    },
    async openDetailDialog(customer) {
      this.detailDialogOpen = true
      this.detailLoading = true
      this.selectedCustomer = null
      try {
        this.selectedCustomer = (
          await applicationCustomerService.get(customer.id)
        ).data.data
      } catch (error) {
        this.error = requestError(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    },
    async saveCustomer() {
      this.saving = true
      this.formErrors = {}
      try {
        const payload = {
          ...this.form,
          email: this.form.email || null,
          phone_number: this.form.phone_number || null
        }
        if (this.formMode === 'edit')
          await applicationCustomerService.update(this.editingId, payload)
        else await applicationCustomerService.create(payload)
        this.formDialogOpen = false
        await this.fetchCustomers()
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
