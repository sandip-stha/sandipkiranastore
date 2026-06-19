// src/components/CartDrawer.jsx
import React, { useState, useRef } from 'react';
import { ShoppingCart, X, Trash2, Store, Share2, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import html2canvas from 'html2canvas';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, totalAmount, handleCartQtyChange, handleCartTierChange, removeItem, currentUser, showModal } = useCart();
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
        const element = invoiceRef.current;

        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            // यो onclone ले भित्रभित्रै सबै Scroll बन्देज हटाएर पूरै लामो फोटो खिच्न मद्दत गर्छ
            onclone: (clonedDoc) => {
            const el = clonedDoc.getElementById('print-invoice');
            if (el) {
                let parent = el.parentElement;
                // जबसम्म माथि Body सम्म पुग्दैन, सबैको Scroll र Height बन्देज खुला गरिदिने
                while (parent && parent.tagName !== 'BODY') {
                parent.style.overflow = 'visible';
                parent.style.maxHeight = 'none';
                parent.style.height = 'auto';
                parent.style.transform = 'none'; // Tailwind को Animation ले काटिनबाट बचाउँछ
                parent = parent.parentElement;
                }
            }
            }
        });

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
          
          {/* बाहिर क्लिक गर्दा Cart बन्द हुने */}
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>

          {/* Cart Box */}
          <div className="w-full md:w-[450px] bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Cart Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white shadow-sm z-10">
              <h2 className="text-2xl font-black flex items-center gap-3 text-gray-800">
                <ShoppingCart className="text-blue-600" size={28} /> Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition active:scale-90">
                <X size={20} />
              </button>
            </div>

            {/* Cart Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50 hide-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full opacity-60">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <ShoppingCart size={48} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold text-xl">Cart खाली छ!</p>
                  <p className="text-gray-400 text-sm mt-2">सामान थप्न अगाडि बढ्नुहोस्।</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => {
                    // यहाँबाट pricing डाटा तान्छ
                    const itemPricing = item.pricing || [];

                    return (
                      <div key={item.cartItemId} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
                        
                        {/* Delete Button */}
                        <button 
                          onClick={() => removeItem(item.cartItemId)} 
                          className="absolute top-3 right-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition z-10"
                        >
                          <Trash2 size={18}/>
                        </button>

                        {/* Top Row: Image & Details */}
                        <div className="flex items-start mb-3 pr-10">
                          <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden mr-4">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className="font-bold text-gray-800 leading-tight mb-1.5 line-clamp-2">{item.name}</h4>
                            <span className="text-blue-700 text-sm font-black bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                              Rs {item.finalPrice?.toFixed(2) || 0}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row: Select Unit (Modal जस्तै Grid) */}
                        {itemPricing.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Unit:</p>
                            <div className="flex flex-wrap gap-2">
                              {itemPricing.map((tier, idx) => {
                                const isSelected = item.displayUnit === tier.measureUnit;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleCartTierChange && handleCartTierChange(item.cartItemId, tier)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                                      isSelected 
                                        ? 'border-blue-600 bg-blue-600 text-white font-black shadow-md shadow-blue-500/20' 
                                        : 'border-gray-200 bg-gray-50 text-gray-600 font-bold hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                  >
                                    {tier.measureUnit}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Bottom Row: Quantity Input */}
                        <div className="bg-yellow-50 p-3.5 rounded-xl border border-yellow-100 flex flex-row items-center justify-between gap-2">
                          <label className="font-bold text-gray-700 text-xs md:text-sm leading-tight">
                            कति <span className="text-blue-700 font-black">{item.displayUnit || 'सामान'}</span> चाहियो?:
                          </label>
                          
                          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit shrink-0">
                            <input 
                              type="number" 
                              step="any" 
                              min="0.1" 
                              value={item.qty} 
                              onChange={(e) => handleCartQtyChange(item.cartItemId, e.target.value)} 
                              className="w-12 md:w-16 font-black text-lg md:text-xl text-center outline-none bg-transparent py-0.5 text-gray-800" 
                            />
                            <div className="w-[1px] h-6 bg-gray-200"></div>
                            <span className="font-black text-gray-400 text-[10px] md:text-xs uppercase pr-2 pl-1 truncate max-w-[50px]">
                              {item.displayUnit}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Footer (Total & Checkout) */}
            {cart.length > 0 && (
              <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-15px_30px_rgba(0,0,0,0.04)] z-10">
                <div className="flex justify-between items-end mb-5 px-2">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Total Amount</span>
                  <span className="text-3xl font-black text-blue-700">Rs {totalAmount}</span>
                </div>
                <button 
                  onClick={handlePreviewBill} 
                  className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex justify-center items-center gap-3 hover:-translate-y-1 active:scale-95"
                >
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
          <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center z-10 sticky top-0 shadow-sm">
              <h3 className="font-black text-xl text-gray-800">Preview Bill</h3>
              <button onClick={() => setShowInvoice(false)} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-gray-100 hide-scrollbar">
              <div ref={invoiceRef} id='print-invoice' className="bg-white p-8 shadow-md w-full max-w-md mx-auto relative rounded-sm" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="absolute top-4 right-4 text-right text-xs text-gray-500 font-bold">Billed To:<br/><span className="text-gray-800 text-sm">{currentUser?.name}</span></div>
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
                        <td className="py-3">{item.name} <br/><span className="text-xs text-gray-500 font-normal">{item.qty} {item.displayUnit}</span></td>
                        <td className="py-3 text-right">Rs {item.finalPrice?.toFixed(2) || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-black pt-4 mb-8 flex justify-between text-xl font-black text-gray-900"><span>TOTAL</span><span>Rs {totalAmount}</span></div>
              </div>
            </div>
            <div className="bg-white p-5 border-t sticky bottom-0 z-10 flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
              <button onClick={() => {setShowInvoice(false); setIsCartOpen(true);}} className="flex-1 bg-gray-100 text-gray-800 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition">Back</button>
              <button onClick={sendBillAsPhoto} disabled={isGenerating} className="flex-[2] bg-green-500 text-white py-3.5 rounded-xl font-black hover:bg-green-600 transition flex justify-center items-center gap-2 shadow-md shadow-green-500/20 active:scale-95">
                {isGenerating ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Share2 size={20} /> Send Bill to WhatsApp</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

