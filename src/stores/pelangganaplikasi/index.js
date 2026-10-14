import { defineStore } from 'pinia'

const demoCustomers = [
  {
    id: 'cust-demo-001',
    application: 'SI RUKEM',
    applicationId: 'app-demo-001',
    externalId: 'DESA-ROWO-LECES',
    name: 'Desa Rowo Leces (Demo)',
    email: 'desa.rowo@example.test',
    phone: '0812-0000-0001',
    status: 'active',
    createdAt: '2026-10-02T08:00:00+07:00'
  },
  {
    id: 'cust-demo-002',
    application: 'Larissama',
    applicationId: 'app-demo-002',
    externalId: 'WARUNG-A',
    name: 'Warung A (Demo)',
    email: 'warung.a@example.test',
    phone: '0812-0000-0002',
    status: 'active',
    createdAt: '2026-10-04T08:00:00+07:00'
  },
  {
    id: 'cust-demo-003',
    application: 'Larissama',
    applicationId: 'app-demo-002',
    externalId: 'WARUNG-B',
    name: 'Warung B (Demo)',
    email: 'warung.b@example.test',
    phone: '0812-0000-0003',
    status: 'pending',
    createdAt: '2026-10-06T08:00:00+07:00'
  }
]

const emptyForm = () => ({
  application: 'SI RUKEM',
  externalId: '',
  name: '',
  email: '',
  phone: '',
  status: 'active'
})

export const usePelangganAplikasiStore = defineStore('pelanggan-aplikasi', {
  state: () => ({
    items: demoCustomers,
    search: '',
    application: null,
    status: null,
    form: emptyForm(),
    formDialogOpen: false,
    formMode: 'create',
    editingId: null,
    detailDialogOpen: false,
    selectedCustomer: null
  }),

  getters: {
    applications: state => [
      ...new Set(state.items.map(item => item.application))
    ],
    filteredItems: state => {
      const search = state.search.trim().toLowerCase()

      return state.items.filter(item => {
        const matchesSearch =
          !search ||
          [item.name, item.externalId, item.email].some(value =>
            value.toLowerCase().includes(search)
          )

        return (
          matchesSearch &&
          (!state.application || item.application === state.application) &&
          (!state.status || item.status === state.status)
        )
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
      this.selectedCustomer = item
      this.detailDialogOpen = true
    },

    saveDemoCustomer() {
      const customer = {
        ...this.form,
        applicationId:
          this.form.application === 'SI RUKEM' ? 'app-demo-001' : 'app-demo-002'
      }

      if (this.formMode === 'edit') {
        const index = this.items.findIndex(item => item.id === this.editingId)
        if (index !== -1)
          this.items.splice(index, 1, { ...this.items[index], ...customer })
      } else {
        this.items.unshift({
          id: `cust-demo-${Date.now()}`,
          ...customer,
          createdAt: new Date().toISOString()
        })
      }

      this.formDialogOpen = false
    }
  }
})
