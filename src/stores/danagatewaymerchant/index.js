import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'

const emptyForm = () => ({
  code: '',
  name: '',
  email: '',
  environment: 'sandbox'
})

let pendingMerchantRequest = null
let merchantRequestSequence = 0

function retryAfterMilliseconds(error) {
  const retryAfter = error?.response?.headers?.['retry-after']
  if (typeof retryAfter !== 'string' && typeof retryAfter !== 'number') return 0

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000)

  const retryAt = Date.parse(retryAfter)
  return Number.isNaN(retryAt) ? 0 : Math.max(0, retryAt - Date.now())
}

function rateLimitMessage(until) {
  const seconds = Math.max(1, Math.ceil((until - Date.now()) / 1000))
  return `Terlalu banyak permintaan. Tunggu sekitar ${seconds} detik sebelum memuat ulang.`
}

function merchantErrorMessage(error) {
  if (error?.response?.status === 409) {
    return 'Kode merchant sudah digunakan atau permintaan sebelumnya berbeda.'
  }

  return getApiErrorMessage(error)
}

export const useDanaGatewayMerchantStore = defineStore(
  'dana-gateway-merchant',
  {
    state: () => ({
      items: [],
      loading: false,
      error: null,
      rateLimitedUntil: 0,
      search: '',
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
      detailDialogOpen: false,
      detailLoading: false,
      selectedMerchant: null
    }),

    actions: {
      async fetchMerchants(nextPagination = {}) {
        const pagination = { ...this.pagination, ...nextPagination }
        const params = {
          page: pagination.page,
          per_page: pagination.rowsPerPage,
          search: this.search || undefined,
          environment: this.environment || undefined
        }
        const requestKey = JSON.stringify(params)

        if (this.rateLimitedUntil > Date.now()) {
          this.error = rateLimitMessage(this.rateLimitedUntil)
          return
        }

        if (pendingMerchantRequest?.key === requestKey) {
          return pendingMerchantRequest.promise
        }

        this.loading = true
        this.error = null
        this.pagination = pagination
        const requestSequence = ++merchantRequestSequence

        const request = danaGatewayMerchantService
          .list(params)
          .then(response => {
            if (requestSequence !== merchantRequestSequence) return
            const { data, meta } = response.data
            this.items = data ?? []
            this.pagination = {
              ...this.pagination,
              page: meta?.current_page ?? this.pagination.page,
              rowsPerPage: meta?.per_page ?? this.pagination.rowsPerPage,
              rowsNumber: meta?.total ?? 0
            }
            this.rateLimitedUntil = 0
          })
          .catch(error => {
            if (requestSequence !== merchantRequestSequence) return
            if (error?.response?.status === 429) {
              const retryAfter = retryAfterMilliseconds(error)
              this.rateLimitedUntil = Date.now() + retryAfter
              this.error = retryAfter
                ? rateLimitMessage(this.rateLimitedUntil)
                : merchantErrorMessage(error)
              return
            }

            // Pertahankan data terakhir agar QTable tidak memicu request baru
            // hanya karena respons sebelumnya gagal.
            this.error = merchantErrorMessage(error)
          })
          .finally(() => {
            if (requestSequence === merchantRequestSequence) {
              pendingMerchantRequest = null
              this.loading = false
            }
          })

        pendingMerchantRequest = { key: requestKey, promise: request }
        return request
      },

      openCreateDialog() {
        this.form = emptyForm()
        this.formErrors = {}
        this.formDialogOpen = true
      },

      async saveMerchant() {
        if (this.saving) return

        this.saving = true
        this.formErrors = {}

        try {
          const response = await danaGatewayMerchantService.create({
            code: this.form.code.trim(),
            name: this.form.name.trim(),
            email: this.form.email.trim() || null,
            environment: this.form.environment
          })

          this.formDialogOpen = false
          await this.fetchMerchants({ page: 1 })
          Notify.create({
            message: `Merchant ${response.data.data.merchant_code} berhasil diprovisikan. Bootstrap credential masih diperlukan sebelum checkout.`,
            color: 'positive',
            icon: 'check_circle',
            position: 'top',
            timeout: 6000
          })
        } catch (error) {
          this.formErrors = getApiValidationErrors(error)
          if (!Object.keys(this.formErrors).length) {
            this.error = merchantErrorMessage(error)
          }
        } finally {
          this.saving = false
        }
      },

      async showMerchant(merchantId) {
        this.detailLoading = true
        this.selectedMerchant = null
        this.detailDialogOpen = true

        try {
          const response = await danaGatewayMerchantService.get(merchantId)
          this.selectedMerchant = response.data?.data ?? null
        } catch (error) {
          this.detailDialogOpen = false
          this.error = merchantErrorMessage(error)
        } finally {
          this.detailLoading = false
        }
      }
    }
  }
)
