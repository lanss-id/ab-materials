import React from 'react';
import { ShoppingCart, Info, Truck, Tag } from 'lucide-react';
import QuantityControl from './QuantityControl';
import { roundToNearestHundred } from '../utils/priceUtils';

// Definisi tipe yang konsisten dengan data yang diterima
interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  metadata?: any;
}

interface ProductCardProps {
  product: Product;
  categoryName: string;
  subCategoryName?: string;
  brandName?: string;
  isPromoted?: boolean;
  getDiscountForProduct: (productId: number) => number;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onSingleCheckout?: (product: Product, qty: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  subCategoryName,
  brandName,
  isPromoted = false,
  getDiscountForProduct,
  quantity,
  onQuantityChange,
  onSingleCheckout
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discountPercent = getDiscountForProduct(product.id);
  const originalPrice = product.price;
  const finalPrice = discountPercent > 0 ? originalPrice * (1 - discountPercent / 100) : originalPrice;
  const productName = product.name;

  return (
    <div className={`group relative bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden flex flex-col h-full ${
      isPromoted ? 'border-orange-200 ring-2 ring-orange-100' : 'border-slate-200 hover:border-blue-200'
    }`}>
      
      {/* Badges */}
      <div className="p-6 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-blue-800 bg-blue-100">
            {categoryName}
          </span>
          {subCategoryName && (
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-800 bg-teal-100">
              {subCategoryName}
            </span>
          )}
          {brandName && (
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-slate-700 bg-slate-200">
              {brandName}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6 pt-0 flex-grow">
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 mb-3">
          {productName}
        </h3>

        {/* Product Details from Metadata */}
        <div className="space-y-1 mb-4 text-sm text-slate-600 border-t border-b border-slate-100 py-3">
          {Object.entries(product.metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="font-medium capitalize text-slate-500">{key.replace(/_/g, ' ')}</span>
              <span className="text-right font-semibold text-slate-700">{String(value)}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mb-4">
          {discountPercent > 0 ? (
            <>
              <p className="text-sm text-slate-400 line-through mb-1">{formatPrice(originalPrice)}</p>
              <p className="text-2xl font-bold text-orange-600">{formatPrice(finalPrice)}</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-800">{formatPrice(originalPrice)}</p>
          )}
        </div>

        <div className="my-3">
          <QuantityControl value={quantity} onChange={onQuantityChange} min={0} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6 bg-slate-50 pt-4 border-t">
        <div className="flex space-x-2">
          {(() => {
            const roundedFinalPrice = roundToNearestHundred(finalPrice);
            const subtotal = roundedFinalPrice * quantity;
            const path = `${categoryName}${subCategoryName ? ` > ${subCategoryName}` : ''}${brandName ? ` > ${brandName}` : ''}`;
            
            if (quantity > 0) {
              return (
                <button
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                  onClick={() => onSingleCheckout && onSingleCheckout(product, quantity)}
                >
                  <ShoppingCart className="h-4 w-4 group-hover:animate-bounce" />
                  <span>Beli</span>
                </button>
              );
            }
            return (
              <button
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-3 rounded-lg font-semibold opacity-50 cursor-not-allowed flex items-center justify-center space-x-2"
                disabled
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Beli</span>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;