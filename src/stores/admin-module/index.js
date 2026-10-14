import { defineStore } from 'pinia'

const stores = new Map()

export function useAdminModuleStore(moduleKey) {
  if (!stores.has(moduleKey)) {
    stores.set(
      moduleKey,
      defineStore(`admin-${moduleKey}`, {
        state: () => ({
          loading: false,
          items: [],
          params: {
            search: '',
            status: null,
            merchant: null,
            dateRange: '',
            pagination: { page: 1, rowsPerPage: 10 }
          }
        }),
        actions: {
          clearFilters() {
            this.params.search = ''
            this.params.status = null
            this.params.merchant = null
            this.params.dateRange = ''
          }
        }
      })
    )
  }
  return stores.get(moduleKey)()
}
