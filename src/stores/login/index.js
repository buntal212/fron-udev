import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

const userStorageKey = 'udumbara-payment:user'
const tokenStorageKey = 'udumbara-payment:token'

function getStoredUser() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedUser = JSON.parse(window.localStorage.getItem(userStorageKey))

    if (
      storedUser &&
      typeof storedUser === 'object' &&
      storedUser.id &&
      typeof storedUser.name === 'string' &&
      typeof storedUser.username === 'string'
    ) {
      return {
        id: storedUser.id,
        name: storedUser.name,
        username: storedUser.username
      }
    }
  } catch {
    // Data local yang tidak valid akan digantikan setelah login berikutnya.
  }

  return null
}

function saveUser(user) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(userStorageKey, JSON.stringify(user))
  }
}

function removeStoredUser() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(userStorageKey)
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  const token = window.localStorage.getItem(tokenStorageKey)

  return typeof token === 'string' && token.length > 0 ? token : null
}

function saveToken(token) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(tokenStorageKey, token)
  }
}

function removeStoredToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(tokenStorageKey)
  }
}

function setAuthorizationHeader(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    return
  }

  delete api.defaults.headers.common.Authorization
}

const storedToken = getStoredToken()
setAuthorizationHeader(storedToken)

export const useLoginStore = defineStore('login', {
  state: () => ({
    loading: false,
    logoutLoading: false,
    form: {
      username: '',
      password: '',
      remember: false
    },
    submitted: false,
    error: null,
    token: storedToken,
    user: getStoredUser()
  }),

  actions: {
    async submit() {
      this.loading = true
      this.submitted = false
      this.error = null

      try {
        const response = await api.post('/v1/auth/login', {
          username: this.form.username,
          password: this.form.password,
          remember: this.form.remember
        })

        this.token = response.data.data.token
        saveToken(this.token)
        this.user = {
          id: response.data.data.id,
          name: response.data.data.name,
          username: response.data.data.username
        }
        saveUser(this.user)
        setAuthorizationHeader(this.token)

        this.submitted = true
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          'Login gagal. Periksa kembali username dan password Anda.'
      } finally {
        this.loading = false
      }
    },

    async logout() {
      if (this.logoutLoading) {
        return
      }

      this.logoutLoading = true

      try {
        await api.post('/v1/auth/logout')
      } catch (error) {
        console.error('Logout API gagal diproses.', error)
      } finally {
        this.token = null
        this.user = null
        this.submitted = false
        removeStoredUser()
        removeStoredToken()
        setAuthorizationHeader(null)
        this.logoutLoading = false
      }
    }
  }
})
