import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import NestedProductTable from './components/NestedProductTable';
import ProductShowcase from './components/ProductShowcase';
import { Toaster, toast } from 'sonner';
import { 
  List, LayoutGrid, Loader2, ServerCrash, ShoppingCart, Building2, 
  MapPin, Phone, Mail, CheckCircle, Truck, Shield, Clock, FileText
} from 'lucide-react';
import CheckoutModal from './components/CheckoutModal';
import { roundToNearestHundred, calculateTotalWithRounding } from './utils/priceUtils';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PromotionalBanner from './components/PromotionalBanner';

// Impor komponen Admin
import AdminLayout from './components/admin/AdminLayout';
import KelolaProdukPage from './components/admin/KelolaProdukPage';
import AnalyticsPage from './components/admin/AnalyticsPage';
import KelolaPromosiPage from './components/admin/KelolaPromosiPage';
import KelolaDiskonBertingkatPage from './components/admin/KelolaDiskonBertingkatPage';
import AdminRoute from './components/AdminRoute';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

// Definisi tipe data yang konsisten untuk seluruh aplikasi
interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  metadata: any;
}

interface Brand {
  id: number;
  name: string;
  products: Product[];
}

interface SubCategory {
  id: number;
  name: string;
  brands: Brand[];
}

interface Category {
  id: number;
  name: string;
  description: string;
  sub_categories: SubCategory[];
  brands: Brand[];
}

interface Promotion {
  id: number;
  title: string;
  subtitle: string;
  discount_percent: number;
  end_date: string;
  cta_text: string;
  gimmick_type: 'pulse' | 'glow' | 'shake' | 'countdown';
  type: 'sitewide' | 'product_specific';
  promoted_product_ids?: Set<number>;
}

function PublicFacingApp({ categories, loading, error, promotion, appSettings }: { categories: Category[], loading: boolean, error: string | null, promotion: Promotion | null, appSettings: any }) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'showcase'>('table');
  
  const handleQuantityChange = (key: string, value: number) => {
    setQuantities(prev => ({ ...prev, [key]: value < 0 ? 0 : value }));
  };

  const getDiscountForProduct = (productId: number): number => {
    if (!promotion) return 0;
    
    if (promotion.type === 'sitewide') {
      return promotion.discount_percent;
    }
    
    if (promotion.type === 'product_specific' && promotion.promoted_product_ids?.has(productId)) {
      return promotion.discount_percent;
    }

    return 0;
  }

  const getCartItems = () => {
    const items: (Product & { quantity: number; finalPrice: number; brandName: string; originalPrice: number; })[] = [];
    categories.forEach(category => {
      const allBrands = [...category.brands, ...category.sub_categories.flatMap(sc => sc.brands)];
      allBrands.forEach(brand => {
        brand.products.forEach(product => {
          const key = `product-${product.id}`;
          if (quantities[key] > 0) {
            const discountPercent = getDiscountForProduct(product.id);
            const finalPrice = discountPercent > 0 ? (product.price * (1 - discountPercent / 100)) : product.price;
            items.push({
              ...product,
              quantity: quantities[key],
              originalPrice: product.price,
              finalPrice: finalPrice,
              brandName: brand.name,
            });
          }
        });
      });
    });
    // Saring duplikat berdasarkan ID produk
    return Array.from(new Map(items.map(item => [item.id, item])).values());
  };

  const cartItems = getCartItems();
  const totalBelanjaBruto = cartItems.reduce((acc, item) => acc + item.finalPrice * item.quantity, 0);
  
  const totalItemsInCart = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Toaster position="top-right" richColors />
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
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
          </div>
        </div>
      </header>
      
      <main className="w-full">
        {/* ===== BANNER PROMOSI (BARU & DINAMIS) ===== */}
        {promotion && (
          <section className="py-12 bg-gradient-to-b from-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PromotionalBanner
                  title={promotion.title}
                  subtitle={promotion.subtitle}
                  discountPercent={promotion.discount_percent}
                  endDate={new Date(promotion.end_date)}
                  ctaText={promotion.cta_text}
                  onCtaClick={() => document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' })}
                  gimmickType={promotion.gimmick_type}
                />
            </div>
          </section>
        )}
        {/* hero section */}
        <section className="relative bg-gradient-to-b from-blue-50 via-slate-50 to-orange-50 pt-16 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4 leading-tight">
              Pemasok Material <span className="block text-blue-700">Konstruksi Tepercaya</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl text-slate-700 mb-6">
              untuk Bandung & Jabodetabek
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Menyediakan material konstruksi berkualitas tinggi dengan layanan pengiriman cepat dan harga kompetitif. Dipercaya oleh kontraktor dan developer terkemuka.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <a
                href="https://wa.me/6285187230007"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-105"
              >
                <Phone className="w-5 h-5" />
                <span>Dapatkan Penawaran Sekarang</span>
              </a>
              <button
                onClick={() => document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-3 bg-white text-blue-700 font-bold rounded-lg border border-slate-300 shadow-md hover:bg-slate-100 hover:border-slate-400 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Jelajahi Produk</span>
              </button>
            </div>
          </div>
        </section>
      
        <section id="katalog" className="py-16 bg-gradient-to-b from-orange-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Katalog Produk</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">Jelajahi koleksi lengkap material konstruksi kami.</p>
            </div>
            
            <div className="flex justify-end items-center mb-6">
               <div className="flex items-center bg-slate-200 rounded-lg p-1 border border-slate-300">
                <button onClick={() => setViewMode('showcase')} className={`p-2 rounded-md ${viewMode === 'showcase' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><LayoutGrid className="h-5 w-5" /></button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><List className="h-5 w-5" /></button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>
            ) : error ? (
              <div className="text-center bg-red-100 p-6 rounded-lg"><ServerCrash className="w-12 h-12 mx-auto mb-4 text-red-500" /><h3 className="text-xl font-semibold">Gagal memuat data</h3><p>{error}</p></div>
            ) : (
              viewMode === 'table' ? (
                <NestedProductTable categories={categories} quantities={quantities} onQuantityChange={handleQuantityChange} getDiscountForProduct={getDiscountForProduct} />
              ) : (
                <ProductShowcase categories={categories} quantities={quantities} onQuantityChange={handleQuantityChange} getDiscountForProduct={getDiscountForProduct} />
              )
            )}
          </div>
        </section>
        
        {/* ===== FOOTER BARU (DESAIN MINIMALIS MODERN) ===== */}
        <footer className="bg-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">
                Butuh Material Segera?
              </h2>
              <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                Tim ahli kami siap membantu menentukan material terbaik untuk proyek Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                
                {/* Kontak WhatsApp */}
                <a href="https://wa.me/6285187230007" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 group">
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Phone className="h-6 w-6 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">Chat via WhatsApp</p>
                    <span className="text-sm text-slate-600 group-hover:text-blue-600 transition-colors">
                      +62 851-8723-0007
                    </span>
                  </div>
                </a>

                {/* Garis Pemisah */}
                <div className="hidden sm:block w-px h-12 bg-slate-200"></div>
                
                {/* Kontak Email */}
                <a href="mailto:abmaterial1@gmail.com" className="flex items-center space-x-4 group">
                  <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Mail className="h-6 w-6 text-orange-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">Email Kami</p>
                    <span className="text-sm text-slate-600 group-hover:text-orange-600 transition-colors">
                      abmaterial1@gmail.com
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Tombol Keranjang Floating */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setCheckoutModalOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-110 z-40"
          aria-label={`Buka keranjang, ${totalItemsInCart} item`}
        >
          <ShoppingCart className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
            {totalItemsInCart}
          </div>
        </button>
      )}

      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          cartItems={cartItems}
          totalBelanjaBruto={totalBelanjaBruto}
          appSettings={appSettings}
        />
      )}
    </div>
  );
}

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [appSettings, setAppSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [productsResponse, promotionResponse, settingsResponse] = await Promise.all([
      supabase
        .from('categories')
        .select(`
          id, name, description,
          sub_categories (id, name, brands (id, name, products (id, name, price, image_url, metadata))),
          brands (id, name, products (id, name, price, image_url, metadata))
        `),
      supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('app_settings')
        .select('key, value'),
      supabase
        .from('tiered_discounts')
        .select('*')
        .eq('is_active', true)
        .order('min_spend', { ascending: true })
    ]);

    const { data: productsData, error: productsError } = productsResponse;
    if (productsError) {
      console.error('Error fetching products:', productsError);
      setError('Terjadi kesalahan saat mengambil data produk dari server. Silakan coba lagi nanti.');
    } else if (productsData) {
      // Saring data untuk menghilangkan duplikasi brand
      const cleanedData = productsData.map(category => {
        const brandIdsInSubCategories = new Set(
          category.sub_categories.flatMap(sc => sc.brands.map(b => b.id))
        );
        
        const directBrands = category.brands.filter(
          brand => !brandIdsInSubCategories.has(brand.id)
        );
        
        return {
          ...category,
          brands: directBrands,
        };
      });
      setCategories(cleanedData as Category[]);
    }

    const { data: promotionData, error: promotionError } = promotionResponse;
    if (promotionError) {
      // Jangan blokir UI hanya karena promo gagal dimuat
      console.error('Error fetching promotion:', promotionError);
    } else if (promotionData) {
        if (promotionData.type === 'product_specific') {
            const { data: promoProducts, error: promoProductsError } = await supabase
                .from('promotion_products')
                .select('product_id')
                .eq('promotion_id', promotionData.id);
            
            if (promoProductsError) {
                console.error("Error fetching promoted products", promoProductsError);
                setActivePromotion(promotionData); // Tampilkan promo meski produk gagal diambil
            } else {
                const promoted_product_ids = new Set(promoProducts.map(p => p.product_id));
                setActivePromotion({ ...promotionData, promoted_product_ids });
            }
        } else {
            setActivePromotion(promotionData);
        }
    }
    
    // Proses App Settings
    const { data: settingsData, error: settingsError } = settingsResponse;
    if(settingsError) {
        console.error("Error fetching app settings:", settingsError);
    } else if (settingsData) {
        const settingsMap = settingsData.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as any);
        
        // Ambil data tiered_discounts dari promise.all
        const { data: tieredDiscountsData, error: tieredDiscountsError } = await supabase
            .from('tiered_discounts')
            .select('*')
            .eq('is_active', true)
            .order('min_spend', { ascending: true });

        if(tieredDiscountsError) {
            console.error("Error fetching tiered discounts:", tieredDiscountsError);
        } else {
            settingsMap['tiered_discounts'] = tieredDiscountsData;
        }

        setAppSettings(settingsMap);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Format data untuk halaman kelola produk
  const allProductsRaw = categories.flatMap(category =>
    [
      ...category.brands.flatMap(brand => 
        brand.products.map(p => ({
          ...p,
          categoryName: category.name,
          brandName: brand.name
        }))
      ),
      ...category.sub_categories.flatMap(sc => 
        sc.brands.flatMap(brand => 
          brand.products.map(p => ({
            ...p,
            categoryName: category.name,
            subCategoryName: sc.name,
            brandName: brand.name
          }))
        )
      )
    ]
  );
  // Pastikan daftar produk untuk admin juga unik
  const allProductsForAdmin = Array.from(new Map(allProductsRaw.map(p => [p.id, p])).values());

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<PublicFacingApp categories={categories} loading={loading} error={error} promotion={activePromotion} appSettings={appSettings} />} />
        
        {/* Rute Admin diaktifkan di sini */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="kelola-produk" element={<KelolaProdukPage products={allProductsForAdmin} refreshData={fetchData} />} />
          <Route path="kelola-promosi" element={<KelolaPromosiPage refreshData={fetchData} />} />
          <Route path="kelola-diskon-bertingkat" element={<KelolaDiskonBertingkatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;