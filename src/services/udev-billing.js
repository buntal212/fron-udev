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

export const danaGatewayMerchantService = {
  list: params => getList('/v1/admin/dana-gateway-merchants', params),
  get: merchantId => api.get(`/v1/admin/dana-gateway-merchants/${merchantId}`),
  create: payload => api.post('/v1/admin/dana-gateway-merchants', payload),
  readiness: merchantId =>
    api.get(`/v1/admin/dana-gateway-merchants/${merchantId}/readiness`, {
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
    }),
  storedDanaConfiguration: merchantId =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/dana-configuration`,
      {
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  configureSandbox: (merchantId, payload) =>
    api.put(
      `/v1/admin/dana-gateway-merchants/${merchantId}/dana-configuration`,
      payload,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  validateSandboxTester: merchantId =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/validation`,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  sandboxTestHistory: (merchantId, params) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/transactions`,
      {
        params,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  createSandboxTestTransaction: (merchantId, payload, idempotencyKey) =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/transactions`,
      payload,
      {
        headers: {
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
          'Idempotency-Key': idempotencyKey
        }
      }
    ),
  sandboxTestTransactionStatus: (merchantId, paymentId) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/transactions/${paymentId}/status`,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  apiKeys: merchantId =>
    api.get(`/v1/admin/dana-gateway-merchants/${merchantId}/api-keys`, {
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
    }),
  revokeApiKey: (merchantId, apiKeyId) =>
    api.delete(
      `/v1/admin/dana-gateway-merchants/${merchantId}/api-keys/${apiKeyId}`,
      {
        data: { confirm_revoke: true },
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  issueApiKey: (merchantId, payload, idempotencyKey) =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/api-keys/issue`,
      payload,
      {
        headers: {
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
          'Idempotency-Key': idempotencyKey
        }
      }
    ),
  issuanceStatus: (merchantId, issuanceId) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/api-key-issuances/${issuanceId}`,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  issuances: (merchantId, params) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/api-key-issuances`,
      {
        params,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  cancelIssuance: (merchantId, issuanceId) =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/api-key-issuances/${issuanceId}/cancel`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    )
}
