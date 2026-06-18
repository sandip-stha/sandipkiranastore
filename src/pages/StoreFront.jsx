// StoreFront.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Trash2, Store, Search, Menu, Phone, MapPin, Clock, X, Info, Share2, Download, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';

export default function StoreFront() {
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
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef(null);

  const [appModal, setAppModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', whatsappUrl: ''
  });

  const WHATSAPP_NUMBER = "+9779860428834"; 

  const showModal = (type, title, message, whatsappUrl = '') => {
    setAppModal({ isOpen: true, type, title, message, whatsappUrl });
  };

  useEffect(() => {
    axios.get('https://kiranastore-luig.onrender.com/api/categories')
      .then(res => setCategories(['All', ...res.data.map(c => c.name)]))
      .catch(err => console.error("Categories fetch error:", err));

    axios.get('https://kiranastore-luig.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Products fetch error:", err));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.pricing && selectedProduct.pricing.length > 0) {
        setSelectedTier(selectedProduct.pricing[0]);
      } else {
        // Fallback
        setSelectedTier({ measureQty: 1, measureUnit: 'Unit', price: selectedProduct.price || 0 });
      }
      setOrderQty(1);
    }
  }, [selectedProduct]);

  // 🟢 SMART LOGIC CHECK: Is it Kg or Ltr?
  const isLooseItem = ['Kg', 'Ltr', 'ml'].includes(selectedTier?.measureUnit);

  const addToCart = () => {
    if (!selectedTier || Number(orderQty) <= 0) {
      return showModal('warning', 'Invalid Quantity', 'Kripaya thik matra ma quantity halnuhos!');
    }

    const cartItemId = `${selectedProduct._id}-${selectedTier.measureQty}-${selectedTier.measureUnit}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);

    const calculatedPrice = selectedTier.price * Number(orderQty);
    
    // Formatting display unit logic
    let displayUnitStr = isLooseItem 
      ? `${(selectedTier.measureQty * Number(orderQty)).toFixed(2)} ${selectedTier.measureUnit}` 
      : `${orderQty} x (${selectedTier.measureQty} ${selectedTier.measureUnit})`;

    if (existing) {
      setCart(cart.map(item => 
        item.cartItemId === cartItemId 
        ? { 
            ...item, 
            qty: Number(item.qty) + Number(orderQty), 
            finalPrice: item.finalPrice + calculatedPrice,
            displayUnit: displayUnitStr
          } 
        : item
      ));
    } else {
      setCart([...cart, { 
        cartItemId,
        productId: selectedProduct._id,
        name: selectedProduct.name,
        image: selectedProduct.image,
        measureQty: selectedTier.measureQty,
        measureUnit: selectedTier.measureUnit,
        basePrice: selectedTier.price,
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
        const isLoose = ['Kg', 'Ltr', 'ml'].includes(item.measureUnit);
        const finalPrice = item.basePrice * qtyNum;
        const displayUnitStr = isLoose 
          ? `${(item.measureQty * qtyNum).toFixed(2)} ${item.measureUnit}` 
          : `${qtyNum} x (${item.measureQty} ${item.measureUnit})`;
        
        return { ...item, qty: newQty, finalPrice, displayUnit: displayUnitStr };
      }
      return item;
    }));
  };
  
  const removeItem = (id) => setCart(cart.filter(item => item.cartItemId !== id));
  
  const totalAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0).toFixed(2);
  const totalItems = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) || 
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.description && product.description.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

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

        const messageStr = "Namaste! Mero order ko bill maile download garera yaha attach gardai chu. Kripaya heridinu hola.";
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
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

      {/* Invoice / Bill Preview Modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center z-10 sticky top-0">
              <h3 className="font-black text-xl text-gray-800">Preview Bill</h3>
              <button onClick={() => setShowInvoice(false)} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-500 transition"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-gray-200">
              <div ref={invoiceRef} className="bg-white p-8 shadow-sm w-full max-w-md mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6">
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
                          <span className="text-xs text-gray-500 font-normal">{item.displayUnit} (Base: Rs {item.basePrice})</span>
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
              
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Select Options:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.pricing && selectedProduct.pricing.length > 0 ? (
                    selectedProduct.pricing.map((tier, idx) => (
                      <button 
                        key={idx} onClick={() => { setSelectedTier(tier); setOrderQty(1); }}
                        className={`px-4 py-3 border-2 rounded-xl text-left transition-all flex flex-col ${selectedTier === tier ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-300 ring-offset-1' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                      >
                        <span className="font-bold">{tier.measureQty} {tier.measureUnit}</span>
                        <span className="text-lg font-black text-gray-800">Rs {tier.price}</span>
                      </button>
                    ))
                  ) : (
                    <button className="px-4 py-2 border-2 border-blue-600 bg-blue-50 text-blue-800 rounded-xl font-bold">No pricing set</button>
                  )}
                </div>
              </div>

              <div className="mb-6 bg-yellow-50 p-5 rounded-2xl border border-yellow-200 shadow-inner">
                <label className="font-bold text-gray-700 block mb-3">
                  {isLooseItem ? (
                    <>Quantity (जस्तै: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">1.5</span> for Dedh Kilo):</>
                  ) : (
                    <>कति प्याकेट / बोरा चाहियो?:</>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" step={isLooseItem ? "any" : "1"} min="0.1" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} 
                    className="border-2 border-gray-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl p-3 w-32 font-black text-2xl text-center outline-none transition bg-white" 
                  />
                  <span className="font-black text-gray-500 text-lg">
                    {isLooseItem ? selectedTier?.measureUnit : `x (${selectedTier?.measureQty} ${selectedTier?.measureUnit})`}
                  </span>
                </div>
              </div>

              <div className="text-3xl font-black text-blue-700 mb-6 border-b pb-4">
                Total: Rs { ((selectedTier?.price || 0) * (Number(orderQty) || 0)).toFixed(2) }
              </div>
              
              <div className="mb-6 flex-1">
                <p className="text-gray-700 text-sm leading-relaxed">{selectedProduct.description || "Yas product ko barema dherai jankari uplabda chaina."}</p>
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
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <Store size={32} className="text-yellow-400" />
              <span className="hidden sm:block">सन्दिप किराना स्टोर </span>
              <span className="sm:hidden text-xl">सन्दिप किराना</span>
            </div>

            <div className="hidden md:flex space-x-8 font-semibold">
              <a href="#" className="text-yellow-400 border-b-2 border-yellow-400 pb-1">Shop</a>
              <a href="#about" className="hover:text-yellow-300 transition">About Us</a>
              <a href="#contact" className="hover:text-yellow-300 transition">Contact</a>
              <Link to="/admin" className="hover:text-yellow-300 transition">Admin</Link>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-2 bg-blue-700 rounded-full hover:bg-blue-600 transition shadow-inner flex items-center gap-2 px-5 group">
                <ShoppingCart size={22} className="group-hover:scale-110 transition" />
                <span className="font-bold hidden sm:block text-lg">Rs {totalAmount}</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-blue-800 shadow-sm animate-pulse">
                    {totalItems > 99 ? '99+' : parseFloat(totalItems.toFixed(2))}
                  </span>
                )}
              </button>
              <button className="md:hidden p-1 hover:bg-blue-700 rounded-lg transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
        <div className={`md:hidden absolute w-full left-0 bg-blue-900 border-b border-blue-700 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-4 space-y-4">
            <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="block text-yellow-400 font-bold p-2 bg-blue-800 rounded-lg">Shop</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block text-white hover:text-yellow-300 transition font-semibold p-2">About Us</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-white hover:text-yellow-300 transition font-semibold p-2">Contact</a>
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-white hover:text-yellow-300 transition font-semibold p-2">Admin Panel</Link>
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
                        <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded truncate max-w-[80px]">{defaultTier.measureQty} {defaultTier.measureUnit}</span>
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
                <p className="text-xl font-bold text-gray-500">Tapai le khojnu vayeko saman vetiyena.</p>
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
                <p className="text-gray-500 font-medium text-lg">Cart khali cha!</p>
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