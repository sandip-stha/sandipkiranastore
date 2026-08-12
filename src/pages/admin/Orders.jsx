import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle, CheckCircle2, Clock, Trash2, Package, Truck, Banknote, X } from 'lucide-react';

const formatUnit = (unit, qty) => {
  if (typeof unit === 'string' && unit.startsWith(qty + ' ')) {
    return unit.replace(qty + ' ', '').trim();
  }
  return unit || '';
};

export default function Orders({ orders, fetchOrders, API_URL, showToast }) {
  // 🌟 Modals State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return names[0][0].toUpperCase();
  };

  const handleDeliveryPress = (order) => {
    if (order.paymentStatus === 'PAID') {
       updateOrderStatus(order._id, 'Delivered', 'PAID', order.totalAmount);
       return;
    }
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };

  const submitPartialPayment = () => {
    const parsedAmount = parseFloat(partialAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > selectedOrder.totalAmount) {
        return showToast("सही रकम हाल्नुहोस्।", "error");
    }
    setShowPartialModal(false);
    updateOrderStatus(selectedOrder._id, 'Delivered', 'PARTIALLY_PAID', parsedAmount);
  };

  const updateOrderStatus = async (id, status, paymentStatus = undefined, paidAmount = undefined) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/orders/${id}/status`, 
        { status, paymentStatus, paidAmount }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Order ${status} भयो!`, "success");
      setShowDeliveryModal(false);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.error || "अपडेट गर्न सकिएन।", "error");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Are you sure? यो अर्डर सधैंको लागि डिलिट हुनेछ!")) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Order Deleted!", "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to delete order", "error");
    }
  };

  const activeOrders = orders.filter(order => order.status !== 'Delivered' && order.status !== 'Cancelled');

  if (activeOrders.length === 0) {
    return <div className="bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">कुनै लाइभ अर्डर आएको छैन।</div>;
  }

  return (
    <div className="space-y-6">
      {activeOrders.map((order) => {
        const customerName = order.customer?.name || 'Unknown User';
        const userProfilePic = order.customer?.profilePic; 

        const isPending = order.status === 'Pending';
        const isChecked = order.status === 'Checked';

        // 🌟 Finance & Delivery Charge Logic
        const paidAmount = order.paidAmount || 0;
        const dueAmount = order.totalAmount - paidAmount;
        const subTotal = order.items?.reduce((acc, prod) => acc + (prod.finalPrice || prod.price || 0), 0) || 0;
        const deliveryCharge = Math.max(0, order.totalAmount - subTotal);

        return (
          <div key={order._id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${isPending ? 'border-l-4 border-l-orange-500' : isChecked ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'}`}>
            <div className="bg-gray-50/80 p-5 md:p-6 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
              
              <div className="flex items-center gap-4">
                {userProfilePic ? (
                  <img src={userProfilePic} alt={customerName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0 bg-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl border-2 border-white shadow-sm shrink-0">
                    {getInitials(customerName)}
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-xl font-black text-gray-800">{customerName}</h3>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                      isPending ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                      isChecked ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {isPending ? <Clock size={14} /> : isChecked ? <Package size={14} /> : <CheckCircle size={14} />} 
                      {order.status}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase flex items-center gap-1 ${
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' : 
                      order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      <Banknote size={12} />
                      {order.paymentStatus === 'PAID' ? 'PAID' : order.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIAL' : 'UNPAID'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm font-bold flex gap-3">
                    <span>📞 {order.customer?.phone}</span>
                    <span className="hidden md:inline">|</span>
                    <span className="text-gray-400 text-xs">#{order._id.substring(0, 6).toUpperCase()}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                {/* 🌟 NAYA: Finance Box */}
                <div className="flex bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200 shadow-sm">
                  <div className="flex-1 border-r border-gray-300 px-2">
                    <p className="text-[11px] text-gray-500 font-bold mb-1">Total Bill</p>
                    <p className="text-[15px] font-black text-gray-800">Rs. {order.totalAmount}</p>
                  </div>
                  <div className="flex-1 border-r border-gray-300 px-2 pl-4">
                    <p className="text-[11px] text-gray-500 font-bold mb-1">Paid</p>
                    <p className="text-[15px] font-black text-green-600">Rs. {paidAmount}</p>
                  </div>
                  <div className="flex-1 px-2 text-right">
                    <p className="text-[11px] text-red-600 font-bold mb-1">To Collect</p>
                    <p className="text-[18px] font-black text-red-600">Rs. {dueAmount}</p>
                  </div>
                </div>

                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                <div className="bg-gray-50 rounded-2xl border p-4 space-y-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500 font-bold">{item.qty} {formatUnit(item.displayUnit, item.qty)}</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-800">Rs {item.finalPrice || item.price}</span>
                    </div>
                  ))}

                  {/* 🌟 NAYA: Delivery Charge Row */}
                  {deliveryCharge > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <Truck size={20} className="text-red-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 text-sm">Delivery Charge</p>
                          </div>
                        </div>
                        <span className="font-black text-red-500">Rs {deliveryCharge}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full md:w-1/3 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Details</p>
                  <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 mb-6">
                    <p className="font-bold text-gray-800 mb-1">📍 {order.customer?.address}</p>
                    <p className="text-sm text-gray-600 font-semibold">Landmark: <span className="text-blue-700">{order.customer?.landmark}</span></p>
                    {order.remarks && (
                      <p className="text-sm text-gray-600 font-semibold mt-2">Remarks: <span className="text-blue-700 italic">{order.remarks}</span></p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {isPending && (
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'Checked', order.paymentStatus, order.paidAmount)} 
                      className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-md"
                    >
                      <Package size={18} /> Mark Checked
                    </button>
                  )}

                  <button 
                    onClick={() => handleDeliveryPress(order)} 
                    className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md"
                  >
                    <CheckCircle2 size={18} /> Mark Delivered
                  </button>

                  <button 
                    onClick={() => deleteOrder(order._id)} 
                    className="bg-red-50 text-red-500 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100 flex items-center justify-center"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 🌟 NAYA: Delivery Action Modal (Full, Partial, Unpaid) */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-gray-800">Payment Status</h3>
              <button onClick={() => setShowDeliveryModal(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 border"><X size={20}/></button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 font-bold mb-4">अर्डर #{selectedOrder._id.substring(0,6).toUpperCase()} डेलिभर गर्दा भुक्तानी कस्तो भयो?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => updateOrderStatus(selectedOrder._id, 'Delivered', 'PAID', selectedOrder.totalAmount)}
                  className="w-full p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 text-green-700 font-black flex items-center gap-3 transition"
                >
                  <Banknote size={24} /> 💵 पूरा नगद (Full Paid)
                </button>
                
                <button 
                  onClick={() => { setShowDeliveryModal(false); setPartialAmount(''); setShowPartialModal(true); }}
                  className="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black flex items-center gap-3 transition"
                >
                  <Banknote size={24} /> 💸 आंशिक (Partial Payment)
                </button>
                
                <button 
                  onClick={() => updateOrderStatus(selectedOrder._id, 'Delivered', 'UNPAID', 0)}
                  className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-black flex items-center gap-3 transition"
                >
                  <Banknote size={24} /> 📙 उधारो खाता (Unpaid)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 NAYA: Partial Payment Modal */}
      {showPartialModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-gray-800">आंशिक भुक्तानी (Partial)</h3>
              <button onClick={() => setShowPartialModal(false)} className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 border"><X size={20}/></button>
            </div>
            <div className="p-6 text-center">
              <p className="text-blue-700 font-bold mb-4">जम्मा बिल: Rs. {selectedOrder.totalAmount}</p>
              
              <input 
                type="number"
                placeholder="प्राप्त रकम (Rs.)"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl p-4 text-2xl font-black text-center mb-6 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              
              <button 
                onClick={submitPartialPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black flex justify-center items-center gap-2 transition"
              >
                <CheckCircle size={20} /> भुक्तानी अपडेट गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}