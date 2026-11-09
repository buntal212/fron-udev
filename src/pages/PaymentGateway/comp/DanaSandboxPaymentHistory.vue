<template>
  <q-separator class="q-my-lg" />
  <section aria-labelledby="sandbox-payment-history-heading">
    <div class="row items-center justify-between q-col-gutter-sm">
      <div class="col-12 col-sm">
        <h3 id="sandbox-payment-history-heading">Audit Pembayaran Sandbox</h3>
        <p class="section-description">
          Status dan waktu lunas hanya berasal dari catatan gateway yang telah
          diverifikasi.
        </p>
      </div>
      <div class="col-12 col-sm-auto">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh"
          no-caps
          :loading="loading"
          @click="refreshPayments(1, true)"
        />
      </div>
    </div>

    <!-- Filter Status, Rentang Tanggal, Pencarian Referensi -->
    <div class="row q-col-gutter-sm q-mt-xs">
      <div class="col-12 col-sm-4">
        <q-select
          v-model="filters.status"
          outlined
          dense
          clearable
          emit-value
          map-options
          label="Status"
          :options="statusOptions"
          bg-color="white"
          @update:model-value="refreshPayments(1)"
        />
      </div>
      <div class="col-6 col-sm-3">
        <q-input
          v-model="filters.from"
          outlined
          dense
          type="date"
          label="Dari"
          bg-color="white"
          @update:model-value="refreshPayments(1)"
        />
      </div>
      <div class="col-6 col-sm-3">
        <q-input
          v-model="filters.to"
          outlined
          dense
          type="date"
          label="Sampai"
          bg-color="white"
          @update:model-value="refreshPayments(1)"
        />
      </div>
      <div class="col-12 col-sm-2">
        <q-input
          v-model="filters.merchant_order_id"
          outlined
          dense
          clearable
          label="Referensi"
          bg-color="white"
          @keyup.enter="refreshPayments(1)"
        />
      </div>
    </div>

    <!-- Kartu Ringkasan -->
    <div class="summary-grid q-mt-md">
      <q-card
        v-for="item in summaryCards"
        :key="item.label"
        flat
        bordered
        class="bg-white"
      >
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-7">{{ item.label }}</div>
          <div class="text-h6">{{ item.value }}</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="bg-white">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-7">Nilai dibayar</div>
          <div class="text-body2 text-weight-medium">{{ paidAmounts }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-banner v-if="error" rounded class="error-banner q-mt-sm">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ error }}
    </q-banner>

    <!-- Daftar Audit Transaksi (QList + QItem + QExpansionItem Responsif tanpa QDialog) -->
    <div class="payment-history q-mt-sm">
      <q-inner-loading :showing="loading" color="warning" />

      <template v-if="displayedPayments.length">
        <q-list
          bordered
          separator
          class="rounded-borders bg-white payment-history-list"
        >
          <q-expansion-item
            v-for="payment in displayedPayments"
            :key="payment.id"
            :model-value="expandedPaymentId === payment.id"
            group="sandbox-payments"
            header-class="payment-item-header"
            expand-icon-class="text-warning"
            @update:model-value="expanded => toggleDetail(payment, expanded)"
          >
            <!-- Header Item: Tanggal, Nominal, Metode, Referensi, Badge Status -->
            <template #header>
              <div
                class="row items-center justify-between full-width q-py-xs q-pr-sm no-wrap-md"
              >
                <!-- Tanggal & Nominal -->
                <div class="col-12 col-md-3 q-pr-sm">
                  <div class="text-caption text-grey-7">
                    {{ formatDate(payment.created_at) }}
                  </div>
                  <div class="text-weight-bold text-subtitle1 text-dark">
                    {{ formatAmount(payment) }}
                  </div>
                </div>

                <!-- Metode & Referensi -->
                <div class="col-12 col-md-5 q-pr-sm">
                  <div class="text-caption text-grey-8 text-weight-medium">
                    {{ paymentMethodLabel(payment.payment_method) }}
                  </div>
                  <div
                    class="text-caption text-grey-7 ellipsis"
                    :title="payment.merchant_reference"
                  >
                    <span class="text-weight-medium">Ref:</span>
                    {{ payment.merchant_reference }}
                  </div>
                  <div
                    v-if="payment.provider_order_reference"
                    class="text-caption text-grey-6 ellipsis"
                    :title="payment.provider_order_reference"
                  >
                    <span class="text-weight-medium">Provider:</span>
                    {{ payment.provider_order_reference }}
                  </div>
                </div>

                <!-- Status Badge & Quick Action -->
                <div
                  class="col-12 col-md-4 row items-center justify-end q-gutter-x-sm q-mt-xs q-mt-md-none"
                >
                  <q-badge
                    :color="statusColor(payment.status)"
                    class="q-py-xs q-px-sm"
                  >
                    {{ labelFor(payment.status) }}
                  </q-badge>
                  <q-btn
                    v-if="canQueryDanaStatus(payment)"
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="query_stats"
                    label="Cek Status DANA"
                    :loading="
                      danaStatusLoading && danaStatusPaymentId === payment.id
                    "
                    @click.stop="checkDanaStatus(payment)"
                  />
                  <q-btn
                    v-if="payment.status === 'pending'"
                    flat
                    dense
                    no-caps
                    color="negative"
                    icon="cancel"
                    label="Batalkan"
                    :loading="cancellingPaymentId === payment.id"
                    @click.stop="cancelPayment(payment)"
                  />
                </div>
              </div>
            </template>

            <!-- Panel Detail Pembayaran Inline (Expandable Audit View) -->
            <div class="payment-detail-audit bg-grey-1 q-pa-md">
              <div
                v-if="detailLoading && selectedPayment?.id === payment.id"
                class="text-center q-pa-md"
              >
                <q-spinner color="warning" size="28px" />
                <p class="q-mt-sm text-grey-7 text-caption">
                  Memuat detail audit...
                </p>
              </div>

              <q-banner
                v-else-if="detailError && selectedPayment?.id === payment.id"
                rounded
                class="error-banner q-mb-md"
              >
                <template #avatar><q-icon name="error_outline" /></template>
                {{ detailError }}
                <template #action>
                  <q-btn
                    flat
                    color="negative"
                    label="Coba lagi"
                    no-caps
                    :loading="detailLoading || webhookLoading"
                    @click="retryDetail"
                  />
                </template>
              </q-banner>

              <template
                v-else-if="detail && selectedPayment?.id === payment.id"
              >
                <!-- Ringkasan Nominal & Status Verifikasi Gateway -->
                <div class="payment-overview">
                  <div>
                    <p class="overview-label">Nominal pembayaran</p>
                    <p class="overview-amount">{{ formatAmount(detail) }}</p>
                    <p class="overview-reference">
                      {{ detail.merchant_reference }}
                    </p>
                  </div>
                  <div class="overview-status">
                    <q-badge
                      rounded
                      :color="statusColor(detail.status)"
                      class="status-badge"
                    >
                      <q-icon name="verified" size="14px" class="q-mr-xs" />
                      {{ labelFor(detail.status) }}
                    </q-badge>
                    <span>{{
                      detail.gateway_verified_at
                        ? 'Terverifikasi gateway'
                        : 'Menunggu verifikasi gateway'
                    }}</span>
                  </div>
                </div>

                <!-- Metadata Audit Grid -->
                <div class="audit-meta-grid q-mt-md">
                  <div class="audit-meta-item">
                    <q-icon name="tag" />
                    <div>
                      <span>Referensi pembayaran</span>
                      <strong>{{ detail.id }}</strong>
                    </div>
                  </div>
                  <div class="audit-meta-item">
                    <q-icon name="account_balance_wallet" />
                    <div>
                      <span>Referensi provider</span>
                      <strong>{{
                        detail.provider_order_reference || '-'
                      }}</strong>
                    </div>
                  </div>
                  <div class="audit-meta-item">
                    <q-icon name="payments" />
                    <div>
                      <span>Metode pembayaran</span>
                      <strong>{{
                        paymentMethodLabel(detail.payment_method)
                      }}</strong>
                    </div>
                  </div>
                  <div class="audit-meta-item">
                    <q-icon name="schedule" />
                    <div>
                      <span>Dibuat</span>
                      <strong>{{ formatDate(detail.created_at) }}</strong>
                    </div>
                  </div>
                  <div class="audit-meta-item">
                    <q-icon name="verified_user" />
                    <div>
                      <span>Terverifikasi gateway</span>
                      <strong>{{
                        formatDate(detail.gateway_verified_at)
                      }}</strong>
                    </div>
                  </div>
                </div>

                <!-- Bagian Checkout & Instruksi Pembayaran (jika pending) -->
                <section
                  v-if="detail.status === 'pending'"
                  class="audit-section checkout-audit-section"
                >
                  <div class="section-heading">
                    <q-icon
                      name="shopping_cart_checkout"
                      color="warning"
                      size="21px"
                    />
                    <div>
                      <h4>Instruksi Pembayaran &amp; Checkout</h4>
                      <p>
                        Selesaikan atau uji alur pembayaran Sandbox melalui
                        checkout resmi berikut.
                      </p>
                    </div>
                  </div>

                  <!-- Tombol Buka Checkout jika checkout_url tersedia -->
                  <div
                    v-if="detail.checkout_available && detail.checkout_url"
                    class="checkout-action-box q-mb-md"
                  >
                    <q-btn
                      unelevated
                      color="primary"
                      icon="open_in_new"
                      label="Buka Checkout Sandbox"
                      no-caps
                      @click="openCheckout(detail.checkout_url)"
                    />
                  </div>

                  <!-- Instruksi Pembayaran (QRIS / VA / Payment Code) -->
                  <div
                    v-if="detail.payment_instruction"
                    class="payment-instruction q-mt-sm"
                  >
                    <div class="text-weight-bold text-subtitle2">
                      {{
                        detail.payment_instruction.label ||
                        'Instruksi Pembayaran'
                      }}
                    </div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ detail.payment_instruction.message || '' }}
                    </div>

                    <!-- Tampilan QRIS Asli yang Valid -->
                    <div v-if="qrisPayload" class="qris-payload q-mt-sm">
                      <img
                        v-if="qrisDataUrl"
                        :key="qrisPayload"
                        class="qris-image"
                        :src="qrisDataUrl"
                        alt="QRIS DANA Sandbox yang dibuat lokal"
                        decoding="async"
                        @error="handleQrisImageError"
                      />
                      <div v-else-if="qrisLoading" class="qris-render-state">
                        <q-spinner color="warning" size="32px" />
                        <span>Membuat gambar QRIS secara lokal…</span>
                      </div>
                      <q-banner
                        v-if="qrisError"
                        dense
                        rounded
                        class="error-banner q-mt-xs"
                      >
                        <template #avatar
                          ><q-icon name="error_outline"
                        /></template>
                        {{ qrisError }} Gunakan teks payload cadangan di bawah.
                      </q-banner>
                      <div class="qris-actions q-mt-sm row q-gutter-sm">
                        <q-btn
                          outline
                          dense
                          no-caps
                          color="warning"
                          icon="content_copy"
                          label="Salin Kode"
                          @click="copyPaymentCode(qrisPayload)"
                        />
                        <q-btn
                          outline
                          dense
                          no-caps
                          color="primary"
                          icon="download"
                          label="Unduh QRIS"
                          :disable="!qrisDataUrl || !isPngDataUrl(qrisDataUrl)"
                          @click="downloadQris"
                        />
                      </div>
                      <q-expansion-item
                        dense
                        dense-toggle
                        icon="code"
                        label="Teks payload QRIS (cadangan)"
                        class="q-mt-sm full-width"
                      >
                        <code class="qris-payload-text">{{ qrisPayload }}</code>
                      </q-expansion-item>
                    </div>

                    <!-- Kasus QRIS MPM tapi payload tidak valid EMVCo -->
                    <div
                      v-else-if="qrisValidation.isQris && !qrisValidation.valid"
                      class="qris-invalid-box q-mt-sm"
                    >
                      <q-banner dense rounded class="error-banner q-mb-sm">
                        <template #avatar><q-icon name="warning" /></template>
                        <div>
                          <strong>
                            Payload QRIS tidak valid sesuai standar EMVCo.
                          </strong>
                          <div class="text-caption">
                            {{ qrisValidation.error }}
                          </div>
                        </div>
                      </q-banner>
                      <div
                        v-if="qrisValidation.rawPayload"
                        class="payment-code q-mt-xs"
                      >
                        <span>{{ qrisValidation.rawPayload }}</span>
                        <q-btn
                          flat
                          round
                          dense
                          color="warning"
                          icon="content_copy"
                          aria-label="Salin kode pembayaran"
                          @click="copyPaymentCode(qrisValidation.rawPayload)"
                        >
                          <q-tooltip>Salin kode</q-tooltip>
                        </q-btn>
                      </div>
                    </div>

                    <!-- Tampilan Virtual Account / Kode Pembayaran / Custom Checkout non-MPM -->
                    <div
                      v-else-if="detail.payment_instruction.payment_code"
                      class="payment-code q-mt-sm"
                    >
                      <span>{{ detail.payment_instruction.payment_code }}</span>
                      <q-btn
                        flat
                        round
                        dense
                        color="warning"
                        icon="content_copy"
                        aria-label="Salin kode pembayaran"
                        @click="
                          copyPaymentCode(
                            detail.payment_instruction.payment_code
                          )
                        "
                      >
                        <q-tooltip>Salin kode</q-tooltip>
                      </q-btn>
                    </div>
                  </div>

                  <!-- Fallback jika data checkout belum tersedia -->
                  <div
                    v-else-if="
                      !detail.checkout_available && !detail.checkout_url
                    "
                    class="checkout-fallback q-mt-sm"
                  >
                    <q-banner rounded class="warning-banner">
                      <template #avatar>
                        <q-icon name="info" color="warning" />
                      </template>
                      <div>
                        <strong>
                          Data checkout belum tersedia pada transaksi ini.
                        </strong>
                        <div class="text-caption q-mt-xs">
                          Transaksi ini tidak memuat instruksi pembayaran atau
                          tautan checkout (misal dibuat sebelum penyimpanan
                          metadata checkout atau sesi telah kedaluwarsa). Sesuai
                          standar Sandbox, tidak ada QRIS atau transaksi baru
                          yang dibuat secara otomatis.
                        </div>
                      </div>
                      <template #action>
                        <q-btn
                          v-if="canQueryDanaStatus(selectedPayment)"
                          flat
                          dense
                          no-caps
                          color="primary"
                          icon="query_stats"
                          label="Cek Status DANA"
                          :loading="danaStatusLoading"
                          @click="checkDanaStatus(selectedPayment)"
                        />
                      </template>
                    </q-banner>
                  </div>
                </section>

                <!-- Cek Status DANA Sandbox -->
                <section
                  v-if="canQueryDanaStatus(selectedPayment)"
                  class="audit-section"
                >
                  <div class="section-heading">
                    <q-icon name="query_stats" color="primary" size="21px" />
                    <div>
                      <h4>Status DANA Sandbox</h4>
                      <p>
                        Pemeriksaan read-only; tidak mengubah status pembayaran
                        lokal.
                      </p>
                    </div>
                  </div>
                  <div class="row q-gutter-sm items-center">
                    <q-btn
                      outline
                      dense
                      no-caps
                      color="primary"
                      icon="query_stats"
                      label="Cek Status DANA"
                      :loading="danaStatusLoading"
                      @click="checkDanaStatus(selectedPayment)"
                    />
                    <q-btn
                      v-if="selectedPayment.status === 'pending'"
                      outline
                      dense
                      no-caps
                      color="negative"
                      icon="cancel"
                      label="Batalkan Transaksi Sandbox"
                      :loading="cancellingPaymentId === selectedPayment.id"
                      @click="cancelPayment(selectedPayment)"
                    />
                  </div>
                  <q-banner
                    v-if="danaStatusError"
                    rounded
                    class="error-banner q-mt-sm"
                  >
                    <template #avatar><q-icon name="error_outline" /></template>
                    {{ danaStatusError }}
                  </q-banner>
                  <div
                    v-else-if="
                      danaStatus && danaStatusPaymentId === selectedPayment?.id
                    "
                    class="audit-meta-grid q-mt-sm"
                  >
                    <div class="audit-meta-item">
                      <div>
                        <span>Status lokal</span>
                        <strong>{{ labelFor(danaStatus.local_status) }}</strong>
                      </div>
                    </div>
                    <div class="audit-meta-item">
                      <div>
                        <span>Status DANA</span>
                        <strong>{{
                          danaStatus.dana_status?.latest_transaction_status ||
                          '-'
                        }}</strong>
                      </div>
                    </div>
                    <div class="audit-meta-item">
                      <div>
                        <span>Response code</span>
                        <strong>{{
                          danaStatus.dana_status?.response_code || '-'
                        }}</strong>
                      </div>
                    </div>
                    <div class="audit-meta-item">
                      <div>
                        <span>HTTP DANA</span>
                        <strong>{{
                          danaStatus.dana_status?.http_status || '-'
                        }}</strong>
                      </div>
                    </div>
                    <div class="audit-meta-item">
                      <div>
                        <span>Request ID</span>
                        <strong>{{
                          danaStatus.dana_status?.request_id || '-'
                        }}</strong>
                      </div>
                    </div>
                    <div class="audit-meta-item">
                      <div>
                        <span>Waktu cek</span>
                        <strong>{{
                          formatDate(danaStatus.dana_status?.checked_at)
                        }}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Timeline Status -->
                <section class="audit-section">
                  <div class="section-heading">
                    <q-icon name="timeline" color="warning" size="21px" />
                    <div>
                      <h4>Timeline status</h4>
                      <p>Jejak perubahan status pembayaran yang aman.</p>
                    </div>
                  </div>
                  <div v-if="detail.timeline?.length" class="audit-timeline">
                    <article
                      v-for="(event, index) in detail.timeline"
                      :key="index"
                      class="timeline-item"
                    >
                      <div class="timeline-rail">
                        <q-icon
                          :name="eventIcon(event)"
                          :color="eventColor(event)"
                        />
                      </div>
                      <div class="timeline-content">
                        <div
                          class="row items-start justify-between q-col-gutter-sm no-wrap"
                        >
                          <div class="col">
                            <strong>{{ eventTitle(event) }}</strong>
                            <span class="timeline-source">{{
                              sourceLabel(event.source)
                            }}</span>
                          </div>
                          <time>{{ formatDate(event.created_at) }}</time>
                        </div>
                        <div class="timeline-transition">
                          <q-badge outline :color="eventColor(event)">
                            {{ labelFor(event.old_status) }}
                          </q-badge>
                          <q-icon name="arrow_forward" size="16px" />
                          <q-badge :color="eventColor(event)">
                            {{ labelFor(event.new_status) }}
                          </q-badge>
                        </div>
                      </div>
                    </article>
                  </div>
                  <div v-else class="empty-audit">
                    <q-icon name="timeline" size="22px" />
                    <span
                      >Belum ada event status yang aman untuk ditampilkan.</span
                    >
                  </div>
                </section>

                <!-- Metadata Webhook -->
                <section class="audit-section">
                  <div class="section-heading">
                    <q-icon name="webhook" color="warning" size="21px" />
                    <div>
                      <h4>Webhook</h4>
                      <p>Riwayat notifikasi DANA, tanpa payload sensitif.</p>
                    </div>
                  </div>
                  <div v-if="webhookLoading" class="empty-audit">
                    <q-spinner color="warning" size="22px" />
                    <span>Memuat metadata webhook...</span>
                  </div>
                  <q-banner
                    v-else-if="webhookError"
                    rounded
                    class="error-banner"
                  >
                    <template #avatar><q-icon name="error_outline" /></template>
                    {{ webhookError }}
                    <template #action>
                      <q-btn
                        flat
                        color="negative"
                        label="Coba lagi"
                        no-caps
                        @click="loadWebhooks(webhookMeta.current_page, true)"
                      />
                    </template>
                  </q-banner>
                  <q-list
                    v-else-if="webhooks.length"
                    bordered
                    separator
                    class="rounded-borders bg-white"
                  >
                    <q-item
                      v-for="(webhook, index) in webhooks"
                      :key="webhook.id || index"
                      class="q-py-sm"
                    >
                      <q-item-section avatar top>
                        <q-avatar
                          :color="webhookColor(webhook)"
                          text-color="white"
                          size="34px"
                        >
                          <q-icon
                            :name="
                              webhook.signature_valid ? 'verified' : 'gpp_maybe'
                            "
                          />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <div
                          class="row items-center justify-between q-col-gutter-xs"
                        >
                          <strong class="text-subtitle2">{{
                            webhookLabel(webhook)
                          }}</strong>
                          <div class="row items-center q-gutter-xs">
                            <q-badge
                              :color="
                                webhook.http_status === 200
                                  ? 'positive'
                                  : webhook.http_status === 500
                                    ? 'warning'
                                    : 'negative'
                              "
                            >
                              HTTP
                              {{
                                webhook.http_status ||
                                (webhook.processing_status === 'processed'
                                  ? 200
                                  : 400)
                              }}
                            </q-badge>
                            <q-badge outline :color="webhookColor(webhook)">
                              {{
                                webhook.signature_valid
                                  ? 'Signature valid'
                                  : 'Signature invalid'
                              }}
                            </q-badge>
                          </div>
                        </div>

                        <div class="text-caption text-grey-7 q-mt-xs">
                          Diterima: {{ formatDate(webhook.received_at) }}
                          <template v-if="webhook.processed_at">
                            · Selesai: {{ formatDate(webhook.processed_at) }}
                          </template>
                          <template
                            v-if="webhook.attempts && webhook.attempts > 1"
                          >
                            ·
                            <span class="text-warning text-weight-medium"
                              >{{ webhook.attempts }}x percobaan</span
                            >
                          </template>
                        </div>

                        <div
                          class="row items-center q-gutter-x-md q-mt-xs text-caption"
                        >
                          <div>
                            <span class="text-grey-7">Response Code:</span>
                            <span class="text-weight-medium q-ml-xs">
                              {{
                                webhook.response_code ||
                                (webhook.processing_status === 'processed'
                                  ? '2005600'
                                  : '4005600')
                              }}
                            </span>
                          </div>
                          <div v-if="webhook.provider_event_id">
                            <span class="text-grey-7">Request ID:</span>
                            <span class="text-weight-medium q-ml-xs">{{
                              webhook.provider_event_id
                            }}</span>
                          </div>
                          <div v-if="webhook.payload_hash">
                            <span class="text-grey-7">Hash:</span>
                            <code class="q-ml-xs">{{
                              webhook.payload_hash
                            }}</code>
                          </div>
                        </div>

                        <div
                          v-if="webhook.error_code"
                          class="text-caption text-negative q-mt-xs"
                        >
                          Hasil: Ditolak ({{ webhook.error_code }})
                        </div>
                        <div
                          v-else-if="webhook.processing_status === 'processed'"
                          class="text-caption text-positive q-mt-xs"
                        >
                          Hasil: 2005600 Successful (Status pembayaran
                          diperbarui)
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div v-else class="empty-audit">
                    <q-icon name="webhook" size="22px" />
                    <span>Belum ada webhook tercatat untuk transaksi ini.</span>
                  </div>
                  <q-pagination
                    v-if="webhookMeta.last_page > 1"
                    class="q-mt-md justify-center"
                    color="warning"
                    :model-value="webhookMeta.current_page"
                    :max="webhookMeta.last_page"
                    :max-pages="6"
                    :disable="webhookLoading"
                    @update:model-value="loadWebhooks"
                  />
                </section>
              </template>
            </div>
          </q-expansion-item>
        </q-list>

        <!-- Pagination: Maksimal 5 data per halaman -->
        <q-pagination
          v-if="meta.last_page > 1"
          class="q-mt-md justify-center"
          color="warning"
          :model-value="meta.current_page"
          :max="meta.last_page"
          :max-pages="6"
          :disable="loading"
          @update:model-value="refreshPayments"
        />
      </template>

      <!-- Empty State -->
      <q-banner v-else-if="!loading && !error" rounded class="warning-banner">
        Belum ada transaksi Sandbox yang sesuai untuk akun admin ini.
      </q-banner>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import QRCode from 'qrcode'
import { validateEmvcoQris } from '@/utils/emvco-qris'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage } from '@/utils/api-error'

const AUDIT_CACHE_TTL_MS = 10_000
const pendingAuditRequests = new Map()
const auditResponseCache = new Map()
const pendingHistoryRequests = new Map()
const historyResponseCache = new Map()

function deduplicatedRequest(cache, pending, key, request, force = false) {
  if (force) cache.delete(key)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value)
  }

  if (pending.has(key)) return pending.get(key)

  const promise = request()
    .then(value => {
      cache.set(key, { value, expiresAt: Date.now() + AUDIT_CACHE_TTL_MS })
      while (cache.size > 100) cache.delete(cache.keys().next().value)
      return value
    })
    .finally(() => pending.delete(key))

  pending.set(key, promise)
  return promise
}

function retryAfterMilliseconds(error) {
  const headers = error?.response?.headers
  const retryAfter =
    headers?.['retry-after'] ??
    (typeof headers?.get === 'function' ? headers.get('retry-after') : null)
  if (typeof retryAfter !== 'string' && typeof retryAfter !== 'number') return 0

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000)

  const retryAt = Date.parse(retryAfter)
  return Number.isNaN(retryAt) ? 0 : Math.max(0, retryAt - Date.now())
}

function isRateLimitError(error) {
  return (
    error?.response?.status === 429 ||
    (error?.response?.status >= 500 && retryAfterMilliseconds(error) > 0)
  )
}

function rateLimitMessage(milliseconds) {
  const seconds = Math.max(1, Math.ceil(milliseconds / 1000))
  return `Terlalu banyak permintaan. Tunggu sekitar ${seconds} detik sebelum mencoba lagi.`
}

const props = defineProps({ merchant: { type: Object, required: true } })
const $q = useQuasar()
const payments = ref([])
const loading = ref(false)
const error = ref(null)
const detail = ref(null)
const detailError = ref(null)
const detailLoading = ref(false)
const webhooks = ref([])
const webhookError = ref(null)
const webhookLoading = ref(false)
const danaStatus = ref(null)
const danaStatusError = ref(null)
const danaStatusLoading = ref(false)
const danaStatusPaymentId = ref(null)
const cancellingPaymentId = ref(null)
const webhookMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0
})

const expandedPaymentId = ref(null)
const detailOpen = computed(() => Boolean(expandedPaymentId.value))

const qrisDataUrl = ref(null)
const qrisLoading = ref(false)
const qrisError = ref(null)
let qrisRenderRequest = 0

const qrisValidation = computed(() => {
  const instruction = detail.value?.payment_instruction
  if (instruction?.type !== 'qris_mpm') {
    return {
      isQris: false,
      valid: false,
      payload: null,
      rawPayload: null,
      error: null
    }
  }

  const raw =
    typeof instruction.qr_content === 'string' &&
    instruction.qr_content.trim() !== ''
      ? instruction.qr_content.trim()
      : typeof instruction.payment_code === 'string'
        ? instruction.payment_code.trim()
        : null

  if (!raw) {
    return {
      isQris: true,
      valid: false,
      payload: null,
      rawPayload: null,
      error: 'Konten payload QRIS tidak tersedia pada respons gateway.'
    }
  }

  const result = validateEmvcoQris(raw)
  return {
    isQris: true,
    valid: result.valid,
    payload: result.valid ? raw : null,
    rawPayload: raw,
    error: result.valid ? null : result.error
  }
})

const qrisPayload = computed(() => qrisValidation.value.payload)
const requestId = ref(0)
const detailRequestId = ref(0)
const webhookRequestId = ref(0)
const selectedPayment = ref(null)
const detailLoadedAt = ref(0)
const webhookLoadedAt = ref(0)
const rateLimitedUntil = ref(0)
const filters = ref({
  status: null,
  from: null,
  to: null,
  merchant_order_id: null
})

const meta = ref({ current_page: 1, last_page: 1, per_page: 5, total: 0 })

const displayedPayments = computed(() => {
  if (payments.value.length > 5) {
    return payments.value.slice(0, 5)
  }
  return payments.value
})

const summary = ref({
  total: 0,
  paid: 0,
  pending: 0,
  failed_or_expired: 0,
  paid_amounts: []
})
const merchantId = computed(() => props.merchant?.merchant_id)
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Failed', value: 'failed' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' }
]
const summaryCards = computed(() => [
  { label: 'Total', value: summary.value.total },
  { label: 'Paid', value: summary.value.paid },
  { label: 'Pending', value: summary.value.pending },
  { label: 'Gagal/kedaluwarsa', value: summary.value.failed_or_expired }
])
const paidAmounts = computed(
  () =>
    summary.value.paid_amounts
      ?.map(item =>
        formatAmount({
          amount_minor: item.paid_amount_minor,
          currency: item.currency
        })
      )
      .join(' · ') || '-'
)

watch(
  merchantId,
  value => {
    payments.value = []
    error.value = null
    detail.value = null
    detailError.value = null
    webhooks.value = []
    webhookError.value = null
    danaStatus.value = null
    danaStatusError.value = null
    danaStatusLoading.value = false
    danaStatusPaymentId.value = null
    selectedPayment.value = null
    expandedPaymentId.value = null
    detailLoadedAt.value = 0
    webhookLoadedAt.value = 0
    requestId.value++
    detailRequestId.value++
    webhookRequestId.value++
    loading.value = false
    detailLoading.value = false
    webhookLoading.value = false
    if (value) refreshPayments(1)
  },
  { immediate: true }
)

function toggleDetail(payment, expanded) {
  if (expanded) {
    expandedPaymentId.value = payment.id
    openDetail(payment)
  } else if (expandedPaymentId.value === payment.id) {
    expandedPaymentId.value = null
  }
}

function labelFor(value) {
  return value ? String(value).replaceAll('_', ' ') : 'Belum ada status'
}
function paymentMethodLabel(method) {
  return (
    {
      dana_wallet: 'DANA Wallet',
      qris: 'QRIS',
      va_bri: 'VA BRI',
      va_pani: 'VA PANI',
      va_cimb: 'VA CIMB',
      va_btpn: 'VA BTPN'
    }[method] || 'Hosted Checkout'
  )
}
function statusColor(status) {
  return status === 'paid'
    ? 'positive'
    : ['failed', 'expired', 'cancelled'].includes(status)
      ? 'negative'
      : 'warning'
}
function canQueryDanaStatus(payment) {
  return (
    ['dana_wallet', 'qris', 'va_bri', 'va_pani', 'va_cimb', 'va_btpn'].includes(
      payment?.payment_method
    ) && ['pending', 'expired'].includes(payment?.status)
  )
}
function eventColor(event) {
  return statusColor(event.new_status)
}
function eventIcon(event) {
  return event.new_status === 'paid'
    ? 'check_circle'
    : event.new_status === 'pending'
      ? 'hourglass_top'
      : 'receipt_long'
}
function eventTitle(event) {
  return event.event_type
    ? String(event.event_type).replaceAll('.', ' ').replaceAll('_', ' ')
    : 'Perubahan pembayaran'
}
function sourceLabel(source) {
  return (
    { merchant: 'Admin', provider: 'DANA gateway', system: 'Sistem' }[source] ||
    source ||
    'Sistem'
  )
}
function webhookColor(webhook) {
  if (
    webhook.error_code === 'uat_simulated_500' ||
    webhook.http_status === 500
  ) {
    return 'warning'
  }
  return webhook.processing_status === 'processed' && webhook.signature_valid
    ? 'positive'
    : 'negative'
}
function webhookLabel(webhook) {
  if (
    webhook.error_code === 'uat_simulated_500' ||
    webhook.http_status === 500
  ) {
    return 'UAT Webhook Simulasi 500 (5005601)'
  }
  return webhook.processing_status === 'processed'
    ? 'Webhook berhasil diproses'
    : 'Webhook ditolak'
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '-'
}
function formatAmount(payment) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: payment?.currency || 'IDR',
    maximumFractionDigits: 0
  }).format(payment?.amount_minor || 0)
}
function params(page) {
  return {
    page,
    per_page: 5,
    ...Object.fromEntries(
      Object.entries(filters.value).filter(([, value]) => value)
    )
  }
}
function auditAvailable(target) {
  if (rateLimitedUntil.value <= Date.now()) return true

  target.value = rateLimitMessage(rateLimitedUntil.value - Date.now())
  return false
}
function rememberRateLimit(error) {
  if (!isRateLimitError(error)) return

  const retryAfter = retryAfterMilliseconds(error)
  if (retryAfter > 0) {
    rateLimitedUntil.value = Math.max(
      rateLimitedUntil.value,
      Date.now() + retryAfter
    )
  }
}
function auditErrorMessage(exception) {
  const retryAfter = retryAfterMilliseconds(exception)
  if (retryAfter > 0) return rateLimitMessage(retryAfter)
  return getApiErrorMessage(exception)
}
async function refreshPayments(page = meta.value.current_page, force = false) {
  if (!merchantId.value) return
  if (!auditAvailable(error)) return

  const query = params(page)
  const requestKey = `${merchantId.value}:history:${JSON.stringify(query)}`
  const id = ++requestId.value
  loading.value = true
  error.value = null
  try {
    const [listResponse, summaryResponse] = await deduplicatedRequest(
      historyResponseCache,
      pendingHistoryRequests,
      requestKey,
      () =>
        Promise.all([
          danaGatewayMerchantService.sandboxPayments(merchantId.value, query),
          danaGatewayMerchantService.sandboxPaymentSummary(
            merchantId.value,
            query
          )
        ]),
      force
    )
    if (id !== requestId.value) return
    payments.value = listResponse.data?.data ?? []
    meta.value = listResponse.data?.meta ?? meta.value
    summary.value = summaryResponse.data?.data ?? summary.value
  } catch (exception) {
    if (id === requestId.value) {
      rememberRateLimit(exception)
      error.value = auditErrorMessage(exception)
      payments.value = []
    }
  } finally {
    if (id === requestId.value) loading.value = false
  }
}
function webhookRequestKey(paymentId, page) {
  return `${merchantId.value}:webhooks:${paymentId}:${page}:25`
}
async function loadWebhooks(
  page = webhookMeta.value.current_page,
  force = false
) {
  if (!merchantId.value || !selectedPayment.value?.id) return
  if (!auditAvailable(webhookError)) return

  const paymentId = selectedPayment.value.id
  const id = ++webhookRequestId.value
  webhookLoading.value = true
  webhookError.value = null

  try {
    const response = await deduplicatedRequest(
      auditResponseCache,
      pendingAuditRequests,
      webhookRequestKey(paymentId, page),
      () =>
        danaGatewayMerchantService.sandboxPaymentWebhooks(
          merchantId.value,
          paymentId,
          { page, per_page: 25 }
        ),
      force
    )
    if (id !== webhookRequestId.value) return
    webhooks.value = response.data?.data ?? []
    webhookMeta.value = response.data?.meta ?? webhookMeta.value
    webhookLoadedAt.value = Date.now()
  } catch (exception) {
    if (id === webhookRequestId.value) {
      rememberRateLimit(exception)
      webhookError.value = auditErrorMessage(exception)
    }
  } finally {
    if (id === webhookRequestId.value) webhookLoading.value = false
  }
}
async function openDetail(payment, force = false) {
  if (!merchantId.value || !payment?.id) return
  expandedPaymentId.value = payment.id
  if (!auditAvailable(detailError)) return

  const sameLoadedPayment =
    !force &&
    selectedPayment.value?.id === payment.id &&
    detail.value &&
    detailLoadedAt.value + AUDIT_CACHE_TTL_MS > Date.now() &&
    webhookLoadedAt.value + AUDIT_CACHE_TTL_MS > Date.now()
  if (sameLoadedPayment) return

  selectedPayment.value = payment
  detail.value = null
  detailError.value = null
  danaStatus.value = null
  danaStatusError.value = null
  danaStatusPaymentId.value = null
  webhooks.value = []
  webhookError.value = null
  qrisDataUrl.value = null
  qrisError.value = null
  webhookMeta.value = {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0
  }
  detailLoadedAt.value = 0
  webhookLoadedAt.value = 0

  const detailRequest = ++detailRequestId.value
  const webhookRequest = ++webhookRequestId.value
  detailLoading.value = true
  webhookLoading.value = true

  const detailPromise = deduplicatedRequest(
    auditResponseCache,
    pendingAuditRequests,
    `${merchantId.value}:detail:${payment.id}`,
    () =>
      danaGatewayMerchantService.sandboxPaymentDetail(
        merchantId.value,
        payment.id
      ),
    force
  )
  const webhookPromise = deduplicatedRequest(
    auditResponseCache,
    pendingAuditRequests,
    webhookRequestKey(payment.id, 1),
    () =>
      danaGatewayMerchantService.sandboxPaymentWebhooks(
        merchantId.value,
        payment.id,
        { page: 1, per_page: 25 }
      ),
    force
  )

  const [detailResult, webhookResult] = await Promise.allSettled([
    detailPromise,
    webhookPromise
  ])
  if (detailRequest !== detailRequestId.value) return

  if (detailResult.status === 'fulfilled') {
    detail.value = detailResult.value.data?.data ?? null
    detailLoadedAt.value = Date.now()
  } else {
    rememberRateLimit(detailResult.reason)
    detailError.value = auditErrorMessage(detailResult.reason)
  }

  if (webhookRequest === webhookRequestId.value) {
    if (webhookResult.status === 'fulfilled') {
      webhooks.value = webhookResult.value.data?.data ?? []
      webhookMeta.value = webhookResult.value.data?.meta ?? webhookMeta.value
      webhookLoadedAt.value = Date.now()
      webhookError.value = null
    } else {
      rememberRateLimit(webhookResult.reason)
      webhookError.value = auditErrorMessage(webhookResult.reason)
    }
  }

  detailLoading.value = false
  webhookLoading.value = false
}
async function checkDanaStatus(payment) {
  if (!merchantId.value || !payment?.id || !canQueryDanaStatus(payment)) return
  if (!auditAvailable(danaStatusError) || danaStatusLoading.value) return

  await openDetail(payment)
  if (selectedPayment.value?.id !== payment.id) return

  danaStatusLoading.value = true
  danaStatusError.value = null
  danaStatusPaymentId.value = payment.id
  try {
    const response =
      await danaGatewayMerchantService.queryDanaSandboxPaymentStatus(
        merchantId.value,
        payment.id
      )
    if (selectedPayment.value?.id !== payment.id) return
    danaStatus.value = response.data?.data ?? null
  } catch (exception) {
    if (selectedPayment.value?.id === payment.id) {
      rememberRateLimit(exception)
      danaStatusError.value = auditErrorMessage(exception)
    }
  } finally {
    if (danaStatusPaymentId.value === payment.id)
      danaStatusLoading.value = false
  }
}

async function cancelPayment(payment) {
  if (!merchantId.value || !payment?.id || cancellingPaymentId.value) return
  cancellingPaymentId.value = payment.id
  try {
    await danaGatewayMerchantService.cancelDanaSandboxPayment(
      merchantId.value,
      payment.id
    )
    $q.notify({
      type: 'positive',
      message: 'Transaksi DANA Sandbox berhasil dibatalkan di DANA.'
    })
    await checkDanaStatus(payment)
    await refreshPayments(meta.value.current_page, true)
  } catch (exception) {
    rememberRateLimit(exception)
    $q.notify({
      type: 'negative',
      message:
        auditErrorMessage(exception) ||
        'Gagal membatalkan transaksi di DANA Sandbox.'
    })
  } finally {
    cancellingPaymentId.value = null
  }
}
function isPngDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/png;base64,')
}

function validCheckoutUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

watch(
  qrisPayload,
  async payload => {
    const request = ++qrisRenderRequest
    qrisDataUrl.value = null
    qrisError.value = null
    qrisLoading.value = Boolean(payload)
    if (!payload) return

    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 380,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
      if (request !== qrisRenderRequest) return
      if (!isPngDataUrl(dataUrl)) {
        throw new Error('Hasil pembuatan QRIS bukan format PNG yang valid.')
      }
      qrisDataUrl.value = dataUrl
    } catch (err) {
      if (request === qrisRenderRequest) {
        qrisError.value =
          'QRIS tidak dapat dibuat sebagai gambar di browser: ' +
          (err?.message || 'Format tidak didukung.')
      }
    } finally {
      if (request === qrisRenderRequest) qrisLoading.value = false
    }
  },
  { immediate: true }
)

function handleQrisImageError() {
  qrisDataUrl.value = null
  qrisLoading.value = false
  qrisError.value =
    'Gambar QRIS tidak dapat dirender atau rusak di browser. Gunakan kode teks cadangan.'
}

watch(expandedPaymentId, id => {
  if (!id) {
    qrisDataUrl.value = null
    qrisError.value = null
    qrisLoading.value = false
  }
})

function openCheckout(url) {
  const targetUrl = url || detail.value?.checkout_url
  if (!validCheckoutUrl(targetUrl)) {
    $q.notify({
      message: 'URL checkout Sandbox tidak valid atau tidak tersedia.',
      color: 'negative',
      icon: 'error',
      position: 'top'
    })
    return
  }
  globalThis.location.assign(targetUrl)
}

async function copyPaymentCode(code) {
  if (typeof code !== 'string' || code === '') return
  try {
    await globalThis.navigator?.clipboard?.writeText(code)
    $q.notify({
      message: 'Kode pembayaran disalin.',
      color: 'positive',
      icon: 'content_copy',
      position: 'top'
    })
  } catch {
    $q.notify({
      message: 'Gagal menyalin kode pembayaran.',
      color: 'negative',
      icon: 'error',
      position: 'top'
    })
  }
}

async function downloadQris() {
  if (!qrisPayload.value || !isPngDataUrl(qrisDataUrl.value)) {
    $q.notify({
      message: 'Gambar QRIS belum siap atau tidak valid untuk diunduh.',
      color: 'negative',
      icon: 'error',
      position: 'top'
    })
    return
  }
  try {
    const response = await fetch(qrisDataUrl.value)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `qris-dana-sandbox-${detail.value?.merchant_reference || 'code'}.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    $q.notify({
      message: 'Gagal mengunduh gambar QRIS.',
      color: 'negative',
      icon: 'error',
      position: 'top'
    })
  }
}

function retryDetail() {
  if (selectedPayment.value) openDetail(selectedPayment.value, true)
}
</script>

<style scoped>
h3,
h4 {
  margin: 0;
  color: #20180b;
}
.section-description {
  margin: 4px 0 0;
  color: #746b5c;
  font-size: 0.82rem;
  line-height: 1.5;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.payment-history {
  position: relative;
  min-height: 64px;
}
.error-banner {
  border: 1px solid #e8b4ad;
  background: #fff2f0;
  color: #9f2419;
}
.warning-banner {
  border: 1px solid #e4c56c;
  background: #fff8dc;
  color: #5d4710;
}
.payment-history-list {
  border-radius: 12px;
  overflow: hidden;
}
.payment-item-header {
  min-height: 58px;
}
.payment-detail-audit {
  border-top: 1px solid #eee6d9;
  border-radius: 0 0 10px 10px;
}
.payment-overview {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid #ebd18d;
  border-radius: 12px;
  background: linear-gradient(125deg, #fffaf0, #fff);
}
.overview-label,
.overview-reference {
  margin: 0;
  color: #746b5c;
  font-size: 0.76rem;
}
.overview-amount {
  margin: 4px 0;
  color: #281d0c;
  font-size: 1.45rem;
  font-weight: 800;
}
.overview-status {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 6px;
  text-align: right;
  color: #746b5c;
  font-size: 0.75rem;
}
.status-badge {
  padding: 6px 10px;
  font-weight: 700;
}
.audit-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.audit-meta-item {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #eee6d9;
  border-radius: 10px;
  background: #fff;
}
.audit-meta-item > .q-icon {
  margin-top: 2px;
  color: #b88924;
}
.audit-meta-item span,
.webhook-content span {
  display: block;
  color: #817866;
  font-size: 0.72rem;
}
.audit-meta-item strong {
  display: block;
  overflow-wrap: anywhere;
  color: #342918;
  font-size: 0.79rem;
  font-weight: 600;
}
.audit-section {
  margin-top: 20px;
}
.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 10px;
}
.section-heading h4 {
  font-size: 0.95rem;
}
.section-heading p {
  margin: 2px 0 0;
  color: #817866;
  font-size: 0.76rem;
}
.audit-timeline {
  padding: 4px 0;
}
.timeline-item {
  position: relative;
  display: flex;
  gap: 12px;
  min-height: 64px;
}
.timeline-item:not(:last-child)::before {
  position: absolute;
  top: 25px;
  bottom: 0;
  left: 11px;
  width: 2px;
  background: #eadfc9;
  content: '';
}
.timeline-rail {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff8e8;
}
.timeline-content {
  flex: 1;
  min-width: 0;
  padding: 1px 0 10px;
}
.timeline-content strong {
  display: block;
  color: #362a18;
  font-size: 0.83rem;
  text-transform: capitalize;
}
.timeline-source {
  display: block;
  margin-top: 2px;
  color: #8b6e2f;
  font-size: 0.71rem;
}
.timeline-content time {
  color: #817866;
  font-size: 0.71rem;
  white-space: nowrap;
}
.timeline-transition {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}
.timeline-transition .q-badge {
  font-size: 0.68rem;
}
.webhook-list {
  overflow: hidden;
  border: 1px solid #eee6d9;
  border-radius: 12px;
}
.webhook-row {
  display: flex;
  gap: 11px;
  padding: 10px 12px;
  background: #fff;
}
.webhook-row + .webhook-row {
  border-top: 1px solid #f0eadf;
}
.webhook-content {
  flex: 1;
  min-width: 0;
}
.webhook-content strong {
  color: #352918;
  font-size: 0.82rem;
}
.webhook-content small {
  display: block;
  margin-top: 3px;
  color: #a13d2e;
  font-size: 0.7rem;
}
.empty-audit {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px;
  border: 1px dashed #dfd2bb;
  border-radius: 10px;
  color: #817866;
  font-size: 0.78rem;
}
.checkout-action-box {
  display: flex;
  align-items: center;
}
.payment-instruction {
  border: 1px solid #eee6d9;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.payment-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px dashed #cbb57c;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fdfbf7;
  color: #342918;
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.qris-payload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.qris-image {
  width: 200px;
  max-width: 100%;
  border: 1px solid #eee6d9;
  border-radius: 8px;
  background: #fff;
}
.qris-render-state {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 180px;
  padding: 16px;
  color: #817866;
}
.qris-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.qris-payload-text {
  display: block;
  overflow-wrap: anywhere;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fdfbf7;
  border: 1px solid #eee6d9;
  color: #342918;
  font-size: 0.75rem;
}
@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 599px) {
  .payment-overview {
    flex-direction: column;
  }
  .overview-status {
    align-items: flex-start;
    text-align: left;
  }
  .audit-meta-grid {
    grid-template-columns: 1fr;
  }
  .timeline-content time {
    white-space: normal;
    text-align: right;
  }
  .webhook-content .q-badge {
    margin-top: 4px;
  }
}
</style>
