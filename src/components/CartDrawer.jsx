import React, { useState, useRef } from 'react';
import { ShoppingCart, X, Trash2, Store, Share2, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import html2canvas from 'html2canvas';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, totalAmount, handleCartQtyChange, removeItem, currentUser, showModal } = useCart();
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef(null);
  const WHATSAPP_NUMBER = "+9779860428834"; 

  if (!isCartOpen && !showInvoice) return null;

  const handlePreviewBill = () => {
    if (cart.length === 0) return showModal('warning', 'Cart Khali Cha!', 'कृपया बिल बनाउन अगाडि Cart मा सामान थप्नुहोस्।');
    setIsCartOpen(false); 
    setShowInvoice(true); 
  };

  const sendBillAsPhoto = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sandip_Kirana_Bill_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const messageStr = `Namaste! Mero order ko bill maile download garera yaha attach gardai chu. (Name: ${currentUser?.name || 'Customer'})`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageStr)}`;

        setShowInvoice(false);
        showModal('success', 'Bill Downloaded! 📥', "अब तलको बटन थिचेर WhatsApp खोल्नुहोस् र 'Gallery' बाट भर्खरै Download भएको बिलको फोटो पठाउनुहोला।", whatsappUrl);
      }, 'image/png');
    } catch (error) {
      showModal('error', 'Opps!', 'Bill generate garna sakiyena.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <>
      {/* --- CART DRAWER OVERLAY --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          
          {/* बाहिर क्लिक गर्दा Cart बन्द हुने (Optional but good UX) */}
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>

          {/* Cart Box (दायाँबाट आउने) */}
          <div className="w-full md:w-[450px] bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Cart Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
              <h2 className="text-2xl font-black flex items-center gap-3 text-gray-800">
                <ShoppingCart className="text-blue-600" size={28} /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition active:scale-90">
                <X size={20} />
              </button>
            </div>

            {/* Cart Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {cart.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full opacity-50">
                  <ShoppingCart size={64} className="mb-4 text-gray-400" />
                  <p className="text-gray-500 font-bold text-xl">Cart खाली छ!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.cartItemId} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover mr-4 border border-gray-100" />
                      <div className="flex-1 pr-2">
                        <h4 className="font-bold text-base text-gray-800 line-clamp-1">{item.name}</h4>
                        <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-1 rounded mt-1 inline-block uppercase tracking-wider">{item.displayUnit}</span>
                        <p className="text-blue-700 text-sm font-black mt-1">Rs {item.finalPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <input type="number" step="any" value={item.qty} onChange={(e) => handleCartQtyChange(item.cartItemId, e.target.value)} className="w-16 p-1.5 text-center font-bold border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm" />
                        <button onClick={() => removeItem(item.cartItemId)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer (Total & Checkout) */}
            {cart.length > 0 && (
              <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Total Amount</span>
                  <span className="text-3xl font-black text-blue-700">Rs {totalAmount}</span>
                </div>
                <button onClick={handlePreviewBill} className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-3 hover:-translate-y-1 active:scale-95">
                  Generate Invoice & Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- INVOICE MODAL --- */}
      {showInvoice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center z-10 sticky top-0">
              <h3 className="font-black text-xl text-gray-800">Preview Bill</h3>
              <button onClick={() => setShowInvoice(false)} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-gray-200">
              <div ref={invoiceRef} className="bg-white p-8 shadow-sm w-full max-w-md mx-auto relative" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="absolute top-4 right-4 text-right text-xs text-gray-500 font-bold">Billed To:<br/><span className="text-gray-800">{currentUser?.name}</span></div>
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6 mt-4">
                  <div className="flex justify-center mb-2"><Store size={40} className="text-blue-800" /></div>
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Sandip Kirana</h1>
                  <p className="text-sm text-gray-600 mt-1">Suryabinayak-1, Bhaktapur<br/>Phone: {WHATSAPP_NUMBER}</p>
                </div>
                <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-700"><span>Date: {currentDate}</span><span>Inv #SK-{Math.floor(1000 + Math.random() * 9000)}</span></div>
                <table className="w-full text-left mb-6 border-collapse">
                  <thead><tr className="border-b-2 border-black text-sm uppercase text-gray-800"><th className="py-2">Item</th><th className="py-2 text-right">Amount</th></tr></thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 text-sm font-bold text-gray-700">
                        <td className="py-3">{item.name} <br/><span className="text-xs text-gray-500 font-normal">{item.displayUnit}</span></td>
                        <td className="py-3 text-right">Rs {item.finalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-black pt-4 mb-8 flex justify-between text-xl font-black text-gray-900"><span>TOTAL</span><span>Rs {totalAmount}</span></div>
              </div>
            </div>
            <div className="bg-white p-4 border-t sticky bottom-0 z-10 flex gap-3">
              <button onClick={() => {setShowInvoice(false); setIsCartOpen(true);}} className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Back</button>
              <button onClick={sendBillAsPhoto} disabled={isGenerating} className="flex-[2] bg-green-500 text-white py-3 rounded-xl font-black hover:bg-green-600 transition flex justify-center items-center gap-2">
                {isGenerating ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Share2 size={20} /> Send Bill to WhatsApp</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}