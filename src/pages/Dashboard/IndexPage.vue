<template>
  <q-page class="q-pa-md q-pa-lg-md"
    ><div class="content-wrap"
      ><AppBreadcrumb title="Dashboard" /><div class="q-mt-md q-mb-md"
        ><p class="eyebrow">UDEV CENTRALIZED BILLING</p><h1>Dashboard</h1
        ><p class="page-description"
          >Ringkasan billing akan tersedia saat endpoint dashboard terotorisasi
          disediakan.</p
        ></div
      ><DashboardOverview /></div
  ></q-page>
</template>
<script setup>
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import DashboardOverview from './comp/DashboardOverview.vue'
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
</style>
