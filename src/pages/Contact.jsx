import React, { useState } from 'react';
import axios from 'axios';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Send
} from "lucide-react";

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Contact() {
  // गुनासो फर्मको लागि State हरू
  const [formData, setFormData] = useState({ name: '', phone: '', location: '', complaint: '' });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' }); // success or error

  // Backend को API URL (तपाईंको आवश्यकता अनुसार परिवर्तन गर्न सक्नुहुन्छ)
  const API_URL = 'https://kiranastore-luig.onrender.com';

  const handleGunasoSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.location || !formData.complaint) {
      setStatusMsg({ text: 'कृपया सबै विवरणहरू भर्नुहोस्!', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      // यदि वेबसाइटमा युजर लगइन छ भने Token पठाउने (तपाईंको Backend मा verifyUser भएकोले)
      const token = localStorage.getItem('userToken'); // वेबसाइटमा token सेभ भएको नाम

      await axios.post(`${API_URL}/api/gunaso`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusMsg({ text: 'तपाईंको गुनासो सफलतापूर्वक दर्ता भयो। हामी छिटै सम्पर्क गर्नेछौं!', type: 'success' });
      setFormData({ name: '', phone: '', location: '', complaint: '' }); // फर्म खाली गर्ने
    } catch (error) {
      console.error(error);
      setStatusMsg({ text: 'गुनासो पठाउन समस्या आयो। कृपया लगइन गर्नुभएको छ कि छैन चेक गर्नुहोस्।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden">
      <Navbar />
      
      <div className="flex-grow bg-gray-100 py-12 px-5">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-black text-center text-green-700 mb-3">
            Contact Us
          </h1>
          <p className="text-center text-gray-600 mb-10 text-lg">
            We'd love to hear from you. Feel free to visit or contact us anytime.
          </p>

          {/* Top Section: Map & Contact Info */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">

            {/* Google Map */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3534.3035564900188!2d85.39529837525147!3d27.646078476217706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1122856086c1%3A0xd957085275966952!2sSandip%20Kirana%20Store!5e0!3m2!1sen!2snp!4v1781842700456!5m2!1sen!2snp"
                width="100%"
                height="100%"
                className="min-h-[400px] lg:min-h-[550px]"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sandip Kirana Store"
              />
            </div>

            {/* Contact Details */}
            <div className="space-y-6 flex flex-col justify-center">

              <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5 hover:shadow-xl transition border border-gray-100">
                <div className="bg-green-100 p-4 rounded-full">
                  <MapPin className="text-green-600 w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">Address</h3>
                  <p className="text-gray-600 mt-1">
                    Sandip Kirana Store<br />
                    Suryabinayek, 1, Bhaktapur
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5 hover:shadow-xl transition border border-gray-100">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Phone className="text-blue-600 w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">Phone</h3>
                  <p className="text-gray-600 mt-1 font-semibold tracking-wide">
                    +977-9860428834
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5 hover:shadow-xl transition border border-gray-100">
                <div className="bg-red-100 p-4 rounded-full">
                  <Mail className="text-red-600 w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">Email</h3>
                  <p className="text-gray-600 mt-1">
                    shresthasandip534@gmail.com
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5 hover:shadow-xl transition border border-gray-100">
                <div className="bg-yellow-100 p-4 rounded-full">
                  <Clock className="text-yellow-600 w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">Opening Hours</h3>
                  <p className="text-gray-600 mt-1">
                    Sunday - Saturday<br />
                    7:00 AM - 9:00 PM
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ======================= GUNASO PETIKA (नयाँ थपिएको भाग) ======================= */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-blue-600 p-6 text-white text-center flex flex-col items-center justify-center">
              <MessageSquare className="w-10 h-10 mb-2 text-blue-200" />
              <h2 className="text-3xl font-black">गुनासो तथा सुझाव पेटिका</h2>
              <p className="text-blue-100 mt-2">हाम्रो सेवा वा पसलको बारेमा केही सल्लाह वा गुनासो भए निर्धक्क लेख्नुहोस्।</p>
            </div>

            <div className="p-8 md:p-10 max-w-3xl mx-auto">
              {statusMsg.text && (
                <div className={`p-4 mb-6 rounded-xl font-bold flex items-center justify-center ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleGunasoSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">तपाईंको नाम (Name)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ram Shrestha"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">फोन नम्बर (Phone)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 98XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">ठेगाना (Location)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Suryabinayak Chowk"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">तपाईंको गुनासो (Your Message)</label>
                  <textarea 
                    rows="5" 
                    placeholder="आफ्नो कुरा यहाँ लेख्नुहोस्..."
                    value={formData.complaint}
                    onChange={(e) => setFormData({...formData, complaint: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mx-auto"
                >
                  {loading ? 'पठाउँदै...' : <><Send size={20} /> गुनासो पठाउनुहोस्</>}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}