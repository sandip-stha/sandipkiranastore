import React, { useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { PlusCircle, Edit, Trash2, Search, Filter } from 'lucide-react';

// 🌟 MEASURE_UNITS manual array हटाइयो। अब यो props (measureUnits) बाट आउँछ।
export default function ManageProducts({ products, categories, measureUnits = [], fetchData, API_URL, showToast }) {
  
  // 🌟 डिफल्ट युनिट सेट गर्दा backend बाट आएको पहिलो युनिट राख्ने, नभए 'Kg' राख्ने
  const defaultUnit = measureUnits[0]?.name || 'Kg';

  const [productForm, setProductForm] = useState({
    name: '', category: categories[0]?.name || '', description: '',
    pricing: [{ measureQty: '', measureUnit: defaultUnit, price: '' }],
    image: null, isEditing: false, editId: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const addPriceField = () => setProductForm({ 
    ...productForm, 
    pricing: [...productForm.pricing, { measureQty: '', measureUnit: defaultUnit, price: '' }] 
  });
  
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
        const compressedFile = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true, fileType: 'image/jpeg' });
        setProductForm({ ...productForm, image: compressedFile });
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        showToast("Image compress garna samasya vayo!", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || !productForm.description) return showToast("Kripaya sabai details fill garnuhos!", "error");
    
    const validPricing = productForm.pricing.filter(p => p.measureQty && p.measureUnit && p.price);
    if (validPricing.length === 0) return showToast("Kamti ma euta Unit ra Price halnu jaruri cha!", "error");
    if (!productForm.isEditing && !productForm.image) return showToast("Image halna nabirsinu hos!", "error");

    setIsLoading(true);
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('category', productForm.category);
    formData.append('description', productForm.description);
    formData.append('pricing', JSON.stringify(validPricing));
    if (productForm.image instanceof File || productForm.image instanceof Blob) formData.append('image', productForm.image);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };

    try {
      if (productForm.isEditing) {
        await axios.put(`${API_URL}/api/products/${productForm.editId}`, formData, { headers });
        showToast("Product Updated Successfully!", "success");
      } else {
        await axios.post(`${API_URL}/api/products`, formData, { headers });
        showToast("Product Uploaded Successfully!", "success");
      }
      resetForm();
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
      pricing: prod.pricing?.length ? prod.pricing : [{ measureQty: '', measureUnit: defaultUnit, price: '' }], 
      image: null, 
      isEditing: true, 
      editId: prod._id 
    });
    setImagePreview(prod.image);
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Product Deleted!", "success");
      if (productForm.editId === id) resetForm();
      fetchData();
    } catch (err) {
      showToast("Failed to delete product", "error");
    }
  };

  const resetForm = () => {
    setProductForm({ name: '', category: categories[0]?.name || '', description: '', pricing: [{ measureQty: '', measureUnit: defaultUnit, price: '' }], image: null, isEditing: false, editId: null });
    setImagePreview(null);
  };

  const filteredProducts = products.filter(prod => {
    const matchSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'All' || prod.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-6 items-start h-full">
      
      {/* ---------------- RIGHT SIDE: Form Section ---------------- */}
      <div className="w-full lg:w-5/12 bg-white p-6 rounded-3xl shadow-sm border sticky top-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-bold text-gray-700">
                {productForm.isEditing ? '✏️ Edit Product' : '➕ Add New Product'}
            </h3>
            {productForm.isEditing && (
                <button onClick={resetForm} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 font-semibold">
                    Cancel
                </button>
            )}
        </div>

        <form onSubmit={handleProductSubmit} className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Product Name</label>
            <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Aashirvaad Atta" className="w-full p-3 border rounded-xl text-sm" />
          </div>
          
          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Category</label>
            <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full p-3 border rounded-xl bg-white text-sm">
              {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <label className="text-blue-900 font-bold text-sm">Pricing Tiers ⚖️</label>
              <button type="button" onClick={addPriceField} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700"><PlusCircle size={14} /> Add</button>
            </div>
            <div className="space-y-2">
              {productForm.pricing.map((priceItem, index) => {
                // 🌟 पुरानो प्रोडक्टलाई असर नपरोस् भनेर Fallback Check: यदि पुरानो युनिट लिस्टबाट डिलिट भइसकेको रहेछ भने पनि त्यो Dropdown मा देखिनेछ
                const isUnitInList = measureUnits.some(u => u.name === priceItem.measureUnit);
                
                return (
                  <div key={index} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border shadow-sm">
                    <input type="number" step="any" placeholder="Qty" value={priceItem.measureQty} onChange={(e) => handlePriceChange(index, 'measureQty', e.target.value)} className="w-16 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-sm" required />
                    
                    <select value={priceItem.measureUnit} onChange={(e) => handlePriceChange(index, 'measureUnit', e.target.value)} className="w-24 p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center text-sm">
                      {/* यदि पुरानो युनिट डिलिट भएको छ भने त्यसलाई पनि अप्सनमा राख्ने ताकि डाटा नबिग्रियोस् */}
                      {!isUnitInList && priceItem.measureUnit && (
                        <option value={priceItem.measureUnit}>{priceItem.measureUnit} (Old)</option>
                      )}
                      {measureUnits.map(u => <option key={u._id || u.name} value={u.name}>{u.name}</option>)}
                    </select>

                    <span className="font-bold text-gray-400">=</span>
                    <input type="number" placeholder="Price" value={priceItem.price} onChange={(e) => handlePriceChange(index, 'price', e.target.value)} className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700 text-center text-sm" required />
                    {productForm.pricing.length > 1 && (
                      <button type="button" onClick={() => removePriceField(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Description</label>
            <textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows="2" className="w-full p-3 border rounded-xl text-sm"></textarea>
          </div>
          
          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Image {productForm.isEditing && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep old)</span>}</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2.5 border rounded-xl text-sm" disabled={isLoading} />
            {imagePreview && !isLoading && <img src={imagePreview} alt="Preview" className="w-16 h-16 mt-2 object-cover rounded-lg shadow border" />}
          </div>
          
          <button type="submit" disabled={isLoading} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-colors ${productForm.isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {isLoading ? 'Processing...' : (productForm.isEditing ? 'Update Product' : 'Upload Product')}
          </button>
        </form>
      </div>

      {/* ---------------- LEFT SIDE: Inventory Table Section ---------------- */}
      <div className="w-full lg:w-7/12 bg-white rounded-3xl shadow-sm border flex flex-col max-h-[85vh]">
        <div className="p-6 border-b bg-gray-50/50 rounded-t-3xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                Product Inventory
                <span className="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full">{filteredProducts.length} Items</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="text" placeholder="Search product name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-sm">
                        <option value="All">All Categories</option>
                        {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                    </select>
                </div>
            </div>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b">
                <th className="p-4 font-bold text-gray-600 text-sm">Product</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Pricing</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? filteredProducts.map(prod => (
                <tr key={prod._id} className={`border-b hover:bg-blue-50 transition-colors ${productForm.editId === prod._id ? 'bg-blue-50/70 border-l-4 border-l-blue-500' : ''}`}>
                  <td className="p-4">
                      <div className="flex items-center gap-3">
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border shadow-sm" />
                          <div>
                              <div className="font-bold text-gray-800">{prod.name}</div>
                              <span className="text-gray-500 text-xs font-semibold">{prod.category}</span>
                          </div>
                      </div>
                  </td>
                  <td className="p-4 text-sm text-gray-700">
                    <div className="flex flex-col gap-1">
                      {prod.pricing && prod.pricing.map((p, i) => (
                          <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-semibold w-max">
                              {p.measureQty}{p.measureUnit} = Rs {p.price}
                          </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right align-middle">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => editProduct(prod)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors bg-blue-50"><Edit size={18}/></button>
                        <button onClick={() => deleteProduct(prod._id)} className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors bg-red-50"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr><td colSpan="3" className="text-center p-8 text-gray-500">Product vetiyena. Kripaya search kura check garnuhos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}