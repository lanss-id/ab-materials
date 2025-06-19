import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, Grid, List } from 'lucide-react';
import ProductCard from './ProductCard';
import constructionData from '../data/construction_products_json.json';

const ProductShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

  // Get promoted products (first few from each category)
  const getPromotedProducts = () => {
    const promoted: any[] = [];
    constructionData.daftar_produk_konstruksi.kategori.forEach(category => {
      if (category.produk && category.produk.length > 0) {
        // Add first product from each category as promoted
        promoted.push({
          ...category.produk[0],
          categoryName: category.nama,
          categoryId: category.id,
          isPromoted: true,
          discountPercent: Math.floor(Math.random() * 20) + 10 // Random discount 10-30%
        });
      }
      
      // Handle sub-categories for non-SNI products
      if (category.sub_kategori) {
        category.sub_kategori.forEach(subCat => {
          if (subCat.produk && subCat.produk.length > 0) {
            promoted.push({
              ...subCat.produk[0],
              categoryName: `${category.nama} - ${subCat.merk}`,
              categoryId: category.id,
              isPromoted: true,
              discountPercent: Math.floor(Math.random() * 15) + 5
            });
          }
        });
      }
    });
    return promoted.slice(0, 12); // Limit to 12 promoted products
  };

  const getAllProducts = () => {
    const allProducts: any[] = [];
    constructionData.daftar_produk_konstruksi.kategori.forEach(category => {
      if (category.produk) {
        category.produk.forEach(product => {
          allProducts.push({
            ...product,
            categoryName: category.nama,
            categoryId: category.id,
            isPromoted: false
          });
        });
      }
      
      if (category.sub_kategori) {
        category.sub_kategori.forEach(subCat => {
          if (subCat.produk) {
            subCat.produk.forEach(product => {
              allProducts.push({
                ...product,
                categoryName: `${category.nama} - ${subCat.merk}`,
                categoryId: category.id,
                isPromoted: false
              });
            });
          }
        });
      }
    });
    return allProducts;
  };

  const promotedProducts = getPromotedProducts();
  const allProducts = getAllProducts();
  
  const filteredProducts = selectedCategory 
    ? allProducts.filter(p => p.categoryId === selectedCategory)
    : [...promotedProducts, ...allProducts];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const categories = constructionData.daftar_produk_konstruksi.kategori;

  const handleAddToCart = (product: any) => {
    // Add to cart logic
    console.log('Added to cart:', product);
  };

  const handleViewDetails = (product: any) => {
    // View details logic
    console.log('View details:', product);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Produk Unggulan
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Temukan material konstruksi berkualitas tinggi dengan harga terbaik. 
            Produk pilihan untuk proyek Anda di Bandung dan Jabodetabek.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 space-y-4 lg:space-y-0">
          {/* Category Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-700">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filter:</span>
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? parseInt(e.target.value) : null);
                setCurrentPage(0);
              }}
              className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.nama}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className={`grid gap-6 mb-12 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {currentProducts.map((product, index) => (
            <ProductCard
              key={`${product.categoryId}-${index}`}
              product={product}
              categoryName={product.categoryName}
              isPromoted={product.isPromoted}
              discountPercent={product.discountPercent}
              onAddToCart={() => handleAddToCart(product)}
              onViewDetails={() => handleViewDetails(product)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors duration-200 ${
                    currentPage === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductShowcase;