import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Truck, Clock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

// Tipe data item di keranjang harus sinkron dengan App.tsx
interface CartItem {
  id: number;
  name: string;
  brandName: string;
  quantity: number;
  originalPrice: number;
  finalPrice: number;
  metadata: any;
  min_order_qty?: number;
  min_order_unit?: string;
  min_order_unit_qty?: number;
  unitName?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalBelanjaBruto: number; // Renamed from totalAkhir and represents gross total
  appSettings: any;
  checkoutMode?: 'cart' | 'single';
  checkoutProduct?: CartItem | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalBelanjaBruto,
  appSettings,
  checkoutMode = 'cart',
  checkoutProduct = null,
}) => {
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeStatus, setPromoCodeStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [promoCodeData, setPromoCodeData] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isOpen) return null;

  // DEBUG: Log cartItems yang diterima

  // Fallback: patch cartItems jika field minimum order null, ambil dari metadata
  const patchedCartItems = cartItems.map(item => {
    if (
      (item.min_order_qty == null || item.min_order_unit == null || item.min_order_unit_qty == null) &&
      item.metadata
    ) {
      return {
        ...item,
        min_order_qty: item.min_order_qty ?? item.metadata.min_order_qty,
        min_order_unit: item.min_order_unit ?? item.metadata.min_order_unit,
        min_order_unit_qty: item.min_order_unit_qty ?? item.metadata.min_order_unit_qty,
      };
    }
    return item;
  });

  // Tentukan produk yang akan ditampilkan di modal
  // --- Promo Code Logic ---
  const calculateDiscount = (total: number) => {
    if (promoCodeData) {
      // Jika kode promo valid, gunakan diskon dari kode promo
      const discountPercentage = promoCodeData.discount_percent;
      const discountAmount = (total * discountPercentage) / 100;
      const totalAfterDiscount = total - discountAmount;
      const finalTotal = Math.round(totalAfterDiscount / 100) * 100;
      return {
        discountPercentage,
        discountAmount,
        isFreeShipping: false,
        finalTotal,
        discountMessage: `Kode promo (${promoCodeData.code})`,
      };
    }
    // Jika tidak ada kode promo, pakai tiered discount
    const isFeatureEnabled = appSettings?.tiered_discount_active?.enabled ?? false;
    if (!isFeatureEnabled) {
      const finalTotal = Math.round(total / 100) * 100;
      return { discountPercentage: 0, discountAmount: 0, isFreeShipping: false, finalTotal, discountMessage: '' };
    }
    const activeTiers = appSettings?.tiered_discounts || [];
    const applicableTier = activeTiers.find((tier: any) => 
        total >= tier.min_spend && (tier.max_spend === null || total < tier.max_spend)
    );
    if (!applicableTier) {
       const finalTotal = Math.round(total / 100) * 100;
       return { discountPercentage: 0, discountAmount: 0, isFreeShipping: false, finalTotal, discountMessage: '' };
    }
    const discountPercentage = applicableTier.discount_percent || 0;
    const discountAmount = (total * discountPercentage) / 100;
    const totalAfterDiscount = total - discountAmount;
    const finalTotal = Math.round(totalAfterDiscount / 100) * 100;
    return {
      discountPercentage,
      discountAmount,
      isFreeShipping: applicableTier.free_shipping || false,
      finalTotal,
      discountMessage: applicableTier.description || '',
    };
  };

  // Hitung total untuk displayItems (support minimum pembelian)
  const displayTotal = patchedCartItems.reduce((acc, item) => {
    if (item.min_order_qty && item.min_order_unit && item.min_order_unit_qty) {
      return acc + (item.finalPrice * item.min_order_unit_qty);
    }
    return acc + (item.finalPrice * item.quantity);
  }, 0);

  const discountInfo = calculateDiscount(displayTotal);

  // Handler untuk validasi kode promo
  const handleApplyPromo = async () => {
    setPromoCodeStatus('validating');
    setPromoError(null);
    setPromoCodeData(null);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCodeInput.trim())
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) {
      setPromoCodeStatus('invalid');
      setPromoError('Terjadi kesalahan, coba lagi.');
      toast.error('Terjadi kesalahan, coba lagi.');
      return;
    }
    if (!data) {
      setPromoCodeStatus('invalid');
      setPromoError('Kode promo tidak ditemukan atau tidak aktif.');
      toast.error('Kode promo tidak ditemukan atau tidak aktif.');
      return;
    }
    // Cek tanggal berlaku
    const today = new Date();
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (today < start || today > end) {
      setPromoCodeStatus('invalid');
      setPromoError('Kode promo belum/tidak berlaku.');
      toast.error('Kode promo belum/tidak berlaku.');
      return;
    }
    setPromoCodeStatus('valid');
    setPromoCodeData(data);
    setPromoError(null);
    toast.success('Kode promo berhasil diterapkan!');
  };

  // --- LOGIKA WAKTU PENGIRIMAN ---
  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes(); // Waktu dalam menit
  };

  const isRegularShippingAvailable = () => {
    return getCurrentTime() < 15 * 60; // Sebelum jam 15:00 (3 sore)
  };

  const getRegularShippingMessage = () => {
    if (isRegularShippingAvailable()) {
      return 'Pesan sebelum jam 15:00, akan dikirim besok';
    }
    return 'Pesan setelah jam 15:00, akan direspon besok dan dikirim lusa';
  };

  const getRegularShippingDescription = () => {
    if (isRegularShippingAvailable()) {
      return 'Dikirim besok';
    }
    return 'Direspon besok, dikirim lusa';
  };

  const handleProceedToWhatsApp = () => {
    if (!selectedShipping) {
      toast.error("Silakan pilih metode pengiriman terlebih dahulu.");
      return;
    }

    const itemsList = patchedCartItems.map(item => {
      // Perhitungan subtotal harus sesuai minimum order
      let subtotal = 0;
      let qtyLabel = '';
      if (item.min_order_qty && item.min_order_unit && item.min_order_unit_qty) {
        subtotal = item.finalPrice * item.min_order_unit_qty;
        qtyLabel = `${item.min_order_qty} ${item.min_order_unit} (= ${item.min_order_unit_qty} ${item.unitName || ''})`;
      } else {
        subtotal = item.quantity * item.finalPrice;
        qtyLabel = `${item.quantity} ${item.unitName || ''}`;
      }
      return `${item.name} (${item.brandName})\nHarga: Rp${item.finalPrice.toLocaleString('id-ID')} x ${qtyLabel}\nSubtotal: Rp${subtotal.toLocaleString('id-ID')}`;
    }).join('\n\n');

    let shippingInfo = '';
    if (selectedShipping === 'reguler') {
      shippingInfo = `Layanan Pengiriman: Reguler (${getRegularShippingDescription()})`;
    } else {
      shippingInfo = 'Layanan Pengiriman: Instan (3 jam) - Detail biaya akan dikonfirmasi via WhatsApp';
    }

    // Gunakan displayTotal (bukan totalBelanjaBruto) untuk total belanja
    const summaryList = [
      `*Rekap Pesanan:*\n${itemsList}`,
      `\n*Total Belanja:* Rp${displayTotal.toLocaleString('id-ID')}`,
    ];

    if (discountInfo.discountAmount > 0) {
      summaryList.push(`*Diskon (${discountInfo.discountPercentage}%):* -Rp${discountInfo.discountAmount.toLocaleString('id-ID')}`);
    }
    if (discountInfo.isFreeShipping) {
      summaryList.push(`*Promo:* Gratis Ongkir (T&C berlaku)`);
    }

    summaryList.push(`*Total Akhir:* Rp${discountInfo.finalTotal.toLocaleString('id-ID')}`);

    const pesan = `Halo Admin, saya ingin memesan material konstruksi berikut:\n\n${summaryList.join('\n')}\n\n${shippingInfo}\n\nTerima kasih.`;

    const waHref = `https://wa.me/6285187230007?text=${encodeURIComponent(pesan)}`;
    
    window.open(waHref, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-slate-900 flex justify-between items-center">
                  Lengkapi Pesanan Anda
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </Dialog.Title>
                
                <div className="mt-6 space-y-6">
                  {/* Input Kode Promo */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-5 flex flex-col gap-2 sm:flex-row sm:items-center border border-yellow-200 shadow-sm relative">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket-percent-icon lucide-ticket-percent text-orange-700"><path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M9 9h.01"/><path d="m15 9-6 6"/><path d="M15 15h.01"/></svg>
                      <span className="font-semibold text-orange-700 text-base">Punya kode promo?</span>
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border-2 border-yellow-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-lg font-semibold placeholder:font-normal placeholder:text-slate-400 transition-all"
                        placeholder="Masukkan kode promo"
                        value={promoCodeInput}
                        onChange={e => {
                          setPromoCodeInput(e.target.value);
                          setPromoCodeStatus('idle');
                          setPromoError(null);
                        }}
                        disabled={promoCodeStatus === 'validating'}
                        maxLength={32}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        inputMode="text"
                      />
                      <button
                        className={`px-6 py-3 rounded-lg font-bold text-white transition-all text-base shadow-md ${promoCodeStatus === 'validating' ? 'bg-orange-300' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'}`}
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoCodeStatus === 'validating' || !promoCodeInput}
                      >
                        {promoCodeStatus === 'validating' ? 'Tunggu...' : 'Pakai'}
                      </button>
                    </div>
                  </div>
                  {/* Ringkasan Produk */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Produk yang Dipilih</h3>
                    <div className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2">
                      {patchedCartItems.map((item) => {
                        // Cek minimum pembelian
                        const minQty = item.min_order_qty;
                        const minUnit = item.min_order_unit;
                        const minUnitQty = item.min_order_unit_qty;
                        const satuanUtama = item.unitName || '';
                        if (minQty && minUnit && minUnitQty) {
                          return (
                            <div key={item.id} className="flex flex-col gap-1 border-b border-slate-100 pb-2 mb-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-700 font-semibold">{item.name} ({item.brandName})</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                <span>Jumlah: <b>{minQty} {minUnit}</b> <span className="text-slate-400">(={minUnitQty} {satuanUtama})</span></span>
                                <span>Harga per {satuanUtama}: <b>Rp{item.finalPrice.toLocaleString('id-ID')}</b></span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                <span>Subtotal: <b>Rp{(item.finalPrice * minUnitQty).toLocaleString('id-ID')}</b></span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={item.id} className="flex justify-between items-center">
                              <span className="text-slate-600">{item.name} ({item.brandName})</span>
                              <span className="font-medium">{item.quantity} x Rp{item.finalPrice.toLocaleString('id-ID')}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                    
                    <div className="border-t border-slate-200 mt-3 pt-3 space-y-2">
                       <div className="flex justify-between items-center text-slate-600">
                        <span>Subtotal</span>
                        <span>Rp{displayTotal.toLocaleString('id-ID')}</span>
                      </div>
                      
                      {discountInfo.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Diskon ({discountInfo.discountPercentage}%)</span>
                          <span>-Rp{discountInfo.discountAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      {discountInfo.discountMessage && (
                        <div className="flex justify-between items-center text-green-600 text-xs">
                          <span>{discountInfo.discountMessage}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center font-bold text-lg text-blue-700 pt-2">
                        <span>Total Pembayaran</span>
                        <span>Rp{discountInfo.finalTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Pengiriman */}
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-4">Pilih Layanan Pengiriman</h3>
                    <div className="space-y-4">
                      {/* Opsi Reguler */}
                      <div onClick={() => setSelectedShipping('reguler')} className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedShipping === 'reguler' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                        <div className="flex items-start space-x-4">
                          <div className="bg-blue-100 p-3 rounded-lg mt-1"><Truck className="h-6 w-6 text-blue-600" /></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-slate-800 text-lg">Pengiriman Reguler</h4>
                              <CheckCircle className={`h-5 w-5 ${selectedShipping === 'reguler' ? 'text-blue-600' : 'text-slate-300'}`} />
                            </div>
                            <p className="text-slate-600 mb-2"><strong>{getRegularShippingDescription()}</strong> - Pilihan ekonomis dan terpercaya.</p>
                            <div className={`flex items-center space-x-2 text-sm p-2 rounded-md ${isRegularShippingAvailable() ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                              <Clock className="h-4 w-4" />
                              <span>{getRegularShippingMessage()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opsi Instan */}
                      <div onClick={() => setSelectedShipping('instan')} className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedShipping === 'instan' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300'}`}>
                        <div className="flex items-start space-x-4">
                           <div className="bg-green-100 p-3 rounded-lg mt-1"><Clock className="h-6 w-6 text-green-600" /></div>
                          <div className="flex-1">
                             <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-slate-800 text-lg">Pengiriman Instan</h4>
                              <CheckCircle className={`h-5 w-5 ${selectedShipping === 'instan' ? 'text-green-600' : 'text-slate-300'}`} />
                            </div>
                            <p className="text-slate-600 mb-2"><strong>Sampai dalam 3 jam</strong> - Untuk kebutuhan mendesak.</p>
                            <div className="flex items-center space-x-2 text-sm p-2 rounded-md bg-sky-50 text-sky-700">
                              <AlertCircle className="h-4 w-4" />
                              <span>Hubungi via WhatsApp untuk detail biaya & ketersediaan.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t pt-6">
                  <button
                    type="button"
                    onClick={handleProceedToWhatsApp}
                    disabled={!selectedShipping}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent bg-green-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-green-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Lanjutkan Pesan ke WhatsApp
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CheckoutModal; 