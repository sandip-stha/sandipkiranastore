// src/components/ProductModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductModal({ product, onClose }) {
  // 🌟 NAYA: useCart बाट showToast पनि ल्यायौं
  const { addToCart, showToast } = useCart();
  const [selectedTier, setSelectedTier] = useState(null);
  const [orderQty, setOrderQty] = useState(1);

  useEffect(() => {
    if (product.pricing && product.pricing.length > 0) {
      setSelectedTier(product.pricing[0]);
      setOrderQty(product.pricing[0].measureQty); 
    } else {
      setSelectedTier({ measureQty: 1, measureUnit: 'Unit', price: product.price || 0 });
      setOrderQty(1);
    }
  }, [product]);

  const getUnitPrice = (tier) => (!tier || !tier.measureQty) ? 0 : tier.price / tier.measureQty;

  const handleAdd = () => {
    addToCart(product, selectedTier, orderQty);
    
    // 🌟 NAYA: सामान थपिएपछि UI लाई असर नपर्ने गरी सानो Toast देखाउने
    if (showToast) {
      showToast(`${product.name} Cart मा थपियो!`);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300 max-h-[90vh]">
        
        {/* Close Button - Floating at top right */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-500 transition z-20 shadow-sm border border-gray-200"
        >
          <X size={20} className="font-bold" />
        </button>

        {/* Left Side: Product Image */}
        <div className="md:w-1/2 bg-gray-50 relative min-h-[250px] md:min-h-full">
          <img 
            src={product.image} 
            alt={product.name} 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        </div>

        {/* Right Side: Product Details */}
        <div className="md:w-1/2 flex flex-col h-full max-h-[60vh] md:max-h-[90vh] bg-white">
          
          {/* Scrollable Content Area */}
          <div className="p-6 md:p-8 pt-12 md:pt-12 overflow-y-auto flex-1 hide-scrollbar">
            <span className="text-[10px] text-blue-600 font-black tracking-widest uppercase mb-2 bg-blue-50 w-max px-3 py-1 rounded-md">
              {product.category}
            </span>
            <h2 className="text-3xl font-black text-gray-800 mb-6 leading-tight">
              {product.name}
            </h2>
            
            {/* Unit Selection Grid */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Unit:</p>
              <div className="grid grid-cols-2 gap-3">
                {product.pricing && product.pricing.length > 0 ? (
                  product.pricing.map((tier, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { setSelectedTier(tier); setOrderQty(tier.measureQty); }} 
                      className={`p-3 border-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                        selectedTier === tier 
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-300 ring-offset-1' 
                        : 'border-gray-100 text-gray-500 hover:border-blue-300 bg-white shadow-sm'
                      }`}
                    >
                      <span className="text-lg font-black">{tier.measureUnit}</span>
                      <span className="text-[10px] mt-1 font-bold opacity-70">Rate: Rs {tier.price} / {tier.measureQty}{tier.measureUnit}</span>
                    </button>
                  ))
                ) : (
                  <button className="p-3 border-2 border-blue-600 bg-blue-50 text-blue-800 rounded-xl font-bold col-span-2">
                    No pricing set
                  </button>
                )}
              </div>
            </div>
            
            {/* Redesigned Quantity Input */}
            <div className="mb-6 bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
              <label className="font-bold text-gray-700 block mb-3 text-sm">
                कति <span className="text-blue-700 font-black">{selectedTier?.measureUnit || 'सामान'}</span> चाहियो?:
              </label>
              <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit">
                <input 
                  type="number" 
                  step="any" 
                  min="0.1" 
                  value={orderQty} 
                  onChange={(e) => setOrderQty(e.target.value)} 
                  className="w-24 font-black text-2xl text-center outline-none bg-transparent py-1 text-gray-800" 
                />
                <div className="w-[2px] h-8 bg-gray-100"></div>
                <span className="font-black text-gray-400 text-sm uppercase pr-4 pl-2">
                  {selectedTier?.measureUnit}
                </span>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-2">
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description || "यस प्रोडक्टको बारेमा धेरै जानकारी उपलब्ध छैन।"}
              </p>
            </div>
          </div>

          {/* Sticky Bottom Bar for Total & Add to Cart */}
          <div className="p-5 md:p-6 bg-white border-t border-gray-100 shadow-[0_-15px_30px_rgba(0,0,0,0.03)] z-10 rounded-b-3xl md:rounded-br-3xl md:rounded-bl-none">
            <div className="flex justify-between items-end mb-4 px-2">
              <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Total Price</span>
              <div className="text-3xl font-black text-blue-700">
                Rs { ((getUnitPrice(selectedTier)) * (Number(orderQty) || 0)).toFixed(2) }
              </div>
            </div>
            <button 
              onClick={handleAdd} 
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <ShoppingCart size={24} /> Add to Cart
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}