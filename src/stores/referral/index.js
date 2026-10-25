import { defineStore } from 'pinia'
import { partnerService, referralCodeService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const blank = () => ({
  partner_id: null,
  type: 'umum',
  is_active: true
})

export const useReferralStore = defineStore('referral', {
  state: () => ({
    items: [],
    partners: [],
    loading: false,
    saving: false,
    error: null,
    search: '',
    status: null,
    type: null,
    pagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0,
      sortBy: 'created_at',
      descending: true
    },
    form: blank(),
    formErrors: {},
    formOpen: false,
    createdCode: null,
    createdCodeOpen: false,
    detail: null,
    usages: [],
    detailOpen: false
  }),
  actions: {
    async fetch(next = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...next }
      try {
        const { data } = await referralCodeService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          search: this.search || undefined,
          is_active: this.status ?? undefined,
          type: this.type || undefined,
          sort: this.pagination.sortBy,
          direction: this.pagination.descending ? 'desc' : 'asc'
        })
        this.items = data.data
        this.pagination = {
          ...this.pagination,
          page: data.meta.current_page,
          rowsPerPage: data.meta.per_page,
          rowsNumber: data.meta.total
        }
      } catch (error) {
        this.error = getApiErrorMessage(error)
      } finally {
        this.loading = false
      }
    },
    async fetchPartners() {
      try {
        this.partners = (
          await partnerService.list({
            per_page: 100,
            is_active: true,
            sort: 'name',
            direction: 'asc'
          })
        ).data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    },
    openCreate() {
      this.form = blank()
      this.formErrors = {}
      this.formOpen = true
    },
    async save() {
      this.saving = true
      this.formErrors = {}
      try {
        const response = await referralCodeService.create(this.form)
        this.createdCode = response.data.data.code
        this.formOpen = false
        this.createdCodeOpen = true
        await this.fetch()
      } catch (error) {
        this.formErrors = getApiValidationErrors(error)
      } finally {
        this.saving = false
      }
    },
    async openDetail(item) {
      this.detailOpen = true
      this.detail = null
      this.usages = []
      try {
        const [code, usage] = await Promise.all([
          referralCodeService.get(item.id),
          referralCodeService.usages(item.id)
        ])
        this.detail = code.data.data
        this.usages = usage.data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    },
    async setStatus(item, isActive) {
      try {
        await referralCodeService.update(item.id, { is_active: isActive })
        await this.fetch()
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    }
  }
})
