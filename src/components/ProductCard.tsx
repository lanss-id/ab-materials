import React from 'react';
import { ShoppingCart, Info, Star, Truck } from 'lucide-react';

interface Product {
  ukuran?: string;
  jenis?: string;
  diameter_mm?: number;
  harga: number;
  aplikasi?: string;
  dimensi?: string;
  warna?: string;
  grade?: string;
}

interface ProductCardProps {
  product: Product;
  categoryName: string;
  isPromoted?: boolean;
  discountPercent?: number;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  isPromoted = false,
  discountPercent = 0,
  onAddToCart,
  onViewDetails
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const originalPrice = product.harga;
  const discountedPrice = discountPercent > 0 ? originalPrice * (1 - discountPercent / 100) : originalPrice;

  const productName = product.ukuran || product.jenis || 'Produk';

  return (
    <div className={`group relative bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden ${
      isPromoted ? 'border-orange-200 ring-2 ring-orange-100' : 'border-slate-200 hover:border-blue-200'
    }`}>
      {/* Promotional Badge */}
      {isPromoted && discountPercent > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
            -{discountPercent}%
          </div>
        </div>
      )}

      {/* Special Offer Badge */}
      {isPromoted && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-full shadow-lg">
            <Star className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Product Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
              {productName}
            </h3>
            <p className="text-sm text-slate-500 font-medium">{categoryName}</p>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-2 mb-4">
          {product.diameter_mm && (
            <div className="flex items-center text-sm text-slate-600">
              <span className="font-medium">Diameter:</span>
              <span className="ml-2">{product.diameter_mm}mm</span>
            </div>
          )}
          {product.dimensi && (
            <div className="flex items-center text-sm text-slate-600">
              <span className="font-medium">Dimensi:</span>
              <span className="ml-2">{product.dimensi}</span>
            </div>
          )}
          {product.warna && (
            <div className="flex items-center text-sm text-slate-600">
              <span className="font-medium">Warna:</span>
              <span className="ml-2">{product.warna}</span>
            </div>
          )}
          {product.aplikasi && (
            <div className="text-sm text-slate-600">
              <span className="font-medium">Aplikasi:</span>
              <p className="mt-1 text-xs leading-relaxed">{product.aplikasi}</p>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-700">
              {formatPrice(discountedPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Harga per unit</p>
        </div>

        {/* Free Delivery Badge */}
        {isPromoted && (
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg mb-4">
            <Truck className="h-4 w-4" />
            <span className="text-sm font-medium">Gratis Ongkir Jabodetabek</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex space-x-2">
          <button
            onClick={onAddToCart}
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
          >
            <ShoppingCart className="h-4 w-4 group-hover:animate-bounce" />
            <span>Tambah</span>
          </button>
          <button
            onClick={onViewDetails}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;