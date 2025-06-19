import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Plus,
  ShoppingCart,
  Tag,
  Package,
  DollarSign
} from 'lucide-react';
import constructionData from '../data/construction_products_json.json';

interface Product {
  ukuran?: string;
  jenis?: string;
  diameter_mm?: number;
  harga: number;
  aplikasi?: string;
  dimensi?: string;
  warna?: string;
  grade?: string;
  kemasan?: string;
  panjang?: string;
}

interface Category {
  id: number;
  nama: string;
  deskripsi: string;
  produk?: Product[];
  sub_kategori?: {
    merk: string;
    produk: Product[];
  }[];
}

interface NestedProductTableProps {
  onEditProduct?: (categoryId: number, product: Product, index: number) => void;
  onDeleteProduct?: (categoryId: number, index: number) => void;
  onAddProduct?: (categoryId: number) => void;
  isAdminMode?: boolean;
}

const NestedProductTable: React.FC<NestedProductTableProps> = ({
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  isAdminMode = false
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());

  const categories: Category[] = constructionData.daftar_produk_konstruksi.kategori;

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubCategory = (key: string) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubCategories(newExpanded);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductName = (product: Product) => {
    return product.ukuran || product.jenis || 'Produk';
  };

  const renderProductRow = (
    product: Product, 
    categoryId: number, 
    index: number, 
    isSubProduct = false,
    subCategoryKey?: string
  ) => (
    <tr 
      key={`${categoryId}-${index}-${subCategoryKey || 'main'}`}
      className={`${isSubProduct ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}
    >
      <td className={`px-6 py-4 ${isSubProduct ? 'pl-12' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isSubProduct ? 'bg-slate-400' : 'bg-blue-500'}`}></div>
          <div>
            <div className="font-medium text-slate-900">{getProductName(product)}</div>
            {product.aplikasi && (
              <div className="text-sm text-slate-500 mt-1">{product.aplikasi}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="space-y-1">
          {product.diameter_mm && (
            <div className="text-sm text-slate-600">⌀ {product.diameter_mm}mm</div>
          )}
          {product.dimensi && (
            <div className="text-sm text-slate-600">{product.dimensi}</div>
          )}
          {product.warna && (
            <div className="text-sm text-slate-600">Warna: {product.warna}</div>
          )}
          {product.grade && (
            <div className="text-sm text-slate-600">Grade: {product.grade}</div>
          )}
          {product.kemasan && (
            <div className="text-sm text-slate-600">Kemasan: {product.kemasan}</div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-lg font-bold text-blue-700">
          {formatPrice(product.harga)}
        </div>
        <div className="text-xs text-slate-500">per unit</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {isAdminMode ? (
            <>
              <button
                onClick={() => onEditProduct?.(categoryId, product, index)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                title="Edit Produk"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteProduct?.(categoryId, index)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                title="Hapus Produk"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Beli</span>
              </button>
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                Detail
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCategoryHeader = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    const productCount = (category.produk?.length || 0) + 
      (category.sub_kategori?.reduce((acc, sub) => acc + (sub.produk?.length || 0), 0) || 0);

    return (
      <tr 
        key={`category-${category.id}`}
        className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 cursor-pointer transition-all duration-200"
        onClick={() => toggleCategory(category.id)}
      >
        <td colSpan={4} className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                )}
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{category.nama}</h3>
                <p className="text-sm text-slate-600 mt-1">{category.deskripsi}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {productCount} produk
              </div>
              {isAdminMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddProduct?.(category.id);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
                  title="Tambah Produk"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderSubCategoryHeader = (subCategory: any, categoryId: number) => {
    const subKey = `${categoryId}-${subCategory.merk}`;
    const isExpanded = expandedSubCategories.has(subKey);

    return (
      <tr 
        key={`subcategory-${subKey}`}
        className="bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors duration-200"
        onClick={() => toggleSubCategory(subKey)}
      >
        <td colSpan={4} className="px-6 py-3 pl-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
                <Tag className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-700">Merk: {subCategory.merk}</h4>
              </div>
            </div>
            <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
              {subCategory.produk?.length || 0} varian
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span>Katalog Produk Material Konstruksi</span>
          </h2>
          {isAdminMode && (
            <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
              Mode Admin
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Produk & Deskripsi
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Spesifikasi
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Harga</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              
              return (
                <React.Fragment key={category.id}>
                  {renderCategoryHeader(category)}
                  
                  {isExpanded && (
                    <>
                      {/* Direct products */}
                      {category.produk?.map((product, index) => 
                        renderProductRow(product, category.id, index)
                      )}
                      
                      {/* Sub-categories */}
                      {category.sub_kategori?.map((subCategory) => {
                        const subKey = `${category.id}-${subCategory.merk}`;
                        const isSubExpanded = expandedSubCategories.has(subKey);
                        
                        return (
                          <React.Fragment key={subKey}>
                            {renderSubCategoryHeader(subCategory, category.id)}
                            
                            {isSubExpanded && subCategory.produk?.map((product, index) => 
                              renderProductRow(product, category.id, index, true, subKey)
                            )}
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Total: {categories.length} kategori dengan{' '}
            {categories.reduce((acc, cat) => 
              acc + (cat.produk?.length || 0) + 
              (cat.sub_kategori?.reduce((subAcc, sub) => subAcc + (sub.produk?.length || 0), 0) || 0)
            , 0)} produk
          </div>
          <div className="text-xs">
            Klik pada kategori untuk melihat detail produk
          </div>
        </div>
      </div>
    </div>
  );
};

export default NestedProductTable;