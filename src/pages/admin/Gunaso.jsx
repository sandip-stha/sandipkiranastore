import React from 'react';
import axios from 'axios';
import { CheckCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function Gunaso({ gunasos, fetchGunasos, API_URL, showToast }) {
  
  // 🌟 NAYA: फोटो नहुँदा नामको पहिलो अक्षर निकाल्ने फङ्सन
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return names[0][0].toUpperCase();
  };

  const updateGunasoStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/gunaso/admin/${id}/status`, { status }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showToast(`Gunaso marked as ${status}!`, "success");
      fetchGunasos();
    } catch (err) {
      showToast("Failed to update gunaso", "error");
    }
  };

  const deleteGunaso = async (id) => {
    if (!window.confirm("Are you sure? यो गुनासो सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/gunaso/admin/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showToast("Gunaso Deleted!", "success");
      fetchGunasos();
    } catch (err) {
      showToast("Failed to delete gunaso", "error");
    }
  };

  if (gunasos.length === 0) {
    return <div className="bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">अहिले सम्म कुनै गुनासो वा सुझाव आएको छैन।</div>;
  }

  return (
    <div className="space-y-6">
      {gunasos.map((g) => {
        const userProfilePic = g.profilePic || g.customer?.profilePic; // 🌟 फोटो तान्ने

        return (
          <div key={g._id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${g.status === 'Pending' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-green-500 opacity-80'}`}>
            <div className="bg-gray-50/80 p-5 md:p-6 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
              
              {/* 🌟 NAYA: Gunaso Sender Info with Avatar */}
              <div className="flex items-center gap-4">
                {userProfilePic ? (
                  <img src={userProfilePic} alt={g.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0 bg-gray-200" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-2 border-white shadow-sm shrink-0 ${g.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {getInitials(g.name)}
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-gray-800">{g.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${g.status === 'Pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                      {g.status === 'Pending' ? <Clock size={14}/> : <CheckCircle size={14}/>} {g.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm font-bold flex gap-3 mt-1"><span>📞 {g.phone}</span> <span className="hidden md:inline">|</span> <span>📍 {g.location}</span></p>
                </div>
              </div>

            </div>

            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="flex-1 w-full">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</p>
                <p className="text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border border-gray-200 italic leading-relaxed text-lg">"{g.complaint}"</p>
                {g.image && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Attached Image</p>
                    <a href={g.image} target="_blank" rel="noreferrer"><img src={g.image} alt="Gunaso Attachment" className="w-full md:w-64 h-48 object-cover rounded-xl border border-gray-200 shadow-sm hover:opacity-90 transition cursor-pointer" /></a>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-4 font-bold">Received At: {new Date(g.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 self-end md:self-auto">
                {g.status === 'Pending' ? (
                  <button onClick={() => updateGunasoStatus(g._id, 'Resolved')} className="flex-1 md:flex-none bg-green-500 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md"><CheckCircle2 size={18} /> Mark Resolved</button>
                ) : (
                  <div className="flex-1 md:flex-none bg-gray-100 text-green-600 px-5 py-3 rounded-xl font-black flex items-center justify-center gap-2 border border-green-200"><CheckCircle size={18} /> Resolved</div>
                )}
                <button onClick={() => deleteGunaso(g._id)} className="bg-red-50 text-red-500 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100 flex items-center justify-center"><Trash2 size={20} /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}