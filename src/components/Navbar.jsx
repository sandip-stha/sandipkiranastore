import React, { useState } from 'react';
import { Store, User, LogOut, ShoppingCart, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, handleLogout, totalAmount, totalItems, isCartOpen, setIsCartOpen } = useCart();

  return (
    <nav className="bg-blue-800 text-white shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-black tracking-tight cursor-pointer" onClick={() => navigate('/')}>
            <Store size={32} className="text-yellow-400" />
            <span className="hidden sm:block">सन्दिप किराना स्टोर</span>
            <span className="sm:hidden text-xl">सन्दिप किराना</span>
          </div>
          <div className="hidden md:flex space-x-8 font-semibold">
             <Link to="/" className="hover:text-yellow-300 transition">Home</Link>
            <Link to="/shop" className="hover:text-yellow-300 transition">Shop Products</Link>
            <Link to="/contact" className="hover:text-yellow-300 transition">Contact Us</Link>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-3 bg-blue-900 px-4 py-2 rounded-full border border-blue-700 shadow-inner">
                <User size={18} className="text-yellow-400" />
                <span className="font-bold text-sm truncate max-w-[120px]">{currentUser.name}</span>
                <button onClick={handleLogout} className="text-red-300 hover:text-red-400 ml-2 transition" title="Logout"><LogOut size={18} /></button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="hidden sm:flex items-center gap-2 bg-yellow-400 text-blue-900 px-5 py-2 rounded-full font-black hover:bg-yellow-300 transition shadow-md">
                <User size={18} /> Login
              </button>
            )}
            
            <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-2 bg-blue-700 rounded-full hover:bg-blue-600 transition shadow-inner flex items-center gap-2 px-5 group">
              <ShoppingCart size={22} className="group-hover:scale-110 transition" />
              <span className="font-bold hidden sm:block text-lg">Rs {totalAmount}</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-blue-800 shadow-sm animate-pulse">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
            <button className="md:hidden p-1 hover:bg-blue-700 rounded-lg transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute w-full left-0 bg-blue-900 border-b border-blue-700 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-4 space-y-4">
          {currentUser ? (
             <div className="flex justify-between items-center bg-blue-800 p-3 rounded-xl border border-blue-700 mb-4">
               <div className="flex items-center gap-3 text-yellow-400 font-bold"><User size={20}/> {currentUser.name}</div>
               <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="text-red-300 bg-red-900/30 p-2 rounded-lg hover:bg-red-900/50 transition"><LogOut size={20}/></button>
             </div>
          ) : (
             <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="w-full bg-yellow-400 text-blue-900 p-3 rounded-xl font-black flex justify-center items-center gap-2 mb-4 shadow-md">
               <User size={20}/> Login / Register
             </button>
          )}
          <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block text-yellow-400 font-bold p-2 bg-blue-800 rounded-lg">Shop</Link>
        </div>
      </div>
    </nav>
  );
}