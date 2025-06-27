import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { supabase } from './supabaseClient';
import { Toaster, toast } from 'sonner';
import {
    List, LayoutGrid, Loader2, ServerCrash, ShoppingCart,
    MapPin, Phone, Mail, FileText
} from 'lucide-react';
import CheckoutModal from './components/CheckoutModal';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import PromotionalBanner from './components/PromotionalBanner';
import TieredDiscountBanner from './components/TieredDiscountBanner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load komponen HALAMAN, bukan skeleton
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const KelolaProdukPage = lazy(() => import('./components/admin/KelolaProdukPage'));
const AnalyticsPage = lazy(() => import('./components/admin/AnalyticsPage'));
const KelolaPromosiPage = lazy(() => import('./components/admin/KelolaPromosiPage'));
const KelolaDiskonBertingkatPage = lazy(() => import('./components/admin/KelolaDiskonBertingkatPage'));
const SignIn = lazy(() => import('./components/SignIn'));
const SignUp = lazy(() => import('./components/SignUp'));
const AdminRoute = lazy(() => import('./components/AdminRoute'));
const GuestRoute = lazy(() => import('./components/GuestRoute'));
// Kode yang benar
const NestedProductTable = lazy(() => import('./components/NestedProductTable'));
const ProductShowcase = lazy(() => import('./components/ProductShowcase'));
const KelolaKodePromoPage = lazy(() => import('./components/admin/KelolaKodePromoPage'));

// Impor skeleton secara langsung untuk mencegah CLS
import TableSkeleton from './components/skeletons/TableSkeleton';
import ShowcaseSkeleton from './components/skeletons/ShowcaseSkeleton';
// Definisi tipe data
interface Product {
    id: number;
    name: string;
    price: number;
    image_url?: string;
    metadata?: any;
    unitName?: string;
    min_order_qty?: number;
    min_order_unit?: string;
    min_order_unit_qty?: number;
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
    const [checkoutMode, setCheckoutMode] = useState<'cart' | 'single'>('cart');
    const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'table' | 'showcase'>('table');
    const [sortOption, setSortOption] = useState('default');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    const handleQuantityChange = (key: string, value: number) => {
        // Cari produk terkait
        let productId: number | null = null;
        if (key.startsWith('product-')) {
            productId = parseInt(key.replace('product-', ''));
        }
        let product: Product | undefined = undefined;
        if (productId) {
            product = allProducts.find(p => p.id === productId);
        }
        // Cek minimum order
        if (product && product.min_order_qty && value > 0 && value < product.min_order_qty) {
            setQuantities(prev => ({ ...prev, [key]: product!.min_order_qty as number }));
            toast.warning(`Minimum pembelian untuk produk ini adalah ${product.min_order_qty} ${product.min_order_unit || ''}`);
            return;
        }
        setQuantities(prev => ({ ...prev, [key]: value < 0 ? 0 : value }));
    };

    // Helper untuk parsing minimum order dari metadata
    const parseMinOrder = (product: Product) => {
        const meta = product.metadata || {};
        return {
            min_order_qty: meta.min_order_qty,
            min_order_unit: meta.min_order_unit,
            min_order_unit_qty: meta.min_order_unit_qty,
        };
    };

    // Handler untuk checkout satu produk
    const openSingleCheckout = (product: Product, qty: number) => {
        let brandName = (product as any).brandName;
        if (!brandName) {
            for (const category of categories) {
                for (const brand of [...category.brands, ...category.sub_categories.flatMap(sc => sc.brands)]) {
                    if (brand.products.some(p => p.id === product.id)) {
                        brandName = brand.name;
                        break;
                    }
                }
                if (brandName) break;
            }
        }
        // Cari produk lengkap dari allProducts
        const fullProduct = allProducts.find(p => p.id === product.id);
        const discountPercent = getDiscountForProduct(product.id);
        const finalPrice = discountPercent > 0 ? (product.price * (1 - discountPercent / 100)) : product.price;
        setCheckoutProduct({
            ...(fullProduct || product),
            quantity: qty,
            originalPrice: product.price,
            finalPrice,
            brandName: brandName || '',
        });
        setCheckoutMode('single');
        setCheckoutModalOpen(true);
    };
    // Handler untuk checkout seluruh keranjang
    const openCartCheckout = () => {
        setCheckoutMode('cart');
        setCheckoutProduct(null);
        setCheckoutModalOpen(true);
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

    const sortOptions = [
        { value: 'default', label: 'Rekomendasi' },
        { value: 'price-asc', label: 'Harga: Terendah ke Tertinggi' },
        { value: 'price-desc', label: 'Harga: Tertinggi ke Terendah' },
        { value: 'name-asc', label: 'Nama: A-Z' },
        { value: 'name-desc', label: 'Nama: Z-A' },
    ];

    const selectedSortOption = sortOptions.find(option => option.value === sortOption) || sortOptions[0];

    const getCartItems = () => {
        const items: (Product & { quantity: number; finalPrice: number; brandName: string; originalPrice: number; min_order_qty?: number; min_order_unit?: string; min_order_unit_qty?: number; })[] = [];
        categories.forEach(category => {
            const allBrands = [...category.brands, ...category.sub_categories.flatMap(sc => sc.brands)];
            allBrands.forEach(brand => {
                brand.products.forEach(product => {
                    const key = `product-${product.id}`;
                    if (quantities[key] > 0) {
                        const discountPercent = getDiscountForProduct(product.id);
                        const finalPrice = discountPercent > 0 ? (product.price * (1 - discountPercent / 100)) : product.price;
                        // Cari produk lengkap dari allProducts
                        const fullProduct = allProducts.find(p => p.id === product.id);
                        items.push({
                            ...(fullProduct || product),
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
    // Perhitungan total belanja bruto yang memperhitungkan minimum order unit/qty
    const totalBelanjaBruto = cartItems.reduce((acc, item) => {
        if (item.min_order_qty && item.min_order_unit && item.min_order_unit_qty) {
            return acc + (item.finalPrice * item.quantity * item.min_order_unit_qty);
        }
        return acc + (item.finalPrice * item.quantity);
    }, 0);

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

                <section id="katalog" className="py-12 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8">
                            {/* --- Kontrol Sorting Modern --- */}
                            <div className="relative">
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-slate-700">Urutkan:</span>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                            className="flex items-center justify-between bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-slate-400 cursor-pointer shadow-sm hover:shadow-md min-w-[200px]"
                                        >
                                            <span className="truncate">{selectedSortOption.label}</span>
                                            <svg
                                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isSortDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                                {sortOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSortOption(option.value);
                                                            setIsSortDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors duration-150 hover:bg-slate-50 ${option.value === sortOption
                                                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                                                            : 'text-slate-700'
                                                            }`}
                                                    >
                                                        <span className="truncate">{option.label}</span>
                                                        {option.value === sortOption && (
                                                            <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Backdrop untuk menutup dropdown */}
                                {isSortDropdownOpen && (
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsSortDropdownOpen(false)}
                                    />
                                )}
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

                        {loading && <LoadingFallback />}
                        {error && (
                            <div className="text-center py-12">
                                <ServerCrash className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <p className="text-red-500 font-semibold">{error}</p>
                            </div>
                        )}
                        {!loading && !error && (
                            <Suspense fallback={viewMode === 'table' ? <TableSkeleton /> : <ShowcaseSkeleton />}>
                                {viewMode === 'table' ? (
                                    <NestedProductTable
                                        categories={sortedCategories}
                                        quantities={quantities}
                                        onQuantityChange={handleQuantityChange}
                                        getDiscountForProduct={getDiscountForProduct}
                                        onSingleCheckout={openSingleCheckout}
                                    />
                                ) : (
                                    <ProductShowcase
                                        categories={sortedCategories}
                                        quantities={quantities}
                                        onQuantityChange={handleQuantityChange}
                                        getDiscountForProduct={getDiscountForProduct}
                                        onSingleCheckout={openSingleCheckout}
                                    />
                                )}
                            </Suspense>
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
                        onClick={openCartCheckout}
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
                    cartItems={checkoutMode === 'single' && checkoutProduct ? [checkoutProduct] : cartItems}
                    totalBelanjaBruto={checkoutMode === 'single' && checkoutProduct ? checkoutProduct.finalPrice * checkoutProduct.quantity : totalBelanjaBruto}
                    appSettings={appSettings}
                    checkoutMode={checkoutMode}
                    checkoutProduct={checkoutProduct}
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
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const [productsResponse, promotionResponse, settingsResponse, tieredDiscountsResponse, allProductsResponse] = await Promise.all([
            supabase
                .from('categories')
                .select(`
          id, name, description,
          sub_categories (
            id, name, brands (
              id, name, products (
                id, name, price, image_url, metadata, unit_id,
                units (name),
                min_order_qty, min_order_unit, min_order_unit_qty,
                brand_id
              )
            )
          ),
          brands (
            id, name, products (
              id, name, price, image_url, metadata, unit_id,
              units (name),
              min_order_qty, min_order_unit, min_order_unit_qty,
              brand_id
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
                .order('min_spend', { ascending: true }),
            supabase
                .from('products')
                .select('id, name, price, image_url, metadata, min_order_qty, min_order_unit, min_order_unit_qty, brand_id, unit_id')
        ]);

        const { data: productsData, error: productsError } = productsResponse;
        // DEBUG: Log hasil query Supabase
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
                            unitName: (p.units && typeof p.units === 'object' && 'name' in p.units) ? p.units.name : 'per unit',
                            min_order_qty: p.min_order_qty,
                            min_order_unit: p.min_order_unit,
                            min_order_unit_qty: p.min_order_unit_qty,
                        }))
                    })),
                    sub_categories: category.sub_categories.map((sc: any) => ({
                        ...sc,
                        brands: sc.brands.map((brand: any) => ({
                            ...brand,
                            products: brand.products.map((p: any) => ({
                                ...p,
                                unitName: (p.units && typeof p.units === 'object' && 'name' in p.units) ? p.units.name : 'per unit',
                                min_order_qty: p.min_order_qty,
                                min_order_unit: p.min_order_unit,
                                min_order_unit_qty: p.min_order_unit_qty,
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
        if (settingsError) {
            console.error("Error fetching app settings:", settingsError);
        } else if (settingsData) {
            const settingsMap = settingsData.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {} as any);
            setAppSettings(settingsMap);
        }

        const { data: tieredDiscountsData, error: tieredDiscountsError } = tieredDiscountsResponse;
        if (tieredDiscountsError) {
            console.error("Error fetching tiered discounts:", tieredDiscountsError);
        } else if (tieredDiscountsData) {
            setTieredDiscounts(tieredDiscountsData);
            setAppSettings((prev: any) => ({
                ...prev,
                tiered_discounts: tieredDiscountsData
            }));
        }

        const { data: allProducts, error: allProductsError } = allProductsResponse;
        if (allProductsError) {
            console.error('Error fetching all products:', allProductsError);
            setError('Terjadi kesalahan saat mengambil data produk dari server. Silakan coba lagi nanti.');
        } else if (allProducts) {
            setAllProducts(allProducts);
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
            <ErrorBoundary>
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
                            <Route path="kelola-kode-promo" element={
                                <AdminRoute><AdminLayout><KelolaKodePromoPage /></AdminLayout></AdminRoute>
                            } />
                        </Route>
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
