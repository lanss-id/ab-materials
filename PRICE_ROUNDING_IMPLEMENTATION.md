# Implementasi Pembulatan Harga

## Deskripsi
Sistem pembulatan harga telah diimplementasikan untuk membulatkan harga produk ke ratusan terdekat sesuai dengan permintaan user.

## Contoh Pembulatan
- 21.612,5 → 21.600
- 21.672,5 → 21.700
- 50.150 → 50.200
- 100.050 → 100.100

## File yang Diperbarui

### 1. `src/utils/priceUtils.ts` (Baru)
File utility yang berisi fungsi-fungsi pembulatan harga:
- `roundToNearestHundred(value: number)`: Membulatkan ke ratusan terdekat
- `formatPriceWithRounding(price: number)`: Format harga dengan pembulatan
- `calculateTotalWithRounding(products)`: Hitung total dengan pembulatan

### 2. `src/components/NestedProductTable.tsx`
- Menambahkan import utility functions
- Memperbarui `formatPrice()` untuk menggunakan pembulatan
- Memperbarui WhatsApp message untuk menggunakan harga yang dibulatkan
- Memperbarui range harga di header kategori

### 3. `src/components/ProductCard.tsx`
- Menambahkan import utility functions
- Memperbarui `formatPrice()` untuk menggunakan pembulatan
- Memperbarui WhatsApp message untuk menggunakan harga yang dibulatkan

### 4. `src/App.tsx`
- Menambahkan import utility functions
- Memperbarui perhitungan total harga menggunakan `calculateTotalWithRounding()`
- Memperbarui WhatsApp message untuk menggunakan harga yang dibulatkan
- Memperbarui ringkasan pesanan untuk menggunakan harga yang dibulatkan
- Memperbarui `hargaDiskon` untuk menggunakan pembulatan

### 5. `src/components/CheckoutModal.tsx`
- Menambahkan import utility functions
- Memperbarui tampilan harga produk untuk menggunakan pembulatan
- Memperbarui total pembayaran untuk menggunakan pembulatan

## Cara Kerja
1. Fungsi `roundToNearestHundred()` menggunakan `Math.round(value / 100) * 100`
2. Semua tampilan harga di aplikasi sekarang menggunakan harga yang dibulatkan
3. Perhitungan total, subtotal, dan WhatsApp message semua menggunakan harga yang dibulatkan
4. Konsistensi pembulatan di seluruh aplikasi

## Testing
Untuk memastikan implementasi berfungsi dengan baik:
1. Jalankan aplikasi dengan `npm run dev`
2. Pilih beberapa produk dengan harga yang memiliki desimal
3. Periksa bahwa harga ditampilkan dalam format yang dibulatkan
4. Periksa bahwa total harga dan WhatsApp message menggunakan harga yang dibulatkan 