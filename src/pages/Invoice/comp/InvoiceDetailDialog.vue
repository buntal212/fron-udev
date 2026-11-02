<template>
  <q-dialog
    v-model="store.detailDialogOpen"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @before-hide="store.closeDetailDialog"
  >
    <q-card class="invoice-dialog-card column no-wrap">
      <!-- Sticky Header -->
      <q-card-section
        class="dialog-sticky-header row items-center justify-between q-py-sm q-px-md"
      >
        <div class="row items-center q-gutter-sm no-wrap">
          <q-avatar
            size="36px"
            color="amber-10"
            text-color="dark"
            icon="receipt_long"
            class="gold-avatar"
          />
          <div class="column">
            <div class="row items-center q-gutter-xs">
              <span class="eyebrow text-gold">DETAIL INVOICE</span>
              <q-badge
                v-if="store.selectedInvoice"
                rounded
                outline
                color="warning"
                :label="store.applicationName(invoice)"
                class="app-badge"
              />
            </div>
            <h2 class="dialog-title text-sand text-weight-bolder">
              {{ invoice.invoice_number || 'Memuat Invoice...' }}
            </h2>
          </div>
        </div>

        <div class="row items-center q-gutter-xs no-wrap">
          <q-badge
            v-if="store.selectedInvoice"
            rounded
            :color="getInvoiceStatus(invoice.status).color"
            :label="getInvoiceStatus(invoice.status).label"
            class="q-px-sm q-py-xs status-header-badge"
          />
          <q-btn
            v-if="store.selectedInvoice && invoice.payment_attempts?.length"
            flat
            dense
            round
            color="warning"
            icon="sync"
            :loading="store.reconcileLoading"
            :disable="store.reconcileLoading"
            @click="store.reconcileInvoice()"
          >
            <q-tooltip class="bg-dark text-warning"
              >Sinkronkan status transaksi terbaru dari gateway</q-tooltip
            >
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="close"
            text-color="grey-4"
            aria-label="Tutup"
            v-close-popup
          />
        </div>
      </q-card-section>

      <q-separator class="gold-separator" />

      <!-- Dialog Body -->
      <q-card-section
        v-if="store.detailLoading"
        class="q-pa-xl text-center flex flex-center col"
      >
        <div class="column items-center q-gutter-md">
          <q-spinner-orbit color="warning" size="48px" />
          <div class="text-sand text-weight-medium">Memuat data invoice...</div>
        </div>
      </q-card-section>

      <q-card-section
        v-else-if="store.selectedInvoice"
        class="dialog-scroll-body col q-pa-md q-pa-sm-lg"
      >
        <!-- Error Banner Top -->
        <q-banner
          v-if="store.checkoutError"
          rounded
          dense
          class="gold-error-banner q-mb-md"
        >
          <template #avatar>
            <q-icon name="error_outline" color="negative" size="24px" />
          </template>
          <div class="text-body2 text-weight-medium">{{
            store.checkoutError
          }}</div>
          <template #action>
            <q-btn
              flat
              dense
              no-caps
              color="warning"
              label="Sinkronkan Status"
              :loading="store.reconcileLoading"
              @click="store.reconcileInvoice()"
            />
            <q-btn
              flat
              dense
              no-caps
              color="negative"
              label="Coba Lagi"
              :loading="store.checkoutLoading"
              @click="store.retryCheckout()"
            />
          </template>
        </q-banner>

        <!-- Two Column Desktop Layout -->
        <div class="row q-col-gutter-md">
          <!-- Left Column: Ringkasan & Rincian Tagihan -->
          <div class="col-12 col-md-6 column q-gutter-y-md">
            <!-- Card 1: Ringkasan Invoice & Info Tanggal -->
            <div class="gold-card q-pa-md">
              <div class="row items-center q-gutter-xs q-mb-sm">
                <q-icon name="info" color="warning" size="18px" />
                <span class="gold-card-title">Ringkasan Invoice</span>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <p class="field-label">Pelanggan</p>
                  <p class="field-value">{{ invoice.customer?.name || '—' }}</p>
                </div>
                <div class="col-12 col-sm-6">
                  <p class="field-label">Aplikasi</p>
                  <p class="field-value">{{
                    store.applicationName(invoice)
                  }}</p>
                </div>
                <div class="col-12 col-sm-6">
                  <p class="field-label">Paket Langganan</p>
                  <p class="field-value">{{ invoice.plan?.name || '—' }}</p>
                </div>
                <div class="col-12 col-sm-6">
                  <p class="field-label">Durasi / Periode</p>
                  <p class="field-value">
                    {{ invoice.period_count || 1 }} Periode ({{
                      invoice.duration_days
                    }}
                    hari)
                  </p>
                </div>
              </div>

              <q-separator class="gold-separator-subtle q-my-sm" />

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <p class="field-label">Tanggal Terbit</p>
                  <p class="field-value">{{
                    formatSubscriptionDate(invoice.issued_at)
                  }}</p>
                </div>
                <div class="col-12 col-sm-6">
                  <p class="field-label">Jatuh Tempo</p>
                  <p class="field-value">{{
                    formatSubscriptionDate(invoice.due_at)
                  }}</p>
                </div>
                <div class="col-12 col-sm-6">
                  <p class="field-label">Tanggal Pembayaran</p>
                  <p class="field-value">{{
                    formatSubscriptionDate(invoice.paid_at) || 'Belum dibayar'
                  }}</p>
                </div>
                <div v-if="invoice.subscription" class="col-12 col-sm-6">
                  <p class="field-label">Masa Aktif Langganan</p>
                  <div class="row items-center q-gutter-xs">
                    <span class="field-value">{{
                      formatSubscriptionDate(invoice.subscription.expires_at)
                    }}</span>
                    <q-badge
                      rounded
                      dense
                      :color="
                        invoice.subscription.status === 'active'
                          ? 'positive'
                          : 'grey-7'
                      "
                      :label="invoice.subscription.status"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 2: Rincian Tagihan & Total Pembayaran -->
            <div class="gold-card q-pa-md">
              <div class="row items-center q-gutter-xs q-mb-sm">
                <q-icon name="receipt" color="warning" size="18px" />
                <span class="gold-card-title">Rincian Tagihan</span>
              </div>

              <div class="column q-gutter-y-xs q-mb-md">
                <div class="row justify-between text-body2">
                  <span class="text-muted">Harga Normal</span>
                  <span class="text-sand">
                    {{
                      formatSubscriptionPrice(
                        invoice.pricing?.normal_price ?? invoice.amount,
                        invoice.currency
                      )
                    }}
                  </span>
                </div>
                <div
                  v-if="
                    invoice.pricing?.discount_amount &&
                    Number(invoice.pricing.discount_amount) > 0
                  "
                  class="row justify-between text-body2"
                >
                  <span class="text-muted">Potongan Diskon</span>
                  <span class="text-negative">
                    -{{
                      formatSubscriptionPrice(
                        invoice.pricing.discount_amount,
                        invoice.currency
                      )
                    }}
                  </span>
                </div>
                <div
                  v-if="referralName !== '—'"
                  class="row justify-between text-body2"
                >
                  <span class="text-muted">Referral Mitra</span>
                  <span class="text-gold">{{ referralName }}</span>
                </div>
              </div>

              <!-- Total Bayar Highlight Box -->
              <div
                class="total-bayar-box q-pa-md row items-center justify-between"
              >
                <div>
                  <div class="total-label text-gold text-weight-bold"
                    >TOTAL PEMBAYARAN</div
                  >
                  <div class="total-amount text-gold-glow">
                    {{
                      formatSubscriptionPrice(
                        invoice.pricing?.final_price ?? invoice.amount,
                        invoice.currency
                      )
                    }}
                  </div>
                </div>
                <q-badge
                  rounded
                  :color="getInvoiceStatus(invoice.status).color"
                  :label="getInvoiceStatus(invoice.status).label"
                  class="q-px-sm q-py-xs"
                />
              </div>
            </div>
          </div>

          <!-- Right Column: Pembayaran, QRIS/VA Display & Sandbox Controls -->
          <div class="col-12 col-md-6 column q-gutter-y-md">
            <!-- Payment Action / Instructions Panel -->
            <div class="gold-card q-pa-md">
              <!-- Header Section -->
              <div class="row items-center justify-between q-mb-sm">
                <div class="row items-center q-gutter-xs">
                  <q-icon name="payment" color="warning" size="18px" />
                  <span class="gold-card-title"
                    >Metode & Instruksi Pembayaran</span
                  >
                </div>
                <q-badge
                  v-if="isCheckoutExpired"
                  color="negative"
                  label="Kedaluwarsa"
                  rounded
                />
                <q-badge
                  v-else-if="invoice.status === 'paid'"
                  color="positive"
                  label="Lunas"
                  rounded
                />
                <q-badge
                  v-else-if="isCurrentAttemptActive"
                  color="warning"
                  label="Menunggu Pembayaran"
                  rounded
                />
              </div>

              <!-- Gateway Selector Toggle (Midtrans Sandbox / DANA Sandbox) -->
              <div v-if="canStartCheckout" class="q-mb-md">
                <div class="text-caption text-muted q-mb-xs"
                  >Pilih Gateway Pembayaran:</div
                >
                <div class="row q-gutter-xs">
                  <q-btn
                    v-for="gw in availableGateways"
                    :key="gw"
                    dense
                    unelevated
                    no-caps
                    :class="[
                      'gateway-toggle-btn',
                      store.checkoutProvider === gw
                        ? 'gateway-btn-active'
                        : 'gateway-btn-inactive'
                    ]"
                    :icon="
                      gw === 'midtrans' ? 'bolt' : 'account_balance_wallet'
                    "
                    :label="
                      gw === 'midtrans' ? 'Midtrans Sandbox' : 'DANA Sandbox'
                    "
                    @click="setProvider(gw)"
                  />
                </div>
              </div>

              <!-- Payment Method Selector (QRIS / VA / GoPay / etc.) -->
              <div v-if="canStartCheckout" class="q-mb-md">
                <div class="text-caption text-muted q-mb-xs"
                  >Pilih Metode Transaksi:</div
                >
                <div class="row q-gutter-xs">
                  <q-btn
                    v-for="opt in paymentMethodOptions"
                    :key="opt.value"
                    dense
                    unelevated
                    no-caps
                    :class="[
                      'method-toggle-btn',
                      store.checkoutPaymentMethod === opt.value
                        ? 'method-btn-active'
                        : 'method-btn-inactive'
                    ]"
                    :label="opt.label"
                    @click="store.checkoutPaymentMethod = opt.value"
                  />
                </div>
              </div>

              <!-- Start Checkout Button (with double-click prevention) -->
              <div
                v-if="canStartCheckout && !isCurrentAttemptActive"
                class="q-mb-sm"
              >
                <q-btn
                  class="full-width gold-action-btn"
                  unelevated
                  no-caps
                  :loading="store.checkoutLoading"
                  :disable="store.checkoutLoading"
                  :icon="
                    store.checkoutPaymentMethod === 'qris'
                      ? 'qr_code_2'
                      : isVirtualAccountMethod(store.checkoutPaymentMethod)
                        ? 'account_balance'
                        : 'payments'
                  "
                  :label="
                    store.checkoutPaymentMethod === 'qris'
                      ? `Bayar dengan QRIS ${isMidtrans ? 'Midtrans' : 'DANA'}`
                      : isVirtualAccountMethod(store.checkoutPaymentMethod)
                        ? `Dapatkan ${paymentMethodLabel(store.checkoutPaymentMethod)}`
                        : `Lanjut ke ${paymentMethodLabel(store.checkoutPaymentMethod)}`
                  "
                  @click="onStartCheckout()"
                />
              </div>

              <!-- Countdown Banner when active -->
              <div
                v-if="
                  !isCheckoutExpired &&
                  invoice.status === 'pending' &&
                  store.checkoutRemainingSeconds > 0
                "
                class="countdown-box q-pa-sm row items-center justify-between q-mb-sm"
              >
                <div
                  class="row items-center q-gutter-xs text-sand text-caption"
                >
                  <q-icon name="schedule" color="warning" size="16px" />
                  <span>Sisa Waktu Pembayaran:</span>
                  <strong class="text-gold">{{ formattedCountdown }}</strong>
                </div>
                <q-spinner-dots color="warning" size="16px" />
              </div>

              <!-- QRIS Display Box -->
              <div
                v-if="showQrisSection"
                class="qris-presentation-box q-pa-md text-center q-mb-sm"
              >
                <div class="text-caption text-weight-bold text-dark q-mb-xs">
                  QRIS {{ isMidtrans ? 'Midtrans' : 'DANA' }} Sandbox
                </div>

                <!-- Loading QR Spinner -->
                <div
                  v-if="store.checkoutLoading || store.checkoutQrLoading"
                  class="q-py-lg"
                >
                  <q-spinner-tail color="primary" size="42px" />
                  <div class="text-caption text-grey-8 q-mt-xs">
                    Menghubungi Midtrans Sandbox untuk QRIS resmi...
                  </div>
                </div>

                <!-- Real Official QR Image (Midtrans QR URL) or Rendered Canvas fallback -->
                <div
                  v-else-if="activeQrUrl || store.checkoutQrDataUrl"
                  class="column items-center"
                >
                  <div class="qris-image-frame q-pa-xs bg-white shadow-3">
                    <img
                      v-if="activeQrUrl && !qrImageLoadFailed"
                      :src="activeQrUrl"
                      :alt="`QRIS ${isMidtrans ? 'Midtrans' : 'DANA'} Sandbox`"
                      class="qris-render-img"
                      @error="onQrImageError"
                    />
                    <img
                      v-else-if="store.checkoutQrDataUrl"
                      :src="store.checkoutQrDataUrl"
                      :alt="`QRIS ${isMidtrans ? 'Midtrans' : 'DANA'} Sandbox`"
                      class="qris-render-img"
                    />
                  </div>
                  <div
                    class="text-caption text-grey-9 text-weight-medium q-mt-xs"
                  >
                    Scan kode QRIS melalui simulator atau aplikasi sandbox.
                  </div>
                  <div
                    class="row items-center justify-center q-gutter-xs q-mt-sm"
                  >
                    <q-btn
                      v-if="store.checkoutQrDataUrl"
                      dense
                      outline
                      no-caps
                      size="sm"
                      color="dark"
                      icon="download"
                      label="Unduh QRIS"
                      @click="downloadQrisPng"
                    />
                    <q-btn
                      v-if="store.checkoutQrPayload"
                      dense
                      outline
                      no-caps
                      size="sm"
                      color="dark"
                      icon="content_copy"
                      label="Salin Payload"
                      @click="
                        copyPayload(
                          store.checkoutQrPayload,
                          'Payload QRIS disalin!'
                        )
                      "
                    />
                    <q-btn
                      v-if="activeQrUrl"
                      dense
                      outline
                      no-caps
                      size="sm"
                      color="primary"
                      icon="open_in_new"
                      label="Buka QR Resmi"
                      :href="activeQrUrl"
                      target="_blank"
                    />
                  </div>
                </div>

                <!-- Missing instructions fallback card -->
                <div
                  v-else-if="invoice.status === 'pending'"
                  class="q-py-md text-center"
                >
                  <q-icon name="hourglass_empty" color="warning" size="32px" />
                  <div class="text-caption text-grey-8 q-mt-xs">
                    Instruksi QRIS belum dimuat dari gateway.
                  </div>
                  <q-btn
                    dense
                    unelevated
                    no-caps
                    size="sm"
                    color="warning"
                    text-color="dark"
                    icon="sync"
                    label="Ambil Ulang Instruksi"
                    class="q-mt-sm"
                    :loading="store.reconcileLoading"
                    @click="store.reconcileInvoice()"
                  />
                </div>
              </div>

              <!-- Virtual Account Display Box -->
              <div
                v-if="isCurrentAttemptVirtualAccount"
                class="va-presentation-box q-pa-md text-center q-mb-sm"
              >
                <div class="text-caption text-grey-4">
                  {{
                    currentPaymentInstruction?.biller_code
                      ? 'Mandiri Bill Payment'
                      : paymentMethodLabel(currentAttemptMethod)
                  }}
                </div>
                <div
                  v-if="currentPaymentInstruction?.biller_code"
                  class="q-my-xs"
                >
                  <div class="text-caption text-gold"
                    >Kode Perusahaan (Biller Code)</div
                  >
                  <div class="text-h6 text-weight-bolder text-sand">{{
                    currentPaymentInstruction.biller_code
                  }}</div>
                </div>
                <div class="q-my-xs">
                  <div class="text-caption text-gold">
                    {{
                      currentPaymentInstruction?.biller_code
                        ? 'Nomor Pembayaran (Bill Key)'
                        : 'Nomor Virtual Account'
                    }}
                  </div>
                  <div
                    class="text-h5 text-weight-bolder text-gold-glow letter-spaced"
                    >{{ currentPaymentCode }}</div
                  >
                </div>
                <div class="row justify-center q-gutter-xs q-mt-sm">
                  <q-btn
                    v-if="currentPaymentInstruction?.biller_code"
                    outline
                    dense
                    no-caps
                    size="sm"
                    color="warning"
                    icon="content_copy"
                    label="Salin Biller Code"
                    @click="
                      copyPayload(
                        currentPaymentInstruction.biller_code,
                        'Biller Code disalin!'
                      )
                    "
                  />
                  <q-btn
                    outline
                    dense
                    no-caps
                    size="sm"
                    color="warning"
                    icon="content_copy"
                    :label="
                      currentPaymentInstruction?.biller_code
                        ? 'Salin Bill Key'
                        : 'Salin Nomor VA'
                    "
                    @click="
                      copyPayload(currentPaymentCode, 'Nomor VA disalin!')
                    "
                  />
                </div>
              </div>

              <!-- GoPay Display Box -->
              <div
                v-if="isCurrentAttemptGopay"
                class="va-presentation-box q-pa-md text-center q-mb-sm"
              >
                <div class="text-caption text-grey-4"
                  >GoPay Midtrans Sandbox</div
                >
                <div class="text-body2 text-sand q-mt-xs"
                  >Lanjutkan transaksi langsung di aplikasi GoPay Sandbox.</div
                >
                <q-btn
                  v-if="store.checkoutUrl || latestAttempt?.checkout_url"
                  unelevated
                  no-caps
                  color="warning"
                  text-color="dark"
                  icon="open_in_new"
                  label="Buka Aplikasi GoPay"
                  class="q-mt-sm font-weight-bold"
                  :href="store.checkoutUrl || latestAttempt?.checkout_url"
                  target="_blank"
                />
              </div>

              <!-- Retry Checkout action when expired / failed -->
              <div
                v-if="
                  (isCheckoutExpired || isLatestAttemptFailed) &&
                  invoice.status === 'pending'
                "
                class="q-mt-xs"
              >
                <q-btn
                  class="full-width"
                  unelevated
                  dense
                  no-caps
                  color="negative"
                  icon="replay"
                  label="Ulangi Checkout (Buat Instruksi Baru)"
                  :loading="store.checkoutLoading"
                  @click="store.retryCheckout()"
                />
              </div>
            </div>

            <!-- Card: Admin UAT Sandbox Controls -->
            <div class="gold-card q-pa-md">
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-xs">
                  <q-icon name="science" color="warning" size="18px" />
                  <span class="gold-card-title"
                    >Kontrol Pengujian Admin (Sandbox)</span
                  >
                </div>
                <q-badge
                  color="dark"
                  outline
                  text-color="warning"
                  label="Sandbox UAT"
                />
              </div>
              <p class="text-caption text-muted q-mb-sm">
                Sinkronkan status transaksi resmi dari gateway Midtrans / DANA.
              </p>
              <div class="row q-gutter-xs items-center">
                <q-btn
                  v-if="invoice.payment_attempts?.length"
                  dense
                  unelevated
                  no-caps
                  color="warning"
                  text-color="dark"
                  icon="sync"
                  label="Sinkronkan Status Gateway"
                  class="q-px-sm"
                  :loading="store.reconcileLoading"
                  :disable="store.reconcileLoading"
                  @click="store.reconcileInvoice()"
                />
                <q-btn
                  v-if="invoice.status === 'pending' && !isMidtrans"
                  dense
                  outline
                  no-caps
                  color="negative"
                  icon="cancel"
                  label="Simulasi Gagal (DANA)"
                  class="q-px-sm"
                  :loading="store.simulateLoading"
                  :disable="store.simulateLoading"
                  @click="store.simulateSandboxPayment('failed')"
                />
                <q-btn
                  v-if="store.checkoutUrl"
                  dense
                  outline
                  no-caps
                  color="warning"
                  icon="open_in_new"
                  :label="`Buka Halaman Checkout`"
                  class="q-px-sm"
                  :href="store.checkoutUrl"
                  target="_blank"
                />
              </div>
              <q-banner
                v-if="store.simulateMessage"
                rounded
                dense
                class="bg-positive text-white q-mt-xs text-caption"
              >
                {{ store.simulateMessage }}
              </q-banner>
              <q-banner
                v-if="store.simulateError || store.reconcileError"
                rounded
                dense
                class="bg-negative text-white q-mt-xs text-caption"
              >
                {{ store.simulateError || store.reconcileError }}
              </q-banner>
            </div>
          </div>
        </div>

        <!-- Full-Width Bottom Tabs: Riwayat Pembayaran & Riwayat Subscription -->
        <div class="gold-card q-mt-md">
          <q-tabs
            v-model="activeTab"
            dense
            no-caps
            class="gold-tabs"
            active-color="warning"
            indicator-color="warning"
            align="left"
          >
            <q-tab
              name="attempts"
              icon="history"
              :label="`Riwayat Pembayaran (${invoice.payment_attempts?.length || 0})`"
            />
            <q-tab
              v-if="invoice.subscription?.period_events?.length"
              name="subscriptions"
              icon="card_membership"
              :label="`Riwayat Langganan (${invoice.subscription.period_events.length})`"
            />
          </q-tabs>

          <q-separator class="gold-separator" />

          <q-tab-panels v-model="activeTab" animated class="bg-transparent">
            <!-- Attempts Tab -->
            <q-tab-panel name="attempts" class="q-pa-none">
              <q-list
                v-if="invoice.payment_attempts?.length"
                separator
                class="gold-history-list"
              >
                <q-expansion-item
                  v-for="attempt in invoice.payment_attempts"
                  :key="attempt.id"
                  expand-separator
                  header-class="gold-history-header"
                >
                  <template #header>
                    <q-item-section avatar>
                      <q-avatar
                        size="30px"
                        :color="
                          attempt.provider === 'midtrans'
                            ? 'amber-10'
                            : 'blue-9'
                        "
                        text-color="dark"
                        :icon="
                          attempt.provider === 'midtrans'
                            ? 'bolt'
                            : 'account_balance_wallet'
                        "
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-sand text-weight-bold">
                        {{
                          attempt.provider === 'midtrans' ? 'Midtrans' : 'DANA'
                        }}
                        · Percobaan #{{ attempt.attempt_number }}
                      </q-item-label>
                      <q-item-label caption class="text-muted">
                        {{ formatSubscriptionDate(attempt.requested_at) }} ·
                        {{
                          formatSubscriptionPrice(
                            attempt.amount,
                            attempt.currency
                          )
                        }}
                        <span v-if="attemptPaymentMethod(attempt)">
                          ·
                          {{
                            paymentMethodLabel(attemptPaymentMethod(attempt))
                          }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center q-gutter-xs">
                        <q-badge
                          rounded
                          :color="getPaymentAttemptStatus(attempt.status).color"
                          :label="getPaymentAttemptStatus(attempt.status).label"
                        />
                        <q-badge
                          v-if="attempt.reconciliation"
                          rounded
                          outline
                          :color="
                            reconciliationLabel(attempt.reconciliation.status)
                              .color
                          "
                          :label="
                            reconciliationLabel(attempt.reconciliation.status)
                              .label
                          "
                        />
                      </div>
                    </q-item-section>
                  </template>

                  <!-- Expanded Details -->
                  <div class="q-pa-md bg-dark-surface gold-border-top">
                    <div class="row q-col-gutter-sm text-caption">
                      <div class="col-12 col-sm-6">
                        <span class="text-muted">Order ID:</span>
                        <div class="row items-center q-gutter-xs">
                          <code class="text-gold">{{
                            attempt.order_id || '—'
                          }}</code>
                          <q-btn
                            v-if="attempt.order_id"
                            flat
                            round
                            dense
                            size="xs"
                            icon="content_copy"
                            color="warning"
                            @click="
                              copyPayload(attempt.order_id, 'Order ID disalin!')
                            "
                          />
                        </div>
                      </div>
                      <div class="col-12 col-sm-6">
                        <span class="text-muted"
                          >Provider Reference / Tx ID:</span
                        >
                        <div class="row items-center q-gutter-xs">
                          <code class="text-gold">{{
                            attempt.provider_reference ||
                            attempt.gateway_payment_id ||
                            '—'
                          }}</code>
                          <q-btn
                            v-if="
                              attempt.provider_reference ||
                              attempt.gateway_payment_id
                            "
                            flat
                            round
                            dense
                            size="xs"
                            icon="content_copy"
                            color="warning"
                            @click="
                              copyPayload(
                                attempt.provider_reference ||
                                  attempt.gateway_payment_id,
                                'Referensi disalin!'
                              )
                            "
                          />
                        </div>
                      </div>
                      <div
                        v-if="attempt.checkout_expires_at"
                        class="col-12 col-sm-6"
                      >
                        <span class="text-muted">Batas Kedaluwarsa:</span>
                        <div class="text-sand">{{
                          formatSubscriptionDate(attempt.checkout_expires_at)
                        }}</div>
                      </div>
                      <div
                        v-if="attempt.reconciliation"
                        class="col-12 col-sm-6"
                      >
                        <span class="text-muted">Reconciliation Status:</span>
                        <div class="text-sand">
                          {{ attempt.reconciliation.status }}
                          <span v-if="attempt.reconciliation.retry_count">
                            (Percobaan query:
                            {{ attempt.reconciliation.retry_count }})
                          </span>
                        </div>
                      </div>
                      <div v-if="attempt.settlement" class="col-12">
                        <span class="text-muted">Settlement:</span>
                        <div class="text-positive">
                          Dialokasikan pada
                          {{
                            formatSubscriptionDate(
                              attempt.settlement.allocated_at
                            )
                          }}
                          (Ref:
                          {{ attempt.settlement.settlement_reference || '—' }})
                        </div>
                      </div>
                    </div>
                  </div>
                </q-expansion-item>
              </q-list>
              <div v-else class="q-pa-md text-center text-muted">
                Belum ada percobaan pembayaran tercatat.
              </div>
            </q-tab-panel>

            <!-- Subscriptions Tab -->
            <q-tab-panel
              v-if="invoice.subscription?.period_events?.length"
              name="subscriptions"
              class="q-pa-none"
            >
              <q-list separator class="gold-history-list">
                <q-item
                  v-for="evt in invoice.subscription.period_events"
                  :key="evt.id"
                  class="gold-history-header"
                >
                  <q-item-section avatar>
                    <q-avatar
                      size="30px"
                      :color="
                        evt.event_type === 'activation' ? 'positive' : 'warning'
                      "
                      text-color="dark"
                      :icon="
                        evt.event_type === 'activation'
                          ? 'check_circle'
                          : 'update'
                      "
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-sand text-weight-bold">
                      {{
                        evt.event_type === 'activation'
                          ? 'Aktivasi Awal Langganan'
                          : 'Perpanjangan Masa Aktif'
                      }}
                    </q-item-label>
                    <q-item-label caption class="text-muted">
                      <span v-if="evt.previous_expires_at">
                        {{ formatSubscriptionDate(evt.previous_expires_at) }}
                        &rarr;
                        {{ formatSubscriptionDate(evt.new_expires_at) }}
                      </span>
                      <span v-else>
                        Masa aktif berakhir:
                        {{ formatSubscriptionDate(evt.new_expires_at) }}
                      </span>
                    </q-item-label>
                    <q-item-label v-if="evt.notes" caption class="text-grey-5">
                      {{ evt.notes }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <span class="text-caption text-muted">
                      {{ formatSubscriptionDate(evt.created_at) }}
                    </span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useInvoiceStore } from '@/stores/invoice'
import {
  formatSubscriptionDate,
  formatSubscriptionPrice,
  getInvoiceStatus,
  getPaymentAttemptStatus,
  getReconciliationStatus
} from '@/utils/subscription'

const $q = useQuasar()
const store = useInvoiceStore()
const activeTab = ref('attempts')
const qrImageLoadFailed = ref(false)

const invoice = computed(() => store.selectedInvoice || {})

const referralName = computed(() => {
  const { referral_partner_name: partnerName, referral_code: referralCode } =
    invoice.value.pricing || {}

  if (partnerName && referralCode) return `${partnerName} (${referralCode})`
  return partnerName || referralCode || '—'
})

const reconciliationLabel = status => getReconciliationStatus(status)

const virtualAccountMethods = [
  'bank_transfer',
  'va_bca',
  'va_bni',
  'va_bri',
  'va_permata',
  'va_mandiri',
  'echannel',
  'va_pani',
  'va_cimb',
  'va_btpn'
]

const paymentMethodLabels = {
  dana_wallet: 'DANA Wallet',
  qris: 'QRIS',
  va_bca: 'Virtual Account BCA',
  va_bni: 'Virtual Account BNI',
  va_bri: 'Virtual Account BRI',
  va_permata: 'Virtual Account Permata',
  va_mandiri: 'Mandiri Bill Payment',
  echannel: 'Mandiri Bill Payment',
  bank_transfer: 'Virtual Account',
  va_pani: 'Virtual Account PANI',
  va_cimb: 'Virtual Account CIMB',
  va_btpn: 'Virtual Account BTPN',
  gopay: 'GoPay'
}

const isVirtualAccountMethod = method => virtualAccountMethods.includes(method)

const attemptPaymentMethod = attempt =>
  attempt?.metadata?.payment_method || attempt?.payment_method || null

const latestAttempt = computed(() => {
  const attempts = invoice.value.payment_attempts
  if (!Array.isArray(attempts) || attempts.length === 0) return null
  return [...attempts].sort((a, b) => b.attempt_number - a.attempt_number)[0]
})

const isMidtrans = computed(() => {
  if (store.checkoutProvider) {
    return store.checkoutProvider === 'midtrans'
  }
  const attemptProvider = latestAttempt.value?.provider
  if (attemptProvider) {
    return attemptProvider === 'midtrans'
  }
  const gateways = invoice.value.application_payment_gateways || []
  const hasMidtrans = gateways.some(
    g => g.provider === 'midtrans' && g.is_active
  )
  const hasDana = gateways.some(g => g.provider === 'dana' && g.is_active)
  return hasMidtrans && !hasDana
})

const availableGateways = computed(() => {
  const gateways = invoice.value.application_payment_gateways || []
  const active = gateways.filter(g => g.is_active)
  if (active.length > 0) {
    return active.map(g => g.provider)
  }
  return ['dana', 'midtrans']
})

const setProvider = provider => {
  store.checkoutProvider = provider
}

const paymentMethodOptions = computed(() => {
  if (isMidtrans.value) {
    return [
      { label: 'QRIS', value: 'qris' },
      { label: 'VA BCA', value: 'va_bca' },
      { label: 'VA BNI', value: 'va_bni' },
      { label: 'VA BRI', value: 'va_bri' },
      { label: 'VA Permata', value: 'va_permata' },
      { label: 'Mandiri Bill', value: 'va_mandiri' },
      { label: 'GoPay', value: 'gopay' }
    ]
  }
  return [
    { label: 'DANA Wallet', value: 'dana_wallet' },
    { label: 'QRIS DANA', value: 'qris' },
    { label: 'VA BRI', value: 'va_bri' },
    { label: 'VA PANI', value: 'va_pani' },
    { label: 'VA CIMB', value: 'va_cimb' },
    { label: 'VA BTPN', value: 'va_btpn' }
  ]
})

watch(
  () => store.checkoutProvider,
  newProvider => {
    if (newProvider === 'midtrans') {
      const midtransAllowed = [
        'qris',
        'va_bca',
        'va_bni',
        'va_bri',
        'va_permata',
        'va_mandiri',
        'gopay'
      ]
      if (!midtransAllowed.includes(store.checkoutPaymentMethod)) {
        store.checkoutPaymentMethod = 'qris'
      }
    } else if (newProvider === 'dana') {
      const danaAllowed = [
        'dana_wallet',
        'qris',
        'va_bri',
        'va_pani',
        'va_cimb',
        'va_btpn'
      ]
      if (!danaAllowed.includes(store.checkoutPaymentMethod)) {
        store.checkoutPaymentMethod = 'dana_wallet'
      }
    }
  }
)

const onStartCheckout = () => {
  qrImageLoadFailed.value = false
  const method = store.checkoutPaymentMethod
  const provider = isMidtrans.value ? 'midtrans' : 'dana'
  let bank = null
  if (provider === 'midtrans') {
    if (method === 'va_bca') bank = 'bca'
    else if (method === 'va_bni') bank = 'bni'
    else if (method === 'va_bri') bank = 'bri'
    else if (method === 'va_permata') bank = 'permata'
    else if (method === 'va_mandiri' || method === 'echannel') bank = 'echannel'
  }
  store.startCheckout(method, provider, bank)
}

const paymentMethodLabel = method =>
  paymentMethodLabels[method] ||
  (isMidtrans.value ? 'Pembayaran Midtrans' : 'Pembayaran DANA')

const canStartCheckout = computed(
  () =>
    invoice.value.status === 'pending' &&
    !invoice.value.payment_attempts?.some(
      attempt => attempt.status === 'succeeded'
    )
)

const currentAttemptMethod = computed(
  () => attemptPaymentMethod(latestAttempt.value) || store.checkoutPaymentMethod
)

const currentPaymentInstruction = computed(
  () =>
    latestAttempt.value?.metadata?.payment_instruction ||
    store.checkoutAttempt?.payment_instruction ||
    null
)

const currentPaymentCode = computed(
  () =>
    store.checkoutPaymentCode ||
    latestAttempt.value?.metadata?.payment_code ||
    latestAttempt.value?.metadata?.qr_content ||
    currentPaymentInstruction.value?.payment_code ||
    currentPaymentInstruction.value?.bill_key ||
    ''
)

const isCurrentAttemptActive = computed(() => {
  return (
    latestAttempt.value?.status === 'pending' ||
    Boolean(store.checkoutQrPayload) ||
    Boolean(store.checkoutQrDataUrl) ||
    Boolean(store.checkoutQrUrl) ||
    Boolean(store.checkoutPaymentCode)
  )
})

const isCurrentAttemptVirtualAccount = computed(
  () =>
    isVirtualAccountMethod(currentAttemptMethod.value) &&
    Boolean(currentPaymentCode.value)
)

const isCurrentAttemptGopay = computed(() => {
  const method = currentAttemptMethod.value
  return (
    method === 'gopay' &&
    Boolean(
      store.checkoutUrl ||
      latestAttempt.value?.checkout_url ||
      currentPaymentInstruction.value?.checkout_url ||
      store.checkoutAttempt?.checkout_url
    )
  )
})

const activeQrUrl = computed(() => {
  if (qrImageLoadFailed.value) return null
  return (
    store.checkoutQrUrl ||
    latestAttempt.value?.qr_url ||
    latestAttempt.value?.metadata?.qr_url ||
    latestAttempt.value?.metadata?.payment_instruction?.qr_url ||
    null
  )
})

const onQrImageError = () => {
  qrImageLoadFailed.value = true
}

const showQrisSection = computed(() => {
  const method = currentAttemptMethod.value
  return (
    method === 'qris' &&
    (Boolean(activeQrUrl.value) ||
      Boolean(store.checkoutQrPayload) ||
      Boolean(store.checkoutQrDataUrl) ||
      store.checkoutLoading ||
      store.checkoutQrLoading ||
      isCurrentAttemptActive.value)
  )
})

const isCheckoutExpired = computed(() => {
  if (latestAttempt.value?.status === 'expired') return true
  if (
    store.checkoutExpiresAt &&
    new Date(store.checkoutExpiresAt).getTime() <= Date.now()
  ) {
    return true
  }
  return false
})

const isLatestAttemptFailed = computed(() => {
  return (
    latestAttempt.value?.status === 'failed' ||
    latestAttempt.value?.status === 'expired'
  )
})

const formattedCountdown = computed(() => {
  const s = store.checkoutRemainingSeconds
  if (s <= 0) return 'Kedaluwarsa'
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
})

const downloadQrisPng = () => {
  const targetUrl = store.checkoutQrDataUrl || activeQrUrl.value
  if (!targetUrl) return
  const a = document.createElement('a')
  a.href = targetUrl
  a.download = `qris-${invoice.value.invoice_number || (isMidtrans.value ? 'midtrans-sandbox' : 'dana-sandbox')}.png`
  a.click()
}

const copyPayload = async (text, message = 'Berhasil disalin!') => {
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      $q.notify({
        type: 'positive',
        message,
        position: 'top',
        timeout: 1800
      })
    }
  } catch {
    // ignore
  }
}

watch(
  () => store.checkoutQrUrl,
  () => {
    qrImageLoadFailed.value = false
  }
)

onBeforeUnmount(() => {
  store.stopCheckoutSession()
})
</script>

<style scoped lang="scss">
/* Premium Black & Gold Design System */
.invoice-dialog-card {
  width: min(960px, 96vw);
  max-width: 960px;
  max-height: 90vh;
  background-color: #0c0c0d;
  color: #f7f4ee;
  border: 1px solid #2e281b;
  border-radius: 16px;
  box-shadow:
    0 20px 45px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(214, 173, 77, 0.1);
  overflow: hidden;

  @media (max-width: 600px) {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100% !important;
    max-height: 100dvh !important;
    border-radius: 0 !important;
    border: none !important;
  }
}

.dialog-sticky-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #111115;
  border-bottom: 1px solid #242019;
}

.dialog-scroll-body {
  overflow-y: auto;
}

.gold-avatar {
  background: linear-gradient(135deg, #d6ad4d 0%, #a47d25 100%) !important;
}

.eyebrow {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.app-badge {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}

.dialog-title {
  margin: 2px 0 0;
  font-size: 1.18rem;
  line-height: 1.25;
}

.gold-separator {
  background-color: #242019;
}

.gold-separator-subtle {
  background-color: #1e1b15;
}

.gold-card {
  background: #151519;
  border: 1px solid #28241c;
  border-radius: 12px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #3d3522;
  }
}

.gold-card-title {
  color: #d6ad4d;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field-label {
  margin: 0 0 2px;
  color: #8c8577;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-value {
  margin: 0;
  color: #f7f4ee;
  font-size: 0.9rem;
  font-weight: 500;
}

.text-sand {
  color: #f7f4ee;
}

.text-gold {
  color: #d6ad4d;
}

.text-gold-glow {
  color: #f5cf6d;
  text-shadow: 0 0 12px rgba(245, 207, 109, 0.35);
}

.text-muted {
  color: #948e81;
}

/* Highlight Box: Total Bayar */
.total-bayar-box {
  background: linear-gradient(135deg, #221c11 0%, #17140e 100%);
  border: 1px solid #d6ad4d;
  border-radius: 10px;
  box-shadow: 0 0 18px rgba(214, 173, 77, 0.12);
}

.total-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.total-amount {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.2;
}

/* Gateway & Method Toggles */
.gateway-toggle-btn {
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 12px;
  transition: all 0.2s ease;
}

.gateway-btn-active {
  background: #d6ad4d !important;
  color: #0c0c0d !important;
  box-shadow: 0 0 10px rgba(214, 173, 77, 0.4);
}

.gateway-btn-inactive {
  background: #1e1e24 !important;
  color: #a8a090 !important;
  border: 1px solid #2e281b;

  &:hover {
    color: #f7f4ee !important;
    border-color: #d6ad4d;
  }
}

.method-toggle-btn {
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 10px;
  transition: all 0.2s ease;
}

.method-btn-active {
  background: #f5cf6d !important;
  color: #12100b !important;
  box-shadow: 0 0 8px rgba(245, 207, 109, 0.35);
}

.method-btn-inactive {
  background: #19191e !important;
  color: #9c9484 !important;
  border: 1px solid #28241c;

  &:hover {
    color: #f7f4ee !important;
    border-color: #5c4e2e;
  }
}

.gold-action-btn {
  background: linear-gradient(135deg, #d6ad4d 0%, #bf9230 100%) !important;
  color: #0c0c0d !important;
  font-weight: 700;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(214, 173, 77, 0.3);
  padding: 8px 16px;

  &:hover {
    filter: brightness(1.08);
  }
}

.countdown-box {
  background: #1f1b13;
  border: 1px solid #4a3e23;
  border-radius: 8px;
}

/* QRIS Presentation Box */
.qris-presentation-box {
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #d6ad4d;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.qris-image-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e0d7c6;
}

.qris-render-img {
  width: 220px;
  height: 220px;
  max-width: 100%;
  object-fit: contain;
}

/* VA Box */
.va-presentation-box {
  background: #121216;
  border: 1px solid #3d3420;
  border-radius: 10px;
}

.letter-spaced {
  letter-spacing: 0.08em;
}

.gold-error-banner {
  background: #2b1414;
  color: #ffb8b8;
  border: 1px solid #6b2626;
}

/* Tabs & History Lists */
.gold-tabs {
  background: #111115;
  border-bottom: 1px solid #242019;
}

.gold-history-list {
  background: #151519;
}

.gold-history-header {
  background: #151519;

  &:hover {
    background: #1c1c22;
  }
}

.bg-dark-surface {
  background: #111114;
}

.gold-border-top {
  border-top: 1px solid #242019;
}
</style>
