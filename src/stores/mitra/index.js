import { defineStore } from 'pinia'
import { partnerService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const blank = () => ({
  name: '',
  whatsapp_number: '',
  email: '',
  address: '',
  notes: '',
  is_active: true
})

export const useMitraStore = defineStore('mitra', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
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
    form: blank(),
    formErrors: {},
    editingId: null,
    formOpen: false,
    detail: null,
    detailOpen: false
  }),
  actions: {
    async fetch(next = {}) {
      this.loading = true
      this.error = null
      this.pagination = { ...this.pagination, ...next }
      try {
        const { data } = await partnerService.list({
          page: this.pagination.page,
          per_page: this.pagination.rowsPerPage,
          search: this.search || undefined,
          is_active: this.status ?? undefined,
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
    openCreate() {
      this.form = blank()
      this.formErrors = {}
      this.editingId = null
      this.formOpen = true
    },
    openEdit(item) {
      this.form = {
        name: item.name,
        whatsapp_number: item.whatsapp_number,
        email: item.email || '',
        address: item.address || '',
        notes: item.notes || '',
        is_active: item.is_active
      }
      this.formErrors = {}
      this.editingId = item.id
      this.formOpen = true
    },
    async save() {
      this.saving = true
      this.formErrors = {}
      try {
        if (this.editingId)
          await partnerService.update(this.editingId, this.form)
        else await partnerService.create(this.form)
        this.formOpen = false
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
      try {
        this.detail = (await partnerService.get(item.id)).data.data
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    },
    async setStatus(item, isActive) {
      try {
        await partnerService.update(item.id, { is_active: isActive })
        await this.fetch()
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    },
    async remove(item) {
      try {
        await partnerService.remove(item.id)
        await this.fetch()
      } catch (error) {
        this.error = getApiErrorMessage(error)
      }
    }
  }
})
