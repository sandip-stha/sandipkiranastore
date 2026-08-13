import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Settings } from 'lucide-react';

export default function ManageSettings({ API_URL, showToast }) {
  const [settings, setSettings] = useState({
    deliveryCharge: 100,
    freeDeliveryThreshold: 5000
  });
  const [isLoading, setIsLoading] = useState(false);

  // सेटिङ्स तान्ने
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`);
      if (res.data) {
        setSettings({
          deliveryCharge: res.data.deliveryCharge,
          freeDeliveryThreshold: res.data.freeDeliveryThreshold
        });
      }
    } catch (error) {
      console.log("Failed to load settings:", error);
    }
  };

  // सेटिङ्स अपडेट गर्ने
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Settings Updated Successfully!", "success");
    } catch (error) {
      showToast("Failed to update settings!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border mt-6">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">App Settings</h2>
          <p className="text-sm text-gray-500">तपाईंको एपको डेलिभरी चार्ज र अफरहरू कन्ट्रोल गर्नुहोस्</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        
        {/* Delivery Charge Input */}
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <label className="block text-gray-700 font-bold mb-2 text-sm">
            Standard Delivery Charge (Rs)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rs.</span>
            <input 
              type="number" 
              value={settings.deliveryCharge} 
              onChange={(e) => setSettings({...settings, deliveryCharge: Number(e.target.value)})} 
              className="w-full pl-12 pr-4 py-3 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">यो रकम अर्डर गर्दा ग्राहकको बिलमा डेलिभरी चार्जको रूपमा जोडिनेछ।</p>
        </div>

        {/* Free Delivery Threshold Input */}
        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
          <label className="block text-blue-900 font-bold mb-2 text-sm">
            Free Delivery Threshold (Rs)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rs.</span>
            <input 
              type="number" 
              value={settings.freeDeliveryThreshold} 
              onChange={(e) => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})} 
              className="w-full pl-12 pr-4 py-3 border rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
          </div>
          <p className="text-xs text-blue-600 mt-2">यदि ग्राहकको सामानको मूल्य यो रकम वा यो भन्दा बढी छ भने डेलिभरी अटोमेटिक FREE हुनेछ। (जस्तै: ५०००)</p>
        </div>

        {/* Save Button */}
        <button 
          type="submit" 
          disabled={isLoading} 
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors mt-2"
        >
          {isLoading ? 'Saving...' : (
            <>
              <Save size={20} />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}