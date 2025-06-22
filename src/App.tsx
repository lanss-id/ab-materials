import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { supabase } from './supabaseClient';
import NestedProductTable from './components/NestedProductTable';
import ProductShowcase from './components/ProductShowcase';
import { Toaster } from 'sonner';
import { 
  List, LayoutGrid, Loader2, ServerCrash, ShoppingCart, 
  MapPin, Phone, Mail, FileText
} from 'lucide-react';
import CheckoutModal from './components/CheckoutModal';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import PromotionalBanner from './components/PromotionalBanner';
import TieredDiscountBanner from './components/TieredDiscountBanner';

// Lazy load komponen
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const KelolaProdukPage = lazy(() => import('./components/admin/KelolaProdukPage'));
const AnalyticsPage = lazy(() => import('./components/admin/AnalyticsPage'));
const KelolaPromosiPage = lazy(() => import('./components/admin/KelolaPromosiPage'));
const KelolaDiskonBertingkatPage = lazy(() => import('./components/admin/KelolaDiskonBertingkatPage'));
const AdminRoute = lazy(() => import('./components/AdminRoute'));
const SignIn = lazy(() => import('./components/SignIn'));
const SignUp = lazy(() => import('./components/SignUp'));
const GuestRoute = lazy(() => import('./components/GuestRoute'));

// Definisi tipe data
interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  metadata: any;
  unitName?: string;
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

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );
}

function PublicFacingApp({ categories, loading, error, promotion, appSettings, tieredDiscounts }: { categories: Category[], loading: boolean, error: string | null, promotion: Promotion | null, appSettings: any, tieredDiscounts: any[] }) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'showcase'>('table');
  const [sortOption, setSortOption] = useState('default');
  
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

  const sortedCategories = useMemo(() => {
    const sortProducts = (products: Product[], option: string) => {
      const sorted = [...products];
      switch (option) {
        case 'price-asc':
          return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
          return sorted.sort((a, b) => b.price - a.price);
        case 'name-asc':
          return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        case 'name-desc':
          return sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
        default:
          return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      }
    };

    return categories.map(category => ({
      ...category,
      brands: category.brands.map(brand => ({
        ...brand,
        products: sortProducts(brand.products, sortOption)
      })),
      sub_categories: category.sub_categories.map(sc => ({
        ...sc,
        brands: sc.brands.map(brand => ({
          ...brand,
          products: sortProducts(brand.products, sortOption)
        }))
      }))
    }));
  }, [categories, sortOption]);

  const cartItems = getCartItems();
  const totalBelanjaBruto = cartItems.reduce((acc, item) => acc + item.finalPrice * item.quantity, 0);
  
  const totalItemsInCart = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Toaster position="top-right" richColors />
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/logo.jpeg" 
                alt="AB Material Logo" 
                className="h-12 w-auto" 
                width="135" 
                height="48"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-800">AB Material</h1>
                <p className="text-xs text-slate-500">Material Konstruksi Terpercaya</p>
              </div>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Tiered Discount Banner */}
      <TieredDiscountBanner 
        tieredDiscounts={tieredDiscounts}
        isFeatureActive={appSettings?.tiered_discount_active?.enabled ?? false}
      />
      
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
            
            <div className="flex justify-between items-center mb-6">
              {/* --- Kontrol Sorting --- */}
              <div>
                <label htmlFor="sort-options" className="text-sm font-medium text-slate-700 mr-2">Urutkan:</label>
                <select 
                  id="sort-options"
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                >
                  <option value="default">Rekomendasi</option>
                  <option value="price-asc">Harga: Terendah ke Tertinggi</option>
                  <option value="price-desc">Harga: Tertinggi ke Terendah</option>
                  <option value="name-asc">Nama: A-Z</option>
                  <option value="name-desc">Nama: Z-A</option>
                </select>
              </div>

              {/* --- Kontrol Tampilan --- */}
              <div className="hidden sm:flex items-center space-x-1 bg-slate-200 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300/50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('showcase')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'showcase' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300/50'}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-red-50 border border-red-200 rounded-lg">
                <ServerCrash className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-red-700">Oops! Terjadi Kesalahan</h3>
                <p className="text-red-600 mt-2">{error}</p>
              </div>
            ) : (
              viewMode === 'table' ? (
                <NestedProductTable categories={sortedCategories} quantities={quantities} onQuantityChange={handleQuantityChange} getDiscountForProduct={getDiscountForProduct} />
              ) : (
                <ProductShowcase categories={sortedCategories} quantities={quantities} onQuantityChange={handleQuantityChange} getDiscountForProduct={getDiscountForProduct} />
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

      {/* Tombol Checkout Melayang */}
      {totalItemsInCart > 0 && (
        <div className="sticky bottom-0 w-full p-4 bg-gradient-to-t from-slate-200 to-transparent z-40">
           <button
            onClick={() => setCheckoutModalOpen(true)}
            className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4 bg-orange-600 text-white font-bold rounded-xl shadow-2xl hover:bg-orange-700 transition-transform transform hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-6 h-6" />
              <span>Checkout ({totalItemsInCart} item)</span>
            </div>
            <span className="text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalBelanjaBruto)}</span>
          </button>
        </div>
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
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [appSettings, setAppSettings] = useState<any>({});
  const [tieredDiscounts, setTieredDiscounts] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [productsResponse, promotionResponse, settingsResponse, tieredDiscountsResponse] = await Promise.all([
      supabase
        .from('categories')
        .select(`
          id, name, description,
          sub_categories (
            id, name, brands (
              id, name, products (
                id, name, price, image_url, metadata, unit_id,
                units (name)
              )
            )
          ),
          brands (
            id, name, products (
              id, name, price, image_url, metadata, unit_id,
              units (name)
            )
          )
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
      const cleanedData = productsData.map(category => {
        const brandIdsInSubCategories = new Set(
          category.sub_categories.flatMap(sc => sc.brands.map(b => b.id))
        );
        const directBrands = category.brands.filter(
          brand => !brandIdsInSubCategories.has(brand.id)
        );
        return {
          ...category,
          brands: directBrands.map(brand => ({
            ...brand,
            products: brand.products.map((p: any) => ({
              ...p,
              unitName: (p.units && typeof p.units === 'object' && 'name' in p.units) ? p.units.name : 'per unit'
            }))
          })),
          sub_categories: category.sub_categories.map((sc: any) => ({
            ...sc,
            brands: sc.brands.map((brand: any) => ({
              ...brand,
              products: brand.products.map((p: any) => ({
                ...p,
                unitName: (p.units && typeof p.units === 'object' && 'name' in p.units) ? p.units.name : 'per unit'
              }))
            }))
          }))
        };
      });
      setCategories(cleanedData as Category[]);
    }

    const { data: promotionData, error: promotionError } = promotionResponse;
    if (promotionError) {
      console.error('Error fetching promotion:', promotionError);
    } else if (promotionData) {
        if (promotionData.type === 'product_specific') {
            const { data: promoProducts, error: promoProductsError } = await supabase
                .from('promotion_products')
                .select('product_id')
                .eq('promotion_id', promotionData.id);
            
            if (promoProductsError) {
                console.error("Error fetching promoted products", promoProductsError);
                setActivePromotion(promotionData);
            } else {
                const promoted_product_ids = new Set(promoProducts.map(p => p.product_id));
                setActivePromotion({ ...promotionData, promoted_product_ids });
            }
        } else {
            setActivePromotion(promotionData);
        }
    }
    
    const { data: settingsData, error: settingsError } = settingsResponse;
    if(settingsError) {
        console.error("Error fetching app settings:", settingsError);
    } else if (settingsData) {
        const settingsMap = settingsData.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as any);
       setAppSettings(settingsMap);
    }

    const { data: tieredDiscountsData, error: tieredDiscountsError } = tieredDiscountsResponse;
    if(tieredDiscountsError) {
        console.error("Error fetching tiered discounts:", tieredDiscountsError);
    } else if (tieredDiscountsData) {
       setTieredDiscounts(tieredDiscountsData);
        setAppSettings((prev: any) => ({
            ...prev,
            tiered_discounts: tieredDiscountsData
        }));
    }

    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchData();

    return () => subscription.unsubscribe();
  }, []);

  const allProductsForAdmin = useMemo(() => {
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
    return Array.from(new Map(allProductsRaw.map(p => [p.id, p])).values());
  }, [categories]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/*" element={<PublicFacingApp categories={categories} loading={loading} error={error} promotion={activePromotion} appSettings={appSettings} tieredDiscounts={tieredDiscounts} />} />
          
          <Route 
            path="/signin" 
            element={<GuestRoute><SignIn /></GuestRoute>}
          />
          <Route 
            path="/signup" 
            element={<GuestRoute><SignUp /></GuestRoute>}
          />
          
          <Route path="/admin"> 
            <Route index element={
              <AdminRoute><AdminLayout><Navigate to="/admin/analytics" replace /></AdminLayout></AdminRoute>
            } />
            <Route path="analytics" element={
              <AdminRoute><AdminLayout><AnalyticsPage /></AdminLayout></AdminRoute>
            } />
            <Route path="kelola-produk" element={
              <AdminRoute><AdminLayout><KelolaProdukPage products={allProductsForAdmin} refreshData={fetchData} /></AdminLayout></AdminRoute>
            } />
            <Route path="kelola-promosi" element={
              <AdminRoute><AdminLayout><KelolaPromosiPage refreshData={fetchData} /></AdminLayout></AdminRoute>
            } />
            <Route path="kelola-diskon-bertingkat" element={
              <AdminRoute><AdminLayout><KelolaDiskonBertingkatPage /></AdminLayout></AdminRoute>
            } />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;