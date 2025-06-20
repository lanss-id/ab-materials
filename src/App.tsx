import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  Truck,
  Shield,
  Clock,
  Settings
} from 'lucide-react';
import PromotionalBanner from './components/PromotionalBanner';
import NestedProductTable from './components/NestedProductTable';
import AdminPanel from './components/AdminPanel';
import ProductCard from './components/ProductCard';
import constructionData from './data/construction_products_json.json';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import { supabase } from './supabaseClient'; // pastikan path benar

// Tambahkan type Promotion
type Promotion = {
  id: number;
  title: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetRegion: string;
  gimmickType: 'pulse' | 'glow' | 'shake' | 'countdown';
};

function App() {
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [productViewMode, setProductViewMode] = useState<'table' | 'card'>('table');

  // State global untuk quantity per produk
  // key: productKey (categoryId-index-subKey), value: quantity
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});

  // PROMO STATE GLOBAL
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      const { data, error } = await supabase.from('promotions').select('*');
      if (!error && data) setPromotions(data);
    };
    fetchPromotions();
  }, []);

  // Helper untuk update quantity
  const handleQuantityChange = (productKey: string, value: number) => {
    setSelectedQuantities((prev) => {
      if (value <= 0) {
        // Hapus jika 0
        const copy = { ...prev };
        delete copy[productKey];
        return copy;
      }
      return { ...prev, [productKey]: value };
    });
  };

  // Helper untuk ambil data produk dari key
  const getProductByKey = (key: string) => {
    // key: categoryId-index-subKey
    const [catId, idx, subKey] = key.split('-');
    const category = constructionData.daftar_produk_konstruksi.kategori.find((c: any) => c.id === Number(catId));
    if (!category) return null;
    if (!subKey || subKey === 'main') {
      return category.produk?.[Number(idx)] ? { ...category.produk[Number(idx)], categoryName: category.nama } : null;
    } else {
      const subCat = category.sub_kategori?.find((s: any) => `${catId}-${s.merk}` === subKey);
      return subCat?.produk?.[Number(idx)] ? { ...subCat.produk[Number(idx)], categoryName: `${category.nama} - ${subCat.merk}` } : null;
    }
  };

  // Data produk yang dipilih (quantity > 0)
  const selectedProducts = Object.entries(selectedQuantities)
    .map(([key, qty]) => {
      const prod = getProductByKey(key);
      return prod ? { ...prod, key, quantity: qty } : null;
    })
    .filter(Boolean);

  const totalHarga = selectedProducts.reduce((acc, p: any) => acc + (p.harga * p.quantity), 0);

  // WhatsApp message (encoded)
  const waMessage = encodeURIComponent(
    `Halo Admin, saya ingin memesan material konstruksi berikut:\n\n` +
    selectedProducts.map((p: any) =>
      `${p.categoryName} - ${p.ukuran || p.jenis || 'Produk'}\nHarga Satuan: Rp${p.harga.toLocaleString('id-ID')}\nJumlah: ${p.quantity}\nSubtotal: Rp${(p.harga * p.quantity).toLocaleString('id-ID')}`
    ).join('\n\n') +
    `\n\nTotal: Rp${totalHarga.toLocaleString('id-ID')}`
  );

  // WhatsApp message (plain preview)
  const waMessagePreview =
    `Halo Admin, saya ingin memesan material konstruksi berikut:\n\n` +
    selectedProducts.map((p: any) =>
      `${p.categoryName} - ${p.ukuran || p.jenis || 'Produk'}\nHarga Satuan: Rp${p.harga.toLocaleString('id-ID')}\nJumlah: ${p.quantity}\nSubtotal: Rp${(p.harga * p.quantity).toLocaleString('id-ID')}`
    ).join('\n\n') +
    `\n\nTotal: Rp${totalHarga.toLocaleString('id-ID')}`;

  const handlePromoClick = () => {
    // Handle promotional CTA click
    console.log('Promo clicked!');
  };

  // PROMO LOGIC: Ambil promo aktif (semua produk)
  const getActivePromotion = () => {
    const now = new Date();
    return promotions.find(promo => {
      if (!promo.isActive) return false;
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);
      return now >= start && now <= end;
    });
  };
  const activePromo = getActivePromotion();
  const discountPercent = activePromo ? activePromo.discountPercent : 0;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-700 p-2 rounded-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-800">AB Material</h1>
                      <p className="text-xs text-slate-500">Material Konstruksi Terpercaya</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <a
                        href="https://wa.me/6285187230007"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-slate-600 hover:text-green-600 transition-colors"
                        title="Hubungi via WhatsApp"
                      >
                        <Phone className="h-4 w-4" />
                        <span>+62 851-8723-0007</span>
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                      <span>abmaterial1@gmail.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
                <div className="text-center mb-8">
                  {/* Service Area Badges */}
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      <span>Bandung</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      <span>Jabodetabek</span>
                    </div>
                  </div>

                  {/* Main Headlines */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
                    Pemasok Material
                    <span className="block text-blue-700">Konstruksi Tepercaya</span>
                    <span className="block text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-600 mt-2">
                      untuk Bandung & Jabodetabek
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                    Menyediakan material konstruksi berkualitas tinggi dengan layanan pengiriman cepat 
                    dan harga kompetitif. Dipercaya oleh kontraktor dan developer terkemuka.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <a
                      href="https://wa.me/6285187230007"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <span className="flex items-center space-x-2">
                        <Phone className="h-5 w-5" />
                        <span>Dapatkan Penawaran Sekarang</span>
                      </span>
                    </a>
                    <button className="group bg-white hover:bg-slate-50 text-blue-700 border-2 border-blue-200 hover:border-blue-300 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                      <span className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5" />
                        <span>Jelajahi Produk</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Truck className="h-6 w-6 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Pengiriman Cepat</h3>
                    <p className="text-slate-600 text-sm">Layanan antar langsung ke lokasi proyek dengan armada lengkap</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-green-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Kualitas Terjamin</h3>
                    <p className="text-slate-600 text-sm">Material berkualitas tinggi dengan sertifikat standar nasional</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-orange-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Harga Kompetitif</h3>
                    <p className="text-slate-600 text-sm">Penawaran terbaik dengan sistem pembayaran yang fleksibel</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Clock className="h-6 w-6 text-purple-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Layanan 24/7</h3>
                    <p className="text-slate-600 text-sm">Konsultasi dan pemesanan dapat dilakukan kapan saja</p>
                  </div>
                </div>

                {/* Quick Contact */}
                
              </div>
            </section>

            {/* Promotional Banner */}
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PromotionalBanner
                  title={activePromo ? activePromo.title : "Promo Material Konstruksi"}
                  subtitle={activePromo ? activePromo.description : "Dapatkan diskon fantastis untuk semua kebutuhan material proyek Anda. Penawaran terbatas!"}
                  discountPercent={activePromo ? activePromo.discountPercent : 0}
                  endDate={activePromo ? new Date(activePromo.endDate) : new Date()}
                  ctaText="Ambil Penawaran Sekarang"
                  onCtaClick={handlePromoClick}
                  gimmickType={activePromo ? activePromo.gimmickType : 'pulse'}
                />
              </div>
            </section>

            {/* Product Table */}
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center w-full">
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">
                      Katalog Produk Lengkap
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                      Jelajahi koleksi lengkap material konstruksi berkualitas tinggi dengan harga terbaik. 
                      Klik pada kategori untuk melihat detail produk dan spesifikasi.
                    </p>
                  </div>
                </div>
                  <div className="flex items-center justify-end space-x-2 mb-4">
                    <button
                      onClick={() => setProductViewMode('table')}
                      className={`p-2 rounded-md ${productViewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Tampilan Tabel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </button>
                    <button
                      onClick={() => setProductViewMode('card')}
                      className={`p-2 rounded-md ${productViewMode === 'card' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Tampilan Kartu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>
                    </button>
                  </div>
                {productViewMode === 'table' ? (
                  <NestedProductTable
                    quantities={selectedQuantities}
                    onQuantityChange={handleQuantityChange}
                    discountPercent={discountPercent}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {(() => {
                      const categories = constructionData.daftar_produk_konstruksi.kategori;
                      const allProducts: any[] = [];
                      categories.forEach(category => {
                        if (category.produk) {
                          category.produk.forEach((product, idx) => {
                            allProducts.push({
                              ...product,
                              categoryName: category.nama,
                              productKey: `${category.id}-${idx}-main`,
                              discountPercent,
                              hargaDiskon: discountPercent > 0 ? product.harga * (1 - discountPercent / 100) : product.harga
                            });
                          });
                        }
                        if (category.sub_kategori) {
                          category.sub_kategori.forEach(subCat => {
                            if (subCat.produk) {
                              subCat.produk.forEach((product, idx) => {
                                allProducts.push({
                                  ...product,
                                  categoryName: `${category.nama} - ${subCat.merk}`,
                                  productKey: `${category.id}-${idx}-${category.id}-${subCat.merk}`,
                                  discountPercent,
                                  hargaDiskon: discountPercent > 0 ? product.harga * (1 - discountPercent / 100) : product.harga
                                });
                              });
                            }
                          });
                        }
                      });
                      return allProducts.map((product, idx) => (
                        <ProductCard
                          key={product.productKey}
                          product={product}
                          categoryName={product.categoryName}
                          quantity={selectedQuantities[product.productKey] || 0}
                          onQuantityChange={(val) => handleQuantityChange(product.productKey, val)}
                          discountPercent={product.discountPercent}
                          hargaDiskon={product.hargaDiskon}
                        />
                      ));
                    })()}
                  </div>
                )}

                {/* Ringkasan Keranjang */}
                {selectedProducts.length > 0 && (
                  <div className="mt-12 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">Ringkasan Pesanan</h3>
                    <ul className="mb-4 space-y-2">
                      {selectedProducts.map((p: any, i: number) => (
                        <li key={p.key} className="text-slate-700">
                          <div><b>{i + 1}. {p.categoryName} - {p.ukuran || p.jenis || 'Produk'}</b></div>
                          <div>Harga Satuan: Rp{p.harga.toLocaleString('id-ID')}</div>
                          <div>Jumlah: {p.quantity}</div>
                          <div>Subtotal: Rp{(p.harga * p.quantity).toLocaleString('id-ID')}</div>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center font-bold text-lg text-blue-700 mb-4">
                      <span>Total</span>
                      <span>Rp{totalHarga.toLocaleString('id-ID')}</span>
                    </div>
                    <a
                      href={`https://wa.me/6285187230007?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow transition-all duration-200"
                    >
                      Pesan via WhatsApp
                    </a>
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded text-slate-700 text-sm">
                      <b>Preview Pesan WhatsApp:</b>
                      <div style={{ marginTop: 8 }}>
                        {(() => {
                          const parts = waMessagePreview.split('\n\n');
                          const total = parts.pop();
                          return (
                            <>
                              {parts.map((block, idx) => (
                                <div key={idx} style={{ marginBottom: 16 }}>
                                  {block.split('\n').map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
                                </div>
                              ))}
                              <div style={{ fontWeight: 'bold' }}>{total}</div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-8 text-center">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Butuh Material Segera?</h2>
                  <p className="text-slate-600 mb-6">Tim ahli kami siap membantu menentukan material terbaik untuk proyek Anda</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a
                      href="https://wa.me/6285187230007"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-slate-700 hover:bg-blue-50 rounded-lg transition-colors duration-150 p-1"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Phone className="h-5 w-5 text-blue-700" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Chat via WhatsApp</p>
                        <span className="text-sm text-slate-500 hover:underline">
                          +62 851-8723-0007
                        </span>
                      </div>
                    </a>
                    <div className="hidden sm:block w-px h-12 bg-slate-300"></div>
                    <div className="flex items-center space-x-3 text-slate-700">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Mail className="h-5 w-5 text-orange-700" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Email Kami</p>
                        <p className="text-sm text-slate-500">abmaterial1@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;