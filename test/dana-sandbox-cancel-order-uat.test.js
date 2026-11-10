import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('panel tester DANA Sandbox menampilkan hasil UAT Cancel Order (2005700) dengan diagnostik aman', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )
  const service = await readFile(
    new URL('../src/services/udev-billing.js', import.meta.url),
    'utf8'
  )

  // Tombol aksi pembatalan transaksi pending
  assert.match(panel, /label="Batalkan Transaksi Sandbox"/)
  assert.match(panel, /label="UAT Happy Path E2E"/)
  assert.match(panel, /label="Cancel Order Success \(2005700\)"/)
  assert.match(panel, /label="UAT Cancel in Progress \(2025700\)"/)
  assert.match(panel, /label="UAT Transaction Not Permitted \(4035705\)"/)
  assert.match(panel, /label="UAT Merchant Status Abnormal \(4045708\)"/)
  assert.match(panel, /label="UAT Transaction Not Found \(4045701\)"/)
  assert.match(panel, /label="UAT Cancel Missing Timestamp \(4005702\)"/)
  assert.match(panel, /confirmHappyPathE2eUat/)
  assert.match(panel, /executeHappyPathE2eUat/)
  assert.match(panel, /runningHappyPathE2eUat/)
  assert.match(panel, /happyPathE2eResult/)
  assert.match(panel, /showHappyPathE2eConfirmDialog/)
  assert.match(panel, /Konfirmasi UAT Happy Path E2E/)
  assert.match(panel, /cancelCurrentTransaction/)
  assert.match(panel, /runCancelOrderSuccessUat/)
  assert.match(panel, /runCancelOrderInProgressUat/)
  assert.match(panel, /runCancelTransactionNotPermittedUat/)
  assert.match(panel, /runCancelMerchantStatusAbnormalUat/)
  assert.match(panel, /runCancelTransactionNotFoundUat/)
  assert.match(panel, /runCancelMissingTimestampUat/)
  assert.match(panel, /cancellingTransaction/)
  assert.match(panel, /runningCancelOrderInProgressUat/)
  assert.match(panel, /runningCancelTransactionNotPermittedUat/)
  assert.match(panel, /runningCancelMerchantStatusAbnormalUat/)
  assert.match(panel, /runningCancelTransactionNotFoundUat/)
  assert.match(panel, /runningCancelMissingTimestampUat/)
  assert.match(panel, /cancelPaymentResult/)
  assert.match(panel, /cancelInProgressUat/)
  assert.match(panel, /cancelTransactionNotPermittedUat/)
  assert.match(panel, /cancelMerchantStatusAbnormalUat/)
  assert.match(panel, /cancelTransactionNotFoundUat/)
  assert.match(panel, /cancelMissingTimestampUat/)

  // Kelompok kategori dan grid responsif
  assert.match(panel, /Konfigurasi/)
  assert.match(panel, /Create Order/)
  assert.match(panel, /Status Inquiry/)
  assert.match(panel, /Cancel Order/)
  assert.match(panel, /Webhook/)
  assert.match(panel, /uat-btn-grid/)
  assert.match(panel, /isAnyUatRunning/)

  // Banner hasil UAT Happy Path E2E
  assert.match(panel, /Hasil UAT DANA Sandbox Happy Path E2E/)
  assert.match(panel, /E2E PASS/)
  assert.match(panel, /1\. Create Order/)
  assert.match(panel, /2\. Cancel Order/)
  assert.match(panel, /3\. Status Inquiry/)
  assert.match(panel, /happyPathE2eResult\.final_status/)

  // Banner hasil UAT Cancel Order
  assert.match(
    panel,
    /Hasil Pembatalan Transaksi DANA Sandbox \(Cancel Order — 2005700\)/
  )
  assert.match(panel, /Lolos \(2005700 \/ Success\)/)
  assert.match(panel, /\/payment-gateway\/v1\.0\/debit\/cancel\.htm/)
  assert.match(panel, /cancelPaymentResult\.response_code/)
  assert.match(panel, /cancelPaymentResult\.response_message/)
  assert.match(panel, /cancelPaymentResult\.cancel_time/)
  assert.match(panel, /cancelPaymentResult\.request_id/)

  // Banner hasil UAT Cancel In Progress (2025700)
  assert.match(panel, /Hasil UAT Cancel Order In Progress \(2025700\)/)
  assert.match(panel, /Lolos \(2025700 \/ Request In Progress\)/)
  assert.match(panel, /cancelInProgressUat\.response_code/)
  assert.match(panel, /cancelInProgressUat\.response_message/)
  assert.match(panel, /cancelInProgressUat\.local_status/)

  // Banner hasil UAT Cancel Transaction Not Permitted (4035705)
  assert.match(panel, /Pembatalan Ditolak DANA — Do Not Honor/)
  assert.match(panel, /Lolos \(4035705 \/ Do Not Honor\)/)
  assert.match(panel, /cancelTransactionNotPermittedUat\.response_code/)
  assert.match(panel, /cancelTransactionNotPermittedUat\.response_message/)
  assert.match(panel, /cancelTransactionNotPermittedUat\.local_status/)
  assert.match(
    panel,
    /Status pembayaran lokal dan\s+invoice tetap aman, tidak berubah sepihak/
  )

  // Banner hasil UAT Cancel Merchant Status Abnormal (4045708)
  assert.match(panel, /Pembatalan Ditolak — Invalid Merchant/)
  assert.match(panel, /Lolos \(4045708 \/ Invalid Merchant\)/)
  assert.match(panel, /cancelMerchantStatusAbnormalUat\.response_code/)
  assert.match(panel, /cancelMerchantStatusAbnormalUat\.response_message/)
  assert.match(panel, /cancelMerchantStatusAbnormalUat\.local_status/)

  // Banner hasil UAT Cancel Transaction Not Found (4045701)
  assert.match(panel, /Pembatalan Ditolak — Transaction Not Found/)
  assert.match(panel, /Lolos \(4045701 \/ Transaction Not Found\)/)
  assert.match(panel, /cancelTransactionNotFoundUat\.response_code/)
  assert.match(panel, /cancelTransactionNotFoundUat\.response_message/)
  assert.match(panel, /cancelTransactionNotFoundUat\.local_status/)

  // Banner hasil UAT Cancel Missing Timestamp (4005702)
  assert.match(
    panel,
    /Pembatalan Ditolak — Missing Mandatory Field \(4005702\)/
  )
  assert.match(panel, /Lolos \(4005702 \/ Missing Mandatory Field\)/)
  assert.match(panel, /cancelMissingTimestampUat\.response_code/)
  assert.match(panel, /cancelMissingTimestampUat\.response_message/)
  assert.match(panel, /cancelMissingTimestampUat\.local_status/)
  assert.match(panel, /cancelMissingTimestampUat\.x_timestamp_sent/)

  // Keamanan: tidak mengekspos credential, private key, atau token
  const uatSection = panel.split('<div v-if="validation"')[0]
  assert.doesNotMatch(
    uatSection,
    /private_key|api_key|X-SIGNATURE|client_secret/
  )

  // Service billing API helper
  assert.match(service, /cancelDanaSandboxPayment:/)
  assert.match(
    service,
    /\/v1\/admin\/dana-gateway-merchants\/\$\{merchantId\}\/sandbox-tester\/transactions\/\$\{paymentId\}\/cancel/
  )
})

test('riwayat pembayaran DANA Sandbox menampilkan banner hasil pembatalan transaksi 2005700', async () => {
  const history = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxPaymentHistory.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(history, /cancelPayment\(payment\)/)
  assert.match(history, /cancellingPaymentId/)
  assert.match(history, /cancelPaymentResults/)
  assert.match(
    history,
    /Hasil Pembatalan Transaksi DANA Sandbox\s*\(Cancel Order\s*—\s*2005700\)/
  )
  assert.match(history, /2005700/)
  assert.match(history, /\/payment-gateway\/v1\.0\/debit\/cancel\.htm/)
  assert.doesNotMatch(history, /private_key|api_key|client_secret/)
})
