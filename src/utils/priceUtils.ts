/**
 * Pembulatan ke ratusan terdekat.
 * Contoh: 1234 -> 1200, 1250 -> 1300
 */
export const roundToNearestHundred = (price: number): number => {
  return Math.round(price / 100) * 100;
};

/**
 * Format harga dengan pembulatan ke ratusan terdekat
 */
export const formatPriceWithRounding = (price: number): string => {
  const roundedPrice = roundToNearestHundred(price);
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(roundedPrice);
};

/**
 * Menghitung total belanja, pembulatan, dan total akhir dari satu nilai total.
 * @param totalBelanja - Angka total belanja sebelum pembulatan.
 * @returns Object berisi totalBelanja, pembulatan, dan totalAkhir.
 */
export const calculateTotalWithRounding = (totalBelanja: number) => {
    const totalAkhir = roundToNearestHundred(totalBelanja);
    const pembulatan = totalAkhir - totalBelanja;
    return {
        totalBelanja,
        pembulatan,
        totalAkhir
    };
}; 