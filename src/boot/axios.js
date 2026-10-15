import { boot } from 'quasar/wrappers'
import axios from 'axios'
import {
  getApiErrorMessage,
  getApiValidationErrors,
  notifyApiError
} from '@/utils/api-error'

const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json'
  }
})

api.interceptors.response.use(
  response => response,
  error => {
    error.userMessage = getApiErrorMessage(error)
    error.validationErrors = getApiValidationErrors(error)

    if (error.response?.status !== 422) {
      notifyApiError(error)
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('udev:session-expired'))
    }

    return Promise.reject(error)
  }
)

export default boot(() => {
  // Instance diekspor untuk digunakan oleh Pinia store.
})

export { api }
