import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShoppingCart, Truck, Clock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Tipe data item di keranjang harus sinkron dengan App.tsx
interface CartItem {
  id: number;
  name: string;
  brandName: string;
  quantity: number;
  originalPrice: number;
  finalPrice: number;
  metadata: any;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalBelanjaBruto: number; // Renamed from totalAkhir and represents gross total
  appSettings: any;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalBelanjaBruto,
  appSettings,
}) => {
  const [selectedShipping, setSelectedShipping] = useState<string>('');

  if (!isOpen) return null;

  // --- Tiered Discount Logic from DB ---
  const calculateTieredDiscount = (total: number) => {
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
  
  const discountInfo = calculateTieredDiscount(totalBelanjaBruto);

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

    const itemsList = cartItems.map(item => {
      const subtotal = item.quantity * item.finalPrice;
      return `${item.name} (${item.brandName})\nHarga: Rp${item.finalPrice.toLocaleString('id-ID')} x ${item.quantity}\nSubtotal: Rp${subtotal.toLocaleString('id-ID')}`;
    }).join('\n\n');

    let shippingInfo = '';
    if (selectedShipping === 'reguler') {
      shippingInfo = `Layanan Pengiriman: Reguler (${getRegularShippingDescription()})`;
    } else {
      shippingInfo = 'Layanan Pengiriman: Instan (3 jam) - Detail biaya akan dikonfirmasi via WhatsApp';
    }

    const summaryList = [
      `*Rekap Pesanan:*\n${itemsList}`,
      `\n*Total Belanja:* Rp${totalBelanjaBruto.toLocaleString('id-ID')}`,
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
                  {/* Ringkasan Produk */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Produk yang Dipilih</h3>
                    <div className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className="text-slate-600">{item.name} ({item.brandName})</span>
                          <span className="font-medium">{item.quantity} x Rp{item.finalPrice.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-slate-200 mt-3 pt-3 space-y-2">
                       <div className="flex justify-between items-center text-slate-600">
                        <span>Subtotal</span>
                        <span>Rp{totalBelanjaBruto.toLocaleString('id-ID')}</span>
                      </div>
                      
                      {discountInfo.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Diskon ({discountInfo.discountPercentage}%)</span>
                          <span>-Rp{discountInfo.discountAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      {discountInfo.isFreeShipping && (
                         <div className="flex justify-between items-center text-green-600">
                          <span>Promo</span>
                          <span>Gratis Ongkir</span>
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