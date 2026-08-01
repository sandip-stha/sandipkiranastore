import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { 
  Search, ShoppingCart, Trash2, UserCheck, DollarSign, 
  BookOpen, CheckCircle, Store, Download, X, Printer, Keyboard, CreditCard,
  Plus, Edit3 // 🌟 नयाँ आइकनहरू थपियो
} from 'lucide-react';

export default function PosBilling({ products, users, API_URL, showToast, fetchOrders }) {
  // Products Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [activeCartId, setActiveCartId] = useState(null);
  
  // 🌟 Custom/Misc Item States
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Arrow Key Navigation States for Product List
  const [selectedProdIdx, setSelectedProdIdx] = useState(0);
  const [selectedRateIdx, setSelectedRateIdx] = useState(0);

  // Customer Search & Select States
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('Store Walk-in');
  
  // Billing Modal & Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [generatedBill, setGeneratedBill] = useState(null);
  const invoiceRef = useRef(null);

  // PARTIAL PAYMENT STATES
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  // Input & Row References
  const searchInputRef = useRef(null);
  const customerInputRef = useRef(null);
  const partialInputRef = useRef(null);
  const qtyInputRefs = useRef({});
  const productRowRefs = useRef({});

  // ==========================================
  // 🔥 SAFE & ERGONOMIC KEYBOARD SHORTCUTS
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey && e.key.toLowerCase() === 'i') || (e.ctrlKey && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.altKey && e.key.toLowerCase() === 'c') || (e.ctrlKey && e.key.toLowerCase() === 'e')) {
        e.preventDefault();
        customerInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (cart.length > 0 && !showBillModal && !showPartialModal) handleCreateBill('PAID', 'CASH');
      }
      if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (cart.length > 0 && !showBillModal && !showPartialModal) handleCreateBill('UNPAID', 'COD');
      }
      if ((e.altKey && e.key.toLowerCase() === 'p') || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        if (cart.length > 0 && !showBillModal && !showPartialModal) {
          setShowPartialModal(true);
          setTimeout(() => partialInputRef.current?.focus(), 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showBillModal, showPartialModal, customerName, customerPhone]);

  const filteredUsers = useMemo(() => {
    if (!users || !customerSearch.trim()) return [];
    return users.filter(u => 
      u.name?.toLowerCase().includes(customerSearch.toLowerCase()) || 
      u.phone?.includes(customerSearch)
    ).slice(0, 5);
  }, [users, customerSearch]);

  const selectCustomer = (user) => {
    setCustomerName(user.name);
    setCustomerPhone(user.phone);
    setCustomerAddress(user.address || 'Store Walk-in');
    setCustomerSearch(`${user.name} (${user.phone})`);
    setShowUserDropdown(false);
    showToast(`ग्राहक ${user.name} छनोट भयो!`, "success");
    searchInputRef.current?.focus();
  };

  const toggleManualCustomer = (checked) => {
    setIsManualCustomer(checked);
    if (checked) {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('9800000000');
      setCustomerAddress('Store Walk-in');
      setCustomerSearch('');
      searchInputRef.current?.focus();
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('Store Walk-in');
    }
  };

  const filteredProducts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchLower) || 
                          (p.category && p.category.toLowerCase().includes(searchLower));
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    setSelectedProdIdx(0);
    setSelectedRateIdx(0);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (filteredProducts[selectedProdIdx]) {
      const activeId = filteredProducts[selectedProdIdx]._id;
      if (productRowRefs.current[activeId]) {
        productRowRefs.current[activeId].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedProdIdx, filteredProducts]);

  const addToCart = (product, tier) => {
    const unitPrice = tier.price / tier.measureQty;
    const cartItemId = `${product._id}-${tier.measureUnit}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);

    let updatedCart;
    if (existing) {
      updatedCart = cart.map(item => 
        item.cartItemId === cartItemId 
          ? { ...item, qty: item.qty + tier.measureQty, finalPrice: (item.qty + tier.measureQty) * unitPrice }
          : item
      );
    } else {
      updatedCart = [...cart, {
        cartItemId,
        productId: product._id,
        name: product.name,
        image: product.image || '',
        measureUnit: tier.measureUnit,
        unitPrice: unitPrice,
        qty: tier.measureQty,
        finalPrice: tier.price,
        displayUnit: `${tier.measureQty} ${tier.measureUnit}`,
        availableRates: product.pricing || [],
        isCustom: false // 🌟 साधारण सामानको ट्याग
      }];
    }
    setCart(updatedCart);
    setActiveCartId(cartItemId);

    setTimeout(() => {
      if (qtyInputRefs.current[cartItemId]) {
        qtyInputRefs.current[cartItemId].focus();
        qtyInputRefs.current[cartItemId].select();
      }
    }, 50);
  };

  // 🌟 विविध सामान (Manual/Custom Item) थप्ने फङ्सन
  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice.trim()) {
      showToast("सामानको नाम र मूल्य दुवै हाल्नुहोस्!", "error");
      return;
    }
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      showToast("कृपया सही मूल्य हाल्नुहोस्!", "error");
      return;
    }

    // 🌟 MongoDB को लागि 24-character को डमी productId बनाइएको
    const validMongoId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const customId = `misc-${Date.now()}`;

    const newItem = {
      cartItemId: customId,
      productId: validMongoId, // 👈 यहाँ परिवर्तन गरिएको छ
      name: customItemName.trim(), 
      measureUnit: '', 
      unitPrice: price,
      qty: 1, 
      finalPrice: price, 
      displayUnit: '',
      availableRates: [],
      isCustom: true 
    };

    setCart([...cart, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const handleCartUnitChange = (oldCartItemId, newUnit) => {
    const itemToChange = cart.find(i => i.cartItemId === oldCartItemId);
    if (!itemToChange || itemToChange.isCustom) return;

    const newTier = itemToChange.availableRates.find(r => r.measureUnit === newUnit);
    if (!newTier) return;

    const newUnitPrice = newTier.price / newTier.measureQty;
    const newCartItemId = `${itemToChange.productId}-${newUnit}`;
    const qty = itemToChange.qty || 1;

    const existingOther = cart.find(i => i.cartItemId === newCartItemId && i.cartItemId !== oldCartItemId);

    let updatedCart;
    if (existingOther) {
      updatedCart = cart
        .filter(i => i.cartItemId !== oldCartItemId)
        .map(i => i.cartItemId === newCartItemId 
          ? { ...i, qty: i.qty + qty, finalPrice: (i.qty + qty) * newUnitPrice }
          : i
        );
    } else {
      updatedCart = cart.map(i => i.cartItemId === oldCartItemId ? {
        ...i,
        cartItemId: newCartItemId,
        measureUnit: newUnit,
        unitPrice: newUnitPrice,
        finalPrice: qty * newUnitPrice,
        displayUnit: `${qty} ${newUnit}`
      } : i);
    }

    setCart(updatedCart);
    setActiveCartId(newCartItemId);

    setTimeout(() => {
      if (qtyInputRefs.current[newCartItemId]) {
        qtyInputRefs.current[newCartItemId].focus();
        qtyInputRefs.current[newCartItemId].select();
      }
    }, 50);
  };

  const handleCustomQtyChange = (cartItemId, newQtyVal) => {
    const qtyNum = parseFloat(newQtyVal);
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId && !item.isCustom) {
        const validQty = isNaN(qtyNum) || qtyNum < 0 ? 0 : qtyNum;
        return { 
          ...item, 
          qty: validQty, 
          finalPrice: validQty * item.unitPrice, 
          displayUnit: `${validQty} ${item.measureUnit}` 
        };
      }
      return item;
    }));
  };

  const handleQtyKeyDown = (e, index, cartItemId) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = index + 1;
      if (nextIdx < cart.length) {
        const nextId = cart[nextIdx].cartItemId;
        if (!cart[nextIdx].isCustom) {
          qtyInputRefs.current[nextId]?.focus();
          qtyInputRefs.current[nextId]?.select();
        }
        setActiveCartId(nextId);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = index - 1;
      if (prevIdx >= 0) {
        const prevId = cart[prevIdx].cartItemId;
        if (!cart[prevIdx].isCustom) {
          qtyInputRefs.current[prevId]?.focus();
          qtyInputRefs.current[prevId]?.select();
        }
        setActiveCartId(prevId);
      } else {
        searchInputRef.current?.focus();
      }
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.shiftKey) {
      e.preventDefault();
      const currentItem = cart[index];
      if (currentItem?.availableRates?.length > 1 && !currentItem.isCustom) {
        const currentUnitIdx = currentItem.availableRates.findIndex(r => r.measureUnit === currentItem.measureUnit);
        let nextUnitIdx;
        if (e.key === 'ArrowRight') {
          nextUnitIdx = (currentUnitIdx + 1) % currentItem.availableRates.length;
        } else {
          nextUnitIdx = (currentUnitIdx - 1 + currentItem.availableRates.length) % currentItem.availableRates.length;
        }
        const nextUnit = currentItem.availableRates[nextUnitIdx].measureUnit;
        handleCartUnitChange(currentItem.cartItemId, nextUnit);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setSearchTerm('');
      searchInputRef.current?.focus();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (!filteredProducts.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProdIdx(prev => Math.min(prev + 1, filteredProducts.length - 1));
      setSelectedRateIdx(0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProdIdx(prev => Math.max(prev - 1, 0));
      setSelectedRateIdx(0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const currentProd = filteredProducts[selectedProdIdx];
      if (currentProd?.pricing) {
        setSelectedRateIdx(prev => Math.min(prev + 1, currentProd.pricing.length - 1));
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedRateIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentProd = filteredProducts[selectedProdIdx];
      if (currentProd && currentProd.pricing?.[selectedRateIdx]) {
        addToCart(currentProd, currentProd.pricing[selectedRateIdx]);
      }
    }
  };

  const removeItem = (id) => setCart(cart.filter(i => i.cartItemId !== id));
  const totalAmount = cart.reduce((sum, i) => sum + i.finalPrice, 0).toFixed(2);

  const handleCreateBill = async (paymentStatus, paymentMethod, customPaidAmount = null) => {
    if (cart.length === 0) return showToast("कार्ट खाली छ! सामान थप्नुहोस्।", "error");
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast("कृपया ग्राहकको नाम र फोन नम्बर अनिवार्य हाल्नुहोस्!", "error");
      customerInputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const billNo = `SK-${Math.floor(100000 + Math.random() * 900000)}`;
      
      let actualPaidAmount = 0;
      if (paymentStatus === 'PAID') actualPaidAmount = Number(totalAmount);
      else if (paymentStatus === 'PARTIALLY_PAID') actualPaidAmount = Number(customPaidAmount || 0);
      else actualPaidAmount = 0;

      const orderData = {
        customer: {
          name: customerName,
          phone: customerPhone,
          email: `${customerPhone}@store.com`,
          address: customerAddress,
          landmark: 'Store Walk-in'
        },
        items: cart,
        totalAmount: Number(totalAmount),
        remarks: `Counter POS Bill #${billNo}`,
        paymentMethod: paymentMethod,       
        paymentStatus: paymentStatus,       
        paidAmount: actualPaidAmount,
        status: "Pending"                   
      };

      const res = await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newOrderId = res.data?.order?._id;

      if (newOrderId) {
        await axios.put(`${API_URL}/api/orders/${newOrderId}/status`, 
          { 
            status: 'Delivered', 
            paymentStatus: paymentStatus, 
            paidAmount: actualPaidAmount 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setGeneratedBill({
        billNo,
        date: new Date().toLocaleString(),
        customer: orderData.customer,
        items: [...cart],
        totalAmount: totalAmount,
        paymentStatus,
        paymentMethod,
        paidAmount: actualPaidAmount,
        dueAmount: (Number(totalAmount) - actualPaidAmount).toFixed(2)
      });

      setShowBillModal(true);
      setShowPartialModal(false);
      setPartialAmount('');
      showToast(`बिल बन्यो! (${paymentStatus === 'PAID' ? 'नगद' : paymentStatus === 'PARTIALLY_PAID' ? 'किस्ता भुक्तानी' : 'उधारो खाता'})`, "success");
      if (fetchOrders) fetchOrders();

    } catch (err) {
      console.error("Billing Error:", err.response?.data || err);
      showToast(err.response?.data?.error || "बिल बनाउन समस्या भयो!", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadBill = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bill_${generatedBill?.billNo}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      showToast("बिल डाउनलोड गर्न सकिएन!", "error");
    }
  };

  const printBill = () => window.print();

  const startNewBill = () => {
    setShowBillModal(false);
    setGeneratedBill(null);
    setCart([]);
    if (!isManualCustomer) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerSearch('');
    }
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full max-w-full overflow-hidden">
      {/* 🌟 COMPACT SHORTCUTS BAR */}
      <div className="bg-[#0A192F] text-white px-4 py-2 rounded-xl mb-3 flex items-center justify-between text-xs font-semibold shrink-0">
        <div className="flex items-center gap-2 text-yellow-400 font-bold">
          <Keyboard size={16} /> <span>POS Shortcuts:</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">↑ / ↓</kbd> Item</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">← / →</kbd> Rate</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">Shift+←/→</kbd> Unit</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">Alt+I / Ctrl+Q</kbd> Search</span>
          <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">Alt+C / Ctrl+E</kbd> Customer</span>
          <span><kbd className="bg-green-600/80 px-1.5 py-0.5 rounded text-[11px] font-mono">Ctrl+S / Alt+S</kbd> Cash</span>
          <span><kbd className="bg-orange-600/80 px-1.5 py-0.5 rounded text-[11px] font-mono">Ctrl+D / Alt+D</kbd> Khata</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        
        {/* ---------------- बायाँ भाग: सामान सर्च र लिस्ट ---------------- */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="सामान वा क्याटेगोरीको नाम टाइप गर्नुहोस्..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm bg-white shadow-inner transition"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 custom-scrollbar scroll-pt-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[11px] font-bold text-gray-500 uppercase bg-white shadow-sm sticky top-0 z-20">
                  <th className="p-2.5 bg-white">Item Name</th>
                  <th className="p-2.5 bg-white">Category</th>
                  <th className="p-2.5 text-right bg-white">Available Rates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredProducts.map((prod, index) => {
                  const isRowSelected = index === selectedProdIdx;
                  return (
                    <tr 
                      key={prod._id} 
                      ref={(el) => (productRowRefs.current[prod._id] = el)}
                      onClick={() => { setSelectedProdIdx(index); searchInputRef.current?.focus(); }}
                      className={`hover:bg-blue-50/70 transition cursor-pointer scroll-mt-12 ${
                        isRowSelected ? 'bg-blue-100/80 font-semibold border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-gray-800">
                        {prod.name}
                        {isRowSelected && <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Selected</span>}
                      </td>
                      <td className="p-2.5 text-xs text-gray-500">{prod.category}</td>
                      <td className="p-2.5 text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {prod.pricing?.map((tier, idx) => {
                            const isRateSelected = isRowSelected && idx === selectedRateIdx;
                            return (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); addToCart(prod, tier); }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition shadow-sm whitespace-nowrap ${
                                  isRateSelected 
                                    ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 scale-105' 
                                    : 'bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-800 border-gray-200'
                                }`}
                              >
                                + {tier.measureQty} {tier.measureUnit} (Rs {tier.price})
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- दायाँ भाग: POS Cart र Billing ---------------- */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border flex flex-col justify-between min-h-0 overflow-hidden">
          
          <div className="p-3.5 border-b bg-blue-50/40 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-gray-800 text-xs uppercase">
                <UserCheck size={16} className="text-blue-600" /> Customer Details
              </div>
              
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer bg-white px-2.5 py-1 rounded-lg border shadow-sm hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={isManualCustomer}
                  onChange={(e) => toggleManualCustomer(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                Walk-in (Manual)
              </label>
            </div>

            {!isManualCustomer ? (
              <div className="relative">
                <input 
                  ref={customerInputRef}
                  type="text"
                  placeholder="ग्राहक खोज्नुहोस् (Alt+C वा Ctrl+E)..."
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                  className="w-full p-2 border border-blue-200 rounded-lg text-xs font-bold outline-none focus:border-blue-600 bg-white"
                />
                
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute left-0 right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y">
                    {filteredUsers.map(u => (
                      <div 
                        key={u._id}
                        onClick={() => selectCustomer(u)}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs font-bold transition"
                      >
                        <div>
                          <p className="text-gray-900 font-bold">{u.name}</p>
                          <p className="text-gray-500 font-normal text-[11px]">{u.address || 'No Address'}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono text-[11px]">{u.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <input 
                type="text" 
                placeholder="फोन नम्बर *" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={!isManualCustomer}
                className={`p-2 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-blue-600 transition ${
                  !isManualCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed' : 'bg-white text-gray-900'
                }`}
                required
              />
              <input 
                type="text" 
                placeholder="ग्राहकको नाम *" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!isManualCustomer}
                className={`p-2 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-blue-600 transition ${
                  !isManualCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed' : 'bg-white text-gray-900'
                }`}
                required
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar min-h-0 bg-gray-50/50">
            
            {/* 🌟 CUSTOM ITEM ENTRY BOX (यहाँ राखिएको छ) */}
            <div className="bg-green-50/70 border border-green-200 rounded-xl p-2 mb-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-700 mb-1.5 px-1">
                <Edit3 size={13} /> विविध सामान (Manual Item)
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="सामान (उदा. Chocolate 10pcs)" 
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="flex-1 p-1.5 border border-green-300 rounded-lg text-xs font-bold outline-none focus:border-green-600 bg-white"
                />
                <input 
                  type="number" 
                  placeholder="मूल्य" 
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomItem(); }}
                  className="w-20 p-1.5 border border-green-300 rounded-lg text-xs font-bold text-center outline-none focus:border-green-600 bg-white"
                />
                <button 
                  onClick={handleAddCustomItem}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 rounded-lg flex items-center justify-center transition shadow-sm"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-medium text-xs">
                <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                कार्ट खाली छ
              </div>
            ) : (
              cart.map((item, idx) => (
                <div 
                  key={item.cartItemId} 
                  onClick={() => {
                    setActiveCartId(item.cartItemId);
                    if (!item.isCustom) {
                        qtyInputRefs.current[item.cartItemId]?.focus();
                        qtyInputRefs.current[item.cartItemId]?.select();
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${activeCartId === item.cartItemId ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200'}`}
                >
                  
                  {/* Left: Name & Rate */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-gray-800 text-xs truncate leading-tight">{item.name}</div>
                    {/* 🌟 Custom Item होइन भने मात्र युनिट र प्राइज देखाउने */}
                    {!item.isCustom && (
                        <div className="text-[11px] font-semibold text-gray-500 mt-0.5">Rs {item.unitPrice.toFixed(2)} / {item.measureUnit}</div>
                    )}
                  </div>

                  {/* Right: Quantity, Unit & Total */}
                  <div className="flex items-center gap-2 shrink-0">
                    
                    {/* 🌟 Custom Item हो भने क्वान्टिटी बक्स नदेखाउने */}
                    {!item.isCustom && (
                        <div className="flex items-center border border-gray-300 bg-white rounded-lg shadow-sm px-1.5 py-0.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                        <input
                            ref={(el) => (qtyInputRefs.current[item.cartItemId] = el)}
                            type="number"
                            step="any"
                            min="0"
                            value={item.qty === 0 ? '' : item.qty}
                            onChange={(e) => handleCustomQtyChange(item.cartItemId, e.target.value)}
                            onKeyDown={(e) => handleQtyKeyDown(e, idx, item.cartItemId)}
                            className="w-12 font-bold text-sm text-center outline-none bg-transparent py-0.5 text-gray-900 font-mono"
                            placeholder="0"
                        />
                        
                        {item.availableRates && item.availableRates.length > 1 ? (
                            <select
                            value={item.measureUnit}
                            onChange={(e) => handleCartUnitChange(item.cartItemId, e.target.value)}
                            className="text-[11px] font-extrabold text-blue-700 bg-blue-50 border-l border-gray-200 pl-1 py-0.5 outline-none font-mono cursor-pointer hover:bg-blue-100 transition rounded-r"
                            >
                            {item.availableRates.map((rate, rIdx) => (
                                <option key={rIdx} value={rate.measureUnit}>
                                {rate.measureUnit}
                                </option>
                            ))}
                            </select>
                        ) : (
                            <span className="text-[11px] font-extrabold text-gray-500 border-l border-gray-200 pl-1.5 uppercase select-none font-mono">
                            {item.measureUnit}
                            </span>
                        )}
                        </div>
                    )}

                    <div className="font-extrabold text-gray-900 text-xs w-16 text-right font-mono">
                      Rs {item.finalPrice.toFixed(0)}
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); removeItem(item.cartItemId); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition">
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 space-y-2.5 shrink-0">
            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-gray-500 uppercase text-xs">Total Amount</span>
              <span className="text-2xl font-black text-blue-700 font-mono">Rs {totalAmount}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button disabled={isProcessing} onClick={() => handleCreateBill('PAID', 'CASH')} className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md">
                <DollarSign size={15} /> नगद
              </button>
              <button disabled={isProcessing} onClick={() => { if (cart.length === 0) return showToast("कार्ट खाली छ!", "error"); setShowPartialModal(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md">
                <CreditCard size={15} /> किस्ता
              </button>
              <button disabled={isProcessing} onClick={() => handleCreateBill('UNPAID', 'COD')} className="bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md">
                <BookOpen size={15} /> उधारो
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PARTIAL & BILL MODALS... (Rest of the modals remain the same) */}
      {showPartialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
           {/* Modal Code remains unchanged */}
        </div>
      )}

      {showBillModal && generatedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-green-600 px-6 py-4 text-center text-white relative">
              <button onClick={startNewBill} className="absolute top-4 right-4 bg-green-700 p-1.5 rounded-full"><X size={16} /></button>
              <h3 className="font-black text-lg">बिल तयार भयो! 🎉</h3>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-gray-100">
              <div ref={invoiceRef} className="bg-white p-6 shadow-md w-full max-w-md mx-auto rounded-sm border" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                {/* Header */}
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
                  <h1 className="text-lg font-black text-gray-900 uppercase">Sandip Kirana Store</h1>
                  <p className="text-xs text-gray-600">Suryabinayak-1, Bhaktapur</p>
                </div>
                
                {/* Bill Items */}
                <table className="w-full text-left mb-3 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black text-xs uppercase text-gray-800">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {generatedBill.items.map((item, idx) => (
                      <tr key={idx} className="text-xs font-bold text-gray-700">
                        <td className="py-1.5">
                          {item.name} <br/>
                          {/* 🌟 Custom Item होइन भने मात्र युनिट बिलमा छाप्ने */}
                          {!item.isCustom && (
                              <span className="text-[10px] text-gray-500 font-normal">{item.qty} {item.measureUnit} @ {item.unitPrice.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="py-1.5 text-right">Rs {item.finalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t-2 border-black pt-2 flex justify-between text-base font-black">
                  <span>TOTAL</span><span>Rs {generatedBill.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 border-t flex gap-2">
              <button onClick={startNewBill} className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold text-xs">रद्द (New Bill)</button>
              <button onClick={printBill} className="bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold flex gap-1.5 text-xs"><Printer size={16} /> Print</button>
              <button onClick={downloadBill} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold flex justify-center gap-1.5 text-xs"><Download size={16} /> Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}