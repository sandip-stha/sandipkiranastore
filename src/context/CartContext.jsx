// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertCircle, Info, Share2 } from 'lucide-react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const [appModal, setAppModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', whatsappUrl: ''
  });

  const showModal = (type, title, message, whatsappUrl = '') => {
    setAppModal({ isOpen: true, type, title, message, whatsappUrl });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('sk_user');
    
    // यदि भ्यालु छ, तर "undefined" वा "null" जस्ता बिग्रिएका शब्द छैनन् भने मात्र Parse गर्ने
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Local storage error, clearing corrupted data:", error);
        localStorage.removeItem('sk_user'); 
        localStorage.removeItem('sk_token');
      }
    } else {
      // यदि "undefined" आएको छ भने त्यसलाई डिलिट गरिदिने
      localStorage.removeItem('sk_user');
    }
  }, []);

  const addToCart = (product, tier, orderQty) => {
    if (!currentUser) {
      navigate('/login'); 
      return;
    }
    if (!tier || Number(orderQty) <= 0) {
      return showModal('warning', 'Invalid Quantity', 'कृपया ठिक मात्रामा Quantity हाल्नुहोस्!');
    }

    const unitPrice = tier.price / tier.measureQty;
    const calculatedPrice = unitPrice * Number(orderQty);
    const displayUnitStr = `${orderQty} ${tier.measureUnit}`;
    const cartItemId = `${product._id}-${tier.measureUnit}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);

    if (existing) {
      setCart(cart.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = Number(item.qty) + Number(orderQty);
          return { 
            ...item, qty: newQty, finalPrice: item.unitPrice * newQty, displayUnit: `${newQty} ${item.measureUnit}`
          };
        }
        return item;
      }));
    } else {
      setCart([...cart, { 
        cartItemId, 
        productId: product._id, 
        name: product.name, 
        image: product.image, 
        measureUnit: tier.measureUnit, 
        unitPrice: unitPrice, 
        qty: Number(orderQty), 
        finalPrice: calculatedPrice, 
        displayUnit: displayUnitStr,
        pricing: product.pricing 
      }]);
    }
    
    // ❌ NAYA FIX: यहाँ तल रहेको setIsCartOpen(true); लाई हटाइएको छ 
    // ताकि Add to Cart गर्दा Cart Drawer आफै नखुलोस्।
    // setIsCartOpen(true); 
  };

  const handleCartQtyChange = (cartItemId, newQty) => {
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const qtyNum = Number(newQty);
        return { ...item, qty: qtyNum, finalPrice: item.unitPrice * qtyNum, displayUnit: `${qtyNum} ${item.measureUnit}` };
      }
      return item;
    }));
  };
  
  const removeItem = (id) => setCart(cart.filter(item => item.cartItemId !== id));
  
  const handleLogout = () => {
    localStorage.removeItem('sk_token');
    localStorage.removeItem('sk_user');
    setCurrentUser(null);
    setCart([]);
    setIsCartOpen(false);
    showModal('success', 'Logged Out', 'तपाईं सफलतापूर्वक बाहिर निस्कनुभयो।');
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0).toFixed(2);
  const totalItems = cart.length;

  const handleCartTierChange = (cartItemId, selectedTier) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartItemId === cartItemId) {
        const unitPrice = selectedTier.price / selectedTier.measureQty;
        return {
          ...item,
          displayUnit: selectedTier.measureUnit, 
          unitPrice: unitPrice,
          qty: selectedTier.measureQty, 
          finalPrice: unitPrice * selectedTier.measureQty
        };
      }
      return item;
    }));
  };

  return (
    <CartContext.Provider value={{
      cart, setCart, isCartOpen, setIsCartOpen, currentUser, setCurrentUser,
      addToCart, handleCartQtyChange, removeItem, totalAmount, totalItems, handleLogout, showModal,
      handleCartTierChange 
    }}>
      {children}
      
      {/* Universal App Modal */}
      {appModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 relative text-center border border-gray-100">
            <div className={`p-5 rounded-full mb-6 shadow-inner ${appModal.type === 'success' ? 'bg-green-100' : appModal.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              {appModal.type === 'success' && <Download size={40} className="text-green-600 animate-bounce" />}
              {appModal.type === 'error' && <AlertCircle size={40} className="text-red-600" />}
              {appModal.type === 'warning' && <Info size={40} className="text-yellow-600" />}
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-3">{appModal.title}</h3>
            <p className="text-gray-600 mb-8 font-medium leading-relaxed">{appModal.message}</p>
            {appModal.whatsappUrl ? (
              <button onClick={() => { window.open(appModal.whatsappUrl, '_blank'); setAppModal({ ...appModal, isOpen: false }); }} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-lg hover:bg-[#20bd5a] transition-all flex justify-center items-center gap-2 hover:-translate-y-1">
                <Share2 size={24} /> Open WhatsApp Now
              </button>
            ) : (
              <button onClick={() => setAppModal({ ...appModal, isOpen: false })} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition-all">Okay, Got it!</button>
            )}
            {appModal.whatsappUrl && <button onClick={() => setAppModal({ ...appModal, isOpen: false })} className="mt-5 text-gray-400 hover:text-red-500 font-bold transition">Cancel</button>}
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);