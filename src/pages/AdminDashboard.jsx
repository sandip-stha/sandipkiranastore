// AdminDashboard.jsx
import axios from 'axios';
import imageCompression from 'browser-image-compression'; 
import {
  Bell,
  CheckCircle,
  CheckCircle2,
  Clock,
  Edit,
  FolderPlus,
  LayoutDashboard, 
  Lock,
  LogOut,
  Package,
  PlusCircle,
  ShoppingBag,
  Trash2,
  MessageSquare,
  Users, 
  Save 
} from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = 'https://kiranastore-luig.onrender.com'; 

const MEASURE_UNITS = ['Kg', 'Gram', 'Ltr', 'ml', 'Bora', 'Packet', 'Pouch', 'Piece', 'Box', 'Doz', 'Bottle', 'Jar'];

// 🌟 डुप्लिकेट Quantity हटाउने Helper Function
const formatUnit = (unit, qty) => {
  if (typeof unit === 'string' && unit.startsWith(qty + ' ')) {
    return unit.replace(qty + ' ', '').trim();
  }
  return unit || '';
};

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); 
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [gunasos, setGunasos] = useState([]); // 
  const [users, setUsers] = useState([]); // 

  const [userForm, setUserForm] = useState({ 
    name: '', phone: '', email: '', address: '', landmark: '', adminRemark: '', isEditing: false, editId: null 
  });

  
  const [catForm, setCatForm] = useState({ name: '', isEditing: false, editId: null });
  
  const [productForm, setProductForm] = useState({ 
    name: '', category: '', description: '', 
    pricing: [{ measureQty: '', measureUnit: 'Kg', price: '' }], 
    image: null, isEditing: false, editId: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
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
    } catch (error) {
      console.error("Order fetch error:", error);
    }
  };

  // 🚨 गुनासो तान्ने फङ्सन
  const fetchGunasos = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/admin/gunaso`, { headers: { Authorization: `Bearer ${token}` } });
      setGunasos(res.data);
    } catch (error) {
      console.error("Gunaso fetch error:", error);
    }
  };
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (error) {
      console.error("Users fetch error:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/products`)
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      
      if (catRes.data.length > 0 && !productForm.category) {
        setProductForm(prev => ({ ...prev, category: catRes.data[0].name }));
      }
      fetchOrders();
      fetchGunasos(); 
      fetchUsers(); // 🚨 यो लाइन छुटेको थियो, यहाँ थप्नुहोस्!
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
        fetchOrders();
        fetchGunasos();
        fetchUsers();
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

  const updateOrderStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Order marked as ${status}!`, "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to update order", "error");
    }
  };

  const deleteOrder = async (id) => {
    if(!window.confirm("Are you sure? यो अर्डर सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Order Deleted!", "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to delete order", "error");
    }
  };

  // 🚨 गुनासोको Status अपडेट र Delete गर्ने
  const updateGunasoStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/admin/gunaso/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Gunaso marked as ${status}!`, "success");
      fetchGunasos();
    } catch (err) {
      showToast("Failed to update gunaso", "error");
    }
  };

  const deleteGunaso = async (id) => {
    if(!window.confirm("Are you sure? यो गुनासो सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/gunaso/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Gunaso Deleted!", "success");
      fetchGunasos();
    } catch (err) {
      showToast("Failed to delete gunaso", "error");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return showToast("Category name chaaiyo!", "error");
    
    setIsLoading(true);
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (catForm.isEditing) {
        await axios.put(`${API_URL}/api/categories/${catForm.editId}`, { name: catForm.name }, { headers });
        showToast("Category Updated!", "success");
      } else {
        await axios.post(`${API_URL}/api/categories`, { name: catForm.name }, { headers });
        showToast("Category Added!", "success");
      }
      setCatForm({ name: '', isEditing: false, editId: null });
      fetchData();
    } catch (error) {
      showToast("Category action failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const editCategory = (cat) => {
    setCatForm({ name: cat.name, isEditing: true, editId: cat._id });
    window.scrollTo(0, 0);
  };

  const deleteCategory = async (id) => {
    if(!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Category Deleted!", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete category", "error");
    }
  };

  const addPriceField = () => {
    setProductForm({ ...productForm, pricing: [...productForm.pricing, { measureQty: '', measureUnit: 'Kg', price: '' }] });
  };

  const removePriceField = (index) => {
    const newPricing = productForm.pricing.filter((_, i) => i !== index);
    setProductForm({ ...productForm, pricing: newPricing });
  };

  const handlePriceChange = (index, field, value) => {
    const newPricing = [...productForm.pricing];
    newPricing[index][field] = value;
    setProductForm({ ...productForm, pricing: newPricing });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file)); 
      try {
        setIsLoading(true); 
        const options = {
          maxSizeMB: 0.1, 
          maxWidthOrHeight: 800, 
          useWebWorker: true,
          fileType: 'image/jpeg' 
        };
        const compressedFile = await imageCompression(file, options);
        setProductForm({ ...productForm, image: compressedFile });
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("Error compressing image:", error);
        showToast("Image compress garna samasya vayo!", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || !productForm.description) {
      return showToast("Kripaya sabai details fill garnuhos!", "error");
    }
    
    const validPricing = productForm.pricing.filter(p => p.measureQty && p.measureUnit && p.price);
    if (validPricing.length === 0) {
      return showToast("Kamti ma euta Unit ra Price halnu jaruri cha!", "error");
    }
    if (!productForm.isEditing && !productForm.image) {
      return showToast("Image halna nabirsinu hos!", "error");
    }

    setIsLoading(true);
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('category', productForm.category);
    formData.append('description', productForm.description);
    formData.append('pricing', JSON.stringify(validPricing));
    
    if (productForm.image instanceof File || productForm.image instanceof Blob) {
      formData.append('image', productForm.image);
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data' 
    };

    try {
      if (productForm.isEditing) {
        await axios.put(`${API_URL}/api/products/${productForm.editId}`, formData, { headers });
        showToast("Product Updated Successfully!", "success");
      } else {
        await axios.post(`${API_URL}/api/products`, formData, { headers });
        showToast("Product Uploaded Successfully!", "success");
      }
      
      setProductForm({ 
        name: '', category: categories[0]?.name || '', description: '', 
        pricing: [{ measureQty: '', measureUnit: 'Kg', price: '' }], image: null, isEditing: false, editId: null 
      });
      setImagePreview(null);
      fetchData();
    } catch (error) {
      showToast("Product process fail vayo!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const editProduct = (prod) => {
    setProductForm({
      name: prod.name,
      category: prod.category,
      description: prod.description,
      pricing: prod.pricing && prod.pricing.length > 0 ? prod.pricing : [{ measureQty: '', measureUnit: 'Kg', price: '' }],
      image: null,
      isEditing: true,
      editId: prod._id
    });
    setImagePreview(prod.image);
    window.scrollTo(0, 0);
  };

  const deleteProduct = async (id) => {
    if(!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Product Deleted!", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete product", "error");
    }
  };

  // 🚨 नयाँ: Customer Delete गर्ने
  const deleteUser = async (id) => {
    if(!window.confirm("Are you sure? यो ग्राहकको सम्पूर्ण डाटा सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Customer Deleted!", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to delete customer", "error");
    }
  };

  // Edit बटन थिच्दा फर्ममा डाटा ल्याउने
  const editUser = (user) => {
    setUserForm({
      name: user.name, phone: user.phone, email: user.email, 
      address: user.address, landmark: user.landmark, 
      adminRemark: user.adminRemark || '', // यहाँ थपियो
      isEditing: true, editId: user._id
    });
    window.scrollTo(0, 0); 
  };

  // Edit गरेको डाटा सेभ गर्ने
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/admin/users/${userForm.editId}`, userForm, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showToast("Customer Details Updated!", "success");
      setUserForm({ name: '', phone: '', email: '', address: '', landmark: '', isEditing: false, editId: null });
      fetchUsers();
    } catch (err) {
      showToast("Failed to update customer", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚨 नयाँ: Customer को Remarks (टिप्पणी) Update गर्ने
  const updateRemark = async (id, remark) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/admin/users/${id}/remark`, { adminRemark: remark }, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Customer Remarks Saved!", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to save remarks", "error");
    }
  };

  const handleRemarkChange = (id, value) => {
    setUsers(users.map(u => u._id === id ? { ...u, adminRemark: value } : u));
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const pendingGunasoCount = gunasos.filter(g => g.status === 'Pending').length; // 🚨 Pending Gunaso Count

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {toast.isVisible && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="font-bold">{toast.message}</span>
          </div>
        )}
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6 text-blue-700">
            <Lock size={48} className="bg-blue-50 p-3 rounded-full" />
          </div>
          <h2 className="text-3xl font-black mb-8 text-center text-gray-800">Admin Portal</h2>
          <div className="space-y-5">
            <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} placeholder="Username" className="w-full p-4 border rounded-xl" required />
            <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} placeholder="Password" className="w-full p-4 border rounded-xl" required />
            <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold hover:bg-blue-800">
              {isLoading ? 'Wait...' : 'Login'}
            </button>
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
            {pendingOrdersCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                {pendingOrdersCount} New
              </span>
            )}
          </li>
          <li onClick={() => setActiveTab('products')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold transition ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <Package size={22} /> Manage Products
          </li>
          <li onClick={() => setActiveTab('categories')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold transition ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <FolderPlus size={22} /> Manage Categories
          </li>
          
          {/* 🚨 Sidebar मा Gunaso थपियो */}
          <li onClick={() => setActiveTab('gunaso')} className={`cursor-pointer p-4 rounded-xl flex items-center justify-between font-semibold transition ${activeTab === 'gunaso' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <div className="flex items-center gap-3"><MessageSquare size={22} /> Gunaso (गुनासो)</div>
            {pendingGunasoCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.6)]">
                {pendingGunasoCount} New
              </span>
            )}
          </li>
          <li onClick={() => setActiveTab('users')} className={`cursor-pointer p-4 rounded-xl flex items-center justify-between font-semibold transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}>
            <div className="flex items-center gap-3"><Users size={22} /> Customers List</div>
          </li>
        </ul>
        <div className="border-t border-gray-700 pt-6">
          <button onClick={handleLogout} className="w-full cursor-pointer p-4 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center gap-2 font-bold transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen bg-[#F3F4F6]">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-black text-gray-800">
              {activeTab === 'orders' ? 'Order Details 🛍️' : 
              activeTab === 'products' ? 'Manage Products 📦' : 
              activeTab === 'gunaso' ? 'Customer Gunaso 💬' : 
              activeTab === 'users' ? 'Registered Customers 👥' : 'Manage Categories 📁'}
            </h1>
            
            {activeTab === 'orders' && pendingOrdersCount > 0 && (
               <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border flex items-center gap-3">
                 <div className="relative">
                   <Bell size={24} className="text-blue-600" />
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                 </div>
                 <span className="font-bold text-gray-700">{pendingOrdersCount} Pending Orders</span>
               </div>
            )}
            
            {/* 🚨 Gunaso Tab मा हुँदा Gunaso को Notification देखाउने */}
            {activeTab === 'gunaso' && pendingGunasoCount > 0 && (
               <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border flex items-center gap-3">
                 <div className="relative">
                   <Bell size={24} className="text-orange-600" />
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
                 </div>
                 <span className="font-bold text-gray-700">{pendingGunasoCount} Pending Gunaso</span>
               </div>
            )}
          </div>

          {/* ============================== GUNASO TAB (नयाँ थपिएको) ============================== */}
          {activeTab === 'gunaso' && (
            <div className="space-y-6">
              {gunasos.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">
                  अहिले सम्म कुनै गुनासो वा सुझाव आएको छैन।
                </div>
              ) : (
                gunasos.map((g) => (
                  <div key={g._id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${g.status === 'Pending' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-green-500 opacity-80'}`}>
                    
                    <div className="bg-gray-50/80 p-5 md:p-6 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-gray-800">{g.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${g.status === 'Pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                            {g.status === 'Pending' ? <Clock size={14}/> : <CheckCircle size={14}/>} {g.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm font-bold flex gap-3 mt-2">
                          <span>📞 {g.phone}</span>
                          <span className="hidden md:inline">|</span>
                          <span>📍 {g.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
                      <div className="flex-1 w-full">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</p>
                        <p className="text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border border-gray-200 italic leading-relaxed text-lg">
                          "{g.complaint}"
                        </p>

                        {/* 🚨 नयाँ: यदि फोटो छ भने देखाउने */}
                        {g.image && (
                          <div className="mt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Attached Image</p>
                            <a href={g.image} target="_blank" rel="noreferrer">
                              <img 
                                src={g.image} 
                                alt="Gunaso Attachment" 
                                className="w-full md:w-64 h-48 object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition cursor-pointer" 
                              />
                            </a>
                            <p className="text-xs text-gray-400 mt-1">Click image to view full size</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-4 font-bold">Received At: {new Date(g.createdAt).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 self-end md:self-auto">
                        {g.status === 'Pending' ? (
                          <button onClick={() => updateGunasoStatus(g._id, 'Resolved')} className="flex-1 md:flex-none bg-green-500 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md">
                            <CheckCircle2 size={18} /> Mark Resolved
                          </button>
                        ) : (
                          <div className="flex-1 md:flex-none bg-gray-100 text-green-600 px-5 py-3 rounded-xl font-black flex items-center justify-center gap-2 border border-green-200">
                            <CheckCircle size={18} /> Resolved
                          </div>
                        )}
                        <button onClick={() => deleteGunaso(g._id)} className="bg-red-50 text-red-500 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100 flex items-center justify-center">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* ============================== ORDER TAB ============================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">कुनै अर्डर आएको छैन।</div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${order.status === 'Pending' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500 opacity-80'}`}>
                    
                    <div className="bg-gray-50/80 p-5 md:p-6 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-gray-800">{order.customer?.name || 'Unknown User'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                            {order.status === 'Pending' ? <Clock size={14}/> : <CheckCircle size={14}/>} {order.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm font-bold flex gap-3">
                          <span>📞 {order.customer?.phone}</span>
                          <span className="hidden md:inline">|</span>
                          <span>📧 {order.customer?.email}</span>
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-3xl font-black text-blue-700">Rs {order.totalAmount}</p>
                      </div>
                    </div>

                    <div className="p-5 md:p-6 flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                        <div className="bg-gray-50 rounded-2xl border p-4 space-y-3">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                              <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                  <p className="text-xs text-gray-500 font-bold">{item.qty} {formatUnit(item.displayUnit, item.qty)}</p>
                                </div>
                              </div>
                              <span className="font-black text-gray-800">Rs {item.finalPrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-full md:w-1/3 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Details</p>
                          <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 mb-6">
                            <p className="font-bold text-gray-800 mb-1">📍 {order.customer?.address}</p>
                            <p className="text-sm text-gray-600 font-semibold">Landmark: <span className="text-blue-700">{order.customer?.landmark}</span></p>
                            {order.remarks && (
                                <p className="text-sm text-gray-600 font-semibold">
                                  Remarks: <span className="text-blue-700">{order.remarks}</span>
                                </p>
                              )}
                            <p className="text-xs text-gray-400 mt-3 font-bold">Ordered At: {new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {order.status === 'Pending' ? (
                            <button onClick={() => updateOrderStatus(order._id, 'Delivered')} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md">
                              <CheckCircle2 size={18} /> Mark Delivered
                            </button>
                          ) : (
                            <div className="flex-1 bg-gray-100 text-green-600 py-3 rounded-xl font-black flex items-center justify-center gap-2 border border-green-200">
                              <CheckCircle size={18} /> Delivered
                            </div>
                          )}
                          <button onClick={() => deleteOrder(order._id)} className="bg-red-50 text-red-500 px-4 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* ============================== CATEGORY TAB ============================== */}
          {activeTab === 'categories' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border h-fit">
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">
                  {catForm.isEditing ? 'Edit Category' : 'Create New Category'}
                </h3>
                <form onSubmit={handleCategorySubmit}>
                  <label className="block text-gray-600 font-semibold mb-3">Category Name</label>
                  <input 
                    type="text" value={catForm.name} onChange={(e) => setCatForm({...catForm, name: e.target.value})} 
                    placeholder="e.g. Masala, Chamal..." 
                    className="w-full p-4 border rounded-xl mb-6 outline-none focus:border-blue-500" 
                  />
                  <div className="flex gap-4">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition">
                      {isLoading ? 'Saving...' : (catForm.isEditing ? 'Update Category' : 'Save Category')}
                    </button>
                    {catForm.isEditing && (
                      <button type="button" onClick={() => setCatForm({ name: '', isEditing: false, editId: null })} className="bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">All Categories</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-4 font-bold text-gray-600">Name</th>
                        <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat._id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-800">{cat.name}</td>
                          <td className="p-4 flex justify-end gap-3">
                            <button onClick={() => editCategory(cat)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Edit size={20}/></button>
                            <button onClick={() => deleteCategory(cat._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={20}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================== PRODUCT TAB ============================== */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">
                  {productForm.isEditing ? 'Edit Product Details' : 'Add New Product'}
                </h3>
                
                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-2">Product Name</label>
                    <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Aashirvaad Atta" className="w-full p-4 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-2">Category</label>
                    <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full p-4 border rounded-xl bg-white">
                      {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-blue-900 font-black text-lg">Product Pricing Tiers ⚖️</label>
                      <button type="button" onClick={addPriceField} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                        <PlusCircle size={16} /> Add Unit Option
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {productForm.pricing.map((priceItem, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                          <input 
                            type="number" step="any" placeholder="Qty (e.g. 200, 1)" 
                            value={priceItem.measureQty} onChange={(e) => handlePriceChange(index, 'measureQty', e.target.value)} 
                            className="w-full md:w-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold" required 
                          />
                          <select 
                            value={priceItem.measureUnit} onChange={(e) => handlePriceChange(index, 'measureUnit', e.target.value)} 
                            className="w-full md:w-32 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center"
                          >
                            {MEASURE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <span className="font-black text-gray-400 hidden md:block">=</span>
                          <input 
                            type="number" placeholder="Price (Rs)" 
                            value={priceItem.price} onChange={(e) => handlePriceChange(index, 'price', e.target.value)} 
                            className="w-full md:w-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-700 text-center" required 
                          />
                          {productForm.pricing.length > 1 && (
                            <button type="button" onClick={() => removePriceField(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg w-full md:w-auto flex justify-center">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4 font-medium">💡 Example: [200] [Gram] = [40], or [1] [Kg] = [100]</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-600 font-semibold mb-2">Description</label>
                    <textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} placeholder="About this product..." rows="3" className="w-full p-4 border rounded-xl"></textarea>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-600 font-semibold mb-2">Image {productForm.isEditing && '(Leave blank to keep old image)'}</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-3 border rounded-xl" disabled={isLoading} />
                    {isLoading && <span className="text-blue-500 text-sm mt-2 font-bold animate-pulse">Compressing Image...</span>}
                    {imagePreview && !isLoading && <img src={imagePreview} alt="Preview" className="w-20 h-20 mt-3 object-cover rounded-lg shadow" />}
                  </div>

                  <div className="md:col-span-2 flex gap-4 mt-4">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-lg hover:bg-green-700 shadow-lg">
                      {isLoading ? 'Processing...' : (productForm.isEditing ? 'Update Product Details' : 'Upload Product to Store')}
                    </button>
                    {productForm.isEditing && (
                      <button type="button" onClick={() => { setProductForm({ name: '', category: categories[0]?.name || '', description: '', pricing: [{ measureQty: '', measureUnit: 'Kg', price: '' }], image: null, isEditing: false, editId: null }); setImagePreview(null); }} className="bg-gray-200 text-gray-800 py-4 px-8 rounded-xl font-bold">
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Product Table List */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">Product Inventory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-4 font-bold text-gray-600">Image</th>
                        <th className="p-4 font-bold text-gray-600">Name & Category</th>
                        <th className="p-4 font-bold text-gray-600">Pricing Options</th>
                        <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(prod => (
                        <tr key={prod._id} className="border-b hover:bg-gray-50">
                          <td className="p-4"><img src={prod.image} alt="img" className="w-14 h-14 rounded-xl object-cover border shadow-sm" /></td>
                          <td className="p-4">
                            <div className="font-bold text-gray-800 text-lg">{prod.name}</div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider">{prod.category}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            <div className="flex flex-col gap-1.5">
                              {prod.pricing && prod.pricing.map((p, i) => (
                                <span key={i} className="bg-green-50 text-green-800 px-3 py-1 border border-green-100 rounded-lg font-bold w-max shadow-sm">
                                  {p.measureQty} {p.measureUnit} = Rs {p.price}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right align-middle">
                            <button onClick={() => editProduct(prod)} className="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition mr-2"><Edit size={20}/></button>
                            <button onClick={() => deleteProduct(prod._id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition"><Trash2 size={20}/></button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan="4" className="p-6 text-center text-gray-400 font-bold">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================== CUSTOMERS (USERS) TAB ============================== */}
          {activeTab === 'users' && (
            <div className="space-y-8">
              
              {/* EDIT FORM (यो Edit बटन थिचेपछि मात्र देखिन्छ) */}
              {userForm.isEditing && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">✏️ Edit Customer Details</h3>
                  <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2">Full Name</label>
                      <input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="w-full p-4 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2">Phone Number</label>
                      <input type="text" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} className="w-full p-4 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2">Email Address</label>
                      <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full p-4 border rounded-xl" required />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-2">Landmark</label>
                      <input type="text" value={userForm.landmark} onChange={(e) => setUserForm({...userForm, landmark: e.target.value})} className="w-full p-4 border rounded-xl" required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 font-semibold mb-2">Full Address</label>
                      <input type="text" value={userForm.address} onChange={(e) => setUserForm({...userForm, address: e.target.value})} className="w-full p-4 border rounded-xl" required />
                    </div>
                    
                    {/* 🚨 नयाँ: Edit फर्म भित्रै Remarks थपियो */}
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border">
                      <label className="block text-gray-700 font-bold mb-2">Admin Remarks (चिन्न सजिलोको लागि)</label>
                      <input type="text" value={userForm.adminRemark} onChange={(e) => setUserForm({...userForm, adminRemark: e.target.value})} className="w-full p-3 border rounded-xl bg-white" placeholder="e.g. उधारो लग्ने, सधैं आउने ग्राहक, भाइको साथी..." />
                    </div>

                    <div className="md:col-span-2 flex gap-4 mt-2">
                      <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700">
                        {isLoading ? 'Updating...' : 'Update Details'}
                      </button>
                      <button type="button" onClick={() => setUserForm({ name: '', phone: '', email: '', address: '', landmark: '', adminRemark: '', isEditing: false, editId: null })} className="bg-gray-200 text-gray-800 py-4 px-8 rounded-xl font-bold hover:bg-gray-300">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* USERS LIST */}
              <div className="grid md:grid-cols-2 gap-6">
                {users.length === 0 ? (
                  <div className="col-span-2 bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">
                    अहिले सम्म कुनै ग्राहक दर्ता भएका छैनन्।
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user._id} className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col gap-5 relative overflow-hidden transition-all hover:shadow-md">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black text-gray-800 mb-1">{user.name}</h3>
                          <p className="text-gray-500 font-bold text-sm">📞 {user.phone} | 📧 {user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => editUser(user)} className="bg-blue-50 text-blue-500 p-3 rounded-xl hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-100">
                            <Edit size={20} />
                          </button>
                          <button onClick={() => deleteUser(user._id)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Address & Remarks Section */}
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <p className="font-bold text-gray-800 mb-1">📍 {user.address}</p>
                        <p className="text-sm text-gray-600 font-semibold mb-2">
                          Landmark: <span className="text-blue-700">{user.landmark}</span>
                        </p>
                        
                        {/* 🚨 Remarks भएमा मात्र देखिने */}
                        {user.adminRemark && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Admin Remarks</p>
                            <p className="text-sm font-bold text-gray-800 italic">" {user.adminRemark} "</p>
                          </div>
                        )}
                      </div>

                      {/* पहिलेको खाली input box वाला UI यहाँबाट हटाइयो! */}

                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}