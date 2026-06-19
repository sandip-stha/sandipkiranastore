// AuthPage.jsx
import React, { useState } from 'react';
import { User, Mail, Smartphone, Lock, MapPin, Navigation, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ 
    name: '', phone: '', email: '', address: '', landmark: '', password: '', confirmPassword: '' 
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();
  const API_BASE_URL = 'https://kiranastore-luig.onrender.com/api/auth'; 

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage({ type: '', text: '' });
    
    // Client side check for Nepal 10-digit phone
    const nepalPhoneRegex = /^9\d{9}$/;
    if (!nepalPhoneRegex.test(authForm.phone)) {
      setAuthLoading(false);
      return setMessage({ type: 'error', text: 'कृपया ९८ वा ९७ बाट सुरु हुने १० अंकको फोन नम्बर हाल्नुहोस्!' });
    }

    try {
      if (authMode === 'register') {
        if (authForm.password !== authForm.confirmPassword) {
          setAuthLoading(false);
          return setMessage({ type: 'error', text: 'Password र Confirm Password मिलेन!' });
        }
        
        const res = await axios.post(`${API_BASE_URL}/register`, authForm);
        
        localStorage.setItem('sk_token', res.data.token);
        localStorage.setItem('sk_user', JSON.stringify(res.data.user));
        navigate('/'); 
      } 
      else {
        const res = await axios.post(`${API_BASE_URL}/login`, { phone: authForm.phone, password: authForm.password });
        localStorage.setItem('sk_token', res.data.token);
        localStorage.setItem('sk_user', JSON.stringify(res.data.user));
        navigate('/');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'केही प्राविधिक समस्या आयो।' });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-gray-100 relative my-10">
        
        <Link to="/" className="absolute top-4 left-4 text-gray-500 hover:text-blue-600 transition flex items-center gap-1 font-bold text-sm">
          <ArrowLeft size={16} /> पसलमा फर्कनुहोस्
        </Link>

        <div className="text-center mb-8 mt-4">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <User size={32} className="text-blue-700" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">
            {authMode === 'login' ? 'Login to Order' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            {authMode === 'login' ? 'आफ्नो फोन नम्बर र पासवर्ड हाल्नुहोस्।' : 'नयाँ खाता खोल्न सही डेलिभरी विवरण भर्नुहोस्।'}
          </p>
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-bold text-center leading-relaxed ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Full Name (पूरा नाम)" required value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="email" placeholder="Gmail / Email Address" required value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Delivery Address (उदा: चाबहिल, काठमाडौं)" required value={authForm.address} onChange={(e) => setAuthForm({...authForm, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
              </div>
              <div className="relative">
                <Navigation className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Nearest Landmark (नजिकको चिनिने ठाउँ)" required value={authForm.landmark} onChange={(e) => setAuthForm({...authForm, landmark: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
              </div>
            </>
          )}

          <div className="relative">
            <Smartphone className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="tel" placeholder="Phone Number (उदा: 98XXXXXXXX)" required maxLength="10" pattern="9\d{9}" value={authForm.phone} onChange={(e) => setAuthForm({...authForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="password" placeholder="Password" required value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
          </div>

          {authMode === 'register' && (
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input type="password" placeholder="Confirm Password" required value={authForm.confirmPassword} onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" />
            </div>
          )}

          <button type="submit" disabled={authLoading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4 shadow-lg shadow-blue-500/30 active:scale-95">
            {authLoading ? <Loader2 className="animate-spin" size={24} /> : authMode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-gray-600">
          {authMode === 'login' ? "खाता छैन?" : "पहिले नै खाता छ?"}
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setMessage({ type: '', text: '' }); }} className="text-blue-600 hover:text-blue-800 ml-1 font-black underline decoration-2 underline-offset-2">
            {authMode === 'login' ? 'नयाँ खाता खोल्नुहोस्' : 'यहाँ Login गर्नुहोस्'}
          </button>
        </div>
      </div>
    </div>
  );
}