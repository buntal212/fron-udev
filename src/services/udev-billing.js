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

export const partnerService = {
  list: params => getList('/v1/admin/partners', params),
  get: id => api.get(`/v1/admin/partners/${id}`),
  create: payload => api.post('/v1/admin/partners', payload),
  update: (id, payload) => api.patch(`/v1/admin/partners/${id}`, payload),
  remove: id => api.delete(`/v1/admin/partners/${id}`)
}

export const referralCodeService = {
  list: params => getList('/v1/admin/referral-codes', params),
  get: id => api.get(`/v1/admin/referral-codes/${id}`),
  usages: id =>
    getList(`/v1/admin/referral-codes/${id}/usages`, { per_page: 15 }),
  create: payload => api.post('/v1/admin/referral-codes', payload),
  update: (id, payload) => api.patch(`/v1/admin/referral-codes/${id}`, payload)
}

export const applicationIntegrationService = {
  globalToken: applicationId =>
    api.get(`/v1/admin/applications/${applicationId}/global-integration-token`),
  generateGlobalToken: applicationId =>
    api.post(
      `/v1/admin/applications/${applicationId}/global-integration-token`
    ),
  rotateGlobalToken: applicationId =>
    api.post(
      `/v1/admin/applications/${applicationId}/global-integration-token/rotate`
    ),
  revokeGlobalToken: applicationId =>
    api.delete(
      `/v1/admin/applications/${applicationId}/global-integration-token`
    ),
  tokens: applicationId =>
    getList(`/v1/admin/applications/${applicationId}/integration-tokens`, {
      per_page: 100
    }),
  audits: (applicationId, params) =>
    getList(
      `/v1/admin/applications/${applicationId}/integration-audits`,
      params
    ),
  createToken: (applicationId, payload) =>
    api.post(
      `/v1/admin/applications/${applicationId}/integration-tokens`,
      payload
    ),
  revokeToken: (applicationId, tokenId) =>
    api.delete(
      `/v1/admin/applications/${applicationId}/integration-tokens/${tokenId}`
    )
}

export const applicationIntegrationTestService = {
  create: (applicationId, payload) =>
    api.post(
      `/v1/admin/applications/${applicationId}/integration-tests/customers`,
      payload,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  get: (applicationId, externalId) =>
    api.get(
      `/v1/admin/applications/${applicationId}/integration-tests/customers/${encodeURIComponent(externalId)}`,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  update: (applicationId, externalId, payload) =>
    api.patch(
      `/v1/admin/applications/${applicationId}/integration-tests/customers/${encodeURIComponent(externalId)}`,
      payload,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  audits: (applicationId, params) =>
    getList(
      `/v1/admin/applications/${applicationId}/integration-tests/audits`,
      params
    )
}

export const applicationCustomerService = {
  list: params => getList('/v1/admin/application-customers', params),
  get: id => api.get(`/v1/admin/application-customers/${id}`),
  create: payload => api.post('/v1/admin/application-customers', payload),
  update: (id, payload) =>
    api.patch(`/v1/admin/application-customers/${id}`, payload),
  validateReferral: (id, payload) =>
    api.post(
      `/v1/admin/application-customers/${id}/referral/validate`,
      payload
    ),
  attachReferral: (id, payload) =>
    api.post(`/v1/admin/application-customers/${id}/referral`, payload)
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
  recoverSubscription: id =>
    api.post(
      `/v1/admin/invoices/${id}/subscription/recover`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  create: (payload, headers) =>
    api.post('/v1/admin/invoices', payload, { headers }),
  checkout: (id, idempotencyKey, payload = {}) =>
    api.post(`/v1/admin/invoices/${id}/checkout`, payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
        'Cache-Control': 'no-store',
        Pragma: 'no-cache'
      }
    }),
  reconcile: id =>
    api.post(
      `/v1/admin/invoices/${id}/reconcile`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  simulateSandboxPayment: (id, payload) =>
    api.post(`/v1/admin/invoices/${id}/sandbox-simulate-payment`, payload, {
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
    })
}

export const paymentAttemptService = {
  list: params => getList('/v1/admin/payment-attempts', params),
  get: id => api.get(`/v1/admin/payment-attempts/${id}`),
  retryCheckout: id =>
    api.post(
      `/v1/admin/payment-attempts/${id}/checkout/retry`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  reconcile: id =>
    api.post(
      `/v1/admin/payment-attempts/${id}/reconcile`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    )
}

export const paymentResultService = {
  get: reference =>
    api.get(`/v1/payment-results/${encodeURIComponent(reference)}`, {
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
      suppressErrorNotification: true
    })
}

export const paymentGatewayService = {
  list: params => getList('/v1/admin/payment-gateways', params),
  billingTransactions: params =>
    getList('/v1/admin/payment-gateway/billing-transactions', params),
  billingTransaction: id =>
    api.get(`/v1/admin/payment-gateway/billing-transactions/${id}`),
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
  testCreateOrderMissingTimestamp: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/create-order-missing-timestamp`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testCreateOrderInvalidAmountFormat: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/create-order-invalid-amount-format`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testCreateOrderInconsistentRequest: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/create-order-inconsistent-request`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderSuccess: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-success`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderMissingTimestamp: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-missing-timestamp`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderGeneralError: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-general-error`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderTransactionNotPermitted: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-transaction-not-permitted`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderInvalidMerchant: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-invalid-merchant`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderInconsistentRequest: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-inconsistent-request`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderInvalidSignature: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-invalid-signature`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testIpgCreateOrderExceedsAmountLimit: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/ipg-create-order-exceeds-amount-limit`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testDebitStatusTransactionNotFound: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/debit-status-transaction-not-found`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testDebitStatusMissingTimestamp: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/debit-status-missing-timestamp`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testDebitStatusInternalServerError: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/debit-status-internal-server-error`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  testDebitStatusInvalidSignature: merchantId =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/debit-status-invalid-signature`,
      {},
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  armSandboxWebhookSimulated500: (merchantId, payload) =>
    api.post(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/uat/arm-webhook-500`,
      payload || {},
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
  queryDanaSandboxPaymentStatus: (merchantId, paymentId) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/transactions/${paymentId}/dana-status`,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  sandboxPayments: (merchantId, params) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/payments`,
      {
        params,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  sandboxPaymentDetail: (merchantId, paymentId) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/payments/${paymentId}`,
      { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
    ),
  sandboxPaymentSummary: (merchantId, params) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/payments/summary`,
      {
        params,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  sandboxPaymentWebhooks: (merchantId, paymentId, params) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/payments/${paymentId}/webhooks`,
      {
        params,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }
    ),
  sandboxPaymentResult: context =>
    api.get(
      `/v1/admin/dana-gateway-merchants/sandbox-payment-results/${encodeURIComponent(context)}`,
      {
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        suppressErrorNotification: true
      }
    ),
  sandboxPaymentResultFromHistory: (merchantId, paymentId) =>
    api.get(
      `/v1/admin/dana-gateway-merchants/${merchantId}/sandbox-tester/transactions/${paymentId}/result`,
      {
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        suppressErrorNotification: true
      }
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
