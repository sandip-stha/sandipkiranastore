import React from 'react';
import axios from 'axios';
import { CheckCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react';

const formatUnit = (unit, qty) => {
  if (typeof unit === 'string' && unit.startsWith(qty + ' ')) {
    return unit.replace(qty + ' ', '').trim();
  }
  return unit || '';
};

export default function Orders({ orders, fetchOrders, API_URL, showToast }) {
  const updateOrderStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Order marked as ${status}!`, "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to update order", "error");
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

  if (orders.length === 0) {
    return <div className="bg-white p-10 rounded-3xl border text-center text-gray-400 font-bold text-xl">कुनै अर्डर आएको छैन।</div>;
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order._id} className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${order.status === 'Pending' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500 opacity-80'}`}>
          <div className="bg-gray-50/80 p-5 md:p-6 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black text-gray-800">{order.customer?.name || 'Unknown User'}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                  {order.status === 'Pending' ? <Clock size={14} /> : <CheckCircle size={14} />} {order.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm font-bold flex gap-3">
                <span>📞 {order.customer?.phone}</span>
                <span className="hidden md:inline">|</span>
                <span>📧 {order.customer?.email}</span>
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-3xl font-black text-blue-700">Rs {order.totalAmount}</p>
            </div>
          </div>

          <div className="p-5 md:p-6 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
              <div className="bg-gray-50 rounded-2xl border p-4 space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500 font-bold">{item.qty} {formatUnit(item.displayUnit, item.qty)}</p>
                      </div>
                    </div>
                    <span className="font-black text-gray-800">Rs {item.finalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/3 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Details</p>
                <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 mb-6">
                  <p className="font-bold text-gray-800 mb-1">📍 {order.customer?.address}</p>
                  <p className="text-sm text-gray-600 font-semibold">Landmark: <span className="text-blue-700">{order.customer?.landmark}</span></p>
                  {order.remarks && (
                    <p className="text-sm text-gray-600 font-semibold">Remarks: <span className="text-blue-700">{order.remarks}</span></p>
                  )}
                  <p className="text-xs text-gray-400 mt-3 font-bold">Ordered At: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {order.status === 'Pending' ? (
                  <button onClick={() => updateOrderStatus(order._id, 'Delivered')} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md">
                    <CheckCircle2 size={18} /> Mark Delivered
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 text-green-600 py-3 rounded-xl font-black flex items-center justify-center gap-2 border border-green-200">
                    <CheckCircle size={18} /> Delivered
                  </div>
                )}
                <button onClick={() => deleteOrder(order._id)} className="bg-red-50 text-red-500 px-4 rounded-xl hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}