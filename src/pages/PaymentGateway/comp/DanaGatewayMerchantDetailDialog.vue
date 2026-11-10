<template>
  <div class="merchant-detail-view q-gutter-y-lg">
    <!-- Tombol kembali & header view -->
    <div class="row items-center justify-between q-col-gutter-sm">
      <div class="col-12 col-sm-auto">
        <q-btn
          flat
          color="warning"
          icon="arrow_back"
          label="Kembali ke Daftar Merchant"
          no-caps
          @click="closeDetail"
        />
      </div>
      <div class="col-12 col-sm-auto row q-gutter-sm">
        <q-btn
          outline
          color="warning"
          icon="refresh"
          label="Refresh status"
          no-caps
          :loading="managementLoading"
          @click="refreshManagement(true)"
        />
      </div>
    </div>

    <q-card flat bordered class="detail-card bg-white">
      <q-card-section
        class="detail-card__header row items-center justify-between"
      >
        <div>
          <p class="eyebrow">DANA GATEWAY</p>
          <h2>Detail & Konfigurasi Merchant</h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Tutup"
          @click="closeDetail"
        />
      </q-card-section>
      <q-separator />

      <div class="detail-card__content">
        <q-card-section v-if="store.detailLoading" class="q-gutter-y-sm">
          <q-skeleton v-for="index in 4" :key="index" type="text" />
        </q-card-section>
        <template v-else-if="merchant">
          <q-card-section class="q-gutter-y-md">
            <div class="detail-row">
              <span>Nama merchant</span>
              <strong>{{ merchant.merchant_name }}</strong>
            </div>
            <div class="detail-row">
              <span>Kode merchant</span>
              <strong>{{ merchant.merchant_code }}</strong>
            </div>
            <div class="detail-row">
              <span>Environment</span>
              <div class="row items-center q-gutter-xs">
                <q-badge color="blue-grey" label="Sandbox" />
                <q-badge color="deep-orange" label="Production" />
              </div>
            </div>
            <div class="detail-row">
              <span>Status provisioning</span>
              <q-badge color="positive">
                {{ labelFor(merchant.provisioning_status) }}
              </q-badge>
            </div>
          </q-card-section>
          <q-separator />

          <!-- Tab Dual Environment: Sandbox dan Production -->
          <q-card-section class="q-pb-none bg-grey-1">
            <q-tabs
              v-model="activeEnvironmentTab"
              dense
              class="text-grey-8"
              active-color="warning"
              indicator-color="warning"
              align="left"
              narrow-indicator
              @update:model-value="onEnvironmentTabChange"
            >
              <q-tab name="sandbox" icon="science" label="Sandbox (Testing)">
                <q-badge color="blue-grey" class="q-ml-xs">Testing</q-badge>
              </q-tab>
              <q-tab
                name="production"
                icon="verified"
                label="Production (Prioritas Utama)"
              >
                <q-badge color="deep-orange" class="q-ml-xs">Live</q-badge>
              </q-tab>
            </q-tabs>
          </q-card-section>
          <q-separator />

          <q-card-section
            v-if="activeEnvironmentTab === 'production'"
            class="q-pb-none"
          >
            <q-banner rounded class="production-policy-banner">
              <template #avatar
                ><q-icon name="shield" color="positive"
              /></template>
              <div class="text-weight-bold"
                >Kebijakan Dual Environment UDEV</div
              >
              <div>
                Transaksi pelanggan nyata otomatis memprioritaskan Production
                jika konfigurasi DANA Production approved, aktif, credential
                lengkap, dan terverifikasi. Sandbox hanya digunakan untuk
                pengujian jika Production belum siap.
              </div>
            </q-banner>
          </q-card-section>

          <template v-if="true">
            <q-card-section
              class="row items-center justify-between q-col-gutter-md"
            >
              <div class="col-12 col-sm">
                <h3>Status kesiapan checkout</h3>
                <p class="section-description">
                  Metadata ini tidak memuat credential atau API key plaintext.
                </p>
              </div>
              <div class="col-12 col-sm-auto">
                <q-btn
                  outline
                  color="warning"
                  icon="refresh"
                  label="Refresh status"
                  no-caps
                  :loading="managementLoading"
                  @click="refreshManagement(true)"
                />
              </div>
            </q-card-section>

            <q-card-section v-if="managementError">
              <q-banner rounded class="error-banner">
                <template #avatar><q-icon name="error_outline" /></template>
                {{ managementError }}
                <template #action>
                  <q-btn
                    flat
                    color="negative"
                    label="Coba lagi"
                    no-caps
                    @click="refreshManagement(true)"
                  />
                </template>
              </q-banner>
            </q-card-section>
            <q-card-section v-else-if="managementLoading" class="q-gutter-y-sm">
              <q-skeleton v-for="index in 3" :key="index" type="text" />
            </q-card-section>
            <template v-else-if="readiness">
              <q-card-section class="q-pt-none">
                <div class="readiness-grid">
                  <div class="readiness-item">
                    <span>Status merchant</span>
                    <strong>{{ labelFor(readiness.merchant_status) }}</strong>
                  </div>
                  <div class="readiness-item">
                    <span>API key aktif</span>
                    <strong>{{ readiness.active_api_key_count }}</strong>
                  </div>
                  <div class="readiness-item">
                    <span>Konfigurasi DANA</span>
                    <q-badge
                      :color="
                        readiness.dana_configuration.available
                          ? 'positive'
                          : 'warning'
                      "
                      :text-color="
                        readiness.dana_configuration.available
                          ? 'white'
                          : 'dark'
                      "
                    >
                      {{
                        readiness.dana_configuration.available
                          ? 'Tersedia'
                          : 'Belum tersedia'
                      }}
                    </q-badge>
                  </div>
                  <div class="readiness-item">
                    <span>Konfigurasi aktif</span>
                    <q-badge
                      :color="
                        readiness.dana_configuration.enabled
                          ? 'positive'
                          : 'grey-7'
                      "
                    >
                      {{
                        readiness.dana_configuration.enabled
                          ? 'Aktif'
                          : 'Nonaktif'
                      }}
                    </q-badge>
                  </div>
                  <div class="readiness-item">
                    <span>Kesiapan checkout</span>
                    <q-badge
                      :color="
                        readiness.readiness_status === 'ready'
                          ? 'positive'
                          : 'warning'
                      "
                      :text-color="
                        readiness.readiness_status === 'ready'
                          ? 'white'
                          : 'dark'
                      "
                    >
                      {{
                        readiness.readiness_status === 'ready'
                          ? 'Siap'
                          : 'Belum siap'
                      }}
                    </q-badge>
                  </div>
                </div>
                <q-banner
                  v-if="readiness.not_ready_components?.length"
                  rounded
                  class="warning-banner q-mt-md"
                >
                  <template #avatar><q-icon name="info" /></template>
                  <div class="text-weight-medium">Komponen yang belum siap</div>
                  <div>{{
                    readiness.not_ready_components.map(labelFor).join(', ')
                  }}</div>
                </q-banner>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <q-btn
                  color="warning"
                  text-color="dark"
                  icon="tune"
                  :label="
                    configurationDialogOpen
                      ? 'Sembunyikan Form Konfigurasi'
                      : 'Konfigurasi DANA ' +
                        (activeEnvironmentTab === 'production'
                          ? 'Production'
                          : 'Sandbox')
                  "
                  no-caps
                  @click="toggleConfigurationPanel"
                />
              </q-card-section>

              <!-- Panel Konfigurasi DANA Inline (Responsif tanpa QDialog) -->
              <q-card
                v-if="configurationDialogOpen"
                flat
                bordered
                class="configuration-panel q-mx-md q-mb-lg bg-grey-1"
              >
                <q-card-section class="row items-center justify-between">
                  <div>
                    <p class="eyebrow"
                      >DANA {{ activeEnvironmentTab.toUpperCase() }}</p
                    >
                    <h2
                      >Konfigurasi merchant
                      {{
                        activeEnvironmentTab === 'production'
                          ? 'Production'
                          : 'Sandbox'
                      }}</h2
                    >
                  </div>
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    aria-label="Tutup"
                    @click="configurationDialogOpen = false"
                  />
                </q-card-section>
                <q-separator />
                <q-card-section>
                  <q-banner
                    v-if="!isSecureFrontend"
                    rounded
                    class="transport-notice q-mb-md"
                  >
                    <template #avatar><q-icon name="security" /></template>
                    Credential dikirim ke backend UDEV melalui koneksi lokal,
                    lalu diteruskan ke Gateway HOMELAB menggunakan HTTPS. Karena
                    frontend lokal masih HTTP, gunakan data dummy Sandbox atau
                    HTTPS lokal tepercaya sebelum memasukkan credential asli.
                  </q-banner>
                  <q-banner v-else rounded class="transport-notice q-mb-md">
                    <template #avatar><q-icon name="verified_user" /></template>
                    Credential dikirim ke backend UDEV melalui HTTPS. Nilai
                    secret tidak ditampilkan kembali setelah disimpan.
                  </q-banner>

                  <div class="row items-center q-col-gutter-sm q-mb-md">
                    <div class="col-12 col-sm-auto">
                      <q-btn
                        outline
                        color="warning"
                        icon="download"
                        label="Ambil Konfigurasi Tersimpan"
                        no-caps
                        :loading="storedConfigurationLoading"
                        @click="loadStoredConfiguration"
                      />
                    </div>
                    <div class="col-12 col-sm">
                      <span class="section-description">
                        Hanya metadata
                        {{
                          activeEnvironmentTab === 'production'
                            ? 'Production'
                            : 'Sandbox'
                        }}
                        merchant ini yang diisi. Secret tetap di Gateway dan
                        tidak disimpan otomatis.
                      </span>
                    </div>
                  </div>

                  <q-banner
                    v-if="confirmOverwriteStoredConfig"
                    rounded
                    class="warning-banner q-mb-md"
                  >
                    <div class="text-weight-bold">Timpa perubahan manual?</div>
                    <div>
                      Metadata konfigurasi tersimpan akan menggantikan field
                      yang sedang Anda isi. Private key dan webhook public key
                      tidak akan diambil.
                    </div>
                    <template #action>
                      <q-btn
                        flat
                        label="Batal"
                        no-caps
                        @click="confirmOverwriteStoredConfig = false"
                      />
                      <q-btn
                        color="warning"
                        text-color="dark"
                        label="Ambil konfigurasi"
                        no-caps
                        @click="executeLoadStoredConfiguration"
                      />
                    </template>
                  </q-banner>

                  <q-banner
                    v-if="storedConfigurationNotice"
                    rounded
                    class="warning-banner q-mb-md"
                  >
                    {{ storedConfigurationNotice }}
                  </q-banner>

                  <q-banner
                    v-if="storedSecretStatus"
                    rounded
                    class="transport-notice q-mb-md"
                  >
                    <template #avatar><q-icon name="key" /></template>
                    Private key:
                    <strong>{{
                      storedSecretStatus.private_key
                        ? 'tersimpan'
                        : 'belum tersedia'
                    }}</strong
                    >; webhook public key:
                    <strong>{{
                      storedSecretStatus.webhook_public_key
                        ? 'tersimpan'
                        : 'belum tersedia'
                    }}</strong
                    >. Biarkan field secret kosong untuk mempertahankan nilai
                    yang sudah tersimpan.
                  </q-banner>

                  <q-form
                    ref="configurationFormRef"
                    class="q-gutter-y-md"
                    @submit="askToSaveConfiguration"
                  >
                    <q-input
                      outlined
                      dense
                      readonly
                      :model-value="activeEnvironmentTab"
                      label="Environment"
                      bg-color="grey-2"
                    />
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.partner_id"
                          outlined
                          dense
                          label="Partner ID"
                          :error="Boolean(configurationErrors.partner_id)"
                          :error-message="firstError('partner_id')"
                          :rules="[requiredRule, maxRule(150)]"
                          no-error-icon
                        />
                      </div>
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.merchant_id"
                          outlined
                          dense
                          label="Merchant ID DANA"
                          autocomplete="off"
                          :error="Boolean(configurationErrors.merchant_id)"
                          :error-message="firstError('merchant_id')"
                          :rules="[requiredRule, maxRule(150)]"
                          no-error-icon
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.origin"
                          outlined
                          dense
                          type="url"
                          label="Origin HTTPS"
                          placeholder="https://merchant.example"
                          :error="Boolean(configurationErrors.origin)"
                          :error-message="firstError('origin')"
                          :rules="[httpsUrlRule, maxRule(255)]"
                          no-error-icon
                        />
                      </div>
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.channel_id"
                          outlined
                          dense
                          label="Channel ID"
                          :error="Boolean(configurationErrors.channel_id)"
                          :error-message="firstError('channel_id')"
                          :rules="[requiredRule, maxRule(100)]"
                          no-error-icon
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.external_store_id"
                          outlined
                          dense
                          label="External Store ID Sandbox (untuk QRIS)"
                          hint="Wajib untuk QRIS. Isi hanya ID resmi dari DANA Sandbox, bukan nilai contoh."
                          persistent-hint
                          :error="
                            Boolean(configurationErrors.external_store_id)
                          "
                          :error-message="firstError('external_store_id')"
                          :rules="[maxRule(150)]"
                          no-error-icon
                        />
                      </div>
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.sub_merchant_id"
                          outlined
                          dense
                          label="Sub Merchant ID Sandbox"
                          hint="Isi hanya bila merchant merupakan aggregator."
                          persistent-hint
                          :error="Boolean(configurationErrors.sub_merchant_id)"
                          :error-message="firstError('sub_merchant_id')"
                          :rules="[maxRule(150)]"
                          no-error-icon
                        />
                      </div>
                    </div>
                    <q-input
                      v-model.trim="configurationForm.notification_url"
                      outlined
                      dense
                      type="url"
                      label="Notification URL HTTPS"
                      :error="Boolean(configurationErrors.notification_url)"
                      :error-message="firstError('notification_url')"
                      :rules="[httpsUrlRule, maxRule(2048)]"
                      no-error-icon
                    />
                    <q-input
                      v-model.trim="configurationForm.callback_url"
                      outlined
                      dense
                      type="url"
                      label="Callback URL HTTPS"
                      :error="Boolean(configurationErrors.callback_url)"
                      :error-message="firstError('callback_url')"
                      :rules="[httpsUrlRule, maxRule(2048)]"
                      no-error-icon
                    />
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-6">
                        <q-input
                          v-model.trim="configurationForm.mcc"
                          outlined
                          dense
                          label="MCC"
                          maxlength="4"
                          :error="Boolean(configurationErrors.mcc)"
                          :error-message="firstError('mcc')"
                          :rules="[
                            value =>
                              /^\d{4}$/.test(value) ||
                              'MCC harus terdiri dari 4 angka.'
                          ]"
                          no-error-icon
                        />
                      </div>
                      <div class="col-12 col-md-6 flex items-center">
                        <q-toggle
                          v-model="configurationForm.enabled"
                          color="warning"
                          label="Aktifkan konfigurasi Sandbox"
                        />
                      </div>
                    </div>
                    <q-input
                      v-model="configurationForm.private_key"
                      outlined
                      type="textarea"
                      autogrow
                      label="Private key DANA Sandbox"
                      hint="Tempel langsung key dari Portal DANA: PEM lengkap atau Base64 DER. Header/footer PEM tidak perlu ditambahkan manual."
                      persistent-hint
                      autocomplete="off"
                      :input-class="
                        showPrivateKey ? '' : 'masked-sensitive-input'
                      "
                      :error="Boolean(configurationErrors.private_key)"
                      :error-message="firstError('private_key')"
                      :rules="[optionalKeyMaterialRule]"
                      no-error-icon
                    >
                      <template #append>
                        <q-btn
                          flat
                          round
                          dense
                          :icon="
                            showPrivateKey ? 'visibility_off' : 'visibility'
                          "
                          :aria-label="
                            showPrivateKey
                              ? 'Sembunyikan private key'
                              : 'Tampilkan private key'
                          "
                          @click="showPrivateKey = !showPrivateKey"
                        />
                      </template>
                    </q-input>
                    <q-input
                      v-model="configurationForm.dana_webhook_public_key"
                      outlined
                      type="textarea"
                      autogrow
                      label="Public key webhook DANA Sandbox"
                      hint="Tempel langsung public key DANA dari portal. Jangan gunakan public key merchant untuk field ini."
                      persistent-hint
                      autocomplete="off"
                      :input-class="
                        showWebhookPublicKey ? '' : 'masked-sensitive-input'
                      "
                      :error="
                        Boolean(configurationErrors.dana_webhook_public_key)
                      "
                      :error-message="firstError('dana_webhook_public_key')"
                      :rules="[optionalKeyMaterialRule]"
                      no-error-icon
                    >
                      <template #append>
                        <q-btn
                          flat
                          round
                          dense
                          :icon="
                            showWebhookPublicKey
                              ? 'visibility_off'
                              : 'visibility'
                          "
                          :aria-label="
                            showWebhookPublicKey
                              ? 'Sembunyikan public key'
                              : 'Tampilkan public key'
                          "
                          @click="showWebhookPublicKey = !showWebhookPublicKey"
                        />
                      </template>
                    </q-input>
                    <q-banner rounded class="transport-notice">
                      <template #avatar
                        ><q-icon name="verified_user"
                      /></template>
                      Saat disimpan, Gateway memvalidasi struktur key, RSA-2048,
                      dan kemampuan signature tanpa menampilkan isi key. Status
                      tersimpan hanya berarti format konfigurasi diterima;
                      gunakan status kesiapan lalu uji Sandbox terpisah untuk
                      memverifikasi koneksi DANA.
                    </q-banner>
                    <q-banner
                      v-if="configurationError"
                      rounded
                      class="error-banner"
                    >
                      <template #avatar
                        ><q-icon name="error_outline"
                      /></template>
                      {{ configurationError }}
                    </q-banner>

                    <!-- Konfirmasi Simpan Inline -->
                    <q-banner
                      v-if="saveConfirmationOpen"
                      rounded
                      class="warning-banner q-mt-md"
                    >
                      <template #avatar
                        ><q-icon name="warning" color="warning"
                      /></template>
                      <div class="text-weight-bold"
                        >Simpan konfigurasi Sandbox?</div
                      >
                      <div>
                        Credential akan dikirim sekali ke backend UDEV dan tidak
                        akan ditampilkan kembali oleh halaman ini.
                      </div>
                      <template #action>
                        <q-btn
                          flat
                          label="Batal"
                          no-caps
                          :disable="configurationSaving"
                          @click="saveConfirmationOpen = false"
                        />
                        <q-btn
                          color="warning"
                          text-color="dark"
                          label="Ya, simpan"
                          no-caps
                          :loading="configurationSaving"
                          @click="saveConfiguration"
                        />
                      </template>
                    </q-banner>
                  </q-form>
                </q-card-section>
                <q-card-actions align="right" class="q-pa-md q-gutter-sm">
                  <q-btn
                    flat
                    label="Tutup Form"
                    no-caps
                    :disable="configurationSaving"
                    @click="configurationDialogOpen = false"
                  />
                  <q-btn
                    v-if="!saveConfirmationOpen"
                    color="warning"
                    text-color="dark"
                    icon="save"
                    label="Simpan konfigurasi"
                    no-caps
                    :loading="configurationSaving"
                    @click="askToSaveConfiguration"
                  />
                </q-card-actions>
              </q-card>

              <!-- Panel Sandbox Tester (Khusus Environment Sandbox) -->
              <template v-if="activeEnvironmentTab === 'sandbox'">
                <DanaSandboxTesterPanel :merchant="merchant" />
                <q-separator />
              </template>

              <!-- Metadata API Key & Riwayat Penerbitan -->
              <q-card-section>
                <h3>Metadata API key</h3>
                <p class="section-description">
                  Prefix dan status saja. API key plaintext maupun hash tidak
                  pernah ditampilkan.
                </p>

                <!-- Konfirmasi Cabut API Key Inline -->
                <q-card
                  v-if="revokeConfirmationOpen"
                  flat
                  bordered
                  class="confirmation-card q-my-md bg-red-1"
                >
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold text-negative">
                      Cabut API key?
                    </div>
                    <p class="q-mt-xs">
                      Pencabutan key
                      <strong>{{ apiKeyToRevoke?.key_prefix }}</strong> dapat
                      memutus integrasi aplikasi yang masih menggunakannya.
                      Tindakan ini diteruskan sebagai konfirmasi eksplisit ke
                      backend.
                    </p>
                    <q-banner v-if="revokeError" rounded class="error-banner">
                      <template #avatar
                        ><q-icon name="error_outline"
                      /></template>
                      {{ revokeError }}
                    </q-banner>
                  </q-card-section>
                  <q-card-actions align="right" class="q-pa-md q-gutter-sm">
                    <q-btn
                      flat
                      label="Batal"
                      no-caps
                      :disable="revoking"
                      @click="closeRevokeDialog"
                    />
                    <q-btn
                      color="negative"
                      label="Ya, cabut key"
                      no-caps
                      :loading="revoking"
                      @click="revokeApiKey"
                    />
                  </q-card-actions>
                </q-card>

                <!-- Form Generate API Key Inline -->
                <q-card
                  v-if="issueDialogOpen"
                  flat
                  bordered
                  class="confirmation-card q-my-md bg-amber-1"
                >
                  <q-card-section>
                    <div class="row items-center justify-between">
                      <div class="text-subtitle1 text-weight-bold text-dark">
                        Generate API Key Sandbox
                      </div>
                      <q-btn
                        flat
                        round
                        dense
                        icon="close"
                        aria-label="Tutup"
                        @click="issueDialogOpen = false"
                      />
                    </div>
                    <q-input
                      v-model.trim="issueForm.name"
                      outlined
                      dense
                      label="Nama API Key"
                      class="q-mt-md"
                      bg-color="white"
                    />
                    <q-option-group
                      v-model="issueForm.abilities"
                      :options="abilityOptions"
                      type="checkbox"
                      class="q-mt-sm"
                    />
                    <q-input
                      v-model="issueForm.expires_at"
                      outlined
                      dense
                      type="datetime-local"
                      label="Masa berlaku (opsional)"
                      class="q-mt-sm"
                      bg-color="white"
                    />
                    <q-banner v-if="issueError" class="error-banner q-mt-md">
                      {{ issueError }}
                    </q-banner>
                  </q-card-section>
                  <q-card-actions align="right" class="q-pa-md q-gutter-sm">
                    <q-btn
                      flat
                      label="Batal"
                      no-caps
                      @click="issueDialogOpen = false"
                    />
                    <q-btn
                      color="warning"
                      text-color="dark"
                      label="Konfirmasi Generate"
                      no-caps
                      :loading="issuing"
                      :disable="!issueForm.name || !issueForm.abilities.length"
                      @click="issueApiKey"
                    />
                  </q-card-actions>
                </q-card>

                <q-markup-table
                  v-if="apiKeys.length && $q.screen.gt.sm"
                  flat
                  bordered
                  wrap-cells
                  class="q-mt-sm api-key-metadata-table"
                >
                  <thead>
                    <tr>
                      <th class="text-left">ID</th>
                      <th class="text-left">Prefix</th>
                      <th class="text-left">Status</th>
                      <th class="text-left">Dibuat</th>
                      <th class="text-left">Terakhir digunakan</th>
                      <th class="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="apiKey in apiKeys" :key="apiKey.id">
                      <td>{{ apiKey.id }}</td>
                      <td>{{ apiKey.key_prefix }}</td>
                      <td>
                        <q-badge :color="apiKeyStatus(apiKey).color">
                          {{ apiKeyStatus(apiKey).label }}
                        </q-badge>
                      </td>
                      <td>{{ formatDate(apiKey.created_at) }}</td>
                      <td>{{ formatDate(apiKey.last_used_at) }}</td>
                      <td class="text-right">
                        <q-btn
                          v-if="canRevoke(apiKey)"
                          flat
                          dense
                          color="negative"
                          icon="delete_outline"
                          label="Cabut"
                          no-caps
                          @click="askToRevoke(apiKey)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </q-markup-table>
                <div
                  v-else-if="apiKeys.length"
                  class="api-key-cards q-mt-sm q-gutter-y-sm"
                >
                  <q-card
                    v-for="apiKey in apiKeys"
                    :key="apiKey.id"
                    flat
                    bordered
                    class="api-key-card"
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="row items-start justify-between no-wrap">
                        <div>
                          <div class="text-caption text-grey-7">
                            API Key #{{ apiKey.id }}
                          </div>
                          <div class="text-weight-medium">
                            {{ apiKey.key_prefix }}
                          </div>
                        </div>
                        <q-badge :color="apiKeyStatus(apiKey).color">
                          {{ apiKeyStatus(apiKey).label }}
                        </q-badge>
                      </div>
                      <div class="issuance-card-details q-mt-sm">
                        <span>Dibuat</span>
                        <strong>{{ formatDate(apiKey.created_at) }}</strong>
                        <span>Terakhir digunakan</span>
                        <strong>{{ formatDate(apiKey.last_used_at) }}</strong>
                      </div>
                      <q-btn
                        v-if="canRevoke(apiKey)"
                        class="q-mt-sm"
                        outline
                        color="negative"
                        icon="delete_outline"
                        label="Cabut"
                        no-caps
                        @click="askToRevoke(apiKey)"
                      />
                    </q-card-section>
                  </q-card>
                </div>
                <q-banner v-else rounded class="warning-banner q-mt-sm">
                  <template #avatar><q-icon name="key_off" /></template>
                  Belum ada API key aktif. Merchant belum siap checkout.
                </q-banner>

                <q-btn
                  v-if="!issueDialogOpen"
                  class="q-mt-md"
                  color="warning"
                  text-color="dark"
                  icon="key"
                  label="Generate API Key"
                  no-caps
                  :disable="merchant.merchant_code === 'larissama'"
                  @click="openIssueDialog"
                />

                <q-banner
                  v-if="issuance"
                  rounded
                  class="q-mt-md warning-banner"
                >
                  Issuance #{{ issuance.id }}:
                  <strong>{{ labelFor(issuance.status) }}</strong>
                  <template #action>
                    <q-btn
                      flat
                      label="Refresh Status"
                      no-caps
                      @click="refreshIssuance"
                    />
                    <q-btn
                      v-if="
                        ['cancel_pending', 'manual_review'].includes(
                          issuance.status
                        )
                      "
                      flat
                      color="negative"
                      label="Batalkan"
                      no-caps
                      @click="cancelIssuance"
                    />
                  </template>
                </q-banner>

                <q-separator class="q-my-lg" />

                <!-- Riwayat Penerbitan API Key (QList + QItem + Pagination 5 item) -->
                <div class="row items-center justify-between q-col-gutter-sm">
                  <div class="col-12 col-sm">
                    <h3>Riwayat Penerbitan API Key</h3>
                    <p class="section-description">
                      Journal UDEV; tidak memuat API key maupun secret.
                    </p>
                  </div>
                  <div class="col-12 col-sm-auto">
                    <q-btn
                      outline
                      color="warning"
                      icon="refresh"
                      label="Refresh riwayat"
                      no-caps
                      :loading="issuanceHistoryLoading"
                      @click="refreshIssuanceHistory"
                    />
                  </div>
                </div>

                <q-banner
                  v-if="issuanceHistoryError"
                  rounded
                  class="error-banner q-mt-sm"
                >
                  {{ issuanceHistoryError }}
                </q-banner>
                <div v-else class="issuance-history q-mt-sm">
                  <q-inner-loading
                    :showing="issuanceHistoryLoading"
                    color="warning"
                  />
                  <template v-if="issuanceHistory.length">
                    <q-list
                      bordered
                      separator
                      class="rounded-borders bg-white issuance-history-list"
                    >
                      <q-item
                        v-for="record in displayedIssuanceHistory"
                        :key="record.id"
                        class="q-py-md"
                      >
                        <q-item-section avatar>
                          <q-avatar
                            size="36px"
                            color="amber-1"
                            text-color="warning"
                            icon="key"
                          />
                        </q-item-section>
                        <q-item-section>
                          <div
                            class="row items-center justify-between no-wrap q-col-gutter-xs"
                          >
                            <div class="text-weight-bold text-body2 text-dark">
                              {{ record.key_prefix || 'Tanpa prefix' }}
                            </div>
                            <q-badge
                              :color="issuanceStatusColor(record.status)"
                            >
                              {{ labelFor(record.status) }}
                            </q-badge>
                          </div>
                          <div class="text-caption text-grey-7 q-mt-xs">
                            Journal #{{ record.id }} · Gateway API Key ID:
                            {{ record.gateway_api_key_id || '—' }} ·
                            {{ formatDate(record.created_at) }}
                          </div>
                        </q-item-section>
                        <q-item-section v-if="canRecoverIssuance(record)" side>
                          <q-btn
                            flat
                            dense
                            color="warning"
                            icon="refresh"
                            label="Pulihkan"
                            no-caps
                            @click="refreshIssuance(record)"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>

                    <q-pagination
                      v-if="issuanceHistoryMeta.last_page > 1"
                      class="q-mt-md justify-center"
                      color="warning"
                      :model-value="issuanceHistoryMeta.current_page"
                      :max="issuanceHistoryMeta.last_page"
                      :max-pages="6"
                      :disable="issuanceHistoryLoading"
                      @update:model-value="refreshIssuanceHistory"
                    />
                  </template>
                  <q-banner
                    v-else-if="!issuanceHistoryLoading"
                    rounded
                    class="warning-banner"
                  >
                    Belum ada riwayat penerbitan API key untuk merchant ini.
                  </q-banner>
                </div>
              </q-card-section>
            </template>
          </template>
        </template>

        <q-card-actions align="between" class="q-pa-md bg-grey-1">
          <q-btn
            flat
            color="warning"
            icon="arrow_back"
            label="Kembali ke Daftar Merchant"
            no-caps
            @click="closeDetail"
          />
        </q-card-actions>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Notify, useQuasar } from 'quasar'
import { danaGatewayMerchantService } from '@/services/udev-billing'
import { getApiErrorMessage, getApiValidationErrors } from '@/utils/api-error'
import { useDanaGatewayMerchantStore } from '@/stores/danagatewaymerchant'
import { notificationForApiKeyIssuance } from './dana-api-key-issuance-notification'
import { isSecureFrontendProtocol } from './dana-sandbox-configuration'
import DanaSandboxTesterPanel from './DanaSandboxTesterPanel.vue'

const store = useDanaGatewayMerchantStore()
const $q = useQuasar()
const configurationFormRef = ref(null)
const readiness = ref(null)
const apiKeys = ref([])
const managementLoading = ref(false)
const managementError = ref(null)
const managementLoadedMerchantId = ref(null)
const configurationDialogOpen = ref(false)
const saveConfirmationOpen = ref(false)
const configurationSaving = ref(false)
const configurationError = ref(null)
const configurationErrors = ref({})
const storedConfigurationLoading = ref(false)
const storedConfigurationNotice = ref(null)
const storedSecretStatus = ref(null)
const confirmOverwriteStoredConfig = ref(false)
const showPrivateKey = ref(false)
const showWebhookPublicKey = ref(false)
const revokeConfirmationOpen = ref(false)
const apiKeyToRevoke = ref(null)
const revoking = ref(false)
const revokeError = ref(null)
const issueDialogOpen = ref(false)
const issuing = ref(false)
const issueError = ref(null)
const issuance = ref(null)
const issueIdempotencyKey = ref(null)
const issuanceHistory = ref([])
const issuanceHistoryLoading = ref(false)
const issuanceHistoryError = ref(null)
const issuanceHistoryMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 5,
  total: 0
})

const displayedIssuanceHistory = computed(() => {
  return issuanceHistory.value.length > 5
    ? issuanceHistory.value.slice(0, 5)
    : issuanceHistory.value
})

const issueForm = reactive({
  name: 'UDEV Sandbox Checkout',
  abilities: ['payments:create', 'payments:read'],
  expires_at: null
})
const abilityOptions = [
  { label: 'Buat pembayaran', value: 'payments:create' },
  { label: 'Baca pembayaran', value: 'payments:read' }
]
const merchant = computed(() => store.selectedMerchant)
const activeEnvironmentTab = ref('sandbox')
const isSandbox = computed(() => activeEnvironmentTab.value === 'sandbox')
const isSecureFrontend = computed(() =>
  isSecureFrontendProtocol(globalThis.location?.protocol)
)
const emptyConfiguration = () => ({
  environment: activeEnvironmentTab.value,
  partner_id: '',
  merchant_id: '',
  private_key: '',
  dana_webhook_public_key: '',
  origin: '',
  channel_id: '',
  external_store_id: '',
  sub_merchant_id: '',
  notification_url: '',
  callback_url: '',
  mcc: '',
  enabled: false
})
const configurationForm = reactive(emptyConfiguration())

watch(
  [() => store.detailDialogOpen, () => merchant.value?.merchant_id],
  ([isOpen, merchantId]) => {
    if (!isOpen || !merchantId) {
      managementLoadedMerchantId.value = null
      return
    }
    refreshManagement(true)
  }
)

function onEnvironmentTabChange(tab) {
  activeEnvironmentTab.value = tab
  configurationDialogOpen.value = false
  resetConfigurationForm()
  refreshManagement(true)
}

function closeDetail() {
  store.selectedMerchant = null
  store.detailDialogOpen = false
  resetSensitiveState()
}

function labelFor(value) {
  return value ? value.replaceAll('_', ' ') : 'Tidak diketahui'
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '—'
}
function apiKeyStatus(apiKey) {
  const status = String(apiKey.status || '').toLowerCase()
  if (status === 'pending') return { label: 'Pending', color: 'warning' }
  if (status === 'expired') return { label: 'Kadaluarsa', color: 'grey-7' }
  if (status === 'cancelled') return { label: 'Dibatalkan', color: 'negative' }
  if (apiKey.revoked_at) return { label: 'Dicabut', color: 'negative' }
  if (apiKey.expires_at && new Date(apiKey.expires_at) <= new Date())
    return { label: 'Kadaluarsa', color: 'grey-7' }
  if (apiKey.is_active !== true)
    return { label: 'Tidak aktif', color: 'grey-7' }
  return { label: 'Aktif', color: 'positive' }
}
function canRevoke(apiKey) {
  return apiKeyStatus(apiKey).label === 'Aktif'
}
function issuanceStatusColor(status) {
  if (status === 'active') return 'positive'
  if (['expired', 'cancelled'].includes(status)) return 'grey-7'
  if (status === 'manual_review') return 'negative'
  return 'warning'
}
function canRecoverIssuance(record) {
  return [
    'pending',
    'cancel_pending',
    'confirmation_pending',
    'manual_review'
  ].includes(record.status)
}
function managementErrorMessage(error) {
  const status = error?.response?.status
  if (status === 429) {
    const retryAfter = error.response?.headers?.['retry-after']
    return retryAfter
      ? `Terlalu banyak permintaan status. Tunggu sekitar ${retryAfter} detik lalu refresh manual.`
      : 'Terlalu banyak permintaan status. Tunggu sebentar lalu refresh manual.'
  }
  if (status === 502) {
    return 'DANA Gateway atau proxy internal mengembalikan 502. Tidak ada retry otomatis; periksa audit gateway atau log proxy.'
  }

  return getApiErrorMessage(error)
}
async function refreshManagement(force = false) {
  const merchantId = merchant.value?.merchant_id
  if (
    !merchantId ||
    managementLoading.value ||
    (!force && managementLoadedMerchantId.value === merchantId)
  )
    return

  managementLoading.value = true
  managementError.value = null
  try {
    const [readinessResponse, apiKeysResponse, issuanceResponse] =
      await Promise.all([
        danaGatewayMerchantService.readiness(
          merchantId,
          activeEnvironmentTab.value
        ),
        danaGatewayMerchantService.apiKeys(merchantId),
        danaGatewayMerchantService.issuances(merchantId, {
          per_page: 5
        })
      ])
    readiness.value = readinessResponse.data?.data ?? null
    apiKeys.value = apiKeysResponse.data?.data ?? []
    issuanceHistory.value = issuanceResponse.data?.data ?? []
    issuanceHistoryMeta.value =
      issuanceResponse.data?.meta ?? issuanceHistoryMeta.value
    issuanceHistoryError.value = null
    managementLoadedMerchantId.value = merchantId
  } catch (error) {
    readiness.value = null
    apiKeys.value = []
    issuanceHistory.value = []
    managementError.value = managementErrorMessage(error)
  } finally {
    managementLoading.value = false
  }
}
function toggleConfigurationPanel() {
  if (configurationDialogOpen.value) {
    configurationDialogOpen.value = false
  } else {
    resetConfigurationForm()
    configurationDialogOpen.value = true
  }
}
function resetConfigurationForm() {
  Object.assign(configurationForm, emptyConfiguration())
  configurationErrors.value = {}
  configurationError.value = null
  storedConfigurationNotice.value = null
  storedSecretStatus.value = null
  confirmOverwriteStoredConfig.value = false
  showPrivateKey.value = false
  showWebhookPublicKey.value = false
  saveConfirmationOpen.value = false
}
function clearSensitiveFields() {
  configurationForm.merchant_id = ''
  configurationForm.private_key = ''
  configurationForm.dana_webhook_public_key = ''
  showPrivateKey.value = false
  showWebhookPublicKey.value = false
}
function hasManualConfigurationChanges() {
  return Object.entries(configurationForm).some(([field, value]) => {
    if (field === 'environment') return false
    if (typeof value === 'boolean') return value

    return Boolean(value)
  })
}
function applyStoredConfiguration(response) {
  const values = response?.configuration
  if (!response?.configuration_exists || !values) {
    storedSecretStatus.value = null
    storedConfigurationNotice.value = `Konfigurasi DANA ${activeEnvironmentTab.value === 'production' ? 'Production' : 'Sandbox'} tersimpan belum ditemukan untuk merchant ini. Silakan lengkapi konfigurasi secara manual.`
    return
  }

  const fields = [
    'partner_id',
    'merchant_id',
    'origin',
    'channel_id',
    'external_store_id',
    'sub_merchant_id',
    'notification_url',
    'callback_url',
    'mcc'
  ]
  const filled = []
  const missing = []
  for (const field of fields) {
    if (typeof values[field] === 'string' && values[field] !== '') {
      configurationForm[field] = values[field]
      filled.push(field)
    } else {
      missing.push(field)
    }
  }
  configurationForm.environment = activeEnvironmentTab.value
  configurationForm.enabled = values.enabled === true
  configurationForm.private_key = ''
  configurationForm.dana_webhook_public_key = ''
  storedSecretStatus.value = {
    private_key: values.private_key_configured === true,
    webhook_public_key: values.dana_webhook_public_key_configured === true
  }

  const labels = {
    partner_id: 'Partner ID',
    merchant_id: 'Merchant ID DANA',
    origin: 'Origin',
    channel_id: 'Channel ID',
    external_store_id: 'External Store ID Sandbox',
    sub_merchant_id: 'Sub Merchant ID Sandbox',
    notification_url: 'Notification URL',
    callback_url: 'Callback URL',
    mcc: 'MCC'
  }
  const filledText =
    filled.map(field => labels[field]).join(', ') || 'tidak ada'
  const missingText =
    missing.map(field => labels[field]).join(', ') || 'tidak ada'
  storedConfigurationNotice.value = `Field terisi: ${filledText}. Field yang masih perlu dilengkapi: ${missingText}.`
}
async function executeLoadStoredConfiguration() {
  confirmOverwriteStoredConfig.value = false
  storedConfigurationLoading.value = true
  storedConfigurationNotice.value = null
  configurationError.value = null
  try {
    const response = await danaGatewayMerchantService.storedDanaConfiguration(
      merchant.value.merchant_id,
      activeEnvironmentTab.value
    )
    applyStoredConfiguration(response.data?.data ?? null)
  } catch (error) {
    storedConfigurationNotice.value = getApiErrorMessage(error)
  } finally {
    storedConfigurationLoading.value = false
  }
}
async function loadStoredConfiguration() {
  if (!merchant.value || storedConfigurationLoading.value) return

  if (hasManualConfigurationChanges()) {
    confirmOverwriteStoredConfig.value = true
    return
  }

  await executeLoadStoredConfiguration()
}
function resetSensitiveState() {
  resetConfigurationForm()
  readiness.value = null
  apiKeys.value = []
  managementError.value = null
  managementLoadedMerchantId.value = null
  closeRevokeDialog()
  issuance.value = null
  issueIdempotencyKey.value = null
  issuanceHistory.value = []
  issuanceHistoryError.value = null
  issuanceHistoryMeta.value = {
    current_page: 1,
    last_page: 1,
    per_page: 5,
    total: 0
  }
}
function openIssueDialog() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    Notify.create({
      type: 'negative',
      message: 'Browser tidak mendukung pembuatan identitas tindakan yang aman.'
    })
    return
  }

  issueError.value = null
  issueForm.name = `UDEV ${activeEnvironmentTab.value === 'production' ? 'Production' : 'Sandbox'} Checkout`
  issueIdempotencyKey.value = globalThis.crypto.randomUUID()
  issueDialogOpen.value = true
}
async function issueApiKey() {
  if (!merchant.value || issuing.value) return
  issueError.value = null

  if (!issueIdempotencyKey.value) {
    issueError.value =
      'Identitas tindakan penerbitan tidak tersedia. Tutup lalu buka kembali dialog penerbitan.'
    return
  }

  issuing.value = true
  try {
    const response = await danaGatewayMerchantService.issueApiKey(
      merchant.value.merchant_id,
      {
        environment: activeEnvironmentTab.value,
        name: issueForm.name,
        abilities: issueForm.abilities,
        expires_at: issueForm.expires_at || null
      },
      issueIdempotencyKey.value
    )
    issuance.value = response.data?.data ?? null
    issueDialogOpen.value = false
    Notify.create(
      notificationForApiKeyIssuance(
        issuance.value?.status,
        labelFor(issuance.value?.status)
      )
    )
    await refreshManagement(true)
  } catch (error) {
    issueError.value = getApiErrorMessage(error)
  } finally {
    issuing.value = false
  }
}
async function refreshIssuance(record = issuance.value) {
  if (!merchant.value || !record?.id) return
  try {
    const response = await danaGatewayMerchantService.issuanceStatus(
      merchant.value.merchant_id,
      record.id
    )
    issuance.value = response.data?.data ?? record
    await refreshIssuanceHistory()
  } catch (error) {
    managementError.value = getApiErrorMessage(error)
  }
}
async function refreshIssuanceHistory(
  page = issuanceHistoryMeta.value.current_page
) {
  if (!merchant.value || issuanceHistoryLoading.value) return
  issuanceHistoryLoading.value = true
  issuanceHistoryError.value = null
  try {
    const response = await danaGatewayMerchantService.issuances(
      merchant.value.merchant_id,
      { page, per_page: 5 }
    )
    issuanceHistory.value = response.data?.data ?? []
    issuanceHistoryMeta.value = response.data?.meta ?? issuanceHistoryMeta.value
  } catch (error) {
    issuanceHistoryError.value = getApiErrorMessage(error)
  } finally {
    issuanceHistoryLoading.value = false
  }
}
async function cancelIssuance() {
  if (!merchant.value || !issuance.value?.id) return
  try {
    const response = await danaGatewayMerchantService.cancelIssuance(
      merchant.value.merchant_id,
      issuance.value.id
    )
    issuance.value = response.data?.data ?? issuance.value
  } catch (error) {
    managementError.value = getApiErrorMessage(error)
  }
}
function firstError(field) {
  return configurationErrors.value[field]?.[0] || ''
}
function requiredRule(value) {
  return Boolean(value?.trim?.()) || 'Field ini wajib diisi.'
}
function maxRule(maximum) {
  return value => value.length <= maximum || `Maksimal ${maximum} karakter.`
}
function httpsUrlRule(value) {
  return /^https:\/\/.+/i.test(value) || 'Harus berupa URL HTTPS.'
}
function optionalKeyMaterialRule(value) {
  return (
    !value ||
    typeof value === 'string' ||
    'Masukkan key sebagai teks dari Portal DANA.'
  )
}
async function askToSaveConfiguration() {
  if (await configurationFormRef.value?.validate())
    saveConfirmationOpen.value = true
}
async function saveConfiguration() {
  if (!merchant.value || configurationSaving.value) return
  saveConfirmationOpen.value = false
  configurationSaving.value = true
  configurationError.value = null
  configurationErrors.value = {}
  const payload = {
    ...configurationForm,
    environment: activeEnvironmentTab.value
  }
  if (!payload.private_key) delete payload.private_key
  if (!payload.dana_webhook_public_key) delete payload.dana_webhook_public_key
  try {
    await danaGatewayMerchantService.configureSandbox(
      merchant.value.merchant_id,
      payload
    )
    configurationDialogOpen.value = false
    Notify.create({
      message: `Konfigurasi DANA ${activeEnvironmentTab.value === 'production' ? 'Production' : 'Sandbox'} tersimpan. Credential tidak ditampilkan kembali.`,
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
      timeout: 5000
    })
    await refreshManagement(true)
  } catch (error) {
    configurationErrors.value = getApiValidationErrors(error)
    configurationError.value = getApiErrorMessage(error)
  } finally {
    clearSensitiveFields()
    configurationSaving.value = false
  }
}
function askToRevoke(apiKey) {
  apiKeyToRevoke.value = apiKey
  revokeError.value = null
  revokeConfirmationOpen.value = true
}
function closeRevokeDialog() {
  revokeConfirmationOpen.value = false
  apiKeyToRevoke.value = null
  revokeError.value = null
}
async function revokeApiKey() {
  if (!merchant.value || !apiKeyToRevoke.value || revoking.value) return
  revoking.value = true
  revokeError.value = null
  try {
    await danaGatewayMerchantService.revokeApiKey(
      merchant.value.merchant_id,
      apiKeyToRevoke.value.id
    )
    closeRevokeDialog()
    Notify.create({
      message: 'API key berhasil dicabut.',
      color: 'positive',
      icon: 'check_circle',
      position: 'top'
    })
    await refreshManagement()
  } catch (error) {
    revokeError.value = getApiErrorMessage(error)
  } finally {
    revoking.value = false
  }
}
</script>

<style scoped>
.merchant-detail-view {
  max-width: 100%;
}
.detail-card {
  border-radius: 14px;
}
.detail-card__header {
  background: #fff;
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
h2,
h3 {
  margin: 0;
  color: #20180b;
}
h2 {
  font-size: 1.15rem;
}
h3 {
  font-size: 1rem;
}
.detail-row,
.readiness-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  font-size: 0.9rem;
}
.detail-row span,
.readiness-item span,
.section-description {
  color: #746b5c;
}
.detail-row strong {
  overflow-wrap: anywhere;
  text-align: right;
}
.section-description {
  margin: 4px 0 0;
  font-size: 0.82rem;
}
.readiness-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.readiness-item {
  min-height: 48px;
  padding: 10px;
  border: 1px solid #e8dfcf;
  border-radius: 8px;
}
.warning-banner {
  border: 1px solid #e4c56c;
  background: #fff8dc;
  color: #5d4710;
  font-size: 0.82rem;
}
.production-policy-banner {
  border: 1px solid #94d3a2;
  background: #f0fdf4;
  color: #166534;
  font-size: 0.84rem;
  line-height: 1.45;
}
.transport-notice {
  border: 1px solid #cbb57c;
  background: #fff9e6;
  color: #5d4710;
  font-size: 0.84rem;
  line-height: 1.45;
}
.error-banner {
  border: 1px solid #e8b4ad;
  background: #fff2f0;
  color: #9f2419;
}
.configuration-panel {
  border-radius: 12px;
  border: 1px solid #ebd18d;
}
.confirmation-card {
  border-radius: 12px;
}
.issuance-history {
  position: relative;
  min-height: 72px;
}
.issuance-history-list {
  border-radius: 10px;
}
.api-key-metadata-table :deep(table) {
  width: 100%;
  table-layout: fixed;
}
.api-key-metadata-table :deep(th),
.api-key-metadata-table :deep(td) {
  overflow-wrap: anywhere;
  white-space: normal;
}
.api-key-metadata-table :deep(th:nth-child(1)) {
  width: 8%;
}
.api-key-metadata-table :deep(th:nth-child(2)) {
  width: 20%;
}
.api-key-metadata-table :deep(th:nth-child(3)) {
  width: 13%;
}
.api-key-metadata-table :deep(th:nth-child(4)) {
  width: 18%;
}
.api-key-metadata-table :deep(th:nth-child(5)) {
  width: 20%;
}
.api-key-metadata-table :deep(th:nth-child(6)) {
  width: 21%;
}
.issuance-card-details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 12px;
  font-size: 0.82rem;
}
.issuance-card-details span {
  color: #746b5c;
}
.issuance-card-details strong {
  text-align: right;
}
:deep(.masked-sensitive-input) {
  -webkit-text-security: disc;
  text-security: disc;
}
@media (max-width: 599px) {
  .readiness-grid {
    grid-template-columns: 1fr;
  }
  .detail-row,
  .readiness-item {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
