<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Referral & Komisi" />

      <!-- Page Header -->
      <div class="row items-center justify-between q-mt-md q-mb-md">
        <div>
          <p class="eyebrow">PROGRAM KEMITRAAN UDEV</p>
          <h1>Referral & Komisi</h1>
          <p class="page-description">
            Kelola kode referral, pantau warung referral, dan pantau riwayat
            komisi mitra otomatis.
          </p>
        </div>
        <div v-if="store.activeTab === 'kode'">
          <q-btn
            color="warning"
            text-color="dark"
            icon="add"
            label="Buat kode referral"
            no-caps
            class="text-weight-bold"
            @click="store.openCreate"
          />
        </div>
      </div>

      <!-- Navigation Tabs -->
      <q-tabs
        v-model="store.activeTab"
        dense
        align="left"
        active-color="warning"
        indicator-color="warning"
        class="referral-nav-tabs q-mb-lg text-grey-7"
        no-caps
      >
        <q-tab name="summary" icon="dashboard" label="Ringkasan Komisi" />
        <q-tab name="commissions" icon="receipt_long" label="Riwayat Komisi" />
        <q-tab name="warung" icon="storefront" label="Warung Referral" />
        <q-tab name="kode" icon="sell" label="Kode Referral" />
      </q-tabs>

      <!-- TAB 1: RINGKASAN KOMISI -->
      <div v-if="store.activeTab === 'summary'">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <StatCard
              label="Total Mitra Aktif"
              :value="String(store.summary?.total_partners ?? '—')"
              caption="Mitra mandiri terdaftar"
              icon="handshake"
              color="blue-8"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <StatCard
              label="Warung Referral"
              :value="String(store.summary?.total_referred_warungs ?? '—')"
              caption="Terkunci kode referral"
              icon="storefront"
              color="teal-8"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <StatCard
              label="Total Transaksi Komisi"
              :value="String(store.summary?.total_commissions_count ?? '—')"
              caption="Pembayaran tervalidasi"
              icon="payments"
              color="indigo-8"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <StatCard
              label="Total Penghasilan"
              :value="money(store.summary?.total_earnings)"
              caption="Gross komisi tercatat"
              icon="monetization_on"
              color="warning"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <StatCard
              label="Saldo Tersedia"
              :value="money(store.summary?.total_available_balance)"
              caption="Siap ditarik mitra"
              icon="account_balance_wallet"
              color="positive"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <StatCard
              label="Saldo Tertahan"
              :value="money(store.summary?.total_pending_balance)"
              caption="Masa retensi / hold"
              icon="schedule"
              color="purple-8"
            />
          </div>
        </div>

        <!-- Recent Activity Card List -->
        <q-card flat bordered class="recent-commissions-card q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="row items-center q-gutter-sm">
              <q-icon name="history" size="22px" color="warning" />
              <div class="text-subtitle1 text-weight-bold text-sand"
                >10 Aktivitas Komisi Terakhir</div
              >
            </div>
            <q-btn
              flat
              dense
              no-caps
              color="warning"
              label="Lihat Semua Riwayat"
              icon-right="arrow_forward"
              @click="store.activeTab = 'commissions'"
            />
          </div>

          <div v-if="store.summaryLoading" class="text-center q-pa-lg">
            <q-spinner color="warning" size="32px" />
          </div>

          <div
            v-else-if="!store.recentCommissions.length"
            class="empty-state text-center q-pa-xl text-muted"
          >
            Belum ada catatan komisi referral yang tervalidasi.
          </div>

          <div v-else class="recent-list q-gutter-y-sm">
            <q-card
              v-for="comm in store.recentCommissions"
              :key="comm.id"
              flat
              bordered
              class="commission-item-card"
            >
              <div
                class="row items-center justify-between q-pa-sm card-header-bar"
              >
                <div class="row items-center q-gutter-xs">
                  <q-badge
                    color="dark"
                    text-color="amber-3"
                    class="text-weight-bold"
                  >
                    #{{ comm.invoice?.invoice_number || 'INVOICE' }}
                  </q-badge>
                  <span class="text-caption text-grey-4 q-ml-xs">
                    {{ date(comm.verified_at) }}
                  </span>
                </div>
                <q-badge
                  rounded
                  :color="
                    comm.status === 'available'
                      ? 'positive'
                      : comm.status === 'reversed'
                        ? 'negative'
                        : 'warning'
                  "
                  :label="
                    comm.status === 'available'
                      ? 'Tersedia'
                      : comm.status === 'reversed'
                        ? 'Dibalikkan'
                        : 'Tertahan'
                  "
                  class="text-weight-bold"
                />
              </div>

              <div class="row items-center justify-between q-pa-md">
                <div>
                  <div class="text-weight-bold text-sand">
                    {{ comm.warung?.name || 'Warung' }}
                    <span class="text-caption text-muted"
                      >({{ comm.warung?.application_name || 'Aplikasi' }})</span
                    >
                  </div>
                  <div class="text-caption text-muted q-mt-xs">
                    Mitra:
                    <strong class="text-warning">{{
                      comm.partner?.name || '—'
                    }}</strong>
                    · Kode:
                    <code>{{
                      comm.referral_code?.code ||
                      comm.warung?.referral_code ||
                      '—'
                    }}</code>
                  </div>
                  <div
                    v-if="comm.notes"
                    class="text-caption text-grey-6 q-mt-xs"
                  >
                    {{ comm.notes }}
                  </div>
                </div>

                <div class="text-right">
                  <q-badge
                    rounded
                    :color="
                      comm.commission_type === 'pembayaran_pertama'
                        ? 'teal-9'
                        : comm.commission_type === 'reversal'
                          ? 'red-9'
                          : 'blue-9'
                    "
                    :label="
                      comm.commission_type === 'pembayaran_pertama'
                        ? 'Pembayaran Pertama'
                        : comm.commission_type === 'reversal'
                          ? 'Reversal / Refund'
                          : 'Perpanjangan'
                    "
                    class="text-weight-bold q-mb-xs"
                  />
                  <div
                    class="text-h6 text-weight-bold"
                    :class="
                      Number(comm.amount) < 0
                        ? 'text-negative'
                        : 'text-positive'
                    "
                  >
                    {{ Number(comm.amount) < 0 ? '-' : '+'
                    }}{{ money(Math.abs(Number(comm.amount))) }}
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </q-card>
      </div>

      <!-- TAB 2: RIWAYAT KOMISI (CARD LIST + INFINITE SCROLL) -->
      <div v-if="store.activeTab === 'commissions'">
        <FilterPanel class="q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="store.commissionFilter.search"
              outlined
              dense
              clearable
              debounce="300"
              placeholder="Cari warung, mitra, invoice..."
              bg-color="white"
              @update:model-value="() => store.fetchCommissions(true)"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="store.commissionFilter.commission_type"
              outlined
              dense
              clearable
              emit-value
              map-options
              placeholder="Semua Tipe Komisi"
              :options="[
                { label: 'Semua Tipe Komisi', value: null },
                {
                  label: 'Pembayaran Pertama (Rp50.000)',
                  value: 'pembayaran_pertama'
                },
                { label: 'Perpanjangan (Rp7.500)', value: 'perpanjangan' },
                { label: 'Reversal / Refund', value: 'reversal' }
              ]"
              bg-color="white"
              @update:model-value="() => store.fetchCommissions(true)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-select
              v-model="store.commissionFilter.status"
              outlined
              dense
              clearable
              emit-value
              map-options
              placeholder="Semua Status"
              :options="[
                { label: 'Semua Status', value: null },
                { label: 'Tersedia', value: 'available' },
                { label: 'Tertahan', value: 'held' },
                { label: 'Dibalikkan', value: 'reversed' }
              ]"
              bg-color="white"
              @update:model-value="() => store.fetchCommissions(true)"
            />
          </div>
          <div class="col-12 col-md-3 row items-center justify-end q-gutter-sm">
            <q-btn
              flat
              dense
              color="warning"
              icon="refresh"
              label="Segarkan"
              no-caps
              :loading="store.commissionsLoading"
              @click="() => store.fetchCommissions(true)"
            />
          </div>
        </FilterPanel>

        <!-- Empty State -->
        <div
          v-if="!store.commissionsLoading && !store.commissions.length"
          class="empty-state-box q-pa-xl text-center"
        >
          <q-icon
            name="receipt_long"
            size="48px"
            color="grey-6"
            class="q-mb-sm"
          />
          <div class="text-h6 text-sand text-weight-bold"
            >Belum Ada Riwayat Komisi</div
          >
          <div class="text-caption text-muted">
            Riwayat komisi tercatat otomatis ketika invoice settlement
            tervalidasi.
          </div>
        </div>

        <!-- Commissions Card List with Infinite Scroll -->
        <div v-else class="commissions-card-list">
          <q-infinite-scroll
            :offset="250"
            :disable="!store.commissionsHasMore || store.commissionsLoading"
            @load="store.loadMoreCommissions"
          >
            <q-card
              v-for="item in store.commissions"
              :key="item.id"
              flat
              bordered
              class="commission-item-card q-mb-md"
            >
              <!-- Card Header Bar: Black & Gold -->
              <div
                class="card-header-bar q-px-md q-py-sm row items-center justify-between"
              >
                <div class="row items-center q-gutter-xs">
                  <q-badge
                    color="dark"
                    text-color="amber-3"
                    class="text-weight-bold q-px-sm"
                  >
                    #{{ item.invoice?.invoice_number || 'INV' }}
                  </q-badge>
                  <span class="text-caption text-grey-4 q-ml-sm">
                    Terverifikasi: {{ date(item.verified_at) }}
                  </span>
                </div>

                <div class="row items-center q-gutter-xs">
                  <q-badge
                    rounded
                    :color="
                      item.status === 'available'
                        ? 'positive'
                        : item.status === 'reversed'
                          ? 'negative'
                          : 'warning'
                    "
                    :label="
                      item.status === 'available'
                        ? 'Tersedia'
                        : item.status === 'reversed'
                          ? 'Dibalikkan'
                          : 'Tertahan'
                    "
                    class="text-weight-bold q-px-sm"
                  />
                </div>
              </div>

              <!-- Card Body -->
              <div class="q-pa-md row items-center justify-between">
                <div class="col-12 col-md-7">
                  <div class="text-subtitle1 text-weight-bold text-sand">
                    {{ item.warung?.name || 'Warung Referral' }}
                    <q-badge outline color="warning" class="q-ml-xs">
                      {{ item.warung?.application_name || 'Aplikasi' }}
                    </q-badge>
                  </div>
                  <div class="text-caption text-muted q-mt-xs">
                    Mitra:
                    <strong class="text-warning">{{
                      item.partner?.name || '—'
                    }}</strong>
                    · Kode:
                    <code>{{
                      item.referral_code?.code ||
                      item.warung?.referral_code ||
                      '—'
                    }}</code>
                    · Pemilik: {{ item.warung?.owner_name || '—' }} ({{
                      item.warung?.phone_number || '—'
                    }})
                  </div>
                  <div
                    v-if="item.notes"
                    class="text-caption text-grey-6 q-mt-xs"
                  >
                    Catatan: {{ item.notes }}
                  </div>
                  <div
                    v-if="item.reversal"
                    class="reversal-info-banner q-pa-xs q-mt-xs text-caption text-negative"
                  >
                    <q-icon name="warning" size="14px" class="q-mr-xs" />
                    Dibalikkan: "{{ item.reversal.notes }}" pada
                    {{ date(item.reversal.created_at) }}
                  </div>
                </div>

                <div
                  class="col-12 col-md-5 row items-center justify-end q-gutter-md q-mt-sm q-mt-md-none text-right"
                >
                  <div>
                    <q-badge
                      rounded
                      :color="
                        item.commission_type === 'pembayaran_pertama'
                          ? 'teal-9'
                          : item.commission_type === 'reversal'
                            ? 'red-9'
                            : 'blue-9'
                      "
                      :label="
                        item.commission_type === 'pembayaran_pertama'
                          ? 'Pembayaran Pertama'
                          : item.commission_type === 'reversal'
                            ? 'Reversal / Refund'
                            : 'Perpanjangan'
                      "
                      class="text-weight-bold q-mb-xs"
                    />
                    <div
                      class="text-h6 text-weight-bold"
                      :class="
                        Number(item.amount) < 0
                          ? 'text-negative'
                          : 'text-positive'
                      "
                    >
                      {{ Number(item.amount) < 0 ? '-' : '+'
                      }}{{ money(Math.abs(Number(item.amount))) }}
                    </div>
                  </div>

                  <!-- Reversal Action Button -->
                  <div
                    v-if="
                      item.status !== 'reversed' &&
                      item.commission_type !== 'reversal'
                    "
                  >
                    <q-btn
                      outline
                      dense
                      no-caps
                      size="sm"
                      color="negative"
                      icon="undo"
                      label="Balikkan"
                      class="q-px-sm"
                      @click="store.openReversalDialog(item)"
                    />
                  </div>
                </div>
              </div>
            </q-card>

            <template #loading>
              <div class="row justify-center q-my-md">
                <q-spinner color="warning" size="32px" />
              </div>
            </template>
          </q-infinite-scroll>
        </div>
      </div>

      <!-- TAB 3: WARUNG REFERRAL (CARD LIST + INFINITE SCROLL) -->
      <div v-if="store.activeTab === 'warung'">
        <FilterPanel class="q-mb-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="store.warungFilter.search"
              outlined
              dense
              clearable
              debounce="300"
              placeholder="Cari nama warung, pemilik, HP, mitra, kode..."
              bg-color="white"
              @update:model-value="() => store.fetchWarungs(true)"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6 row items-center justify-end q-gutter-sm">
            <q-btn
              flat
              dense
              color="warning"
              icon="refresh"
              label="Segarkan"
              no-caps
              :loading="store.warungsLoading"
              @click="() => store.fetchWarungs(true)"
            />
          </div>
        </FilterPanel>

        <!-- Empty State -->
        <div
          v-if="!store.warungsLoading && !store.warungs.length"
          class="empty-state-box q-pa-xl text-center"
        >
          <q-icon
            name="storefront"
            size="48px"
            color="grey-6"
            class="q-mb-sm"
          />
          <div class="text-h6 text-sand text-weight-bold"
            >Belum Ada Warung Referral</div
          >
          <div class="text-caption text-muted">
            Warung akan muncul di sini saat kode referral pertama kali digunakan
            oleh pelanggan.
          </div>
        </div>

        <!-- Warung Card List with Infinite Scroll -->
        <div v-else class="warungs-card-list">
          <q-infinite-scroll
            :offset="250"
            :disable="!store.warungsHasMore || store.warungsLoading"
            @load="store.loadMoreWarungs"
          >
            <q-card
              v-for="warung in store.warungs"
              :key="warung.id"
              flat
              bordered
              class="warung-item-card q-mb-md"
            >
              <!-- Card Header Bar: Black & Gold -->
              <div
                class="card-header-bar q-px-md q-py-sm row items-center justify-between"
              >
                <div class="row items-center q-gutter-xs">
                  <q-icon name="storefront" size="18px" color="amber-3" />
                  <span class="text-weight-bold text-sand q-ml-xs">
                    {{ warung.warung_name || 'Pelanggan' }}
                  </span>
                  <q-badge outline color="warning" class="q-ml-sm">
                    {{ warung.application_name || 'Aplikasi' }}
                  </q-badge>
                </div>

                <div class="row items-center q-gutter-xs">
                  <span class="text-caption text-grey-4">
                    Terkunci sejak: {{ date(warung.locked_at) }}
                  </span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="q-pa-md row items-center justify-between">
                <div class="col-12 col-md-7">
                  <div class="text-caption text-muted">
                    Pemilik:
                    <strong class="text-sand">{{
                      warung.owner_name || '—'
                    }}</strong>
                    · HP: {{ warung.phone_number || '—' }} · Email:
                    {{ warung.email || '—' }}
                  </div>
                  <div class="text-caption text-muted q-mt-xs">
                    Mitra Perujuk:
                    <strong class="text-warning">{{
                      warung.partner_name || '—'
                    }}</strong>
                    · Kode Referral:
                    <code>{{ warung.referral_code }}</code> (Tipe:
                    {{ warung.referral_type }})
                  </div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    Harga Pelanggan:
                    <strong>{{ money(warung.customer_price) }}</strong> (Diskon
                    {{ money(warung.discount_amount) }})
                  </div>
                </div>

                <div
                  class="col-12 col-md-5 row items-center justify-end q-gutter-md q-mt-sm q-mt-md-none text-right"
                >
                  <div>
                    <div class="text-caption text-muted"
                      >Total Pembayaran Berhasil</div
                    >
                    <q-badge
                      color="dark"
                      text-color="amber-3"
                      class="text-weight-bold text-subtitle2 q-px-sm"
                    >
                      {{ warung.payments_count }}x Bayar
                    </q-badge>
                  </div>
                  <div>
                    <div class="text-caption text-muted"
                      >Total Komisi Dihasilkan</div
                    >
                    <div class="text-h6 text-weight-bold text-positive">
                      {{ money(warung.commissions_total) }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card>

            <template #loading>
              <div class="row justify-center q-my-md">
                <q-spinner color="warning" size="32px" />
              </div>
            </template>
          </q-infinite-scroll>
        </div>
      </div>

      <!-- TAB 4: KODE REFERRAL (EXISTING) -->
      <div v-if="store.activeTab === 'kode'">
        <FilterPanel class="q-mb-md">
          <div class="col-12 col-md-5">
            <q-input
              v-model="store.search"
              outlined
              dense
              clearable
              debounce="250"
              label="Cari kode referral"
              bg-color="white"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="store.type"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Jenis"
              :options="typeOptions"
              bg-color="white"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="store.status"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Status"
              :options="statusOptions"
              bg-color="white"
            />
          </div>
        </FilterPanel>

        <ErrorState
          v-if="store.error"
          :message="store.error"
          @retry="store.fetch"
        />

        <q-table
          v-else
          flat
          bordered
          row-key="id"
          :rows="store.items"
          :columns="columns"
          :loading="store.loading"
          :pagination="store.pagination"
          :rows-per-page-options="[15, 30, 50]"
          @request="request"
        >
          <template #body-cell-code="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-xs">
                <code>{{ props.row.code }}</code>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="content_copy"
                  @click="copy(props.row.code)"
                />
              </div>
            </q-td>
          </template>
          <template #body-cell-price="props">
            <q-td :props="props">
              {{ money(props.row.customer_price) }}
              <div class="caption">
                Diskon {{ money(props.row.discount_amount) }}
              </div>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.is_active ? 'positive' : 'grey-7'"
                :label="props.row.is_active ? 'Aktif' : 'Tidak aktif'"
              />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                @click="store.openDetail(props.row)"
              />
              <q-btn
                flat
                round
                dense
                :icon="props.row.is_active ? 'block' : 'check_circle'"
                :color="props.row.is_active ? 'negative' : 'positive'"
                @click="confirmStatus(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>

      <!-- Dialog Buat Kode Referral -->
      <q-dialog v-model="store.formOpen">
        <q-card class="dialog">
          <q-form @submit.prevent="store.save">
            <q-card-section>
              <p class="eyebrow">REFERRAL BARU</p>
              <h2>Buat kode referral</h2>
            </q-card-section>
            <q-card-section class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="store.form.partner_id"
                  outlined
                  dense
                  emit-value
                  map-options
                  option-label="name"
                  option-value="id"
                  label="Mitra *"
                  :options="store.partners"
                  :error="hasError('partner_id')"
                  :error-message="errorFor('partner_id')"
                />
              </div>
              <div class="col-12">
                <q-banner rounded class="automatic-code-banner">
                  Kode referral akan dibuat otomatis oleh sistem setelah
                  disimpan.
                </q-banner>
              </div>
              <div class="col-12">
                <q-select
                  v-model="store.form.type"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Jenis kode *"
                  :options="typeOptions"
                  :error="hasError('type')"
                  :error-message="errorFor('type')"
                />
              </div>
              <div class="col-12">
                <q-banner rounded class="price-banner">
                  {{ priceText }} per 30 hari. Harga dasar Rp175.000.
                </q-banner>
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="store.form.is_active"
                  color="warning"
                  label="Kode aktif"
                />
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat no-caps label="Batal" v-close-popup />
              <q-btn
                color="warning"
                text-color="dark"
                no-caps
                type="submit"
                :loading="store.saving"
                label="Buat kode"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <!-- Dialog Salin Kode Baru -->
      <q-dialog v-model="store.createdCodeOpen" persistent>
        <q-card class="created-code-dialog">
          <q-card-section>
            <p class="eyebrow">KODE BERHASIL DIBUAT</p>
            <h2>Simpan kode referral ini</h2>
            <p class="created-code-note">
              Bagikan kode ini kepada mitra. Kode juga tersedia pada daftar
              referral.
            </p>
          </q-card-section>
          <q-card-section class="row items-center no-wrap q-gutter-sm">
            <code class="created-code">{{ store.createdCode }}</code>
            <q-btn
              color="warning"
              text-color="dark"
              no-caps
              icon="content_copy"
              label="Salin kode"
              @click="copy(store.createdCode)"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              no-caps
              label="Selesai"
              @click="store.createdCodeOpen = false"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Dialog Detail Referral & Usages -->
      <q-dialog v-model="store.detailOpen">
        <q-card class="dialog">
          <q-card-section class="row justify-between">
            <div>
              <p class="eyebrow">DETAIL REFERRAL</p>
              <h2>{{ store.detail?.code || 'Memuat...' }}</h2>
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>
          <q-card-section v-if="store.detail">
            <div class="detail-grid">
              <span>Mitra</span><strong>{{ store.detail.partner_name }}</strong>
              <span>Jenis</span
              ><strong class="text-capitalize">{{ store.detail.type }}</strong>
              <span>Harga dasar</span
              ><strong>{{ money(store.detail.base_price) }}</strong>
              <span>Diskon</span
              ><strong>{{ money(store.detail.discount_amount) }}</strong>
              <span>Harga pelanggan</span
              ><strong>{{ money(store.detail.customer_price) }}</strong>
              <span>Penggunaan</span
              ><strong>{{ store.detail.usages_count || 0 }}</strong>
            </div>
            <q-separator class="q-my-md" />
            <div class="text-weight-bold q-mb-sm">Riwayat penggunaan</div>
            <q-list bordered separator>
              <q-item v-for="usage in store.usages" :key="usage.id">
                <q-item-section>
                  <q-item-label>
                    {{ usage.customer_name || 'Pelanggan' }} ·
                    {{ usage.application_name || 'Aplikasi' }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ money(usage.customer_price) }} dikunci
                    {{ date(usage.locked_at) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="!store.usages.length">
                <q-item-section
                  >Belum ada pelanggan yang memakai kode ini.</q-item-section
                >
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Dialog Reversal Komisi -->
      <q-dialog v-model="store.reversalDialog.open">
        <q-card class="dialog">
          <q-card-section>
            <p class="eyebrow text-negative">REVERSAL KOMISI REFERRAL</p>
            <h2>Balikkan Komisi</h2>
            <p class="caption">
              Tindakan ini akan membuat entri ledger reversal immutable dan
              memperbarui saldo mitra tanpa menghapus histori.
            </p>
          </q-card-section>
          <q-card-section v-if="store.reversalDialog.ledger">
            <div class="detail-grid q-mb-md">
              <span>Invoice</span>
              <strong
                >#{{
                  store.reversalDialog.ledger.invoice?.invoice_number
                }}</strong
              >
              <span>Warung</span>
              <strong>{{ store.reversalDialog.ledger.warung?.name }}</strong>
              <span>Mitra</span>
              <strong>{{ store.reversalDialog.ledger.partner?.name }}</strong>
              <span>Komisi Saat Ini</span>
              <strong class="text-positive">{{
                money(store.reversalDialog.ledger.amount)
              }}</strong>
            </div>

            <q-input
              v-model="store.reversalDialog.reason"
              outlined
              dense
              type="textarea"
              rows="3"
              label="Alasan Reversal / Refund *"
              placeholder="Contoh: Refund atas permintaan pelanggan / chargeback bank"
              :error="Boolean(store.reversalDialog.error)"
              :error-message="store.reversalDialog.error"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Batal" v-close-popup />
            <q-btn
              color="negative"
              no-caps
              label="Proses Reversal"
              :loading="store.reversalDialog.saving"
              @click="store.submitReversal"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <ConfirmDialog
        v-model="confirmation.open"
        :title="confirmation.title"
        :message="confirmation.message"
        @confirm="applyConfirmation"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { Notify } from 'quasar'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import StatCard from '@/components/StatCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useReferralStore } from '@/stores/referral'

const store = useReferralStore()

const typeOptions = [
  { label: 'Umum — diskon Rp50.000', value: 'umum' },
  { label: 'Khusus — diskon Rp75.000', value: 'khusus' }
]

const statusOptions = [
  { label: 'Aktif', value: true },
  { label: 'Tidak aktif', value: false }
]

const columns = [
  { name: 'code', label: 'Kode', field: 'code', align: 'left', sortable: true },
  {
    name: 'partner_name',
    label: 'Mitra',
    field: 'partner_name',
    align: 'left'
  },
  { name: 'type', label: 'Jenis', field: 'type', align: 'left' },
  {
    name: 'price',
    label: 'Harga pelanggan',
    field: 'customer_price',
    align: 'right'
  },
  {
    name: 'usages_count',
    label: 'Penggunaan',
    field: 'usages_count',
    align: 'center'
  },
  { name: 'status', label: 'Status', field: 'is_active', align: 'center' },
  { name: 'actions', label: '', field: 'id', align: 'right' }
]

const money = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const date = value =>
  value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value))
    : '-'

const priceText = computed(() =>
  store.form.type === 'khusus'
    ? 'Diskon Rp75.000, pelanggan membayar Rp100.000'
    : 'Diskon Rp50.000, pelanggan membayar Rp125.000'
)

const request = props =>
  store.fetch({
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending
  })

const confirmation = reactive({
  open: false,
  title: '',
  message: '',
  action: null
})

const confirmStatus = item => {
  confirmation.open = true
  confirmation.title = item.is_active ? 'Nonaktifkan kode?' : 'Aktifkan kode?'
  confirmation.message = item.is_active
    ? 'Pelanggan baru tidak dapat memakai kode ini. Diskon pelanggan lama tetap berlaku.'
    : 'Kode dapat kembali digunakan pelanggan baru.'
  confirmation.action = () => store.setStatus(item, !item.is_active)
}

const applyConfirmation = () => {
  confirmation.open = false
  confirmation.action?.()
}

const copy = async code => {
  await navigator.clipboard?.writeText(code)
  Notify.create({ type: 'positive', message: 'Kode referral disalin.' })
}

const hasError = field => Boolean(store.formErrors[field]?.length)
const errorFor = field => store.formErrors[field]?.[0] || ''

onMounted(async () => {
  await Promise.all([
    store.fetchSummary(),
    store.fetchCommissions(true),
    store.fetchWarungs(true),
    store.fetch(),
    store.fetchPartners()
  ])
})

watch([() => store.search, () => store.status, () => store.type], () =>
  store.fetch({ page: 1 })
)

watch(
  () => store.activeTab,
  tab => {
    if (tab === 'summary') store.fetchSummary()
    else if (tab === 'commissions') store.fetchCommissions(true)
    else if (tab === 'warung') store.fetchWarungs(true)
    else if (tab === 'kode') store.fetch()
  }
)
</script>

<style scoped>
.content-wrap {
  max-width: 1440px;
  margin: 0 auto;
}
.eyebrow {
  margin: 0 0 4px;
  color: #b88924;
  font-size: 0.71rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
h1,
h2 {
  margin: 0;
  color: #17130c;
}
h1 {
  font-size: 1.7rem;
}
.page-description,
.caption {
  margin: 5px 0 0;
  color: #716a5d;
}
.caption {
  font-size: 0.73rem;
}
.referral-nav-tabs {
  background: #ffffff;
  border: 1px solid #e0d7c6;
  border-radius: 10px;
}
.recent-commissions-card {
  border-radius: 14px;
  border-color: #e0d7c6;
  background: #ffffff;
}
.commission-item-card,
.warung-item-card {
  border-radius: 10px;
  border-color: #e0d7c6;
  overflow: hidden;
  background: #ffffff;
}
.card-header-bar {
  background: #17130c;
  border-bottom: 1px solid #2e2617;
}
.text-sand {
  color: #17130c;
}
.text-muted {
  color: #716a5d;
}
.empty-state-box {
  background: #ffffff;
  border: 1px dashed #d8cebe;
  border-radius: 14px;
}
.reversal-info-banner {
  background: #ffebee;
  border-radius: 6px;
}
.dialog {
  width: min(700px, 96vw);
  border-radius: 14px;
}
.price-banner,
.automatic-code-banner {
  background: #fff6dc;
  border: 1px solid #e5bd62;
  color: #604b20;
}
.created-code-dialog {
  width: min(520px, 96vw);
  border-radius: 14px;
}
.created-code-note {
  margin: 6px 0 0;
  color: #716a5d;
}
.created-code {
  flex: 1;
  border: 1px solid #e5bd62;
  border-radius: 8px;
  padding: 10px;
  background: #fff6dc;
  font-size: 1.05rem;
}
.detail-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 9px;
}
.detail-grid span {
  color: #716a5d;
}
code {
  color: #694a0c;
  font-weight: 800;
}
</style>
