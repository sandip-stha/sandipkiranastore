// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Store, User, LogOut, ShoppingCart, Menu, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom'; // Link को सट्टा NavLink ल्यायौं
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser, handleLogout, totalAmount, totalItems, isCartOpen, setIsCartOpen } = useCart();

  // Active मेनुको लागि Design Function
  const navLinkClass = ({ isActive }) => 
    `transition-all pb-1 border-b-2 ${isActive ? 'text-yellow-400 border-yellow-400 font-bold' : 'text-white border-transparent hover:text-yellow-300 hover:border-yellow-300/50'}`;

  const mobileNavLinkClass = ({ isActive }) => 
    `block font-bold p-3 rounded-xl transition-all ${isActive ? 'bg-blue-800 text-yellow-400 shadow-inner border border-blue-700' : 'text-white hover:bg-blue-800 hover:text-yellow-300'}`;

  return (
    <nav className="bg-blue-800 text-white shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2 text-2xl font-black tracking-tight cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/')}>
            <Store size={32} className="text-yellow-400" />
            <span className="hidden sm:block">सन्दिप किराना स्टोर</span>
            <span className="sm:hidden text-xl">सन्दिप किराना</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 font-semibold">
             <NavLink to="/" className={navLinkClass}>Home</NavLink>
             <NavLink to="/shop" className={navLinkClass}>Shop Products</NavLink>
             <NavLink to="/contact" className={navLinkClass}>Contact Us</NavLink>
          </div>
          
          {/* Right Side Buttons */}
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
      <div className={`md:hidden absolute w-full left-0 bg-blue-900 border-b border-blue-700 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-4 space-y-2">
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
          
          {/* यहाँ Mobile Menu का लिङ्कहरू थपिएका छन् */}
          <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>🏠 Home</NavLink>
          <NavLink to="/shop" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>🛍️ Shop Products</NavLink>
          <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>📞 Contact Us</NavLink>
        </div>
      </div>
    </nav>
  );
}