import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Plus,
  ShoppingCart,
  Tag,
  Package,
  DollarSign,
  Layers,
  Info,
  BarChart,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  HelpCircle,
  X
} from 'lucide-react';
import QuantityControl from './QuantityControl';
import { roundToNearestHundred, formatPriceWithRounding } from '../utils/priceUtils';

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

interface NestedProductTableProps {
  categories: Category[];
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: number) => void;
  onAddProduct?: (categoryId: number) => void;
  onAddSubCategoryProduct?: (categoryName: string, subCategoryName: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
  onDeleteSubCategory?: (categoryName: string, subCategoryName: string) => void;
  isAdminMode?: boolean;
  quantities: { [key: string]: number };
  onQuantityChange: (key: string, value: number) => void;
  getDiscountForProduct: (productId: number) => number;
}

const NestedProductTable: React.FC<NestedProductTableProps> = ({
  categories,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  onAddSubCategoryProduct,
  onDeleteCategory,
  onDeleteSubCategory,
  isAdminMode = false,
  quantities,
  onQuantityChange,
  getDiscountForProduct,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [showMobileTutorial, setShowMobileTutorial] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedWithAnimation, setExpandedWithAnimation] = useState<Set<number>>(new Set());
  const [showSimpleHint, setShowSimpleHint] = useState(false);
  const [isCatalogVisible, setIsCatalogVisible] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const catalogSectionRef = useRef<HTMLDivElement>(null);

  // Deteksi mobile dan tutorial
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer untuk mendeteksi section katalog
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isMobile) {
          setIsCatalogVisible(true);
          
          // Tampilkan tutorial untuk mobile user pertama kali
          if (!localStorage.getItem('mobile-tutorial-shown')) {
            setTimeout(() => {
              setShowMobileTutorial(true);
              localStorage.setItem('mobile-tutorial-shown', 'true');
            }, 1000); // Delay 1 detik setelah section terlihat
          }
          
          // Tampilkan hint sederhana
          setTimeout(() => {
            setShowSimpleHint(true);
            setTimeout(() => setShowSimpleHint(false), 3000);
          }, 2000); // Delay 2 detik setelah section terlihat
        }
      },
      {
        threshold: 0.5, // Section harus terlihat 50% untuk dianggap visible
        rootMargin: '0px'
      }
    );

    if (catalogSectionRef.current) {
      observer.observe(catalogSectionRef.current);
    }

    return () => {
      if (catalogSectionRef.current) {
        observer.unobserve(catalogSectionRef.current);
      }
    };
  }, [isMobile]);

  // Deteksi scroll horizontal untuk hint
  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current || !isMobile) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
      const canScrollLeft = scrollLeft > 1;
      
      // Tampilkan hint jika bisa scroll ke kanan atau kiri
      if (canScrollRight || canScrollLeft) {
        setShowScrollHint(true);
        
        // Clear timeout dan set baru
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          setShowScrollHint(false);
        }, 3000); // Tampilkan selama 3 detik
      } else {
        setShowScrollHint(false);
      }
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleScroll);
      
      // Check initial state setelah component mount
      setTimeout(() => {
        handleScroll();
      }, 500);
      
      return () => tableElement.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile]);

  const toggleCategory = (id: number) => {
    setExpandedCategories(p => (p.has(id) ? new Set([...p].filter(x => x !== id)) : new Set([...p, id])));
  };
  
  const toggleSubCategory = (id: string) => {
    setExpandedSubCategories(p => (p.has(id) ? new Set([...p].filter(x => x !== id)) : new Set([...p, id])));
  };
  
  const toggleBrand = (id: string) => {
    setExpandedBrands(p => (p.has(id) ? new Set([...p].filter(x => x !== id)) : new Set([...p, id])));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductName = (product: Product) => {
    return product.name || 'Produk';
  };

  const getRowKey = (categoryId: number, index: number, subKey?: string) => `${categoryId}-${index}-${subKey || 'main'}`;

  const renderProductRow = (product: Product, level: number) => {
    const rowKey = `product-${product.id}`;
    const discountPercent = getDiscountForProduct(product.id);
    const finalPrice = discountPercent > 0 ? product.price * (1 - discountPercent / 100) : product.price;

    return (
      <tr 
        key={rowKey}
        className={`${'bg-slate-50'} hover:bg-blue-50 transition-colors duration-200`}
      >
        <td style={{ paddingLeft: `${1.5 + level * 2}rem` }} className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0"></div>
            <div className="font-medium text-slate-900">{getProductName(product)}</div>
          </div>
        </td>
        
        <td className="px-6 py-4">
          <div className="space-y-1 text-sm text-slate-600 max-w-xs">
            {Object.entries(product.metadata).map(([key, value]) => {
              return (
                <div key={key} className="sm:flex sm:items-start text-[11px] sm:text-xs">
                  <div className="sm:w-1/3 font-medium capitalize text-slate-500 shrink-0">{key.replace(/_/g, ' ')}:</div>
                  <div className="pl-2 sm:pl-0 sm:w-2/3 font-semibold text-slate-700">{String(value)}</div>
                </div>
              );
            })}
          </div>
        </td>
        
        <td className="px-6 py-4">
          {discountPercent > 0 ? (
            <>
              <div className="text-sm text-slate-400 line-through">{formatPrice(product.price)}</div>
              <div className="text-lg font-bold text-blue-700">{formatPrice(finalPrice)}</div>
            </>
          ) : (
            <div className="text-lg font-bold text-blue-700">{formatPrice(product.price)}</div>
          )}
          <div className="text-xs text-slate-700 font-semibold">{product.unitName || 'per unit'}</div>
        </td>
        
        <td className="px-6 py-4">
          <QuantityControl
            value={quantities[rowKey] || 0}
            onChange={(val) => onQuantityChange(rowKey, val)}
            min={0}
          />
        </td>
        
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            {isAdminMode ? (
              <>
                <button
                  onClick={() => onEditProduct?.(product)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  title="Edit Produk"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteProduct?.(product.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  title="Hapus Produk"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                {(() => {
                  const qty = quantities[rowKey] || 0;
                  const namaProduk = getProductName(product);
                  
                  const discountPercent = getDiscountForProduct(product.id);
                  const hargaSatuan = discountPercent > 0 ? 
                    roundToNearestHundred(product.price * (1 - discountPercent / 100)) : 
                    roundToNearestHundred(product.price);
                  const subtotal = hargaSatuan * qty;
                  const pesan = `Halo Admin, saya ingin memesan material konstruksi berikut:\n\n${namaProduk}\nHarga Satuan: Rp${hargaSatuan.toLocaleString('id-ID')}\nJumlah: ${qty}\nSubtotal: Rp${subtotal.toLocaleString('id-ID')}\n\nTotal: Rp${subtotal.toLocaleString('id-ID')}`;
                  const waHref = `https://wa.me/6285187230007?text=${encodeURIComponent(pesan)}`;
                  if (qty > 0) {
                    return (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                        style={{ textDecoration: 'none' }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Beli</span>
                      </a>
                    );
                  }
                  return (
                    <button
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed flex items-center space-x-2"
                      disabled
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Beli</span>
                    </button>
                  );
                })()}
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Detail
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderBrandHeader = (brand: Brand, parentKey: string, level: number) => {
    const brandKey = `${parentKey}-${brand.id}`;
    const isExpanded = expandedBrands.has(brandKey);
    return (
      <React.Fragment key={brandKey}>
        <tr className="bg-slate-50 border-t border-b border-slate-200 hover:bg-slate-100 cursor-pointer" onClick={() => toggleBrand(brandKey)}>
          <td colSpan={5} style={{ paddingLeft: `${1.5 + level * 2}rem` }} className="px-6 py-3">
            <div className="flex items-center space-x-3">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Layers className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-600">{brand.name}</span>
              <span className="text-xs text-slate-500">({brand.products.length} produk)</span>
            </div>
          </td>
        </tr>
        {isExpanded && brand.products.map(p => renderProductRow(p, level + 1))}
      </React.Fragment>
    );
  };

  const renderSubCategoryHeader = (subCategory: SubCategory, parentKey: string, level: number) => {
    const subCategoryKey = `${parentKey}-${subCategory.id}`;
    const isExpanded = expandedSubCategories.has(subCategoryKey);
    return (
      <React.Fragment key={subCategoryKey}>
        <tr className="bg-slate-100 border-t border-b border-slate-200 hover:bg-slate-200 cursor-pointer" onClick={() => toggleSubCategory(subCategoryKey)}>
          <td colSpan={5} style={{ paddingLeft: `${1.5 + level * 2}rem` }} className="px-6 py-3">
            <div className="flex items-center space-x-3">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Tag className="h-4 w-4 text-slate-700" />
              <span className="font-semibold text-slate-700">{subCategory.name}</span>
            </div>
          </td>
        </tr>
        {isExpanded && subCategory.brands.map(b => renderBrandHeader(b, subCategoryKey, level + 1))}
      </React.Fragment>
    );
  };
  
  const renderCategoryHeader = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    
    // Memperbaiki logika untuk menghitung semua produk dalam kategori
    const allProductsInCategory = [
      ...(category.brands?.flatMap(b => b.products) || []),
      ...(category.sub_categories?.flatMap(sc => sc.brands?.flatMap(b => b.products) || []) || [])
    ].filter(Boolean);
    const productCount = allProductsInCategory.length;

    return (
      <React.Fragment key={category.id}>
        <tr className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 cursor-pointer" onClick={() => toggleCategory(category.id)}>
          <td colSpan={5} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{category.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                </div>
              </div>
              <div
                className="flex items-center space-x-4 w-full"
                style={{
                  minWidth: 0,
                  justifyContent: 'flex-end',
                  flexWrap: 'nowrap',
                  gap: '1rem',
                }}
              >
                {(() => {
                  if (productCount === 0) {
                    return (
                      <div
                        className="bg-slate-200 text-slate-600 text-sm font-medium flex items-center justify-center"
                        style={{
                          minWidth: 120,
                          width: 120,
                          height: 32,
                          borderRadius: 8,
                          padding: '0 12px',
                        }}
                      >
                        Tidak ada produk
                      </div>
                    );
                  }
                  
                  const prices = allProductsInCategory
                    .map((p: Product) => p.price)
                    .filter((h: number) => typeof h === 'number');

                  if (prices.length === 0) {
                    return (
                       <div
                        className="bg-slate-200 text-slate-600 text-sm font-medium flex items-center justify-center"
                        style={{
                          minWidth: 120,
                          width: 120,
                          height: 32,
                          borderRadius: 8,
                          padding: '0 12px',
                        }}
                      >
                        Tidak ada harga
                      </div>
                    );
                  }
                  
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  
                  const formatShort = (value: number) => {
                    if (value >= 1_000_000) {
                      return (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1) + 'jt';
                    }
                    if (value >= 1_000) {
                      return (value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1) + 'k';
                    }
                    return value.toString();
                  };
                  return (
                    <div
                      className="bg-blue-100 text-blue-800 text-sm font-semibold flex items-center justify-center"
                      style={{
                        minWidth: 120,
                        maxWidth: 160,
                        height: 32,
                        borderRadius: 8,
                        padding: '0 12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {minPrice === maxPrice
                        ? `Rp ${formatShort(minPrice)}`
                        : `Rp ${formatShort(minPrice)} - ${formatShort(maxPrice)}`}
                    </div>
                  );
                })()}
                {isAdminMode && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddProduct?.(category.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200 flex-shrink-0"
                      title="Tambah Produk"
                      style={{
                        minWidth: 36,
                        minHeight: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory?.(category.name);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200 flex-shrink-0"
                      title="Hapus Kategori"
                      style={{
                        minWidth: 36,
                        minHeight: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
        {isExpanded && (
          <>
            {category.sub_categories.map(sc => renderSubCategoryHeader(sc, `cat-${category.id}`, 1))}
            {category.brands.map(b => renderBrandHeader(b, `cat-${category.id}`, 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  // Mobile Tutorial Component
  const MobileTutorial = () => (
    <div className="mobile-tutorial-overlay">
      <div className="mobile-tutorial-content">
        <div className="text-center">
          <Smartphone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Cara Menggunakan Katalog</h3>
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Geser Kanan-Kiri</p>
                <p className="text-sm text-slate-600">Geser jari ke kanan atau kiri untuk melihat informasi lengkap produk</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Klik Kategori</p>
                <p className="text-sm text-slate-600">Klik nama kategori untuk melihat produk di dalamnya</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Pilih Jumlah</p>
                <p className="text-sm text-slate-600">Pilih jumlah yang diinginkan, lalu klik tombol "Beli"</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowMobileTutorial(false)}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );

  // Scroll Hint Component
  const ScrollHint = () => {
    if (!showScrollHint || !isMobile) return null;
    
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-medium z-40 shadow-lg animate-pulse">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Geser untuk melihat lebih</span>
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    );
  };

  // Simple Hint Component
  const SimpleHint = () => {
    if (!showSimpleHint || !isMobile) return null;
    
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium z-40 animate-pulse">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4" />
          <span>Klik kategori untuk melihat produk</span>
        </div>
      </div>
    );
  };

  return (
    <div ref={catalogSectionRef} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Title Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span>Katalog Produk</span>
          </h2>
          <div className="flex items-center space-x-2">
            {isMobile && (
              <button
                onClick={() => setShowMobileTutorial(true)}
                className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-colors"
                title="Bantuan Mobile"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )}
            {isAdminMode && (
              <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                Mode Admin
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Table Panel */}
      <div ref={tableRef} className={`overflow-auto max-h-[70vh] relative ${isMobile ? 'mobile-table-container' : ''}`}>
        <table className="w-full min-w-[800px]" style={{ borderSpacing: 0, borderCollapse: 'separate' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={`px-6 py-4 text-left text-sm font-semibold text-slate-700 w-1/3 bg-slate-100 border-b border-slate-300 ${isMobile ? 'mobile-table-cell mobile-table-cell-product' : ''}`}>Produk</th>
              <th className={`px-6 py-4 text-left text-sm font-semibold text-slate-700 w-1/4 bg-slate-100 border-b border-slate-300 ${isMobile ? 'mobile-table-cell mobile-table-cell-specs' : ''}`}>Spesifikasi</th>
              <th className={`px-6 py-4 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300 ${isMobile ? 'mobile-table-cell mobile-table-cell-price' : ''}`}>Harga</th>
              <th className={`px-6 py-4 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300 ${isMobile ? 'mobile-table-cell mobile-table-cell-qty' : ''}`}>Kuantitas</th>
              <th className={`px-6 py-4 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300 ${isMobile ? 'mobile-table-cell mobile-table-cell-action' : ''}`}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map(category => renderCategoryHeader(category))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-slate-600">
          {categories && (
            <div>
              Total: {categories.length} kategori dengan{' '}
              {categories.reduce((acc, cat) => 
                acc + [
                  ...(cat.brands?.flatMap(b => b.products) || []),
                  ...(cat.sub_categories?.flatMap(sc => sc.brands?.flatMap(b => b.products) || []) || [])
                ].length
              , 0)} produk
            </div>
          )}
          <div className="text-xs">
            Klik pada kategori untuk melihat detail produk
          </div>
        </div>
      </div>

      {/* Mobile Tutorial */}
      {showMobileTutorial && <MobileTutorial />}
      
      {/* Scroll Hint */}
      <ScrollHint />

      {/* Simple Hint */}
      <SimpleHint />
    </div>
  );
};

export default NestedProductTable;