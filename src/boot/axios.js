import { boot } from 'quasar/wrappers'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    Accept: 'application/json'
  }
})

export default boot(() => {
  // Instance diekspor untuk digunakan oleh Pinia store.
})

export { api }
