import React, { useState } from 'react';
import axios from 'axios';
import { Edit, Trash2 } from 'lucide-react';

export default function ManageCategories({ categories, fetchData, API_URL, showToast }) {
  const [catForm, setCatForm] = useState({ name: '', isEditing: false, editId: null });
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border h-fit">
        <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">{catForm.isEditing ? 'Edit Category' : 'Create New Category'}</h3>
        <form onSubmit={handleCategorySubmit}>
          <label className="block text-gray-600 font-semibold mb-3">Category Name</label>
          <input type="text" value={catForm.name} onChange={(e) => setCatForm({...catForm, name: e.target.value})} placeholder="e.g. Masala, Chamal..." className="w-full p-4 border rounded-xl mb-6 outline-none focus:border-blue-500" />
          <div className="flex gap-4">
            <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700">{isLoading ? 'Saving...' : (catForm.isEditing ? 'Update Category' : 'Save Category')}</button>
            {catForm.isEditing && <button type="button" onClick={() => setCatForm({ name: '', isEditing: false, editId: null })} className="bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border">
        <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">All Categories</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b"><th className="p-4 font-bold text-gray-600">Name</th><th className="p-4 font-bold text-gray-600 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{cat.name}</td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => { setCatForm({ name: cat.name, isEditing: true, editId: cat._id }); window.scrollTo(0, 0); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Edit size={20}/></button>
                  <button onClick={() => deleteCategory(cat._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}