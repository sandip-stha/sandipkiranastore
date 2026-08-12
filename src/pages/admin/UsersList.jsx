import React, { useState } from 'react';
import axios from 'axios';
// 🌟 NAYA: Search icon थपिएको छ
import { Edit, Trash2, Camera, User, CheckCircle, Search } from 'lucide-react';

export default function UsersList({ users, fetchUsers, API_URL, showToast }) {
  const [userForm, setUserForm] = useState({ 
    name: '', phone: '', email: '', address: '', landmark: '', 
    adminRemark: '', profilePic: '', isVerified: false, isEditing: false, editId: null 
  });
  
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🌟 NAYA: Search को लागि State
  const [searchTerm, setSearchTerm] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return names[0][0].toUpperCase();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setUserForm({ ...userForm, profilePic: URL.createObjectURL(file) });
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let finalProfilePic = userForm.profilePic;

      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('profilePic', selectedImageFile);
        
        const uploadRes = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'multipart/form-data' 
          }
        });
        finalProfilePic = uploadRes.data.imageUrl;
      }

      const payload = { ...userForm, profilePic: finalProfilePic };
      
      await axios.put(`${API_URL}/api/admin/users/${userForm.editId}`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      showToast("Customer Details Updated!", "success");
      resetForm();
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update customer", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure? यो ग्राहकको सम्पूर्ण डाटा सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showToast("Customer Deleted!", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to delete customer", "error");
    }
  };

  const editUser = (user) => {
    setUserForm({ 
      name: user.name, 
      phone: user.phone, 
      email: user.email, 
      address: user.address, 
      landmark: user.landmark, 
      adminRemark: user.adminRemark || '', 
      profilePic: user.profilePic || '', 
      isVerified: user.isVerified || false,
      isEditing: true, 
      editId: user._id 
    });
    setSelectedImageFile(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setUserForm({ name: '', phone: '', email: '', address: '', landmark: '', adminRemark: '', profilePic: '', isVerified: false, isEditing: false, editId: null });
    setSelectedImageFile(null);
  };

  // 🌟 NAYA: Search फिल्टर गर्ने लजिक
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      
      {/* ---------------- SEARCH BAR ---------------- */}
      {!userForm.isEditing && (
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-3.5 text-blue-500" size={22} />
          <input 
            type="text" 
            placeholder="Search by customer name or phone number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-blue-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none shadow-sm text-gray-700 font-bold text-sm sm:text-base transition-all"
          />
        </div>
      )}

      {/* ---------------- EDIT CUSTOMER FORM ---------------- */}
      {userForm.isEditing && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-blue-200 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2 relative z-10">
            <Edit className="text-blue-600" size={22} /> Edit Customer Details
          </h3>
          
          <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            
            <div className="md:col-span-2 flex items-center gap-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm">
              <div className="relative">
                {userForm.profilePic ? (
                  <img src={userForm.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-3xl border-4 border-white shadow-md">
                    {getInitials(userForm.name)}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full border-2 border-white text-white shadow-sm cursor-pointer hover:bg-blue-700 transition">
                  <Camera size={16} />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-2 text-sm">Change Profile Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-white file:text-blue-700 hover:file:bg-blue-50 cursor-pointer shadow-sm border border-blue-100"
                />
                <p className="text-xs text-gray-400 mt-2 font-medium">Leave empty to keep the current photo.</p>
              </div>
            </div>

            <div><label className="block text-gray-600 font-semibold mb-2 text-sm">Full Name</label><input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <div><label className="block text-gray-600 font-semibold mb-2 text-sm">Phone Number</label><input type="text" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <div><label className="block text-gray-600 font-semibold mb-2 text-sm">Email Address</label><input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <div><label className="block text-gray-600 font-semibold mb-2 text-sm">Landmark</label><input type="text" value={userForm.landmark} onChange={(e) => setUserForm({...userForm, landmark: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <div className="md:col-span-2"><label className="block text-gray-600 font-semibold mb-2 text-sm">Full Address</label><input type="text" value={userForm.address} onChange={(e) => setUserForm({...userForm, address: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            
            <div className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-1.5"><User size={16} className="text-gray-400"/> Admin Remarks (तपाईंको चिनारीको लागि)</label>
              <input type="text" value={userForm.adminRemark} onChange={(e) => setUserForm({...userForm, adminRemark: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. सधैं उधारो लग्ने, पसलको छेउको दाई..." />
            </div>

            <div className="md:col-span-2 flex items-center justify-between bg-green-50/50 p-5 rounded-2xl border border-green-200 shadow-sm mt-2">
              <div>
                <label className="block text-green-700 font-bold text-sm">Verify Customer</label>
                <p className="text-xs text-gray-500 font-medium mt-1">Verified ग्राहकले आफैं फोटो फेर्न पाउँदैनन्।</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={userForm.isVerified}
                  onChange={(e) => setUserForm({ ...userForm, isVerified: e.target.checked })}
                />
                <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="md:col-span-2 flex gap-4 mt-2">
              <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-md transition flex justify-center items-center gap-2">
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><CheckCircle size={18}/> Update Details</>}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 py-3.5 px-8 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- CUSTOMERS LIST ---------------- */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-2 bg-white p-16 rounded-3xl border text-center text-gray-400 font-bold text-lg flex flex-col items-center justify-center gap-3 shadow-sm">
             <User size={48} className="text-gray-300" />
             {searchTerm ? 'तपाईंले खोज्नुभएको ग्राहक भेटिएन।' : 'अहिले सम्म कुनै ग्राहक दर्ता भएका छैनन्।'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5 relative overflow-hidden transition-all hover:shadow-lg group">
              <div className="flex justify-between items-start gap-4">
                
                {/* 🌟 NAYA: Photo size increased from w-14 to w-20/w-24 for better visibility */}
                <div className="flex items-center gap-5 flex-1">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-50 shadow-md shrink-0 bg-gray-100" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-3xl sm:text-4xl border-4 border-blue-50 shadow-md shrink-0">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-1.5 truncate group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      {user.name}
                      {user.isVerified && <CheckCircle size={16} className="text-green-600 shrink-0" title="Verified Customer" />}
                    </h3>
                    <p className="text-gray-500 font-bold text-sm truncate mb-1">📞 {user.phone}</p>
                    <p className="text-gray-400 font-semibold text-xs truncate">📧 {user.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button onClick={() => editUser(user)} className="bg-blue-50 text-blue-500 p-3 rounded-xl hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-100"><Edit size={18} /></button>
                  <button onClick={() => deleteUser(user._id)} className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100"><Trash2 size={18} /></button>
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 mt-2">
                <p className="font-bold text-slate-700 text-sm mb-1.5 flex items-start gap-2">📍 {user.address}</p>
                <p className="text-xs text-slate-500 font-bold ml-6">Landmark: <span className="text-blue-600">{user.landmark}</span></p>
                
                {user.adminRemark && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User size={12}/> Admin Remarks</p>
                    <p className="text-sm font-bold text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">"{user.adminRemark}"</p>
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