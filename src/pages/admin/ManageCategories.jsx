import React, { useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Scale, Tag } from 'lucide-react';

export default function ManageCategories({ categories, measureUnits, fetchData, API_URL, showToast }) {
  // Category Form State
  const [catForm, setCatForm] = useState({ name: '', isEditing: false, editId: null });
  // Measure Unit Form State
  const [unitForm, setUnitForm] = useState({ name: '', isEditing: false, editId: null });
  
  const [isLoadingCat, setIsLoadingCat] = useState(false);
  const [isLoadingUnit, setIsLoadingUnit] = useState(false);

  // --- 🌟 CATEGORY HANDLERS ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return showToast("Category name चाहियो!", "error");
    
    setIsLoadingCat(true);
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
      showToast(error.response?.data?.error || "Category action failed", "error");
    } finally {
      setIsLoadingCat(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Category Deleted!", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete category", "error");
    }
  };

  // --- 🌟 MEASURE UNIT HANDLERS ---
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    if (!unitForm.name.trim()) return showToast("Unit ko name चाहियो!", "error");
    
    setIsLoadingUnit(true);
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (unitForm.isEditing) {
        await axios.put(`${API_URL}/api/measure-units/${unitForm.editId}`, { name: unitForm.name }, { headers });
        showToast("Measure Unit Updated!", "success");
      } else {
        await axios.post(`${API_URL}/api/measure-units`, { name: unitForm.name }, { headers });
        showToast("Measure Unit Added!", "success");
      }
      setUnitForm({ name: '', isEditing: false, editId: null });
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.error || "Unit action failed", "error");
    } finally {
      setIsLoadingUnit(false);
    }
  };

  const deleteUnit = async (id) => {
    if (!window.confirm("के तपाईं यो Unit डिलिट गर्न चाहनुहुन्छ? पुरानो सामानलाई असर गर्दैन।")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/measure-units/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Measure Unit Deleted!", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete unit", "error");
    }
  };

  return (
    <div className="space-y-12 pb-10">
      
      {/* ================= SECTION 1: CATEGORIES ================= */}
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="text-blue-600" /> 1. Manage Product Categories
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create/Edit Category */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border h-fit">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-3">{catForm.isEditing ? '✏️ Edit Category' : '➕ Create New Category'}</h3>
            <form onSubmit={handleCategorySubmit}>
              <label className="block text-gray-600 font-semibold text-sm mb-2">Category Name</label>
              <input type="text" value={catForm.name} onChange={(e) => setCatForm({...catForm, name: e.target.value})} placeholder="e.g. Masala, Chamal..." className="w-full p-3 border rounded-xl mb-4 outline-none focus:border-blue-500 text-sm" />
              <div className="flex gap-3">
                <button type="submit" disabled={isLoadingCat} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700">{isLoadingCat ? 'Saving...' : (catForm.isEditing ? 'Update Category' : 'Save Category')}</button>
                {catForm.isEditing && <button type="button" onClick={() => setCatForm({ name: '', isEditing: false, editId: null })} className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm">Cancel</button>}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border max-h-[350px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-3 flex justify-between">
              <span>All Categories</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">{categories?.length || 0}</span>
            </h3>
            <table className="w-full text-left border-collapse text-sm">
              <tbody>
                {categories?.map(cat => (
                  <tr key={cat._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="py-3 flex justify-end gap-2">
                      <button onClick={() => setCatForm({ name: cat.name, isEditing: true, editId: cat._id })} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit size={16}/></button>
                      <button onClick={() => deleteCategory(cat._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* ================= SECTION 2: MEASURE UNITS ================= */}
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
          <Scale className="text-green-600" /> 2. Manage Measure Units (तौल/मात्रा इकाईहरू)
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create/Edit Measure Unit */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border h-fit">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-3">{unitForm.isEditing ? '✏️ Edit Measure Unit' : '➕ Add New Unit'}</h3>
            <form onSubmit={handleUnitSubmit}>
              <label className="block text-gray-600 font-semibold text-sm mb-2">Unit Name (e.g. Kg, Gram, Bora, Packet)</label>
              <input type="text" value={unitForm.name} onChange={(e) => setUnitForm({...unitForm, name: e.target.value})} placeholder="e.g. Cartoon, Bora, Liter..." className="w-full p-3 border rounded-xl mb-4 outline-none focus:border-green-500 text-sm" />
              <div className="flex gap-3">
                <button type="submit" disabled={isLoadingUnit} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700">{isLoadingUnit ? 'Saving...' : (unitForm.isEditing ? 'Update Unit' : 'Save Unit')}</button>
                {unitForm.isEditing && <button type="button" onClick={() => setUnitForm({ name: '', isEditing: false, editId: null })} className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm">Cancel</button>}
              </div>
            </form>
          </div>

          {/* Measure Units List */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border max-h-[350px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-3 flex justify-between">
              <span>All Measure Units</span>
              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">{measureUnits?.length || 0}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {measureUnits?.map(u => (
                <div key={u._id} className="flex items-center justify-between bg-gray-50 border p-2.5 rounded-xl hover:bg-green-50/50 transition">
                  <span className="font-bold text-gray-800 text-sm truncate">{u.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setUnitForm({ name: u.name, isEditing: true, editId: u._id })} className="text-blue-500 hover:bg-blue-100 p-1 rounded"><Edit size={14}/></button>
                    <button onClick={() => deleteUnit(u._id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}