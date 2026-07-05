import React, { useState } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, MapPin, Phone, PackageOpen, PlusCircle, UserCircle } from 'lucide-react';

export default function ManageDealers({ dealers, fetchDealers, API_URL, showToast }) {
  const [form, setForm] = useState({ 
    agencyName: '', 
    contacts: [{ name: '', phone: '', role: '' }], 
    location: '', 
    suppliedItems: '', 
    notes: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Contact Field add/remove/change garne functions
  const addContactField = () => setForm({ ...form, contacts: [...form.contacts, { name: '', phone: '', role: '' }] });
  
  const removeContactField = (index) => {
    const newContacts = form.contacts.filter((_, i) => i !== index);
    setForm({ ...form, contacts: newContacts });
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = [...form.contacts];
    newContacts[index][field] = value;
    setForm({ ...form, contacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agencyName || !form.suppliedItems) {
      return showToast("Agency ko naam ra items halnu jaruri cha!", "error");
    }

    const validContacts = form.contacts.filter(c => c.phone);
    if (validContacts.length === 0) {
        return showToast("Kamti ma euta Contact Number halnu hos!", "error");
    }

    setIsLoading(true);
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    const payload = { ...form, contacts: validContacts };

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/admin/dealers/${editId}`, payload, { headers });
        showToast("Dealer Updated Successfully!", "success");
      } else {
        await axios.post(`${API_URL}/api/admin/dealers`, payload, { headers });
        showToast("New Dealer Added!", "success");
      }
      resetForm();
      fetchDealers();
    } catch (error) {
      showToast("Operation failed!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const editDealer = (dealer) => {
    setForm({ 
      agencyName: dealer.agencyName, 
      contacts: dealer.contacts?.length ? dealer.contacts : [{ name: '', phone: '', role: '' }], 
      location: dealer.location, 
      suppliedItems: dealer.suppliedItems, 
      notes: dealer.notes || '' 
    });
    setIsEditing(true);
    setEditId(dealer._id);
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDealer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dealer?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/dealers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Dealer Deleted!", "success");
      if (editId === id) resetForm();
      fetchDealers();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const resetForm = () => {
    setForm({ agencyName: '', contacts: [{ name: '', phone: '', role: '' }], location: '', suppliedItems: '', notes: '' });
    setIsEditing(false);
    setEditId(null);
  };

  const filteredDealers = dealers?.filter(d => 
    d.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.suppliedItems.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-6 items-start h-full">
      
      {/* ---------------- RIGHT SIDE: Form Section ---------------- */}
      <div className="w-full lg:w-7/12 bg-white rounded-3xl shadow-sm border flex flex-col max-h-[85vh]">
        <div className="p-6 border-b bg-gray-50/50 rounded-t-3xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                Dealers Directory
                <span className="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full">{filteredDealers.length} Contacts</span>
            </h3>
            
            <div className="relative w-full">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search agency or items..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
            </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b">
                <th className="p-4 font-bold text-gray-600 text-sm w-1/3">Agency & Info</th>
                <th className="p-4 font-bold text-gray-600 text-sm w-1/3">Contacts</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDealers.length > 0 ? filteredDealers.map(dealer => (
                <tr key={dealer._id} className={`border-b hover:bg-blue-50 transition-colors ${editId === dealer._id ? 'bg-blue-50/70 border-l-4 border-l-blue-500' : ''}`}>
                  <td className="p-4 align-top">
                      <div className="font-bold text-gray-800 text-base mb-1">{dealer.agencyName}</div>
                      <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1.5">
                          <MapPin size={14} className="text-red-500 shrink-0"/> 
                          <span>{dealer.location}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs text-gray-600">
                          <PackageOpen size={14} className="text-yellow-600 shrink-0"/> 
                          <span className="italic">{dealer.suppliedItems}</span>
                      </div>
                  </td>
                  
                  <td className="p-4 align-top text-sm">
                    <div className="flex flex-col gap-2">
                      {dealer.contacts && dealer.contacts.map((c, i) => (
                          <div key={i} className="bg-gray-50 border p-2 rounded-lg text-xs">
                              <div className="font-bold text-gray-700 flex justify-between">
                                 <span>{c.name || 'Unknown'}</span>
                                 <span className="text-orange-600 bg-orange-100 px-1.5 rounded">{c.role || 'Staff'}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-gray-800 font-semibold tracking-wide">
                                <Phone size={12} className="text-green-600"/> {c.phone}
                              </div>
                          </div>
                      ))}
                    </div>
                  </td>

                  <td className="p-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => editDealer(dealer)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors bg-blue-50">
                            <Edit size={18}/>
                        </button>
                        <button onClick={() => deleteDealer(dealer._id)} className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors bg-red-50">
                            <Trash2 size={18}/>
                        </button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan="3" className="text-center p-8 text-gray-500">
                          Dealer vetiyena. Naya add garnuhos.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      

      {/* ---------------- LEFT SIDE: Table Section ---------------- */}
      <div className="w-full lg:w-5/12 bg-white p-6 rounded-3xl shadow-sm border sticky top-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-bold text-gray-700">
                {isEditing ? '✏️ Edit Dealer' : '➕ Add New Dealer'}
            </h3>
            {isEditing && (
                <button onClick={resetForm} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 font-semibold">Cancel</button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Agency / Supplier Name *</label>
            <input type="text" value={form.agencyName} onChange={(e) => setForm({...form, agencyName: e.target.value})} placeholder="e.g. CG Distributors" className="w-full p-3 border rounded-xl text-sm" required />
          </div>
          
          {/* Contacts Dynamic Fields */}
          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
            <div className="flex justify-between items-center mb-3">
              <label className="text-orange-900 font-bold text-sm">Contact Persons 📞</label>
              <button type="button" onClick={addContactField} className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600"><PlusCircle size={14} /> Add Person</button>
            </div>
            <div className="space-y-3">
              {form.contacts.map((contact, index) => (
                <div key={index} className="bg-white p-3 rounded-xl border shadow-sm relative">
                  {form.contacts.length > 1 && (
                    <button type="button" onClick={() => removeContactField(index)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"><Trash2 size={14} /></button>
                  )}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" placeholder="Name (e.g. Ram)" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm" />
                    <input type="text" placeholder="Role (e.g. Hakim, Driver)" value={contact.role} onChange={(e) => handleContactChange(index, 'role', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm" />
                  </div>
                  <input type="text" placeholder="Phone Number *" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm font-bold text-gray-700" required />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Location / Address</label>
            <input type="text" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g. Kalimati, Kathmandu" className="w-full p-3 border rounded-xl text-sm" />
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Supplied Items *</label>
            <textarea value={form.suppliedItems} onChange={(e) => setForm({...form, suppliedItems: e.target.value})} placeholder="e.g. WaiWai, Real Juice..." rows="2" className="w-full p-3 border rounded-xl text-sm" required></textarea>
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1 text-sm">Extra Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="e.g. Bihan 10 baje matra call garne" rows="2" className="w-full p-3 border rounded-xl text-sm"></textarea>
          </div>
          
          <button type="submit" disabled={isLoading} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-colors mt-2 ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {isLoading ? 'Wait...' : (isEditing ? 'Update Dealer' : 'Save Dealer')}
          </button>
        </form>
      </div>
      
      
    </div>
  );
}