import { api } from '@/boot/axios'

const normalizeQueryParams = params =>
  Object.fromEntries(
    Object.entries(params || {}).map(([key, value]) => [
      key,
      typeof value === 'boolean' ? Number(value) : value
    ])
  )

const getList = (url, params) =>
  api.get(url, { params: normalizeQueryParams(params) })

export const authService = {
  login: credentials => api.post('/v1/auth/login', credentials),
  logout: () => api.post('/v1/auth/logout'),
  me: () => api.get('/v1/auth/me')
}

export const applicationService = {
  list: params => getList('/v1/admin/applications', params),
  get: id => api.get(`/v1/admin/applications/${id}`),
  create: payload => api.post('/v1/admin/applications', payload),
  update: (id, payload) => api.patch(`/v1/admin/applications/${id}`, payload)
}

export const applicationCustomerService = {
  list: params => getList('/v1/admin/application-customers', params),
  get: id => api.get(`/v1/admin/application-customers/${id}`),
  create: payload => api.post('/v1/admin/application-customers', payload),
  update: (id, payload) =>
    api.patch(`/v1/admin/application-customers/${id}`, payload)
}

export const subscriptionPlanService = {
  list: params => getList('/v1/admin/subscription-plans', params),
  get: id => api.get(`/v1/admin/subscription-plans/${id}`),
  create: payload => api.post('/v1/admin/subscription-plans', payload),
  update: (id, payload) =>
    api.patch(`/v1/admin/subscription-plans/${id}`, payload),
  remove: id => api.delete(`/v1/admin/subscription-plans/${id}`)
}

export const subscriptionService = {
  list: params => getList('/v1/admin/subscriptions', params),
  get: id => api.get(`/v1/admin/subscriptions/${id}`)
}

export const invoiceService = {
  list: params => getList('/v1/admin/invoices', params),
  get: id => api.get(`/v1/admin/invoices/${id}`),
  create: (payload, headers) =>
    api.post('/v1/admin/invoices', payload, { headers })
}

export const paymentAttemptService = {
  list: params => getList('/v1/admin/payment-attempts', params),
  get: id => api.get(`/v1/admin/payment-attempts/${id}`)
}

export const paymentGatewayService = {
  list: params => getList('/v1/admin/payment-gateways', params),
  merchantOptions: environment =>
    api.get('/v1/admin/payment-gateways/merchants', {
      params: { environment }
    }),
  create: payload => api.post('/v1/admin/payment-gateways', payload),
  update: (id, payload) =>
    api.patch(`/v1/admin/payment-gateways/${id}`, payload)
}
