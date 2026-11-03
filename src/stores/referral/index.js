import { defineStore } from 'pinia'
import {
  partnerService,
  referralCodeService,
  referralCommissionService
} from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const blank = () => ({
  partner_id: null,
  type: 'umum',
  is_active: true
})

export const useReferralStore = defineStore('referral', {
  state: () => ({
    activeTab: 'summary',

    // Summary & Dashboard
    summary: null,
    recentCommissions: [],
    summaryLoading: false,

    // Kode Referral (Existing)
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
    detailOpen: false,

    // Riwayat Komisi (Ledger)
    commissions: [],
    commissionsLoading: false,
    commissionsHasMore: true,
    commissionFilter: {
      search: '',
      partner_id: null,
      commission_type: null,
      status: null,
      date_from: null,
      date_to: null
    },
    commissionPagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0
    },
    reversalDialog: {
      open: false,
      ledger: null,
      reason: '',
      saving: false,
      error: null
    },

    // Daftar Warung Referral
    warungs: [],
    warungsLoading: false,
    warungsHasMore: true,
    warungFilter: {
      search: '',
      partner_id: null,
      application_id: null
    },
    warungPagination: {
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0
    }
  }),
  actions: {
    // === Summary ===
    async fetchSummary() {
      this.summaryLoading = true
      try {
        const { data } = await referralCommissionService.summary()
        this.summary = data.metrics
        this.recentCommissions = data.recent_commissions || []
      } catch (error) {
        this.error = getApiErrorMessage(error)
      } finally {
        this.summaryLoading = false
      }
    },

    // === Riwayat Komisi (Card List + Infinite Scroll) ===
    async fetchCommissions(reset = true) {
      if (reset) {
        this.commissionPagination.page = 1
        this.commissions = []
        this.commissionsHasMore = true
      }
      this.commissionsLoading = true
      try {
        const { data } = await referralCommissionService.list({
          page: this.commissionPagination.page,
          per_page: this.commissionPagination.rowsPerPage,
          search: this.commissionFilter.search || undefined,
          partner_id: this.commissionFilter.partner_id || undefined,
          commission_type: this.commissionFilter.commission_type || undefined,
          status: this.commissionFilter.status || undefined,
          date_from: this.commissionFilter.date_from || undefined,
          date_to: this.commissionFilter.date_to || undefined,
          sort: 'verified_at',
          direction: 'desc'
        })
        const items = data.data || []
        if (reset) {
          this.commissions = items
        } else {
          this.commissions.push(...items)
        }
        this.commissionPagination.page = data.meta.current_page
        this.commissionPagination.rowsNumber = data.meta.total
        this.commissionsHasMore =
          data.meta.current_page < data.meta.last_page && items.length > 0
      } catch (error) {
        this.error = getApiErrorMessage(error)
      } finally {
        this.commissionsLoading = false
      }
    },

    async loadMoreCommissions(index, done) {
      if (!this.commissionsHasMore || this.commissionsLoading) {
        if (typeof done === 'function') done()
        return
      }
      this.commissionPagination.page += 1
      try {
        await this.fetchCommissions(false)
      } finally {
        if (typeof done === 'function') done()
      }
    },

    openReversalDialog(ledger) {
      this.reversalDialog = {
        open: true,
        ledger,
        reason: '',
        saving: false,
        error: null
      }
    },

    async submitReversal() {
      if (!this.reversalDialog.ledger || !this.reversalDialog.reason.trim()) {
        this.reversalDialog.error = 'Alasan reversal harus diisi.'
        return
      }
      this.reversalDialog.saving = true
      this.reversalDialog.error = null
      try {
        await referralCommissionService.reverse(this.reversalDialog.ledger.id, {
          reason: this.reversalDialog.reason.trim()
        })
        this.reversalDialog.open = false
        await Promise.all([this.fetchCommissions(true), this.fetchSummary()])
      } catch (error) {
        this.reversalDialog.error = getApiErrorMessage(error)
      } finally {
        this.reversalDialog.saving = false
      }
    },

    // === Daftar Warung Referral (Card List + Infinite Scroll) ===
    async fetchWarungs(reset = true) {
      if (reset) {
        this.warungPagination.page = 1
        this.warungs = []
        this.warungsHasMore = true
      }
      this.warungsLoading = true
      try {
        const { data } = await referralCommissionService.warungs({
          page: this.warungPagination.page,
          per_page: this.warungPagination.rowsPerPage,
          search: this.warungFilter.search || undefined,
          partner_id: this.warungFilter.partner_id || undefined,
          application_id: this.warungFilter.application_id || undefined
        })
        const items = data.data || []
        if (reset) {
          this.warungs = items
        } else {
          this.warungs.push(...items)
        }
        this.warungPagination.page = data.meta.current_page
        this.warungPagination.rowsNumber = data.meta.total
        this.warungsHasMore =
          data.meta.current_page < data.meta.last_page && items.length > 0
      } catch (error) {
        this.error = getApiErrorMessage(error)
      } finally {
        this.warungsLoading = false
      }
    },

    async loadMoreWarungs(index, done) {
      if (!this.warungsHasMore || this.warungsLoading) {
        if (typeof done === 'function') done()
        return
      }
      this.warungPagination.page += 1
      try {
        await this.fetchWarungs(false)
      } finally {
        if (typeof done === 'function') done()
      }
    },

    // === Kode Referral (Existing) ===
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
