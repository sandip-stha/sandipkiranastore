// StoreFront.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Plus, Trash2, Store, Search, Menu, Phone, MapPin, 
  Clock, X, Info, Share2, Download, Loader2, AlertCircle, 
  User, LogOut, Mail, Lock, Smartphone 
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';

export default function StoreFront() {
  // --- Products & Cart States ---
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState(['All']);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  
  // --- Invoice States ---
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef(null);

  // --- App Modal State ---
  const [appModal, setAppModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', whatsappUrl: ''
  });

  // --- Authentication States 🟢 ---
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', otp: '' });
  const [authLoading, setAuthLoading] = useState(false);

  const WHATSAPP_NUMBER = "+9779860428834"; 

  const showModal = (type, title, message, whatsappUrl = '') => {
    setAppModal({ isOpen: true, type, title, message, whatsappUrl });
  };

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('sk_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Fetch Categories & Products
    axios.get('https://kiranastore-luig.onrender.com/api/categories')
      .then(res => setCategories(['All', ...res.data.map(c => c.name)]))
      .catch(err => console.error("Categories fetch error:", err));

    axios.get('https://kiranastore-luig.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Products fetch error:", err));
  }, []);

  // Set Default Quantity based on the selected tier's base measure
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.pricing && selectedProduct.pricing.length > 0) {
        const defaultTier = selectedProduct.pricing[0];
        setSelectedTier(defaultTier);
        setOrderQty(defaultTier.measureQty); 
      } else {
        setSelectedTier({ measureQty: 1, measureUnit: 'Unit', price: selectedProduct.price || 0 });
        setOrderQty(1);
      }
    }
  }, [selectedProduct]);

  // --- Authentication Handlers 🟢 ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    // Change this URL to your deployed API URL later if needed
    const API_BASE_URL = 'http://localhost:5000/api/auth'; 
    
    try {
      if (authMode === 'register') {
        if (authForm.password !== authForm.confirmPassword) {
          setAuthLoading(false);
          return showModal('error', 'Error', 'Password र Confirm Password मिलेन!');
        }
        const res = await axios.post(`${API_BASE_URL}/register`, authForm);
        showModal('success', 'OTP Sent!', res.data.message);
        setAuthMode('otp');
      } 
      else if (authMode === 'otp') {
        const res = await axios.post(`${API_BASE_URL}/verify-otp`, { email: authForm.email, otp: authForm.otp });
        localStorage.setItem('sk_token', res.data.token);
        localStorage.setItem('sk_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setIsAuthModalOpen(false);
        showModal('success', 'Verified!', 'खाता सफलतापूर्वक खुल्यो। अब हजुरले अर्डर गर्न सक्नुहुन्छ।');
      } 
      else {
        const res = await axios.post(`${API_BASE_URL}/login`, { phone: authForm.phone, password: authForm.password });
        localStorage.setItem('sk_token', res.data.token);
        localStorage.setItem('sk_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setIsAuthModalOpen(false);
        showModal('success', 'Welcome Back!', `स्वागत छ ${res.data.user.name} जी!`);
      }
    } catch (err) {
      showModal('error', 'Opps!', err.response?.data?.message || 'केही प्राविधिक समस्या आयो।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sk_token');
    localStorage.removeItem('sk_user');
    setCurrentUser(null);
    setCart([]);
    setIsCartOpen(false);
    showModal('success', 'Logged Out', 'तपाईं सफलतापूर्वक बाहिर निस्कनुभयो।');
  };

  // --- Cart & Product Handlers ---
  const getUnitPrice = (tier) => {
    if (!tier || !tier.measureQty) return 0;
    return tier.price / tier.measureQty;
  };

  const addToCart = () => {
    // 🟢 Must be logged in to add to cart
    if (!currentUser) {
      setSelectedProduct(null);
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedTier || Number(orderQty) <= 0) {
      return showModal('warning', 'Invalid Quantity', 'कृपया ठिक मात्रामा Quantity हाल्नुहोस्!');
    }

    const unitPrice = getUnitPrice(selectedTier);
    const calculatedPrice = unitPrice * Number(orderQty);
    const displayUnitStr = `${orderQty} ${selectedTier.measureUnit}`;
    const cartItemId = `${selectedProduct._id}-${selectedTier.measureUnit}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);

    if (existing) {
      setCart(cart.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = Number(item.qty) + Number(orderQty);
          return { 
            ...item, 
            qty: newQty, 
            finalPrice: item.unitPrice * newQty,
            displayUnit: `${newQty} ${item.measureUnit}`
          };
        }
        return item;
      }));
    } else {
      setCart([...cart, { 
        cartItemId,
        productId: selectedProduct._id,
        name: selectedProduct.name,
        image: selectedProduct.image,
        measureUnit: selectedTier.measureUnit,
        unitPrice: unitPrice,
        qty: Number(orderQty),
        finalPrice: calculatedPrice,
        displayUnit: displayUnitStr
      }]);
    }
    
    setIsCartOpen(true);
    setSelectedProduct(null); 
  };

  const handleCartQtyChange = (cartItemId, newQty) => {
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const qtyNum = Number(newQty);
        return { 
          ...item, 
          qty: qtyNum, 
          finalPrice: item.unitPrice * qtyNum, 
          displayUnit: `${qtyNum} ${item.measureUnit}` 
        };
      }
      return item;
    }));
  };
  
  const removeItem = (id) => setCart(cart.filter(item => item.cartItemId !== id));
  
  const totalAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0).toFixed(2);
  const totalItems = cart.length;

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) || 
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.description && product.description.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  // --- Invoice Logic ---
  const sendBillAsPhoto = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      
      canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sandip_Kirana_Bill_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const messageStr = `Namaste! Mero order ko bill maile download garera yaha attach gardai chu. Kripaya heridinu hola. (Name: ${currentUser?.name || 'Customer'})`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageStr)}`;

        showModal(
          'success', 
          'Bill Downloaded! 📥', 
          "हजुरको डिभाइसमा बिल सेभ भयो। अब तलको बटन थिचेर WhatsApp खोल्नुहोस् र 'Gallery' बाट भर्खरै Download भएको बिलको फोटो पठाउनुहोला।", 
          whatsappUrl
        );
      }, 'image/png');
    } catch (error) {
      console.error("Bill error:", error);
      showModal('error', 'Opps!', 'Bill generate garna sakiyena. Kripaya pheri try garnuhos.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewBill = () => {
    if (cart.length === 0) return showModal('warning', 'Cart Khali Cha!', 'कृपया बिल बनाउन अगाडि Cart मा सामान थप्नुहोस्।');
    setIsCartOpen(false); 
    setShowInvoice(true); 
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden">
      
      {/* 🌟 UNIVERSAL APP MODAL 🌟 */}
      {appModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 relative animate-in zoom-in-95 duration-300 text-center border border-gray-100">
            <div className={`p-5 rounded-full mb-6 shadow-inner ${appModal.type === 'success' ? 'bg-green-100' : appModal.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              {appModal.type === 'success' && <Download size={40} className="text-green-600 animate-bounce" />}
              {appModal.type === 'error' && <AlertCircle size={40} className="text-red-600" />}
              {appModal.type === 'warning' && <Info size={40} className="text-yellow-600" />}
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">{appModal.title}</h3>
            <p className="text-gray-600 mb-8 font-medium leading-relaxed">{appModal.message}</p>
            {appModal.whatsappUrl ? (
              <button onClick={() => { window.open(appModal.whatsappUrl, '_blank'); setAppModal({ ...appModal, isOpen: false }); setShowInvoice(false); }} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-lg hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-2 hover:-translate-y-1 active:scale-95">
                <Share2 size={24} /> Open WhatsApp Now
              </button>
            ) : (
              <button onClick={() => setAppModal({ ...appModal, isOpen: false })} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
                Okay, Got it!
              </button>
            )}
            {appModal.whatsappUrl && <button onClick={() => setAppModal({ ...appModal, isOpen: false })} className="mt-5 text-gray-400 hover:text-red-500 font-bold transition">Cancel</button>}
          </div>
        </div>
      )}

      {/* 🟢 NEW: AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300 border border-gray-100">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-500 transition z-10"><X size={20} /></button>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <User size={32} className="text-blue-700" />
                </div>
                <h2 className="text-2xl font-black text-gray-800">
                  {authMode === 'login' ? 'Login to Order' : authMode === 'register' ? 'Create Account' : 'Verify Email OTP'}
                </h2>
                <p className="text-gray-500 text-sm mt-2 font-medium">
                  {authMode === 'login' ? 'आफ्नो फोन नम्बर र पासवर्ड हाल्नुहोस्।' : authMode === 'register' ? 'नयाँ खाता खोल्न विवरण भर्नुहोस्।' : 'हजुरको Email मा आएको ६ अंकको OTP हाल्नुहोस्।'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input type="text" placeholder="Full Name" required value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
                  </div>
                )}
                
                {(authMode === 'register' || authMode === 'otp') && (
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input type="email" placeholder="Email Address" required disabled={authMode === 'otp'} value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-60 font-medium" />
                  </div>
                )}

                {(authMode === 'login' || authMode === 'register') && (
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input type="tel" placeholder="Phone Number" required value={authForm.phone} onChange={(e) => setAuthForm({...authForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
                  </div>
                )}

                {(authMode === 'login' || authMode === 'register') && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input type="password" placeholder="Password" required value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
                  </div>
                )}

                {authMode === 'register' && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input type="password" placeholder="Confirm Password" required value={authForm.confirmPassword} onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
                  </div>
                )}

                {authMode === 'otp' && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input type="text" maxLength="6" placeholder="Enter 6-digit OTP" required value={authForm.otp} onChange={(e) => setAuthForm({...authForm, otp: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition text-center font-black tracking-widest text-xl text-gray-800" />
                  </div>
                )}

                <button type="submit" disabled={authLoading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4 shadow-lg shadow-blue-500/30 active:scale-95">
                  {authLoading ? <Loader2 className="animate-spin" size={24} /> : authMode === 'login' ? 'Login' : authMode === 'register' ? 'Register' : 'Verify OTP'}
                </button>
              </form>

              {authMode !== 'otp' && (
                <div className="mt-6 text-center text-sm font-medium text-gray-600">
                  {authMode === 'login' ? "खाता छैन?" : "पहिले नै खाता छ?"}
                  <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-blue-600 hover:text-blue-800 ml-1 font-black underline decoration-2 underline-offset-2">
                    {authMode === 'login' ? 'नयाँ खाता खोल्नुहोस्' : 'यहाँ Login गर्नुहोस्'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice / Bill Preview Modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center z-10 sticky top-0">
              <h3 className="font-black text-xl text-gray-800">Preview Bill</h3>
              <button onClick={() => setShowInvoice(false)} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-500 transition"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-gray-200">
              <div ref={invoiceRef} className="bg-white p-8 shadow-sm w-full max-w-md mx-auto relative" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                
                {/* User Details on Bill */}
                <div className="absolute top-4 right-4 text-right text-xs text-gray-500 font-bold">
                  Billed To:<br/>
                  <span className="text-gray-800">{currentUser?.name}</span><br/>
                  {currentUser?.phone}
                </div>

                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6 mt-4">
                  <div className="flex justify-center mb-2"><Store size={40} className="text-blue-800" /></div>
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Sandip Kirana</h1>
                  <p className="text-sm text-gray-600 mt-1">Suryabinayak-1, Bhaktapur<br/>Phone: {WHATSAPP_NUMBER}</p>
                </div>
                <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-700">
                  <span>Date: {currentDate}</span>
                  <span>Invoice #SK-{Math.floor(1000 + Math.random() * 9000)}</span>
                </div>
                <table className="w-full text-left mb-6 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black text-sm uppercase tracking-wider text-gray-800">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 text-sm font-bold text-gray-700">
                        <td className="py-3">
                          {item.name} <br/>
                          <span className="text-xs text-gray-500 font-normal">
                            {item.displayUnit} (Rate: Rs {item.unitPrice.toFixed(2)}/1{item.measureUnit})
                          </span>
                        </td>
                        <td className="py-3 text-right">Rs {item.finalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-black pt-4 mb-8 flex justify-between items-center text-xl font-black text-gray-900">
                  <span>GRAND TOTAL</span><span>Rs {totalAmount}</span>
                </div>
                <div className="text-center border-t-2 border-dashed border-gray-300 pt-6">
                  <p className="text-sm font-bold text-gray-800">Thank you for your order!</p>
                  <p className="text-xs text-gray-500 mt-1">Visit Again</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 border-t sticky bottom-0 z-10 flex gap-3">
              <button onClick={() => setShowInvoice(false)} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Back to Edit</button>
              <button onClick={sendBillAsPhoto} disabled={isGenerating} className="flex-[2] bg-green-500 text-white py-3 rounded-xl font-black hover:bg-green-600 transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isGenerating ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Share2 size={20} /> Send Bill to WhatsApp</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 SMART PRODUCT DETAILS MODAL */}
      {selectedProduct && !showInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-500 transition z-10"><X size={24} /></button>
            
            <div className="md:w-1/2 bg-gray-100">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-48 md:h-full object-cover" />
            </div>
            
            <div className="md:w-1/2 p-8 flex flex-col justify-center h-full max-h-[80vh] overflow-y-auto">
              <span className="text-xs text-blue-600 font-black tracking-widest uppercase mb-2 bg-blue-50 w-max px-3 py-1 rounded-full">{selectedProduct.category}</span>
              <h2 className="text-3xl font-black text-gray-800 mb-4 leading-tight">{selectedProduct.name}</h2>
              
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Select Unit:</p>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.pricing && selectedProduct.pricing.length > 0 ? (
                    selectedProduct.pricing.map((tier, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => { setSelectedTier(tier); setOrderQty(tier.measureQty); }}
                        className={`px-5 py-3 border-2 rounded-xl text-left transition-all flex flex-col items-center ${selectedTier === tier ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-300 ring-offset-1' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                      >
                        <span className="text-xl font-black">{tier.measureUnit}</span>
                        <span className="text-xs mt-1 font-semibold opacity-70">Rate: Rs {tier.price} / {tier.measureQty}{tier.measureUnit}</span>
                      </button>
                    ))
                  ) : (
                    <button className="px-4 py-2 border-2 border-blue-600 bg-blue-50 text-blue-800 rounded-xl font-bold">No pricing set</button>
                  )}
                </div>
              </div>

              {/* 🟢 QUANTITY SELECTOR */}
              <div className="mb-6 bg-yellow-50 p-5 rounded-2xl border border-yellow-200 shadow-inner">
                <label className="font-bold text-gray-700 block mb-3 text-lg">
                  कति <span className="text-blue-700 font-black">{selectedTier?.measureUnit || 'सामान'}</span> चाहियो?:
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" step="any" min="0.1" 
                    value={orderQty} 
                    onChange={(e) => setOrderQty(e.target.value)} 
                    className="border-2 border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl p-3 w-32 font-black text-2xl text-center outline-none transition bg-white" 
                  />
                  <span className="font-black text-gray-500 text-xl uppercase">
                    {selectedTier?.measureUnit}
                  </span>
                </div>
              </div>

              <div className="text-3xl font-black text-blue-700 mb-6 border-b pb-4">
                Total: Rs { ((getUnitPrice(selectedTier)) * (Number(orderQty) || 0)).toFixed(2) }
              </div>
              
              <div className="mb-6 flex-1">
                <p className="text-gray-700 text-sm leading-relaxed">{selectedProduct.description || "यस प्रोडक्टको बारेमा धेरै जानकारी उपलब्ध छैन।"}</p>
              </div>
              
              <button onClick={addToCart} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95">
                <ShoppingCart size={24} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="bg-blue-800 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <Store size={32} className="text-yellow-400" />
              <span className="hidden sm:block">सन्दिप किराना स्टोर </span>
              <span className="sm:hidden text-xl">सन्दिप किराना</span>
            </div>

            <div className="hidden md:flex space-x-8 font-semibold">
              <a href="#" className="text-yellow-400 border-b-2 border-yellow-400 pb-1">Shop</a>
              <a href="#about" className="hover:text-yellow-300 transition">About Us</a>
              <a href="#contact" className="hover:text-yellow-300 transition">Contact</a>
            </div>

            <div className="flex items-center gap-4">
              
              {/* 🟢 User Profile Header / Login Button */}
              {currentUser ? (
                <div className="hidden sm:flex items-center gap-3 bg-blue-900 px-4 py-2 rounded-full border border-blue-700 shadow-inner">
                  <User size={18} className="text-yellow-400" />
                  <span className="font-bold text-sm truncate max-w-[120px]">{currentUser.name}</span>
                  <button onClick={handleLogout} className="text-red-300 hover:text-red-400 ml-2 transition" title="Logout"><LogOut size={18} /></button>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} className="hidden sm:flex items-center gap-2 bg-yellow-400 text-blue-900 px-5 py-2 rounded-full font-black hover:bg-yellow-300 transition shadow-md hover:-translate-y-0.5">
                  <User size={18} /> Login
                </button>
              )}

              {/* Cart Button */}
              <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-2 bg-blue-700 rounded-full hover:bg-blue-600 transition shadow-inner flex items-center gap-2 px-5 group">
                <ShoppingCart size={22} className="group-hover:scale-110 transition" />
                <span className="font-bold hidden sm:block text-lg">Rs {totalAmount}</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-blue-800 shadow-sm animate-pulse">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-1 hover:bg-blue-700 rounded-lg transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute w-full left-0 bg-blue-900 border-b border-blue-700 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-4 space-y-4">
            
            {/* 🟢 Mobile Auth Section */}
            {currentUser ? (
               <div className="flex justify-between items-center bg-blue-800 p-3 rounded-xl border border-blue-700 mb-4">
                 <div className="flex items-center gap-3 text-yellow-400 font-bold"><User size={20}/> {currentUser.name}</div>
                 <button onClick={handleLogout} className="text-red-300 bg-red-900/30 p-2 rounded-lg hover:bg-red-900/50 transition"><LogOut size={20}/></button>
               </div>
            ) : (
               <button onClick={() => { setIsMobileMenuOpen(false); setAuthMode('login'); setIsAuthModalOpen(true); }} className="w-full bg-yellow-400 text-blue-900 p-3 rounded-xl font-black flex justify-center items-center gap-2 mb-4 shadow-md">
                 <User size={20}/> Login / Register
               </button>
            )}

            <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="block text-yellow-400 font-bold p-2 bg-blue-800 rounded-lg">Shop</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block text-white hover:text-yellow-300 transition font-semibold p-2">About Us</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-white hover:text-yellow-300 transition font-semibold p-2">Contact</a>
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition font-medium p-2 border-t border-blue-800 mt-2">Admin Panel</Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 py-6 flex-1 w-full flex flex-col lg:flex-row gap-8 relative">
        <div className="flex-1 w-full">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
            <div className="md:w-2/3 relative z-10">
              <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Free Local Delivery</span>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight">ताजा किराना सामान, <br/><span className="text-yellow-300 mt-2 block">छिटो डेलिभरी 🧑‍🏍📦</span></h1>
              <p className="text-lg text-blue-100 mb-8 max-w-md">चामल, दाल, तेल, ग्यास र हजुर को दैनिक आवस्यकता का सबै समान हरु सस्तो र सुलव मुल्य मा!</p>
              <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg flex items-center overflow-hidden border-2 border-transparent focus-within:border-yellow-400 transition-all group">
                <Search className="text-gray-400 ml-4 group-focus-within:text-blue-600 transition" size={24} />
                <input type="text" placeholder="K khojdai hunuhuncha?..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-4 px-4 text-gray-800 outline-none font-medium" />
              </div>
            </div>
            <div className="md:w-1/3 mt-8 md:mt-0 relative z-10 hidden md:block">
              <img src="https://scontent.fktm17-1.fna.fbcdn.net/v/t39.30808-6/480559092_594232123435745_383012169672590612_n.jpg?stp=dst-jpg_tt6&cstp=mx1158x2048&ctp=s1158x2048&_nc_cat=108&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=R_d_qVcN2K8Q7kNvwH0zNRP&_nc_oc=Adqj1Cmz1eQ_tArCZd-eU5EMiYHd7wKEAQDvcvlmDVm2vWPiO_SzxN3NGfK0JW8q5-1Vu1ofZYyUiDT60rEj0iy8&_nc_zt=23&_nc_ht=scontent.fktm17-1.fna&_nc_gid=kAX7SIV8Dz7HGCACXbjiVA&_nc_ss=7b2a8&oh=00_Af9h2bzTnc-M-eWwJfnHMtz9hWLcTCpLnVryGWOKQOmozQ&oe=6A3899EB" alt="Groceries" className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500 hover:scale-105" />
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
          </div>

          <div className="mb-6 flex overflow-x-auto pb-4 gap-3 hide-scrollbar items-center">
            <span className="font-bold text-gray-500 mr-2 uppercase tracking-wide text-sm hidden sm:block">Filter:</span>
            {categories.map(category => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-sm border ${selectedCategory === category ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 ring-offset-1' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const defaultTier = product.pricing && product.pricing.length > 0 ? product.pricing[0] : { price: 0, measureQty: '', measureUnit: 'N/A' };
                return (
                  <div key={product._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    <div className="relative overflow-hidden bg-gray-100">
                      <img src={product.image} alt={product.name} className="w-full h-40 md:h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"><span className="bg-white text-gray-900 font-bold py-2 px-4 rounded-full text-sm">View Details</span></div>
                    </div>
                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase bg-blue-50 px-2 py-1 rounded">{product.category}</span>
                        <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded truncate max-w-[80px]">per {defaultTier.measureUnit}</span>
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-gray-800 flex-1 leading-snug line-clamp-2">{product.name}</h3>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-lg md:text-xl font-black text-gray-900">Rs {defaultTier.price}</div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }} className="bg-blue-600 text-white p-2 md:p-2.5 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"><Plus size={20} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <Search size={64} className="mx-auto mb-4 text-gray-300 animate-bounce" />
                <p className="text-xl font-bold text-gray-500">तपाईंले खोज्नुभएको सामान भेटिएन।</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Cart Panel */}
        {isCartOpen && (
          <div className="lg:w-[400px] w-full bg-white p-6 rounded-t-3xl lg:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-2xl border border-gray-100 h-fit lg:sticky lg:top-24 z-30 fixed bottom-0 left-0 max-h-[85vh] overflow-y-auto lg:max-h-[calc(100vh-120px)] flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
              <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-800"><ShoppingCart className="text-blue-600" size={28} /> Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="lg:hidden bg-gray-100 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition"><X size={20} /></button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" className="w-32 mb-6 opacity-40 grayscale hover:grayscale-0 transition duration-500"/>
                <p className="text-gray-500 font-medium text-lg">Cart खाली छ!</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {cart.map(item => (
                  <div key={item.cartItemId} className="flex justify-between items-center bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition relative">
                    <img src={item.image} alt={item.name} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover mr-3 border" />
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-blue-600 font-black bg-blue-50 w-max px-2 py-0.5 rounded mt-1">{item.displayUnit}</p>
                      <p className="text-gray-900 text-sm font-black mt-1">Rs {item.finalPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" step="any" value={item.qty} 
                        onChange={(e) => handleCartQtyChange(item.cartItemId, e.target.value)}
                        className="w-16 p-1.5 text-center font-bold border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm" 
                      />
                    </div>
                    <button onClick={() => removeItem(item.cartItemId)} className="p-2 text-red-400 hover:text-red-600 ml-2 hover:bg-red-50 rounded-lg transition active:scale-90"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            )}
            
            {cart.length > 0 && (
              <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-200 bg-white sticky bottom-0 z-10 pb-2">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Total Amount</span>
                  <span className="text-3xl font-black text-blue-700">Rs {totalAmount}</span>
                </div>
                <button onClick={handlePreviewBill} className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-3 hover:-translate-y-1 active:scale-95">
                  Generate Invoice & Order
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer id="contact" className="bg-gray-900 text-gray-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-2xl font-black text-white mb-4"><Store className="text-yellow-400" /> सन्दिप किराना स्टोर</div>
            <p className="text-gray-400 leading-relaxed">Hajur ko dainik upabhogya saman ko viswasilo sathi. Sasto, sulav ra fresh saman haru hajur kai aagan ma.</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 hover:text-white transition cursor-pointer"><Phone size={18} className="text-blue-400"/> {WHATSAPP_NUMBER}</li>
              <li className="flex items-center gap-3 hover:text-white transition cursor-pointer"><MapPin size={18} className="text-blue-400"/> सुर्यबिनायक्,१, भक्तपुर </li>
              <li className="flex items-center gap-3"><Clock size={18} className="text-blue-400"/> Sun - Sat (6:00 AM - 8:00 PM)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-yellow-400 transition">Home</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition">Shop Products</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition">Terms & Conditions</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          © 2026 सन्दिप किराना स्टोर . All rights reserved.
        </div>
      </footer>
    </div>
  );
}