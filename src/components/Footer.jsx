import React from 'react';
import { Store, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function Footer() {
  const WHATSAPP_NUMBER = "+9779860428834"; 

  return (
    <footer id="contact" className="bg-gray-900 text-gray-300 py-12 mt-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 text-2xl font-black text-white mb-4">
            <Store className="text-yellow-400" /> सन्दिप किराना स्टोर
          </div>
          <p className="text-gray-400 leading-relaxed">Hajur ko dainik upabhogya saman ko viswasilo sathi.</p>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Contact Info</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-blue-400"/> {WHATSAPP_NUMBER}
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-blue-400"/> सुर्यबिनायक्,१, भक्तपुर 
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-yellow-400 transition">Home</Link></li>
            <li><Link to="shop" className="hover:text-yellow-400 transition">Shop Products</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 text-center text-gray-400">
        © {new Date().getFullYear()} Sandip Kirana Store. All Rights Reserved.
      </div>
      
    </footer>
  );
}