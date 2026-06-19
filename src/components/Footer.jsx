// src/components/Footer.jsx
import React from 'react';
import { Store, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const WHATSAPP_NUMBER = "+9779860428834"; 

  return (
    <footer id="contact" className="bg-gray-900 text-gray-300 pt-16 pb-8 mt-12 border-t-4 border-blue-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Section: Brand & Description */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3 text-3xl font-black text-white mb-4">
            <div className="bg-blue-800 p-2.5 rounded-2xl shadow-lg">
              <Store className="text-yellow-400" size={32} />
            </div>
            सन्दिप किराना स्टोर
          </div>
          <p className="text-gray-400 leading-relaxed max-w-sm text-lg">
            हजुरको दैनिक उपभोग्य सामानको भरपर्दो र विश्वासिलो साथी। सस्तो मूल्य, छिटो डेलिभरी!
          </p>
        </div>
        
        {/* Right Section: Contact Info */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <h3 className="text-gray-500 font-bold text-sm mb-6 uppercase tracking-widest">Contact Info</h3>
          <ul className="space-y-4">
            <li className="flex items-center justify-center md:justify-end gap-4 hover:text-white transition group cursor-pointer">
              <span className="font-bold text-lg tracking-wide">{WHATSAPP_NUMBER}</span>
              <div className="bg-gray-800 p-3 rounded-full group-hover:bg-green-600 transition duration-300 shadow-sm">
                <Phone size={20} className="text-green-400 group-hover:text-white"/> 
              </div>
            </li>
            <li className="flex items-center justify-center md:justify-end gap-4 hover:text-white transition group cursor-pointer">
              <span className="font-bold text-lg tracking-wide">सूर्यविनायक-१, भक्तपुर</span>
              <div className="bg-gray-800 p-3 rounded-full group-hover:bg-blue-600 transition duration-300 shadow-sm">
                <MapPin size={20} className="text-blue-400 group-hover:text-white"/>
              </div>
            </li>
          </ul>
        </div>
        
      </div>
      
      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 font-medium text-sm">
          © {new Date().getFullYear()} Sandip Kirana Store. All Rights Reserved.
        </p>
        <p className="text-xs text-gray-600 font-bold tracking-widest uppercase">
          Made with ❤️ in Nepal
        </p>
      </div>
    </footer>
  );
}