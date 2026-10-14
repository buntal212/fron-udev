<template>
  <q-page class="q-pa-md q-pa-lg-md">
    <div class="content-wrap">
      <AppBreadcrumb title="Dashboard" />

      <div
        class="row items-center justify-between q-mt-md q-mb-md q-col-gutter-md"
      >
        <div class="col-12 col-md">
          <p class="eyebrow">UDEV CENTRALIZED BILLING</p>
          <h1>Dashboard</h1>
          <p class="page-description">
            Ringkasan aplikasi, pelanggan, tagihan, dan pembayaran yang dikelola
            administrator.
          </p>
        </div>
        <div class="col-12 col-md-auto">
          <DateRangeFilter v-model="store.dateRange" class="date-filter" />
        </div>
      </div>

      <DemoNotice class="q-mb-md" />
      <DashboardOverview />
    </div>
  </q-page>
</template>

<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import DemoNotice from '@/components/DemoNotice.vue'
import { useDashboardStore } from '@/stores/dashboard'
import DashboardOverview from './comp/DashboardOverview.vue'

const store = useDashboardStore()
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

h1 {
  margin: 0 0 5px;
  color: #17130c;
  font-size: 1.7rem;
}

.page-description {
  margin: 0;
  color: #716a5d;
  font-size: 0.88rem;
}

.date-filter {
  width: 230px;
}
</style>
