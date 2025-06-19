import React, { useState } from 'react';
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

function App() {
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [productViewMode, setProductViewMode] = useState<'table' | 'card'>('table');

  const handlePromoClick = () => {
    // Handle promotional CTA click
    console.log('Promo clicked!');
  };

  // Set promo end date (7 days from now)
  const promoEndDate = new Date();
  promoEndDate.setDate(promoEndDate.getDate() + 7);

  if (currentView === 'admin') {
    return <AdminPanel />;
  }

  return (
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
                <Phone className="h-4 w-4" />
                <span>+62 812-3456-7890</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Mail className="h-4 w-4" />
                <span>info@abmaterial.co.id</span>
              </div>
              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </button>
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
              <button className="group bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <span className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Dapatkan Penawaran Sekarang</span>
                </span>
              </button>
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
            title="Mega Sale Material Konstruksi"
            subtitle="Dapatkan diskon fantastis untuk semua kebutuhan material proyek Anda. Penawaran terbatas!"
            discountPercent={25}
            endDate={promoEndDate}
            ctaText="Ambil Penawaran Sekarang"
            onCtaClick={handlePromoClick}
            gimmickType="pulse"
          />
        </div>
      </section>

      {/* Product Table */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div className="text-center w-full">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                Katalog Produk Lengkap
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Jelajahi koleksi lengkap material konstruksi berkualitas tinggi dengan harga terbaik. 
                Klik pada kategori untuk melihat detail produk dan spesifikasi.
              </p>
            </div>
            <div className="flex items-center space-x-2 absolute right-8">
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
          </div>
          {productViewMode === 'table' ? (
            <NestedProductTable />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(() => {
                const categories = constructionData.daftar_produk_konstruksi.kategori;
                const allProducts: any[] = [];
                categories.forEach(category => {
                  if (category.produk) {
                    category.produk.forEach(product => {
                      allProducts.push({
                        ...product,
                        categoryName: category.nama
                      });
                    });
                  }
                  if (category.sub_kategori) {
                    category.sub_kategori.forEach(subCat => {
                      if (subCat.produk) {
                        subCat.produk.forEach(product => {
                          allProducts.push({
                            ...product,
                            categoryName: `${category.nama} - ${subCat.merk}`
                          });
                        });
                      }
                    });
                  }
                });
                return allProducts.map((product, idx) => (
                  <ProductCard
                    key={idx}
                    product={product}
                    categoryName={product.categoryName}
                  />
                ));
              })()}
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
              <div className="flex items-center space-x-3 text-slate-700">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-700" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Hotline 24/7</p>
                  <p className="text-sm text-slate-500">+62 812-3456-7890</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-slate-300"></div>
              <div className="flex items-center space-x-3 text-slate-700">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-orange-700" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Email Kami</p>
                  <p className="text-sm text-slate-500">info@abmaterial.co.id</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;