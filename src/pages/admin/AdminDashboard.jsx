import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, LayoutDashboard, Lock, LogOut, Package, FolderPlus, ShoppingBag, MessageSquare, Users, Truck, Store } from 'lucide-react';

// Import all child components
import ManageDealers from './ManageDealers';
import Orders from './Orders';
import ManageProducts from './ManageProducts';
import ManageCategories from './ManageCategories';
import Gunaso from './Gunaso';
import UsersList from './UsersList';
import PosBilling from './PosBilling'; // 🌟 नयाँ कम्पोनेन्ट इम्पोर्ट

const API_URL = 'https://kiranastore-luig.onrender.com';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Shared States
  const [dealers, setDealers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [gunasos, setGunasos] = useState([]);
  const [users, setUsers] = useState([]);
  
  // 🌟 १. Measure Units को लागि नयाँ State थपिएको
  const [measureUnits, setMeasureUnits] = useState([]);
  
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000);
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (error) { console.error("Order fetch error:", error); }
  };

  const fetchGunasos = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/admin/gunaso`, { headers: { Authorization: `Bearer ${token}` } });
      setGunasos(res.data);
    } catch (error) { console.error("Gunaso fetch error:", error); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (error) { console.error("Users fetch error:", error); }
  };

  const fetchDealers = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/api/admin/dealers`, { headers: { Authorization: `Bearer ${token}` } });
        setDealers(res.data);
    } catch (error) { console.error("Dealers fetch error:", error); }
  };

  // 🌟 २. fetchData फङ्सनमा measure-units पनि तान्न (Fetch गर्न) थपिएको
  // 🌟 Safe fetchData: Measure units को API फेल भए पनि Products र Categories नरोकिने!
  const fetchData = async () => {
      try {
          const [catRes, prodRes] = await Promise.all([
              axios.get(`${API_URL}/api/categories`),
              axios.get(`${API_URL}/api/products`)
          ]);
          setCategories(catRes.data);
          setProducts(prodRes.data);

          // 🌟 सिधै Backend (Database) बाट Measure Units ल्याउने (कुनै डिफल्ट नराखेको)
          try {
              const unitRes = await axios.get(`${API_URL}/api/measure-units`);
              setMeasureUnits(unitRes.data || []);
          } catch (unitErr) {
              console.error("⚠️ Measure Units API लोड हुन सकेन:", unitErr.message);
              setMeasureUnits([]); // API नचले खाली राख्ने
          }

          fetchOrders();
          fetchGunasos();
          fetchUsers();
          fetchDealers();
      } catch (error) { 
          console.error("Data fetch error:", error); 
      }
    };
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchData();
      const interval = setInterval(() => {
        fetchOrders(); fetchGunasos(); fetchUsers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, loginForm);
      localStorage.setItem('adminToken', response.data.token);
      setIsLoggedIn(true);
      showToast("Login Successful! 🎉", "success");
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.error || "Login failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setLoginForm({ username: '', password: '' });
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const pendingGunasoCount = gunasos.filter(g => g.status === 'Pending').length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {toast.isVisible && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="font-bold">{toast.message}</span>
          </div>
        )}
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6 text-blue-700"><Lock size={48} className="bg-blue-50 p-3 rounded-full" /></div>
          <h2 className="text-3xl font-black mb-8 text-center text-gray-800">Admin Portal</h2>
          <div className="space-y-5">
            <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} placeholder="Username" className="w-full p-4 border rounded-xl" required />
            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} placeholder="Password" className="w-full p-4 border rounded-xl" required />
            <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold hover:bg-blue-800">{isLoading ? 'Wait...' : 'Login'}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative overflow-hidden">
      {toast.isVisible && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
          <span className="font-bold text-lg">{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-[#0A192F] text-white p-6 shadow-2xl hidden md:flex flex-col z-10">
        <h2 className="text-2xl font-black mb-10 flex items-center gap-3 border-b border-gray-700 pb-6">
          <LayoutDashboard size={28} className="text-yellow-400" /> Admin Panel
        </h2>
        <ul className="space-y-3 flex-1">
          <li onClick={() => setActiveTab('orders')} className={`cursor-pointer p-4 rounded-xl flex items-center justify-between font-semibold transition ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <div className="flex items-center gap-3"><ShoppingBag size={22} /> Orders</div>
            {pendingOrdersCount > 0 && <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">{pendingOrdersCount} New</span>}
          </li>
          <li onClick={() => setActiveTab('pos')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold transition ${activeTab === 'pos' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <Store size={22} className="text-green-400" /> POS / Fast Billing
          </li>
          <li onClick={() => setActiveTab('products')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold transition ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <Package size={22} /> Manage Products
          </li>
          <li onClick={() => setActiveTab('categories')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold transition ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <FolderPlus size={22} /> Manage Categories
          </li>
          <li onClick={() => setActiveTab('gunaso')} className={`cursor-pointer p-4 rounded-xl flex items-center justify-between font-semibold transition ${activeTab === 'gunaso' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <div className="flex items-center gap-3"><MessageSquare size={22} /> Gunaso</div>
            {pendingGunasoCount > 0 && <span className="bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">{pendingGunasoCount} New</span>}
          </li>
          <li onClick={() => setActiveTab('users')} className={`cursor-pointer p-4 rounded-xl flex items-center justify-between font-semibold transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <div className="flex items-center gap-3"><Users size={22} /> Customers List</div>
          </li>
          <li onClick={() => setActiveTab('dealers')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold transition ${activeTab === 'dealers' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
              <Truck size={22} /> Dealers & Suppliers
          </li>
        </ul>
        <div className="border-t border-gray-700 pt-6">
          <button onClick={handleLogout} className="w-full cursor-pointer p-4 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center gap-2 font-bold transition"><LogOut size={20} /> Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto h-screen bg-[#F3F4F6]">
        <div className={activeTab === 'pos' ? "w-full max-w-full" : "max-w-6xl mx-auto"}>
          
          {/* Top Header & Title */}
          <div className="w-full flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-3xl md:text-4xl font-black text-gray-800">
              {activeTab === 'pos' ? 'POS Fast Billing 🛒' : 
               activeTab === 'orders' ? 'Order Details 🛍️' : 
               activeTab === 'products' ? 'Manage Products 📦' : 
               activeTab === 'dealers' ? 'Dealers & Suppliers 🚚' : 
               activeTab === 'gunaso' ? 'Customer Gunaso 💬' : 
               activeTab === 'users' ? 'Registered Customers 👥' : 'Manage Categories 📁'}
            </h1>
            
            {activeTab === 'orders' && pendingOrdersCount > 0 && (
               <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border flex items-center gap-3 shrink-0">
                 <div className="relative"><Bell size={24} className="text-blue-600" /><span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span></div>
                 <span className="font-bold text-gray-700">{pendingOrdersCount} Pending Orders</span>
               </div>
            )}
            
            {activeTab === 'gunaso' && pendingGunasoCount > 0 && (
               <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border flex items-center gap-3 shrink-0">
                 <div className="relative"><Bell size={24} className="text-orange-600" /><span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span></div>
                 <span className="font-bold text-gray-700">{pendingGunasoCount} Pending Gunaso</span>
               </div>
            )}
          </div>

          {/* 🌟 ३. यहाँ तल Products र Categories मा measureUnits पनि पास गरिएको छ */}
          <div className="w-full block">
            {activeTab === 'orders' && <Orders orders={orders} fetchOrders={fetchOrders} API_URL={API_URL} showToast={showToast} />}
            {activeTab === 'products' && <ManageProducts products={products} categories={categories} measureUnits={measureUnits} fetchData={fetchData} API_URL={API_URL} showToast={showToast} />}
            {activeTab === 'categories' && <ManageCategories categories={categories} measureUnits={measureUnits} fetchData={fetchData} API_URL={API_URL} showToast={showToast} />}
            {activeTab === 'gunaso' && <Gunaso gunasos={gunasos} fetchGunasos={fetchGunasos} API_URL={API_URL} showToast={showToast} />}
            {activeTab === 'users' && <UsersList users={users} fetchUsers={fetchUsers} API_URL={API_URL} showToast={showToast} />}
            {activeTab === 'dealers' && <ManageDealers dealers={dealers} fetchDealers={fetchDealers} API_URL={API_URL} showToast={showToast} />}
            {activeTab === 'pos' && <PosBilling products={products} users={users} API_URL={API_URL} showToast={showToast} fetchOrders={fetchOrders} />}
          </div>

        </div>
      </div>
    </div>
  );
}