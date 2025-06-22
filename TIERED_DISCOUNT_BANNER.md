# Tiered Discount Banner

## Deskripsi
Komponen banner running text yang menampilkan informasi diskon bertingkat di bawah navbar. Banner ini akan menampilkan semua diskon aktif yang telah dikonfigurasi di halaman admin "Kelola Diskon Checkout".

## Fitur
- **Running Text**: Teks berjalan otomatis dari kanan ke kiri
- **Pause on Hover/Touch**: Animasi berhenti saat user hover (desktop) atau touch (mobile)
- **Resume on Release**: Animasi berjalan kembali saat user melepas hover/touch
- **Dynamic Content**: Konten menyesuaikan dengan data diskon bertingkat yang aktif
- **Responsive**: Bekerja dengan baik di desktop dan mobile
- **Visual Indicators**: Icon pause muncul saat animasi dihentikan

## Styling
- **Background**: Gradient merah (red-500 → red-600 → red-500)
- **Text**: Putih dengan font semibold
- **Icons**: 
  - Gift icon (kuning) untuk setiap item diskon
  - Truck icon untuk gratis ongkir
  - Percent icon untuk diskon persentase
- **Overlay**: Gradient tipis untuk efek visual yang lebih menarik

## Kondisi Tampil
Banner hanya akan muncul jika:
1. Fitur diskon bertingkat aktif (`tiered_discount_active.enabled = true`)
2. Ada minimal satu diskon yang aktif (`is_active = true`)

## Format Teks
- **Diskon Persentase**: "DISKON 5% - Belanja Rp 500.000 - Rp 999.999"
- **Gratis Ongkir**: "Belanja Rp 1.000.000 - ∞ dapat GRATIS ONGKIR"

## Posisi
Banner ditempatkan tepat di bawah header navbar, sebelum konten utama aplikasi.

## Komponen Terkait
- `KelolaDiskonBertingkatPage.tsx`: Halaman admin untuk mengelola diskon
- `App.tsx`: Integrasi banner ke aplikasi utama
- `CheckoutModal.tsx`: Implementasi logika diskon di checkout 

## Fitur Visual
- **Badge Persentase**: Diskon persentase ditampilkan dengan badge kuning yang menonjol
- **Urutan Prioritas**: Persentase diskon ditampilkan di awal teks untuk menarik perhatian
- **Color Coding**: 
  - Diskon persentase: text-yellow-200 font-bold + badge kuning
  - Gratis ongkir: text-yellow-300 (styling standar) 