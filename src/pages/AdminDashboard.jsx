// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, FolderPlus, LogOut, LayoutDashboard, Lock, Loader2, AlertCircle, CheckCircle, XCircle, PlusCircle, Trash2, Edit } from 'lucide-react';
import axios from 'axios';

// Update this to your actual deployed backend URL
const API_URL = 'https://kiranastore-luig.onrender.com'; 

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Category Form State
  const [catForm, setCatForm] = useState({ name: '', isEditing: false, editId: null });
  
  // Product Form State (Notice: pricing is an array now)
  const [productForm, setProductForm] = useState({ 
    name: '', 
    category: '', 
    description: '', 
    pricing: [{ unit: '', price: '' }], // Array of prices
    image: null,
    isEditing: false,
    editId: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  // Helper: Toast
  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsLoggedIn(true);
    fetchData();
  }, []);

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
    } catch (error) {
      console.error("Data fetch error:", error);
    }
  };

  // 🔐 Auth Handlers
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

  // ==========================================
  // CATEGORY FUNCTIONS
  // ==========================================
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

  // ==========================================
  // PRODUCT PRICING FUNCTIONS (Dynamic)
  // ==========================================
  const addPriceField = () => {
    setProductForm({ ...productForm, pricing: [...productForm.pricing, { unit: '', price: '' }] });
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

  // ==========================================
  // PRODUCT FUNCTIONS
  // ==========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm({ ...productForm, image: file });
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (!productForm.name || !productForm.category || !productForm.description) {
      return showToast("Kripaya sabai details fill garnuhos!", "error");
    }
    // Check if at least one complete pricing tier exists
    const validPricing = productForm.pricing.filter(p => p.unit && p.price);
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
    // Send pricing array as JSON string
    formData.append('pricing', JSON.stringify(validPricing));
    
    if (productForm.image instanceof File) {
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
      
      // Reset Form
      setProductForm({ 
        name: '', category: categories[0]?.name || '', description: '', 
        pricing: [{ unit: '', price: '' }], image: null, isEditing: false, editId: null 
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
      pricing: prod.pricing && prod.pricing.length > 0 ? prod.pricing : [{ unit: '', price: '' }],
      image: null, // Don't set URL to file object, we just leave it null unless they upload new
      isEditing: true,
      editId: prod._id
    });
    setImagePreview(prod.image); // Show old image from cloud as preview
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

  // --------- LOGIN SCREEN ---------
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

  // --------- DASHBOARD SCREEN ---------
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative overflow-hidden">
      {toast.isVisible && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
          <span className="font-bold text-lg">{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-blue-900 text-white p-6 shadow-2xl hidden md:flex flex-col z-10">
        <h2 className="text-2xl font-black mb-10 flex items-center gap-3 border-b border-blue-800 pb-6">
          <LayoutDashboard size={28} className="text-yellow-400" /> Admin
        </h2>
        <ul className="space-y-3 flex-1">
          <li onClick={() => setActiveTab('products')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold ${activeTab === 'products' ? 'bg-blue-700 text-yellow-300' : 'hover:bg-blue-800 text-gray-300'}`}>
            <Package size={22} /> Manage Products
          </li>
          <li onClick={() => setActiveTab('categories')} className={`cursor-pointer p-4 rounded-xl flex items-center gap-3 font-semibold ${activeTab === 'categories' ? 'bg-blue-700 text-yellow-300' : 'hover:bg-blue-800 text-gray-300'}`}>
            <FolderPlus size={22} /> Manage Categories
          </li>
        </ul>
        <div className="border-t border-blue-800 pt-6">
          <button onClick={handleLogout} className="w-full cursor-pointer p-4 rounded-xl text-red-300 hover:text-white hover:bg-red-500/20 flex items-center justify-center gap-2 font-bold">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-gray-800 mb-8">
            {activeTab === 'products' ? 'Manage Store Products 📦' : 'Manage Store Categories 📁'}
          </h1>

          {/* ============================== CATEGORY TAB ============================== */}
          {activeTab === 'categories' && (
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Add/Edit Form */}
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

              {/* Table List */}
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
              
              {/* Product Form */}
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

                  {/* DYNAMIC PRICING SECTION */}
                  <div className="md:col-span-2 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-blue-900 font-black text-lg">Product Pricing Tiers 💰</label>
                      <button type="button" onClick={addPriceField} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                        <PlusCircle size={16} /> Add Another Rate
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {productForm.pricing.map((priceItem, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-white p-3 rounded-xl border">
                          <div className="flex-1">
                            <input 
                              type="text" value={priceItem.unit} onChange={(e) => handlePriceChange(index, 'unit', e.target.value)} 
                              placeholder="Unit (e.g. 1 Bora, 1 Kg, Cartoon)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required 
                            />
                          </div>
                          <div className="flex-1">
                            <input 
                              type="number" value={priceItem.price} onChange={(e) => handlePriceChange(index, 'price', e.target.value)} 
                              placeholder="Price in Rs (e.g. 2000)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required 
                            />
                          </div>
                          {productForm.pricing.length > 1 && (
                            <button type="button" onClick={() => removePriceField(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">* Note: Tapailye Bora, Kg, Pouch anusar xutta-xuttai price add garna saknuhuncha.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-600 font-semibold mb-2">Description</label>
                    <textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} placeholder="About this product..." rows="3" className="w-full p-4 border rounded-xl"></textarea>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-600 font-semibold mb-2">Image {productForm.isEditing && '(Leave blank to keep old image)'}</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-3 border rounded-xl" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="w-20 h-20 mt-3 object-cover rounded-lg shadow" />}
                  </div>

                  <div className="md:col-span-2 flex gap-4 mt-4">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-lg hover:bg-green-700 shadow-lg">
                      {isLoading ? 'Processing...' : (productForm.isEditing ? 'Update Product Details' : 'Upload Product to Store')}
                    </button>
                    {productForm.isEditing && (
                      <button type="button" onClick={() => { setProductForm({ name: '', category: categories[0]?.name || '', description: '', pricing: [{ unit: '', price: '' }], image: null, isEditing: false, editId: null }); setImagePreview(null); }} className="bg-gray-200 text-gray-800 py-4 px-8 rounded-xl font-bold">
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
                        <th className="p-4 font-bold text-gray-600">Name</th>
                        <th className="p-4 font-bold text-gray-600">Category</th>
                        <th className="p-4 font-bold text-gray-600">Pricing (Unit : Rs)</th>
                        <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(prod => (
                        <tr key={prod._id} className="border-b hover:bg-gray-50">
                          <td className="p-4"><img src={prod.image} alt="img" className="w-12 h-12 rounded object-cover border" /></td>
                          <td className="p-4 font-bold text-gray-800">{prod.name}</td>
                          <td className="p-4 text-gray-600">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">{prod.category}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            <div className="flex flex-col gap-1">
                              {prod.pricing && prod.pricing.map((p, i) => (
                                <span key={i} className="bg-green-50 text-green-800 px-2 py-1 border border-green-200 rounded">
                                  {p.unit} : <b>Rs {p.price}</b>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 flex justify-end gap-2 items-center h-full">
                            <button onClick={() => editProduct(prod)} className="text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition"><Edit size={20}/></button>
                            <button onClick={() => deleteProduct(prod._id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition"><Trash2 size={20}/></button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan="5" className="p-6 text-center text-gray-400">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}