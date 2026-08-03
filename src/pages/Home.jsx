import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Lock, Zap } from 'lucide-react';
import axios from 'axios';
import ProductModal from '../components/ProductModal';
import bgImage from '../assets/bg.JPG';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Correct token check for sk_token
    const token = localStorage.getItem('sk_token');
    setIsLoggedIn(!!token);

    axios.get('https://kiranastore-luig.onrender.com/api/categories')
      .then(res => setCategories(['All', ...res.data.map(c => c.name)]))
      .catch(err => console.error(err));

    axios.get('https://kiranastore-luig.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  // 🟢 NAYA UPDATE: Hot Sale Products Filter
  const hotSaleProducts = products.filter(product => product.isHotSale === true);

  // Regular Filtered Products (Search + Category)
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    return matchesCategory && (product.name.toLowerCase().includes(searchLower) || (product.category && product.category.toLowerCase().includes(searchLower)));
  });

  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 md:py-4 flex-1 w-full flex flex-col gap-4">
      
      {/* ---------------- Sleek & Compact Hero Banner ---------------- */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white shadow-md">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 p-4 sm:p-6 md:p-8 flex items-center justify-between gap-4">
          <div className="w-full md:w-3/5 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              घरदैलोमै द्रुत डेलिभरी
            </span>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              दैनिक आवश्यक सामान, <span className="text-yellow-300">उत्कृष्ट मूल्यमा!</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-md line-clamp-1">
              ताजा उपभोग्य सामग्री र किराना सामान घरमै बसी सहजै अर्डर गर्नुहोस्।
            </p>

            <div className="pt-2 max-w-lg">
              <div className="flex items-center bg-white rounded-xl p-1 shadow-lg focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
                <Search className="text-gray-400 ml-3 shrink-0" size={18} />
                <input 
                  type="text" 
                  placeholder="सामान खोज्नुहोस् (उदा. चामल, तेल)..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full py-1.5 px-2 text-gray-800 outline-none text-xs sm:text-sm bg-transparent placeholder-gray-400 font-medium" 
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all shrink-0">
                  खोज्नुहोस्
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex shrink-0 w-2/5 justify-end items-center h-36">
            <img 
              src={bgImage} 
              alt="Kirana Products" 
              className="h-full object-contain rounded-xl drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* ---------------- 🔥 HOT SALES SECTION ---------------- */}
      {hotSaleProducts.length > 0 && (
        <div className="mt-2 mb-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-black text-gray-800 flex items-center gap-2">
              <span className="bg-red-100 text-red-600 px-1.5 py-1 rounded-md text-sm shadow-sm animate-pulse">🔥</span> 
              दैनिक आवश्यक (Hot Sales)
            </h2>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {hotSaleProducts.map(product => {
              const defaultTier = product.pricing?.[0] || { price: 0, measureUnit: 'N/A', measureQty: 'N/A' };
              return (
                <div 
                  key={product._id} 
                  onClick={() => setSelectedProduct(product)}
                  className="snap-start shrink-0 w-36 sm:w-44 bg-gradient-to-b from-orange-50 to-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-orange-100 flex flex-col group cursor-pointer hover:-translate-y-1"
                >
                  <div className="relative p-2 h-28 sm:h-32 flex items-center justify-center overflow-hidden">
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                      HOT
                    </span>
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-xl mix-blend-multiply" 
                    />
                  </div>

                  <div className="p-3 flex flex-col flex-1 border-t border-orange-50/50">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto">
                      {isLoggedIn ? (
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-black text-orange-600">Rs. {defaultTier.price}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">/ {defaultTier.measureQty} {defaultTier.measureUnit}</span>
                        </div>
                      ) : (
                        <div className="h-5 mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- Categories Filter Pills ---------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 hide-scrollbar mt-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Categories:</span>
        {categories.map(category => (
          <button 
            key={category} 
            onClick={() => setSelectedCategory(category)} 
            className={`whitespace-nowrap px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              selectedCategory === category 
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* ---------------- Products Grid ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {filteredProducts.map(product => {
          const defaultTier = product.pricing?.[0] || { price: 0, measureUnit: 'N/A', measureQty: 'N/A' };
          return (
            <div 
              key={product._id} 
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer overflow-hidden hover:-translate-y-1" 
              onClick={() => setSelectedProduct(product)}
            >
              <div className="relative bg-gray-50 p-2 h-36 sm:h-44 md:h-48 flex items-center justify-center overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl" 
                />
              </div>

              <div className="p-3.5 flex flex-col flex-1 bg-white">
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider mb-1">
                  {product.category}
                </span>
                
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-snug mb-2 line-clamp-2 min-h-[2.25rem]">
                  {product.name}
                </h3>
                
                {isLoggedIn ? (
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-sm sm:text-base font-black text-gray-900">
                      Rs. {defaultTier.price}
                    </span>
                    <span className="text-[11px] text-gray-500 font-semibold">
                      / {defaultTier.measureQty} {defaultTier.measureUnit}
                    </span>
                  </div>
                ) : (
                  <div className="mb-3 h-5">
                    {/* Keeps card heights aligned when logged out */}
                  </div>
                )}
                
                <div className="mt-auto">
                  {isLoggedIn ? (
                    <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                    >
                      <ShoppingCart size={15} />
                      Order Now
                    </button>
                  ) : (
                    <button 
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/login');
                      }}
                    >
                      <Lock size={15} className="text-slate-300" />
                      Login to Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          isLoggedIn={isLoggedIn}
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </main>
  );
}