import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Store, Search, Menu, Phone, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function StoreFront() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [categories, setCategories] = useState(['All']);
  const [products, setProducts] = useState([]);

  const WHATSAPP_NUMBER = "+9779860428834"; 

  useEffect(() => {
    axios.get('https://kiranastore-luig.onrender.com/api/categories')
      .then(res => setCategories(['All', ...res.data.map(c => c.name)]))
      .catch(err => console.error("Categories lyauna sakena:", err));

    axios.get('https://kiranastore-luig.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Products lyauna sakena:", err));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
      setIsCartOpen(true);
    }
  };

  const updateQty = (id, delta) => setCart(cart.map(item => item._id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  const removeItem = (id) => setCart(cart.filter(item => item._id !== id));
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Cart khali cha!");
    let message = "Namaste! Sandip Kirana Store bata maile order garna chaheko:\n\n";
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name} - ${item.qty} pc(s) (Rs ${item.price * item.qty})\n`;
    });
    message += `\n*Total Bill: Rs ${totalAmount}*\n\nKripaya yo order confirm garidinu hola.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      
      {/* Top Navbar */}
      <nav className="bg-blue-800 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight">
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
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative p-2 bg-blue-700 rounded-full hover:bg-blue-600 transition shadow-inner flex items-center gap-2 px-5"
              >
                <ShoppingCart size={22} />
                <span className="font-bold hidden sm:block text-lg">Rs {totalAmount}</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-blue-800 shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
              
              <button className="md:hidden p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu size={28} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 py-6 flex-1 w-full flex flex-col lg:flex-row gap-8 relative">
        
        {/* Left Side: Hero + Products */}
        <div className="flex-1">
          
          {/* 🌟 PREMIUM HERO BANNER 🌟 */}
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
            <div className="md:w-2/3 relative z-10">
              <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Free Local Delivery</span>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight">
                ताजा किराना सामान, <br/>
              </h1>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 mt-4 text-white leading-tight"> छिटो डेलिभरी 🧑‍🏍📦</h1>
              <p className="text-lg text-blue-100 mb-8 max-w-md">
                चामल, दाल, तेल , ग्यास र हजुर को दैनिक आवस्यकता का सबै समान हरु सस्तो र सुलव मुल्य मा! !
              </p>
              
              {/* Search Bar in Hero */}
              <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg flex items-center overflow-hidden border-2 border-transparent focus-within:border-yellow-400 transition-all">
                <Search className="text-gray-400 ml-4" size={24} />
                <input 
                  type="text" 
                  placeholder="K khojdai hunuhuncha?..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 px-4 text-gray-800 outline-none font-medium"
                />
              </div>
            </div>
            
            <div className="md:w-1/3 mt-8 md:mt-0 relative z-10 hidden md:block">
              <img src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=500&q=80" alt="Groceries Basket" className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500 hover:scale-105" />
            </div>
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
          </div>

          {/* Category Filter */}
          <div className="mb-6 flex overflow-x-auto pb-4 gap-3 hide-scrollbar items-center">
            <span className="font-bold text-gray-500 mr-2 uppercase tracking-wide text-sm hidden sm:block">Filter:</span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-sm border ${
                  selectedCategory === category 
                  ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 ring-offset-1' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
                  <div className="relative overflow-hidden bg-gray-100">
                    <img src={product.image} alt={product.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase mb-2 bg-blue-50 w-max px-2 py-1 rounded">{product.category}</span>
                    <h3 className="text-base font-bold text-gray-800 flex-1 leading-snug">{product.name}</h3>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xl font-black text-gray-900">Rs {product.price}</div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <Search size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-bold text-gray-500">Tapai le khojnu vayeko saman vetiyena.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Shopping Cart Sidebar */}
        {isCartOpen && (
          <div className="lg:w-[400px] w-full bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 h-fit lg:sticky lg:top-24 z-40 fixed bottom-0 left-0 max-h-[85vh] overflow-y-auto lg:max-h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
              <h2 className="text-2xl font-black flex items-center gap-3 text-gray-800">
                <ShoppingCart className="text-blue-600" size={28} /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="lg:hidden bg-gray-100 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50">
                <Trash2 size={20} />
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" className="w-32 mb-6 opacity-40 grayscale"/>
                <p className="text-gray-500 font-medium text-lg">Cart khali cha!</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover mr-3 border" />
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                      <p className="text-blue-700 text-sm font-black mt-1">Rs {item.price * item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
                      <button onClick={() => updateQty(item._id, -1)} className="p-1 text-gray-500 hover:text-blue-600 bg-white rounded shadow-sm"><Minus size={14}/></button>
                      <span className="font-bold w-6 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, 1)} className="p-1 text-gray-500 hover:text-blue-600 bg-white rounded shadow-sm"><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeItem(item._id)} className="p-2 text-red-400 hover:text-red-600 ml-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            )}
            
            {cart.length > 0 && (
              <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-200 bg-white sticky bottom-0">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Total Amount</span>
                  <span className="text-3xl font-black text-blue-700">Rs {totalAmount}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-3 hover:-translate-y-1"
                >
                  Order via WhatsApp
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-2xl font-black text-white mb-4">
              <Store className="text-yellow-400" /> सन्दिप किराना स्टोर 
            </div>
            <p className="text-gray-400 leading-relaxed">Hajur ko dainik upabhogya saman ko viswasilo sathi. Sasto, sulav ra fresh saman haru hajur kai aagan ma.</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3"><Phone size={18} className="text-blue-400"/> +977 9860428834</li>
              <li className="flex items-center gap-3"><MapPin size={18} className="text-blue-400"/> सुर्यबिनायक्,१, भक्तपुर </li>
              <li className="flex items-center gap-3"><Clock size={18} className="text-blue-400"/> Sun - Sat (6:00 AM - 8:00 PM)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Home</a></li>
              <li><a href="#" className="hover:text-white transition">Shop Products</a></li>
              <li><a href="#" className="hover:text-white transition">Terms & Conditions</a></li>
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