import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import ProductCard from './ProductCard';
import { Package } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';

// Tipe data ini harus konsisten dengan yang didefinisikan di App.tsx
// atau diimpor dari file tipe data terpusat.
interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  metadata?: any;
  brandName?: string;
  subCategoryName?: string;
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

interface ProductShowcaseProps {
  categories: Category[];
  quantities: { [key: string]: number };
  onQuantityChange: (key: string, value: number) => void;
  getDiscountForProduct: (productId: number) => number;
  onSingleCheckout?: (product: Product, qty: number) => void;
}

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ categories, quantities, onQuantityChange, getDiscountForProduct, onSingleCheckout }) => {
  return (
    <div className="space-y-12">
      {categories.map((category) => {
        // Gabungkan semua produk dari kategori ini
        const allProducts: Product[] = [
          ...category.brands.flatMap(brand => 
            brand.products.map(p => ({ ...p, brandName: brand.name }))
          ),
          ...category.sub_categories.flatMap(sc => 
            sc.brands.flatMap(brand => 
              brand.products.map(p => ({ ...p, brandName: brand.name, subCategoryName: sc.name }))
            )
          )
        ];

        // Saring produk untuk memastikan keunikannya berdasarkan ID produk
        const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());

        if (uniqueProducts.length === 0) return null;

        return (
          <div key={category.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
                <Package className="w-6 h-6 text-blue-600" />
                <span>{category.name}</span>
              </h2>
              <p className="text-slate-600 mt-1">{category.description}</p>
            </div>
            
            <div className="p-6 product-showcase-container">
              <Swiper
                modules={[Pagination]}
                spaceBetween={24}
                slidesPerView={1.5}
                pagination={{ clickable: true, dynamicBullets: true }}
                breakpoints={{
                  640: { slidesPerView: 2.5, spaceBetween: 20 },
                  768: { slidesPerView: 3.5, spaceBetween: 24 },
                  1024: { slidesPerView: 4.5, spaceBetween: 30 },
                }}
                className="!pb-12" // Menambah padding bawah untuk pagination
              >
                {uniqueProducts.map((product) => (
                  <SwiperSlide key={product.id} className="h-full">
                    <ProductCard
                      product={product}
                      categoryName={category.name}
                      subCategoryName={product.subCategoryName}
                      brandName={product.brandName}
                      quantity={quantities[`product-${product.id}`] || 0}
                      onQuantityChange={(val) => onQuantityChange(`product-${product.id}`, val)}
                      getDiscountForProduct={getDiscountForProduct}
                      onSingleCheckout={onSingleCheckout}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductShowcase;