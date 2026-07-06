import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import ProductModal from '../components/ProductModal';
import bgImage from '../assets/bg.JPG';

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
    <main className="max-w-7xl mx-auto p-4 py-6 flex-1 w-full flex flex-col gap-6">
      
      {/* ---------------- Compact & Beautiful Hero Section ---------------- */}
      <div 
          className="relative rounded-3xl overflow-hidden shadow-sm border border-gray-200 bg-white"
          style={{
            // import गरेको bgImage लाई यहाँ यसरी राख्ने
            backgroundImage: `url(${bgImage})`, 
            backgroundSize: 'contain', 
            backgroundPosition: 'right center', 
            backgroundRepeat: 'no-repeat'
          }}
        >
        {/* लाइट ओभरले (Text प्रस्ट देखिनको लागि सेतो/निलो पारदर्शी तह) */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent md:to-white/30"></div>

        <div className="relative z-10 p-6 md:p-10 w-full md:w-3/4 lg:w-3/5">
          
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-flex items-center gap-1.5 border border-blue-200">
            <ShieldCheck size={16} className="text-blue-600" />
            १००% शुद्ध र गुणस्तरीय
          </span>
          
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-gray-900 leading-tight">
            तपाईंको भान्साको आवश्यकता,<br/>
            <span className="text-blue-600">अब एउटै छानामुनि</span>
          </h1>
          
          <p className="text-sm md:text-base text-gray-600 mb-6 font-medium max-w-lg">
            चामल, दाल, तेलदेखि ग्याससम्म—दैनिक उपभोग्य सम्पूर्ण सामान घरमै बसी अर्डर गर्नुहोस्।
          </p>
          
          {/* Compact Search Bar */}
          <div className="flex items-center bg-white rounded-xl shadow-md border border-gray-200 p-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-all max-w-lg">
            <Search className="text-gray-400 ml-3" size={20} />
            <input 
              type="text" 
              placeholder="सामान खोज्नुहोस्..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full py-2 px-3 text-gray-800 outline-none text-sm md:text-base bg-transparent" 
            />
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors whitespace-nowrap">
              खोज्नुहोस्
            </button>
          </div>
          
          <div className="flex items-center gap-5 mt-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Clock size={16} className="text-emerald-500" /> समयमै डेलिभरी
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Sparkles size={16} className="text-yellow-500" /> सस्तो मूल्य
            </div>
          </div>
          
        </div>
      </div>

      {/* ---------------- Category Filter ---------------- */}
      <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar items-center">
        <span className="font-bold text-gray-500 mr-2 uppercase tracking-wide text-xs hidden sm:block">Filter:</span>
        {categories.map(category => (
          <button 
            key={category} 
            onClick={() => setSelectedCategory(category)} 
            className={`whitespace-nowrap px-5 py-2 rounded-xl font-bold text-sm transition shadow-sm border ${selectedCategory === category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* ---------------- Products Grid ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 mt-2">
        {filteredProducts.map(product => {
          const defaultTier = product.pricing?.[0] || { price: 0, measureUnit: 'N/A', measureQty: 'N/A' };
          return (
            <div 
              key={product._id} 
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col group cursor-pointer overflow-hidden" 
              onClick={() => setSelectedProduct(product)}
            >
              <div className="relative bg-white pt-2 h-40 md:h-44">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-2xl" 
                />
              </div>

              <div className="bg-[#f2f7ff] p-4 flex flex-col flex-1 border-t border-blue-100/50 rounded-b-2xl">
                <span className="text-[10px] md:text-xs text-blue-600 font-bold uppercase tracking-wide mb-1.5">
                  {product.category}
                </span>
                
                <h3 className="text-sm md:text-base font-bold text-gray-800 leading-tight mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-base md:text-lg font-black text-gray-900">
                    Rs. {defaultTier.price}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500 font-semibold">
                    / {defaultTier.measureQty} {defaultTier.measureUnit}
                  </span>
                </div>
                
                <div className="mt-auto">
                  <button className="w-full bg-[#3b82f6] text-white py-2 md:py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm">
                    <ShoppingCart size={16} />
                    Order Now
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}