<template>
  <q-drawer
    :model-value="modelValue"
    bordered
    show-if-above
    class="app-sidebar"
    :width="276"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="sidebar-brand q-pa-lg">
      <div class="brand-mark"><q-icon name="account_balance" /></div>
      <div><strong>UDEV</strong><span>Centralized Billing</span></div>
    </div>
    <q-scroll-area class="fit"
      ><q-list padding>
        <template v-for="section in sections" :key="section.label">
          <q-item-label header>{{ section.label }}</q-item-label>
          <q-item
            v-for="item in section.items"
            :key="item.label"
            v-ripple
            clickable
            :disable="item.comingSoon"
            :to="item.to"
            exact
            active-class="menu-active"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section v-if="item.comingSoon" side
              ><q-badge color="grey-8" label="SEGERA"
            /></q-item-section>
            <q-tooltip v-if="item.comingSoon"
              >Modul disiapkan pada tahap berikutnya.</q-tooltip
            >
          </q-item>
          <q-separator class="q-my-sm" />
        </template> </q-list
    ></q-scroll-area>
  </q-drawer>
</template>

<script setup>
defineProps({ modelValue: { type: Boolean, default: true } })
defineEmits(['update:modelValue'])

const sections = [
  {
    label: 'MENU UTAMA',
    items: [
      { label: 'Dashboard', icon: 'space_dashboard', to: '/' },
      { label: 'Aplikasi', icon: 'apps', to: '/aplikasi' },
      {
        label: 'Pelanggan Aplikasi',
        icon: 'groups',
        to: '/pelanggan-aplikasi'
      },
      { label: 'Paket Langganan', icon: 'workspace_premium', comingSoon: true }
    ]
  },
  {
    label: 'BILLING & PAYMENT',
    items: [
      { label: 'Tagihan', icon: 'receipt_long', comingSoon: true },
      { label: 'Pembayaran', icon: 'payments', comingSoon: true },
      {
        label: 'Transaksi Bermasalah',
        icon: 'report_problem',
        comingSoon: true
      },
      {
        label: 'Masa Aktif Langganan',
        icon: 'event_available',
        comingSoon: true
      }
    ]
  },
  {
    label: 'MONITORING',
    items: [
      { label: 'Laporan', icon: 'insights', comingSoon: true },
      { label: 'Audit Logs', icon: 'history', comingSoon: true }
    ]
  },
  {
    label: 'ADMINISTRASI',
    items: [
      { label: 'Manajemen Admin', icon: 'manage_accounts', comingSoon: true },
      { label: 'Pengaturan', icon: 'settings', comingSoon: true }
    ]
  }
]
</script>

<style scoped>
.app-sidebar {
  background: #0c0c0d;
  color: #d6d1c8;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #fff;
}
.sidebar-brand strong {
  font-size: 1.08rem;
  letter-spacing: 0.06em;
}
.sidebar-brand span {
  display: block;
  color: #d6ad4d;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid #e6bd5d;
  background: linear-gradient(145deg, #f3cc6e, #b88924);
  color: #17130c;
  border-radius: 9px;
  font-size: 21px;
}
.menu-active {
  background: rgba(218, 175, 79, 0.18);
  color: #f2cd72;
  border-radius: 8px;
}
.q-item-label {
  color: #8d877e;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.q-separator {
  background: rgba(255, 255, 255, 0.08);
}
</style>
