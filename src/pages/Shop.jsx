import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import axios from 'axios';
import ProductModal from '../components/ProductModal';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    axios.get('https://kiranastore-luig.onrender.com/api/categories').then(res => setCategories(['All', ...res.data.map(c => c.name)]));
    axios.get('https://kiranastore-luig.onrender.com/api/products').then(res => setProducts(res.data));
  }, []);

  let filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (sortBy === 'price-low') filteredProducts.sort((a, b) => (a.pricing?.[0]?.price || 0) - (b.pricing?.[0]?.price || 0));
  else if (sortBy === 'price-high') filteredProducts.sort((a, b) => (b.pricing?.[0]?.price || 0) - (a.pricing?.[0]?.price || 0));

  return (
    <main className="max-w-7xl mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8 flex-1">
      
      <aside className="w-full md:w-1/4 lg:w-1/5 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:sticky top-24">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="text" placeholder="सामान खोज्नुहोस्..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 outline-none font-medium" />
          </div>
          <div className="border-t border-gray-100 pt-5 mb-5">
            <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2"><SlidersHorizontal size={18} className="text-blue-600"/> Categories</h3>
            <div className="flex md:flex-col overflow-x-auto gap-2 pb-2 hide-scrollbar">
              {categories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedCategory === category ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-blue-50'}`}>{category}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <p className="text-gray-600 font-bold">Showing <span className="text-blue-700">{filteredProducts.length}</span> products</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500">Sort By:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg p-2.5 font-bold outline-none">
              <option value="default">Default</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map(product => {
            const defaultTier = product.pricing?.[0] || { price: 0, measureUnit: 'N/A' };
            return (
              <div key={product._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <div className="relative bg-gray-100 aspect-square overflow-hidden"><img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /></div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1 block">{product.category}</span>
                  <h3 className="text-sm md:text-base font-bold text-gray-800 leading-snug line-clamp-2 mb-2">{product.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-black text-gray-900">Rs {defaultTier.price}</span>
                    <button className="bg-blue-50 text-blue-700 p-2 rounded-xl hover:bg-blue-600 hover:text-white transition-colors active:scale-95"><Plus size={20} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}