import React, { useState, useEffect } from 'react';
import { Package, FolderPlus, LogOut, LayoutDashboard, Lock } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Items State
  const [newCat, setNewCat] = useState('');
  const [productForm, setProductForm] = useState({ name: '', price: '', category: '', image: '' });
  const [categories, setCategories] = useState([]);

  // Page load huda token check garne ra categories tanne
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
      console.error("Category fetch garna error aayo:", error);
    }
  };

  // 🔐 Real Database Login Logic
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://kiranastore-luig.onrender.com/api/admin/login', loginForm);
      
      // Token lai localStorage ma save garne
      localStorage.setItem('adminToken', response.data.token);
      setIsLoggedIn(true);
      alert("Login Successful! 🎉");
      
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.error || "Login fail vayo. Server chaleko cha ki nai check garnus.");
    }
  };

  // 🚪 Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setLoginForm({ username: '', password: '' });
  };

  // 📁 Category save garna (With Token)
  const handleSaveCategory = async () => {
    if (!newCat.trim()) {
      return alert("Kripaya category ko naam lekhnuhos!");
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('https://kiranastore-luig.onrender.com/api/categories', 
        { name: newCat },
        { headers: { Authorization: `Bearer ${token}` } } // 👈 Token pathayeko
      );
      
      alert(`"${response.data.name}" category successfully save vayo! ✅`);
      setNewCat('');
      fetchCategories(); 
      
    } catch (error) {
      console.error("Error saving category:", error);
      alert(error.response?.data?.error || "Category save garna problem aayo!");
    }
  };

  // 🛒 Naya Product Database ma save garna (With Token)
  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category || !productForm.image) {
      return alert("Kripaya sabai product details fill garnuhos!");
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('https://kiranastore-luig.onrender.com/api/products', 
        productForm,
        { headers: { Authorization: `Bearer ${token}` } } // 👈 Token pathayeko
      );
      
      alert("Product store ma successfully upload vayo! 🛒");
      setProductForm({ ...productForm, name: '', price: '', image: '' }); // Form clear garne
      
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error.response?.data?.error || "Product save garna problem aayo!");
    }
  };

  // --------- LOGIN SCREEN ---------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex justify-center mb-6 text-blue-700">
            <Lock size={48} className="bg-blue-50 p-3 rounded-full" />
          </div>
          <h2 className="text-3xl font-black mb-8 text-center text-gray-800 tracking-tight">Admin Portal</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 font-medium mb-2 text-sm">Username</label>
              <input 
                type="text" 
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                placeholder="e.g. admin" 
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50" 
                required 
              />
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-2 text-sm">Password</label>
              <input 
                type="password" 
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                placeholder="••••••••" 
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50" 
                required 
              />
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-4 mt-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Secure Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --------- DASHBOARD SCREEN ---------
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* Sidebar */}
      <div className="w-72 bg-blue-900 text-white p-6 shadow-2xl hidden md:flex flex-col">
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
        
        {/* Mobile Header (Shows only on small screens) */}
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
                <button onClick={handleSaveCategory} className="w-full bg-green-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition shadow-lg hover:shadow-green-500/30">
                  Save Category
                </button>
              </div>

              {/* Display existing categories */}
              <div className="mt-12">
                <h4 className="font-bold text-gray-500 uppercase tracking-wider text-sm mb-4">Existing Categories</h4>
                <div className="flex flex-wrap gap-3">
                  {categories.length === 0 && <span className="text-gray-400 italic">No categories added yet.</span>}
                  {categories.map(cat => (
                    <span key={cat._id} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 shadow-sm">
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
                    placeholder="e.g. Aashirvaad Atta (5kg)" 
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
                
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium bg-white"
                  >
                    {categories.length === 0 && <option value="">No categories available. Please add one first.</option>}
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-600 font-semibold mb-3">Image URL</label>
                  <input 
                    type="text" 
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    placeholder="https://images.unsplash.com/..." 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition font-medium text-sm" 
                  />
                </div>

                {/* Image Preview (Optional flair) */}
                {productForm.image && (
                  <div className="md:col-span-2 mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
                    <img src={productForm.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow" onError={(e) => e.target.style.display='none'} />
                    <span className="text-sm text-gray-500 font-medium">Image Preview</span>
                  </div>
                )}

                <div className="md:col-span-2 mt-6">
                  <button 
                    onClick={handleSaveProduct}
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