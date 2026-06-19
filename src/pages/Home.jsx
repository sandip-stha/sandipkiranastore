import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import axios from 'axios';
import ProductModal from '../components/ProductModal';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    axios.get('https://kiranastore-luig.onrender.com/api/categories')
      .then(res => setCategories(['All', ...res.data.map(c => c.name)]))
      .catch(err => console.error(err));

    axios.get('https://kiranastore-luig.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchLower) || (product.category && product.category.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="max-w-7xl mx-auto p-4 py-6 flex-1 w-full flex flex-col gap-8">
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-8 mb-4 shadow-2xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
        <div className="md:w-2/3 relative z-10">
          <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Free Local Delivery</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight">ताजा किराना सामान, <br/><span className="text-yellow-300 mt-2 block">छिटो डेलिभरी 🧑‍🏍📦</span></h1>
          <p className="text-lg text-blue-100 mb-8 max-w-md">चामल, दाल, तेल, ग्यास र हजुर को दैनिक आवस्यकता का सबै समान हरु सस्तो र सुलव मुल्य मा!</p>
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg flex items-center overflow-hidden border-2 border-transparent focus-within:border-yellow-400 transition-all">
            <Search className="text-gray-400 ml-4" size={24} />
            <input type="text" placeholder="K khojdai hunuhuncha?..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-4 px-4 text-gray-800 outline-none font-medium" />
          </div>
        </div>
      </div>

      <div className="mb-2 flex overflow-x-auto pb-4 gap-3 hide-scrollbar items-center">
        <span className="font-bold text-gray-500 mr-2 uppercase tracking-wide text-sm hidden sm:block">Filter:</span>
        {categories.map(category => (
          <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-sm border ${selectedCategory === category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}>{category}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map(product => {
          const defaultTier = product.pricing?.[0] || { price: 0, measureUnit: 'N/A' };
          return (
            <div key={product._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="relative overflow-hidden bg-gray-100"><img src={product.image} alt={product.name} className="w-full h-40 md:h-48 object-cover group-hover:scale-110 transition-transform duration-500" /></div>
              <div className="p-4 md:p-5 flex flex-col flex-1">
                <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase bg-blue-50 px-2 py-1 rounded w-max mb-2">{product.category}</span>
                <h3 className="text-sm md:text-base font-bold text-gray-800 flex-1 leading-snug line-clamp-2">{product.name}</h3>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between"><div className="text-lg md:text-xl font-black text-gray-900">Rs {defaultTier.price}</div><button className="bg-blue-600 text-white p-2 md:p-2.5 rounded-xl hover:bg-blue-700 transition-all"><Plus size={20} /></button></div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}