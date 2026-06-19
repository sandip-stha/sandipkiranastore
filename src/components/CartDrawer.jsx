import React, { useState, useRef } from 'react';
import { ShoppingCart, X, Trash2, Store, Download, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import html2canvas from 'html2canvas';
import axios from 'axios';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, totalAmount, handleCartQtyChange, removeItem, currentUser, showModal, setCart } = useCart();
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const invoiceRef = useRef(null);

  const API_URL = 'https://kiranastore-luig.onrender.com';

  if (!isCartOpen && !showInvoice) return null;

  // 1. Place Order to Database
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return showModal('warning', 'Cart Khali Cha!', 'कृपया अर्डर गर्न अगाडि Cart मा सामान थप्नुहोस्।');
    if (!currentUser) return showModal('error', 'Login Required', 'कृपया अर्डर गर्न पहिले Login गर्नुहोस्।');

    setIsProcessing(true);
    try {
      await axios.post(`${API_URL}/api/orders`, {
        customer: currentUser,
        items: cart,
        totalAmount: Number(totalAmount)
      });
      
      setOrderSuccess(true);
      setIsCartOpen(false);
      setShowInvoice(true); // अर्डर सफल भएपछि बिल देखाउने
      setCart([]); // Cart खाली गर्ने
    } catch (error) {
      showModal('error', 'Opps!', 'तपाईंको अर्डर पठाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Download Bill (Optional for user)
  const downloadBill = async () => {
    if (!invoiceRef.current) return;
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sandip_Kirana_Bill_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showModal('success', 'Bill Downloaded!', "तपाईंको बिल ग्यालरीमा सेभ भयो।");
        setShowInvoice(false);
      }, 'image/png');
    } catch (error) {
      console.error("Download fail:", error);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <>
      {/* --- CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          <div className="w-full md:w-[450px] bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white shadow-sm z-10">
              <h2 className="text-2xl font-black flex items-center gap-3 text-gray-800">
                <ShoppingCart className="text-blue-600" size={28} /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50 hide-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center opacity-60">
                  <ShoppingCart size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold text-xl">Cart खाली छ!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.cartItemId} className="bg-white p-4 rounded-2xl border shadow-sm relative group">
                      <button onClick={() => removeItem(item.cartItemId)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-xl">
                        <Trash2 size={18}/>
                      </button>
                      <div className="flex items-start mb-3 pr-10">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border mr-4" />
                        <div>
                          <h4 className="font-bold text-gray-800">{item.name}</h4>
                          <span className="text-blue-700 text-sm font-black">Rs {item.finalPrice?.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded-xl border flex items-center justify-between">
                         <span className="font-bold text-xs">Qty:</span>
                         <input type="number" step="any" min="0.1" value={item.qty} onChange={(e) => handleCartQtyChange(item.cartItemId, e.target.value)} className="w-16 font-black text-center border-b border-gray-300 bg-transparent outline-none" />
                         <span className="text-xs font-bold text-gray-500">{item.displayUnit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-white border-t shadow-lg">
                <div className="flex justify-between items-end mb-5">
                  <span className="text-gray-500 font-bold">Total Amount</span>
                  <span className="text-3xl font-black text-blue-700">Rs {totalAmount}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 flex justify-center items-center gap-3">
                  {isProcessing ? <><Loader2 size={24} className="animate-spin" /> Processing...</> : 'Place Order Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ORDER SUCCESS & INVOICE MODAL --- */}
      {showInvoice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            
            {/* Success Header */}
            <div className="bg-green-500 px-6 py-6 text-center text-white z-10 shadow-sm relative">
              <button onClick={() => setShowInvoice(false)} className="absolute top-4 right-4 bg-green-600 p-2 rounded-full hover:bg-green-700"><X size={20} /></button>
              <CheckCircle size={50} className="mx-auto mb-2 text-white animate-bounce" />
              <h3 className="font-black text-2xl">Order Successful! 🎉</h3>
              <p className="text-green-100 text-sm mt-1 font-medium">तपाईंको अर्डर हामीलाई प्राप्त भयो। छिट्टै डेलिभरी हुनेछ।</p>
            </div>

            {/* Invoice Bill */}
            <div className="p-6 overflow-y-auto flex-1 flex justify-center hide-scrollbar">
              <div ref={invoiceRef} className="bg-white p-8 shadow-sm w-full max-w-md mx-auto rounded-sm border" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                  <h1 className="text-2xl font-black text-gray-900 uppercase">Sandip Kirana</h1>
                  <p className="text-sm text-gray-600 mt-1">Suryabinayak-1, Bhaktapur</p>
                </div>
                <div className="mb-4 text-sm font-bold text-gray-700 leading-relaxed">
                  <p>Name: {currentUser?.name}</p>
                  <p>Phone: {currentUser?.phone}</p>
                  <p>Address: {currentUser?.address} ({currentUser?.landmark})</p>
                  <p>Date: {currentDate}</p>
                </div>
                <table className="w-full text-left mb-6 border-collapse">
                  <thead><tr className="border-b-2 border-black text-sm uppercase"><th className="py-2">Item</th><th className="py-2 text-right">Amt</th></tr></thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 text-sm font-bold text-gray-700">
                        <td className="py-3">{item.name} <br/><span className="text-xs text-gray-500 font-normal">{item.qty} {item.displayUnit}</span></td>
                        <td className="py-3 text-right">Rs {item.finalPrice?.toFixed(2) || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-black pt-4 flex justify-between text-xl font-black text-gray-900">
                  <span>TOTAL</span><span>Rs {totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white p-5 border-t flex flex-col gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] text-center">
              <p className="text-gray-600 font-bold text-sm">Do you want to save this bill?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowInvoice(false)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200">No, Thanks</button>
                <button onClick={downloadBill} className="flex-[2] bg-blue-600 text-white py-3.5 rounded-xl font-black hover:bg-blue-700 flex justify-center items-center gap-2">
                  <Download size={20} /> Yes, Download Bill
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}