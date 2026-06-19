import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Providers & Components
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import Contact from './pages/Contact';

// पसलको लागि छुट्टै Layout (जसमा Navbar, Footer र Cart हुन्छ)
const StoreLayout = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden">
        <Navbar />
        
        {/* Outlet ले भित्रका पेजहरु (Home, Shop आदि) लाई यहाँ देखाउने काम गर्छ */}
        <Outlet /> 
        
        <CartDrawer />
        <Footer />
      </div>
    </CartProvider>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        
        {/* १. Admin को लागि छुट्टै Route (यसमा Navbar/CartProvider केही हुँदैन) */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* २. पसलका पेजहरु (यिनीहरु StoreLayout भित्र बस्छन्) */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

      </Routes>
    </Router>
  );
}