import { defineStore } from 'pinia'

const demoApplications = [
  {
    id: 'app-demo-001',
    code: 'RUKEM',
    name: 'SI RUKEM',
    description: 'Sistem informasi pelayanan desa.',
    url: 'https://contoh.local/rukem',
    status: 'active',
    createdAt: '2026-10-01T08:00:00+07:00'
  },
  {
    id: 'app-demo-002',
    code: 'LARISSAMA',
    name: 'Larissama',
    description: 'Platform pengelolaan usaha dan layanan pelanggan.',
    url: 'https://contoh.local/larissama',
    status: 'active',
    createdAt: '2026-10-03T08:00:00+07:00'
  },
  {
    id: 'app-demo-003',
    code: 'UDEV-DEMO',
    name: 'Aplikasi Udumbara Demo',
    description: 'Contoh aplikasi untuk rancangan billing terpusat.',
    url: 'https://contoh.local/udev-demo',
    status: 'inactive',
    createdAt: '2026-10-05T08:00:00+07:00'
  }
]

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  url: '',
  status: 'active'
})

export const useAplikasiStore = defineStore('aplikasi', {
  state: () => ({
    items: demoApplications,
    search: '',
    status: null,
    form: emptyForm(),
    formDialogOpen: false,
    formMode: 'create',
    editingId: null,
    detailDialogOpen: false,
    selectedApplication: null
  }),

  getters: {
    filteredItems: state => {
      const search = state.search.trim().toLowerCase()

      return state.items.filter(item => {
        const matchesSearch =
          !search ||
          [item.name, item.code, item.description].some(value =>
            value.toLowerCase().includes(search)
          )
        const matchesStatus = !state.status || item.status === state.status

        return matchesSearch && matchesStatus
      })
    }
  },

  actions: {
    openCreateDialog() {
      this.form = emptyForm()
      this.formMode = 'create'
      this.editingId = null
      this.formDialogOpen = true
    },

    openEditDialog(item) {
      this.form = { ...item }
      this.formMode = 'edit'
      this.editingId = item.id
      this.formDialogOpen = true
    },

    openDetailDialog(item) {
      this.selectedApplication = item
      this.detailDialogOpen = true
    },

    saveDemoApplication() {
      const application = {
        ...this.form,
        code: this.form.code.trim().toUpperCase()
      }

      if (this.formMode === 'edit') {
        const index = this.items.findIndex(item => item.id === this.editingId)
        if (index !== -1)
          this.items.splice(index, 1, { ...this.items[index], ...application })
      } else {
        this.items.unshift({
          id: `app-demo-${Date.now()}`,
          ...application,
          createdAt: new Date().toISOString()
        })
      }

      this.formDialogOpen = false
    }
  }
})
