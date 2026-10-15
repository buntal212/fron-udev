import { defineStore } from 'pinia'
import {
  applicationCustomerService,
  applicationService,
  subscriptionService
} from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'

export const useLanggananPelangganStore = defineStore('langganan-pelanggan', {
  state: () => ({
    items: [],
    applications: [],
    customers: [],
    loading: false,
    error: null,
    applicationId: null,
    customerId: null,
    status: null,
    pagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0,
      sortBy: 'expires_at',
      descending: false
    },
    detailDialogOpen: false,
    detailLoading: false,
    selectedSubscription: null
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

    async fetchCustomers() {
      try {
        const response = await applicationCustomerService.list({
          per_page: 100,
          application_id: this.applicationId || undefined,
          sort: 'name',
          direction: 'asc'
        })
        this.customers = response.data.data
      } catch (error) {
        this.customers = []
        this.error = getApiErrorMessage(error)
      }
    },

    async onApplicationChanged() {
      this.customerId = null
      await this.fetchCustomers()
      await this.fetchSubscriptions({ page: 1 })
    },

    async fetchSubscriptions(nextPagination = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...nextPagination }

      try {
        const response = await subscriptionService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          application_id: this.applicationId || undefined,
          application_customer_id: this.customerId || undefined,
          status: this.status || undefined,
          sort: this.pagination.sortBy || 'expires_at',
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

    applicationName(subscription) {
      const applicationId =
        subscription.customer?.application_id ||
        subscription.plan?.application_id
      return (
        this.applications.find(item => item.id === applicationId)?.name || '—'
      )
    },

    async openDetailDialog(subscription) {
      this.detailDialogOpen = true
      this.detailLoading = true
      this.selectedSubscription = null

      try {
        const response = await subscriptionService.get(subscription.id)
        this.selectedSubscription = response.data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
        this.detailDialogOpen = false
      } finally {
        this.detailLoading = false
      }
    }
  }
})
