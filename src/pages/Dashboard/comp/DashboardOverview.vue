<template>
  <q-card flat bordered class="panel"
    ><q-card-section class="empty-dashboard"
      ><q-icon name="insights" color="warning" size="42px" /><h2
        >Ringkasan belum tersedia</h2
      ><p
        >Endpoint dashboard belum tersedia pada API Billing. Angka ilustratif
        tidak ditampilkan agar tidak terbaca sebagai data produksi.</p
      ></q-card-section
    ></q-card
  >
</template>
<style scoped>
.panel {
  border-color: #e0d7c6;
  border-radius: 14px;
}
.empty-dashboard {
  max-width: 560px;
  padding: 48px 24px;
  text-align: center;
  margin: 0 auto;
}
h2 {
  margin: 14px 0 7px;
  color: #20180b;
  font-size: 1.1rem;
}
p {
  margin: 0;
  color: #746b5c;
  font-size: 0.88rem;
  line-height: 1.6;
}
</style>
