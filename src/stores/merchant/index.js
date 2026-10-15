import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { getApiErrorMessage } from '@/utils/api-error'

export const useMerchantStore = defineStore('merchant', {
  state: () => ({
    loading: false,
    detailLoading: false,
    error: null,
    items: [],
    selectedMerchant: null,
    detailDialogOpen: false,
    params: {
      search: '',
      status: null,
      page: 1,
      perPage: 10
    },
    pagination: {
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0
    }
  }),

  actions: {
    async fetchMerchants({
      page = this.params.page,
      perPage = this.params.perPage
    } = {}) {
      this.loading = true
      this.error = null
      this.params.page = page
      this.params.perPage = perPage

      try {
        const response = await api.get('/v1/admin/merchants', {
          params: {
            search: this.params.search || undefined,
            status: this.params.status || undefined,
            page,
            per_page: perPage
          }
        })

        this.items = response.data?.data ?? []
        this.pagination = {
          page: response.data?.meta?.current_page ?? page,
          rowsPerPage: response.data?.meta?.per_page ?? perPage,
          rowsNumber: response.data?.meta?.total ?? 0
        }
      } catch (error) {
        this.error = getApiErrorMessage(error)
      } finally {
        this.loading = false
      }
    },

    async showMerchant(id) {
      this.detailLoading = true
      this.error = null

      try {
        const response = await api.get(`/v1/admin/merchants/${id}`)

        this.selectedMerchant = response.data?.data ?? null
        this.detailDialogOpen = true
      } catch (error) {
        this.error = getApiErrorMessage(error)
      } finally {
        this.detailLoading = false
      }
    },

    applyFilters() {
      return this.fetchMerchants({ page: 1 })
    }
  }
})
