import React, { useState, useEffect } from 'react';
import { Package, FolderPlus, LogOut, LayoutDashboard, Lock, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Items State
  const [newCat, setNewCat] = useState('');
  const [categories, setCategories] = useState([]);
  
  // 🟢 NAYA UPDATE: productForm ma 'quantity' ra 'description' thapiyo
  const [productForm, setProductForm] = useState({ 
    name: '', 
    price: '', 
    category: '', 
    quantity: '', 
    description: '', 
    image: null 
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Modal ra Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, actionType: null });

  // Custom Toast Notification ko lagi
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  // Helper function: Toast dekhauna ko lagi
  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast({ isVisible: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://kiranastore-luig.onrender.com/api/categories');
      setCategories(response.data);
      if (response.data.length > 0) {
        setProductForm(prev => ({ ...prev, category: response.data[0].name }));
      }
    } catch (error) {
      console.error("Category fetch error:", error);
    }
  };

  // 🔐 Login Logic
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('https://kiranastore-luig.onrender.com/api/admin/login', loginForm);
      localStorage.setItem('adminToken', response.data.token);
      setIsLoggedIn(true);
      showToast("Login Successful! 🎉", "success");
    } catch (error) {
      console.error("Login failed:", error);
      showToast(error.response?.data?.error || "Login fail vayo. Server check garnus.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setLoginForm({ username: '', password: '' });
    showToast("Logged out successfully.", "success");
  };

  // 📁 Category Modal Trigger
  const triggerCategorySave = () => {
    if (!newCat.trim()) {
      return showToast("Kripaya category ko naam lekhnuhos!", "error");
    }
    setModalConfig({ isOpen: true, actionType: 'category' });
  };

  // 🛒 Product Modal Trigger
  const triggerProductSave = () => {
    // 🟢 NAYA UPDATE: Validation ma quantity ra description pani check gareko
    if (!productForm.name || !productForm.price || !productForm.category || !productForm.quantity || !productForm.description || !productForm.image) {
      return showToast("Kripaya sabai product details ra image fill garnuhos!", "error");
    }
    setModalConfig({ isOpen: true, actionType: 'product' });
  };

  // ⚡ Modal le "Yes" click garesi chalne Actual Database Action
  const executeAction = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      if (modalConfig.actionType === 'category') {
        // CATEGORY SAVE LOGIC
        const response = await axios.post('https://kiranastore-luig.onrender.com/api/categories', 
          { name: newCat },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast(`"${response.data.name}" category successfully save vayo! ✅`, "success");
        setNewCat('');
        fetchCategories(); 

      } else if (modalConfig.actionType === 'product') {
        // PRODUCT SAVE LOGIC
        const formData = new FormData();
        formData.append('name', productForm.name);
        formData.append('price', productForm.price);
        formData.append('category', productForm.category);
        
        // 🟢 NAYA UPDATE: quantity ra description data append gareko
        formData.append('quantity', productForm.quantity);
        formData.append('description', productForm.description);
        formData.append('image', productForm.image); 
        
        await axios.post('https://kiranastore-luig.onrender.com/api/products', 
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data' 
            } 
          } 
        );
        showToast("Product store ma successfully upload vayo! 🛒", "success");
        
        // 🟢 NAYA UPDATE: Reset garda naya fields pani reset gareko
        setProductForm({ name: '', price: '', category: categories[0]?.name || '', quantity: '', description: '', image: null }); 
        setImagePreview(null);
      }
    } catch (error) {
      console.error(`Error saving ${modalConfig.actionType}:`, error);
      showToast(error.response?.data?.error || "Save garna problem aayo!", "error");
    } finally {
      setIsLoading(false);
      setModalConfig({ isOpen: false, actionType: null }); 
    }
  };

  // 🖼️ Handle Local Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm({ ...productForm, image: file });
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  // --------- LOGIN SCREEN ---------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
        {toast.isVisible && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-800'}`}>
            {toast.type === 'success' ? <CheckCircle size={24} className="text-green-600" /> : <XCircle size={24} className="text-red-600" />}
            <span className="font-bold text-lg">{toast.message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex justify-center mb-6 text-blue-700">
            <Lock size={48} className="bg-blue-50 p-3 rounded-full" />
          </div>
          <h2 className="text-3xl font-black mb-8 text-center text-gray-800 tracking-tight">Admin Portal</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 font-medium mb-2 text-sm">Username</label>
              <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} placeholder="e.g. admin" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50" required />
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-2 text-sm">Password</label>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} placeholder="••••••••" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50" required />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white py-4 mt-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : "Secure Login"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --------- DASHBOARD SCREEN ---------
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative overflow-hidden">
      
      {toast.isVisible && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 animate-bounce ${toast.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle size={24} className="text-green-600" /> : <XCircle size={24} className="text-red-600" />}
          <span className="font-bold text-lg">{toast.message}</span>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 transform transition-all scale-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Confirm Action</h3>
            </div>
            <p className="text-gray-600 mb-8 text-lg">
              Are you sure you want to {modalConfig.actionType === 'category' ? `save the new category "${newCat}"` : `upload the product "${productForm.name}"`}?
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setModalConfig({ isOpen: false, actionType: null })} 
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeAction}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Yes, Proceed"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-blue-900 text-white p-6 shadow-2xl hidden md:flex flex-col z-10">
        <h2 className="text-2xl font-black mb-10 flex items-center gap-3 tracking-tight border-b border-blue-800 pb-6">
          <LayoutDashboard size={28} className="text-yellow-400" /> Admin Panel
        </h2>
        
        <ul className="space-y-3 flex-1">
          <li onClick={() => setActiveTab('products')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 transition font-semibold ${activeTab === 'products' ? 'bg-blue-700 shadow-inner text-yellow-300' : 'hover:bg-blue-800 text-gray-300 hover:text-white'}`}>
            <Package size={22} /> Add New Products
          </li>
          <li onClick={() => setActiveTab('categories')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 transition font-semibold ${activeTab === 'categories' ? 'bg-blue-700 shadow-inner text-yellow-300' : 'hover:bg-blue-800 text-gray-300 hover:text-white'}`}>
            <FolderPlus size={22} /> Manage Categories
          </li>
        </ul>

        <div className="border-t border-blue-800 pt-6">
          <button onClick={handleLogout} className="w-full cursor-pointer p-4 rounded-xl text-red-300 hover:text-white hover:bg-red-500/20 flex items-center justify-center gap-2 transition font-bold">
            <LogOut size={20} /> Logout Account
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <LayoutDashboard /> Admin
          </h2>
          <button onClick={handleLogout} className="text-red-500 p-2"><LogOut /></button>
        </div>

        <div className="max-w-4xl">
          <h1 className="text-4xl font-black text-gray-800 mb-8 tracking-tight">
            {activeTab === 'products' ? 'Add New Product 📦' : 'Manage Categories 📁'}
          </h1>

          {/* CATEGORY TAB */}
          {activeTab === 'categories' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">Create a New Category</h3>
              <div className="max-w-md">
                <label className="block text-gray-600 font-semibold mb-3">Category Name</label>
                <input 
                  type="text" 
                  value={newCat} 
                  onChange={(e) => setNewCat(e.target.value)} 
                  placeholder="e.g. Masala, Chauchau, Sweets..." 
                  className="w-full p-4 border-2 border-gray-200 rounded-xl mb-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium" 
                />
                <button 
                  onClick={triggerCategorySave} 
                  className="w-full bg-green-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition shadow-lg hover:shadow-green-500/30"
                >
                  Save Category
                </button>
              </div>

              <div className="mt-12">
                <h4 className="font-bold text-gray-500 uppercase tracking-wider text-sm mb-4">Existing Categories</h4>
                <div className="flex flex-wrap gap-3">
                  {categories.length === 0 && <span className="text-gray-400 italic">No categories added yet.</span>}
                  {categories.map(cat => (
                    <span key={cat._id} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 shadow-sm hover:shadow-md transition">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT TAB */}
          {activeTab === 'products' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">Product Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Product Name</label>
                  <input 
                    type="text" 
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="e.g. Aashirvaad Atta" 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium" 
                  />
                </div>
                
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Price (Rs)</label>
                  <input 
                    type="number" 
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="e.g. 500" 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium" 
                  />
                </div>

                {/* 🟢 NAYA UPDATE: Quantity Field */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Quantity / Unit</label>
                  <input 
                    type="text" 
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                    placeholder="e.g. 1 Bora, 1 Kg, 1 Box, Rs 50 ko packet" 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium" 
                  />
                </div>
                
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium bg-white"
                  >
                    {categories.length === 0 && <option value="">No categories available.</option>}
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* 🟢 NAYA UPDATE: Description Field (Full width: md:col-span-2) */}
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-3">Product Description</label>
                  <textarea 
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    placeholder="e.g. Premium Jeera Masino chamal, perfectly aged for best taste..." 
                    rows="3"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium" 
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Upload Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                  />
                </div>

                {imagePreview && (
                  <div className="md:col-span-2 mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow" />
                    <span className="text-sm text-gray-500 font-medium">Local file selected and ready to upload</span>
                  </div>
                )}

                <div className="md:col-span-2 mt-6">
                  <button 
                    onClick={triggerProductSave}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1"
                  >
                    Upload Product to Storefront
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}