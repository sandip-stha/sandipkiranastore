import React, { useState } from 'react';
import axios from 'axios';
import { Edit, Trash2 } from 'lucide-react';

export default function UsersList({ users, fetchUsers, API_URL, showToast }) {
  const [userForm, setUserForm] = useState({ name: '', phone: '', email: '', address: '', landmark: '', adminRemark: '', isEditing: false, editId: null });
  const [isLoading, setIsLoading] = useState(false);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/admin/users/${userForm.editId}`, userForm, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Customer Details Updated!", "success");
      setUserForm({ name: '', phone: '', email: '', address: '', landmark: '', adminRemark: '', isEditing: false, editId: null });
      fetchUsers();
    } catch (err) {
      showToast("Failed to update customer", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure? यो ग्राहकको सम्पूर्ण डाटा सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Customer Deleted!", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to delete customer", "error");
    }
  };

  const editUser = (user) => {
    setUserForm({ name: user.name, phone: user.phone, email: user.email, address: user.address, landmark: user.landmark, adminRemark: user.adminRemark || '', isEditing: true, editId: user._id });
    window.scrollTo(0, 0);
  };

  return (
    <div className="space-y-8">
      {userForm.isEditing && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-200">
          <h3 className="text-xl font-bold text-gray-700 mb-6 border-b pb-4">✏️ Edit Customer Details</h3>
          <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-gray-600 font-semibold mb-2">Full Name</label><input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="w-full p-4 border rounded-xl" required /></div>
            <div><label className="block text-gray-600 font-semibold mb-2">Phone Number</label><input type="text" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} className="w-full p-4 border rounded-xl" required /></div>
            <div><label className="block text-gray-600 font-semibold mb-2">Email Address</label><input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full p-4 border rounded-xl" required /></div>
            <div><label className="block text-gray-600 font-semibold mb-2">Landmark</label><input type="text" value={userForm.landmark} onChange={(e) => setUserForm({...userForm, landmark: e.target.value})} className="w-full p-4 border rounded-xl" required /></div>
            <div className="md:col-span-2"><label className="block text-gray-600 font-semibold mb-2">Full Address</label><input type="text" value={userForm.address} onChange={(e) => setUserForm({...userForm, address: e.target.value})} className="w-full p-4 border rounded-xl" required /></div>
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border"><label className="block text-gray-700 font-bold mb-2">Admin Remarks (चिन्न सजिलोको लागि)</label><input type="text" value={userForm.adminRemark} onChange={(e) => setUserForm({...userForm, adminRemark: e.target.value})} className="w-full p-3 border rounded-xl bg-white" placeholder="e.g. उधारो लग्ने..." /></div>
            <div className="md:col-span-2 flex gap-4 mt-2">
              <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700">{isLoading ? 'Updating...' : 'Update Details'}</button>
              <button type="button" onClick={() => setUserForm({ name: '', phone: '', email: '', address: '', landmark: '', adminRemark: '', isEditing: false, editId: null })} className="bg-gray-200 text-gray-800 py-4 px-8 rounded-xl font-bold hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {users.length === 0 ? (
          <div className="col-span-2 bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">अहिले सम्म कुनै ग्राहक दर्ता भएका छैनन्।</div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col gap-5 relative overflow-hidden transition-all hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 mb-1">{user.name}</h3>
                  <p className="text-gray-500 font-bold text-sm">📞 {user.phone} | 📧 {user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editUser(user)} className="bg-blue-50 text-blue-500 p-3 rounded-xl hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-100"><Edit size={20} /></button>
                  <button onClick={() => deleteUser(user._id)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100"><Trash2 size={20} /></button>
                </div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <p className="font-bold text-gray-800 mb-1">📍 {user.address}</p>
                <p className="text-sm text-gray-600 font-semibold mb-2">Landmark: <span className="text-blue-700">{user.landmark}</span></p>
                {user.adminRemark && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Admin Remarks</p>
                    <p className="text-sm font-bold text-gray-800 italic">" {user.adminRemark} "</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}