import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import NestedProductTable from '../NestedProductTable';
import { Search, Save, X, Plus, Folder, Tag, PlusCircle, Edit, Trash2 } from 'lucide-react';

// Gabungkan dan bersihkan interface
interface Product {
  id: number;
  name: string;
  price: number;
  categoryName?: string;
  subCategoryName?: string;
  brandName?: string;
  unitName?: string; // satuan produk
  unit_id?: number; // id unit
  metadata?: any;
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  categories?: { name: string }; // Untuk join
}

interface Brand {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

interface KelolaProdukPageProps {
  products: Product[];
  refreshData: () => void;
}

const KelolaProdukPage: React.FC<KelolaProdukPageProps> = ({ products, refreshData }) => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> & { category_id?: number; sub_category_id?: number; brand_id?: number; unit_id?: number } | null>(null);
  
  // State untuk manajemen Kategori
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // State untuk manajemen Sub-Kategori
  const [editingSubCategory, setEditingSubCategory] = useState<Partial<SubCategory> | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [selectedCategoryIdForSub, setSelectedCategoryIdForSub] = useState<number | null>(null);

  // State untuk manajemen Merek
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrandName, setNewBrandName] = useState('');

  // State untuk manajemen Satuan
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnitName, setNewUnitName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk dropdowns
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);

  const fetchCategories = async () => {
    const { data: categoriesData } = await supabase.from('categories').select('id, name').order('name');
    if (categoriesData) setAllCategories(categoriesData);
  };

  const fetchSubCategories = async () => {
    const { data: subCategoriesData } = await supabase.from('sub_categories').select('id, name, category_id, categories(name)').order('name');
    if (subCategoriesData) setAllSubCategories(subCategoriesData as any);
  };

  const fetchBrands = async () => {
    const { data: brandsData } = await supabase.from('brands').select('id, name').order('name');
    if (brandsData) setAllBrands(brandsData);
  };

  const fetchUnits = async () => {
    const { data: unitsData } = await supabase.from('units').select('id, name').order('name');
    if (unitsData) setAllUnits(unitsData);
  };

  // Ambil data master untuk dropdown saat komponen dimuat
  useEffect(() => {
    const fetchMasterData = async () => {
      fetchCategories();
      fetchSubCategories();
      fetchBrands();
      fetchUnits();
    };
    fetchMasterData();
  }, []);

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Nama kategori tidak boleh kosong.');
      return;
    }

    const upsertData = { name: newCategoryName.trim() };
    let error;

    if (editingCategory?.id) {
      // Update
      const { error: updateError } = await supabase.from('categories').update(upsertData).eq('id', editingCategory.id);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase.from('categories').insert(upsertData);
      error = insertError;
    }

    if (error) {
      alert('Gagal menyimpan kategori: ' + error.message);
    } else {
      alert(`Kategori berhasil ${editingCategory ? 'diperbarui' : 'ditambahkan'}!`);
      handleCancelEditCategory();
      await fetchCategories();
      await refreshData();
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.')) {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);

      if (error) {
        alert('Gagal menghapus kategori: ' + error.message);
      } else {
        alert('Kategori berhasil dihapus.');
        await fetchCategories();
        await refreshData();
      }
    }
  };

  const handleCancelEditSubCategory = () => {
    setEditingSubCategory(null);
    setNewSubCategoryName('');
    setSelectedCategoryIdForSub(null);
  };

  const handleEditSubCategory = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setNewSubCategoryName(subCategory.name);
    setSelectedCategoryIdForSub(subCategory.category_id);
  };

  const handleSaveSubCategory = async () => {
    if (!newSubCategoryName.trim() || !selectedCategoryIdForSub) {
      alert('Nama sub-kategori dan kategori induk harus diisi.');
      return;
    }

    const upsertData = { 
      name: newSubCategoryName.trim(),
      category_id: selectedCategoryIdForSub,
    };
    let error;

    if (editingSubCategory?.id) {
      const { error: updateError } = await supabase.from('sub_categories').update(upsertData).eq('id', editingSubCategory.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('sub_categories').insert(upsertData);
      error = insertError;
    }

    if (error) {
      alert('Gagal menyimpan sub-kategori: ' + error.message);
    } else {
      alert(`Sub-kategori berhasil ${editingSubCategory ? 'diperbarui' : 'ditambahkan'}!`);
      handleCancelEditSubCategory();
      await fetchSubCategories();
      await refreshData();
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus sub-kategori ini? Tindakan ini tidak dapat dibatalkan.')) {
      const { error } = await supabase.from('sub_categories').delete().eq('id', subCategoryId);

      if (error) {
        alert('Gagal menghapus sub-kategori: ' + error.message);
      } else {
        alert('Sub-kategori berhasil dihapus.');
        await fetchSubCategories();
        await refreshData();
      }
    }
  };

  const handleCancelEditBrand = () => {
    setEditingBrand(null);
    setNewBrandName('');
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setNewBrandName(brand.name);
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      alert('Nama merek tidak boleh kosong.');
      return;
    }

    const upsertData = { name: newBrandName.trim() };
    let error;

    if (editingBrand?.id) {
      const { error: updateError } = await supabase.from('brands').update(upsertData).eq('id', editingBrand.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('brands').insert(upsertData);
      error = insertError;
    }

    if (error) {
      alert('Gagal menyimpan merek: ' + error.message);
    } else {
      alert(`Merek berhasil ${editingBrand ? 'diperbarui' : 'ditambahkan'}!`);
      handleCancelEditBrand();
      await fetchBrands();
      await refreshData();
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus merek ini? Tindakan ini tidak dapat dibatalkan.')) {
      const { error } = await supabase.from('brands').delete().eq('id', brandId);

      if (error) {
        alert('Gagal menghapus merek: ' + error.message);
      } else {
        alert('Merek berhasil dihapus.');
        await fetchBrands();
        await refreshData();
      }
    }
  };

  const handleCancelEditUnit = () => {
    setEditingUnit(null);
    setNewUnitName('');
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setNewUnitName(unit.name);
  };

  const handleSaveUnit = async () => {
    if (!newUnitName.trim()) {
      alert('Nama satuan tidak boleh kosong.');
      return;
    }
    const upsertData = { name: newUnitName.trim() };
    let error;
    if (editingUnit?.id) {
      const { error: updateError } = await supabase.from('units').update(upsertData).eq('id', editingUnit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('units').insert(upsertData);
      error = insertError;
    }
    if (error) {
      alert('Gagal menyimpan satuan: ' + error.message);
    } else {
      alert(`Satuan berhasil ${editingUnit ? 'diperbarui' : 'ditambahkan'}!`);
      handleCancelEditUnit();
      await fetchUnits();
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus satuan ini?')) {
      const { error } = await supabase.from('units').delete().eq('id', unitId);
      if (error) {
        alert('Gagal menghapus satuan: ' + error.message);
      } else {
        alert('Satuan berhasil dihapus.');
        await fetchUnits();
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    const category = allCategories.find(c => c.name === product.categoryName);
    const subCategory = allSubCategories.find(s => s.name === product.subCategoryName);
    const brand = allBrands.find(b => b.name === product.brandName);
    const unit = allUnits.find(u => u.name === product.unitName);

    setEditingProduct({
        ...product,
        category_id: category?.id,
        sub_category_id: subCategory?.id,
        brand_id: brand?.id,
        unit_id: unit?.id,
    });
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct({ name: '', price: 0, metadata: {}, unit_id: undefined });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    const productData = {
      name: editingProduct.name,
      price: editingProduct.price,
      brand_id: editingProduct.brand_id,
      unit_id: editingProduct.unit_id,
      metadata: typeof editingProduct.metadata === 'string' 
        ? JSON.parse(editingProduct.metadata) 
        : editingProduct.metadata,
    };
    
    let sanitizedData: any = {};
    for (const key in productData) {
      if (productData[key as keyof typeof productData] !== undefined) {
        sanitizedData[key] = productData[key as keyof typeof productData];
      }
    }
    
    let error;
    if (editingProduct.id) {
      const { error: updateError } = await supabase.from('products').update(sanitizedData).eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('products').insert([sanitizedData]);
      error = insertError;
    }

    if (error) {
      alert('Gagal menyimpan produk: ' + error.message);
    } else {
      alert('Produk berhasil disimpan!');
      setShowProductModal(false);
      setEditingProduct(null);
      refreshData();
    }
  };
  
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini? Produk yang dihapus tidak dapat dikembalikan.')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        alert('Gagal menghapus produk: ' + error.message);
      } else {
        alert('Produk berhasil dihapus.');
        refreshData(); // Refresh data untuk menghilangkan produk dari tabel
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Kelola Produk</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center space-x-2 bg-gray-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-colors"
          >
            <span>Kelola Kategori</span>
          </button>
          <button 
            onClick={() => setShowSubCategoryModal(true)}
            className="flex items-center space-x-2 bg-gray-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-colors"
          >
            <span>Kelola Sub-Kategori</span>
          </button>
           <button 
            onClick={() => setShowBrandModal(true)}
            className="flex items-center space-x-2 bg-gray-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-colors"
          >
            <span>Kelola Merek</span>
          </button>
          <button 
            onClick={() => setShowUnitModal(true)}
            className="flex items-center space-x-2 bg-gray-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-colors"
          >
            <span>Kelola Satuan</span>
          </button>
          <button 
            onClick={handleAddProduct}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center mb-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Cari produk, brand, atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-slate-200 bg-slate-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Nama Produk</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Kategori</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Brand</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Harga</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{product.name}</td>
                  <td className="p-4 text-slate-600">{product.subCategoryName ? `${product.categoryName} > ${product.subCategoryName}` : product.categoryName}</td>
                  <td className="p-4 text-slate-600">{product.brandName}</td>
                  <td className="p-4 text-slate-600">Rp{product.price.toLocaleString('id-ID')}</td>
                  <td className="p-4">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleEditProduct(product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>Tidak ada produk yang cocok dengan pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* Modal untuk Kelola Kategori */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Kelola Kategori</h2>
              <button onClick={() => { setShowCategoryModal(false); handleCancelEditCategory(); }} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {editingCategory ? `Edit: ${editingCategory.name}` : 'Tambah Kategori Baru'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nama kategori..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleSaveCategory} 
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={!newCategoryName.trim()}
                  >
                    {editingCategory ? <Save className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  </button>
                  {editingCategory && (
                    <button onClick={handleCancelEditCategory} className="flex items-center space-x-2 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-3 text-slate-700">Daftar Kategori</h3>
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                  {allCategories.length > 0 ? allCategories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-slate-800">{cat.name}</span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEditCategory(cat)} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-slate-500 py-4">Belum ada kategori.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk Kelola Sub-Kategori */}
      {showSubCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Kelola Sub-Kategori</h2>
              <button onClick={() => { setShowSubCategoryModal(false); handleCancelEditSubCategory(); }} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kolom Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-700">
                  {editingSubCategory ? `Edit Sub-Kategori` : 'Tambah Sub-Kategori Baru'}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Induk</label>
                  <select
                    value={selectedCategoryIdForSub || ''}
                    onChange={(e) => setSelectedCategoryIdForSub(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Kategori Induk</option>
                    {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sub-Kategori</label>
                  <input
                    type="text"
                    placeholder="Nama sub-kategori..."
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button 
                    onClick={handleSaveSubCategory} 
                    className="flex items-center justify-center w-full space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={!newSubCategoryName.trim() || !selectedCategoryIdForSub}
                  >
                    <Save className="w-5 h-5"/>
                    <span>{editingSubCategory ? 'Simpan Perubahan' : 'Tambah Sub-Kategori'}</span>
                  </button>
                  {editingSubCategory && (
                    <button onClick={handleCancelEditSubCategory} className="flex items-center justify-center p-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Kolom Daftar */}
              <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8">
                <h3 className="font-semibold text-lg mb-3 text-slate-700">Daftar Sub-Kategori</h3>
                <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                  {allCategories.map(category => {
                    const filteredSubCategories = allSubCategories.filter(sc => sc.category_id === category.id);
                    if (filteredSubCategories.length === 0) return null;
                    return (
                      <div key={category.id}>
                        <h4 className="font-semibold text-slate-600 mb-2 sticky top-0 bg-white/80 backdrop-blur-sm py-1">{category.name}</h4>
                        <div className="space-y-2 pl-2">
                          {filteredSubCategories.map(sc => (
                             <div key={sc.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                              <span className="text-slate-800">{sc.name}</span>
                              <div className="flex items-center space-x-1">
                                <button onClick={() => handleEditSubCategory(sc)} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteSubCategory(sc.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {allSubCategories.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Belum ada sub-kategori.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk Kelola Merek */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Kelola Merek</h2>
              <button onClick={() => { setShowBrandModal(false); handleCancelEditBrand(); }} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {editingBrand ? `Edit: ${editingBrand.name}` : 'Tambah Merek Baru'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nama merek..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleSaveBrand} 
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={!newBrandName.trim()}
                  >
                    {editingBrand ? <Save className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  </button>
                  {editingBrand && (
                    <button onClick={handleCancelEditBrand} className="flex items-center space-x-2 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-3 text-slate-700">Daftar Merek</h3>
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                  {allBrands.length > 0 ? allBrands.map(brand => (
                    <div key={brand.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-slate-800">{brand.name}</span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEditBrand(brand)} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteBrand(brand.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-slate-500 py-4">Belum ada merek.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk Kelola Satuan */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Kelola Satuan</h2>
              <button onClick={() => { setShowUnitModal(false); handleCancelEditUnit(); }} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {editingUnit ? `Edit: ${editingUnit.name}` : 'Tambah Satuan Baru'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nama satuan..."
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleSaveUnit} 
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={!newUnitName.trim()}
                  >
                    {editingUnit ? <Save className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                  </button>
                  {editingUnit && (
                    <button onClick={handleCancelEditUnit} className="flex items-center space-x-2 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-semibold text-lg mb-3 text-slate-700">Daftar Satuan</h3>
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                  {allUnits.length > 0 ? allUnits.map(unit => (
                    <div key={unit.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-slate-800">{unit.name}</span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEditUnit(unit)} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteUnit(unit.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-slate-500 py-4">Belum ada satuan.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk Tambah/Edit Produk */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Nama produk..."
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga</label>
                <input
                  type="number"
                  placeholder="0"
                  value={editingProduct.price || 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Kategori</option>
                    {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <select
                    value={editingProduct.brand_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Brand</option>
                    {allBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={editingProduct.unit_id || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, unit_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Pilih Satuan</option>
                      {allUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowUnitModal(true)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs">Kelola</button>
                  </div>
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sub-Kategori (Opsional)</label>
                <select
                    value={editingProduct.sub_category_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sub_category_id: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Pilih Sub-Kategori</option>
                    {allSubCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Metadata (JSON)</label>
                <textarea
                  rows={5}
                  placeholder='{ "diameter_mm": 10, "panjang": "12m" }'
                  value={
                    editingProduct.metadata ? 
                    (typeof editingProduct.metadata === 'string' ? editingProduct.metadata : JSON.stringify(editingProduct.metadata, null, 2)) 
                    : ''
                  }
                  onChange={(e) => setEditingProduct({ ...editingProduct, metadata: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button onClick={() => setShowProductModal(false)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300">Batal</button>
              <button onClick={handleSaveProduct} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaProdukPage; 