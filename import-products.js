import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ES Module tidak memiliki `__dirname` bawaan, ini cara untuk membuatnya
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =================================================================
// TODO: MASUKKAN INFORMASI SUPABASE ANDA DI SINI
// Anda bisa mendapatkan informasi ini dari Supabase Dashboard Anda
// di bawah Project Settings > API.
// PENTING: Gunakan 'service_role' key untuk skrip ini agar dapat
// melewati kebijakan RLS (Row Level Security).
// =================================================================
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ROLE_KEY;
// =================================================================

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ROLE_KEY ada di file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('Memulai proses impor...');

    // 1. Hapus semua data lama untuk menghindari konflik dan duplikasi
    console.log('Menghapus data lama...');
    await supabase.from('products').delete().neq('id', 0);
    await supabase.from('brands').delete().neq('id', 0);
    await supabase.from('sub_categories').delete().neq('id', 0);
    await supabase.from('categories').delete().neq('id', 0);
    console.log('Data lama berhasil dihapus.');

    // 2. Baca file JSON baru
    const jsonPath = path.resolve(__dirname, 'src/data/construction_products_json.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(fileContent);
    console.log(`Membaca ${data.length} kategori dari file JSON.`);

    // 3. Proses dan masukkan data baru
    for (const categoryData of data) {
      // Masukkan Kategori
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert({ name: categoryData.category, description: categoryData.description })
        .select()
        .single();
      if (categoryError) throw categoryError;
      console.log(`  -> Kategori '${category.name}' berhasil dibuat.`);

      // Proses Brand di bawah Kategori (jika ada)
      if (categoryData.brands) {
        for (const brandData of categoryData.brands) {
          await processBrand(brandData, category.id, null);
        }
      }

      // Proses Sub-Kategori (jika ada)
      if (categoryData.sub_categories) {
        for (const subCategoryData of categoryData.sub_categories) {
          // Masukkan Sub-Kategori
          const { data: subCategory, error: subCategoryError } = await supabase
            .from('sub_categories')
            .insert({ name: subCategoryData.name, category_id: category.id })
            .select()
            .single();
          if (subCategoryError) throw subCategoryError;
          console.log(`    -> Sub-Kategori '${subCategory.name}' berhasil dibuat.`);

          // Proses Brand di bawah Sub-Kategori
          if (subCategoryData.brands) {
            for (const brandData of subCategoryData.brands) {
              await processBrand(brandData, category.id, subCategory.id);
            }
          }
        }
      }
    }

    console.log('\n\x1b[32m%s\x1b[0m', 'Proses impor selesai! Semua data telah berhasil dimasukkan sesuai skema baru.');

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Terjadi kesalahan saat menjalankan skrip:');
    console.error(error); // Log error secara lengkap untuk mempermudah debug
  }
}

async function processBrand(brandData, category_id, sub_category_id) {
  // Masukkan Brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      name: brandData.name,
      category_id: category_id,
      sub_category_id: sub_category_id,
    })
    .select()
    .single();
  if (brandError) throw brandError;
  console.log(`      -> Brand '${brand.name}' berhasil dibuat.`);

  // Masukkan Produk
  const productsToInsert = brandData.products.map(productData => ({
    name: productData.name,
    price: productData.price,
    brand_id: brand.id,
    image_url: productData.image || null,
    metadata: productData.metadata || {},
  }));

  const { error: productsError } = await supabase.from('products').insert(productsToInsert);
  if (productsError) throw productsError;
  console.log(`        -> ${productsToInsert.length} produk untuk brand '${brand.name}' berhasil dimasukkan.`);
}

main(); 