import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { authService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'
import { hasAdminSession, isAdminSessionRejected } from '@/utils/admin-session'

const userStorageKey = 'udumbara-payment:admin-user'
const tokenStorageKey = 'udumbara-payment:admin-token'

function getStoredValue(key) {
  if (typeof window === 'undefined') return null

  return window.sessionStorage.getItem(key)
}

function getStoredUser() {
  try {
    const user = JSON.parse(getStoredValue(userStorageKey))

    return user?.id && user?.username ? user : null
  } catch {
    return null
  }
}

function setAuthorizationHeader(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

const storedToken = getStoredValue(tokenStorageKey)
setAuthorizationHeader(storedToken)

export const useLoginStore = defineStore('login', {
  state: () => ({
    loading: false,
    logoutLoading: false,
    sessionChecked: false,
    form: { username: '', password: '' },
    submitted: false,
    error: null,
    token: storedToken,
    user: getStoredUser()
  }),

  actions: {
    persistSession(token, user) {
      this.token = token
      this.user = user
      setAuthorizationHeader(token)
      window.sessionStorage.setItem(tokenStorageKey, token)
      window.sessionStorage.setItem(userStorageKey, JSON.stringify(user))
    },

    clearSession() {
      this.token = null
      this.user = null
      this.submitted = false
      setAuthorizationHeader(null)

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(tokenStorageKey)
        window.sessionStorage.removeItem(userStorageKey)
      }
    },

    async restoreSession() {
      if (this.sessionChecked) return hasAdminSession(this.token, this.user)

      this.sessionChecked = true

      if (!this.token) {
        this.clearSession()
        return false
      }

      try {
        const response = await authService.me()
        this.user = response.data.data
        window.sessionStorage.setItem(userStorageKey, JSON.stringify(this.user))

        return true
      } catch (error) {
        if (isAdminSessionRejected(error)) {
          this.clearSession()
          return false
        }

        // Jangan menghapus sesi saat jaringan/backend sedang tidak tersedia.
        // Endpoint terproteksi tetap memverifikasi token di server pada setiap
        // permintaan, sedangkan guard dapat mencoba memulihkan sesi lagi nanti.
        this.sessionChecked = false
        return hasAdminSession(this.token, this.user)
      }
    },

    async submit() {
      this.loading = true
      this.submitted = false
      this.error = null

      try {
        const response = await authService.login(this.form)
        const { token, user } = response.data.data

        this.persistSession(token, user)
        this.sessionChecked = true
        this.submitted = true
      } catch (error) {
        this.error =
          getApiValidationErrors(error).username?.[0] ||
          getApiErrorMessage(error)
      } finally {
        this.loading = false
      }
    },

    async logout() {
      if (this.logoutLoading) return

      this.logoutLoading = true

      try {
        await authService.logout()
      } finally {
        this.clearSession()
        this.sessionChecked = true
        this.logoutLoading = false
      }
    }
  }
})
