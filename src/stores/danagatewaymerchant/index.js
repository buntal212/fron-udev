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
        this.loading = true
        this.error = null
        this.pagination = { ...this.pagination, ...nextPagination }

        try {
          const response = await danaGatewayMerchantService.list({
            page: this.pagination.page,
            per_page: this.pagination.rowsPerPage,
            search: this.search || undefined,
            environment: this.environment || undefined
          })
          const { data, meta } = response.data
          this.items = data ?? []
          this.pagination = {
            ...this.pagination,
            page: meta?.current_page ?? this.pagination.page,
            rowsPerPage: meta?.per_page ?? this.pagination.rowsPerPage,
            rowsNumber: meta?.total ?? 0
          }
        } catch (error) {
          this.items = []
          this.error = merchantErrorMessage(error)
        } finally {
          this.loading = false
        }
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
