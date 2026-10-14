// Kontrak endpoint UDEV Billing masa depan. Tidak ada request dijalankan selama backend belum tersedia.
// Saat backend siap, pemanggilan Axios wajib tetap dilakukan melalui Pinia store sesuai aturan proyek.
export const udevBillingEndpoints = Object.freeze({
  dashboard: '/v1/admin/dashboard',
  applications: '/v1/admin/applications',
  applicationCustomers: '/v1/admin/application-customers'
})
