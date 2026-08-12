import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Search, Phone, Wallet, CheckCircle, X, History, FileText, Users, BookOpen, PlusCircle, Calendar, UserPlus, Mail, MapPin, Navigation } from 'lucide-react';
import NepaliDate from 'nepali-datetime';

const toBikramSambat = (dateStr) => {
  const englishDate = new Date(dateStr || Date.now());
  if (isNaN(englishDate.getTime())) return new NepaliDate().format('DD MMMM YYYY');
  
  const nepaliDate = new NepaliDate(englishDate);
  return nepaliDate.format('DD MMMM YYYY', 'np'); 
};

const formatMoney = (amount) => {
    return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getInitials = (name) => {
    if (!name || name === 'undefined' || name === 'null') return 'U';
    const names = name.split(' ');
    if (names.length > 1) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return names[0][0].toUpperCase();
};

// 🌟 NAYA: Photo string "undefined" वा "null" भएमा त्यसलाई false मान्ने Helper Function
const isValidPic = (pic) => {
    return pic && typeof pic === 'string' && pic !== 'undefined' && pic !== 'null' && pic.trim() !== '';
};

export default function UdharoKhata({ API_URL, showToast, users = [] }) {
    const [khataList, setKhataList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [allLedgerData, setAllLedgerData] = useState([]);
    const [showAllHistory, setShowAllHistory] = useState(false);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [oldDueModalVisible, setOldDueModalVisible] = useState(false);
    const [oldDueForm, setOldDueForm] = useState({ amount: '', remarks: 'पुरानो खाताबाट सारिएको', date: new Date().toISOString().split('T')[0] });
    const [submittingOldDue, setSubmittingOldDue] = useState(false);

    const [newKhataModalVisible, setNewKhataModalVisible] = useState(false);
    
    // 🌟 NAYA: नयाँ खाता फर्ममा Register को लागि चाहिने सबै फिल्डहरू थपियो
    const [newKhataForm, setNewKhataForm] = useState({ 
        name: '', phone: '', email: '', address: '', landmark: '', 
        amount: '', remarks: 'Opening Balance (पुरानो खाता)', 
        date: new Date().toISOString().split('T')[0],
        isExistingUser: false
    });
    
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const filteredUsers = useMemo(() => {
        if (!users || !userSearchTerm.trim()) return [];
        return users.filter(u => 
          u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
          u.phone?.includes(userSearchTerm)
        ).slice(0, 5);
    }, [users, userSearchTerm]);

    // 🌟 NAYA: Existing User छान्दा extra fields भर्नु नपर्ने
    const selectExistingUser = (user) => {
        setNewKhataForm({ 
            ...newKhataForm, 
            name: user.name, 
            phone: user.phone, 
            email: user.email || '',
            address: user.address || '',
            landmark: user.landmark || '',
            isExistingUser: true 
        });
        setUserSearchTerm('');
        setShowUserDropdown(false);
    };

    const fetchKhataSummary = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            const res = await axios.get(`${API_URL}/api/khata/all`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            const pendingKhatas = res.data.filter(khata => {
                return khata.status !== 'PAID' && (khata.dueAmount > 0);
            });
            
            const groupedData = {};
            pendingKhatas.forEach(khata => {
                const phone = khata.customer?.phone || 'Unknown Phone';
                const name = khata.customer?.name || 'Unknown Customer';
                
                if (!groupedData[phone]) {
                    groupedData[phone] = { 
                        name, phone, email: khata.customer?.email, profilePic: khata.customer?.profilePic, totalDue: 0, orderCount: 0, orders: []
                    };
                } else if (!isValidPic(groupedData[phone].profilePic) && isValidPic(khata.customer?.profilePic)) {
                    groupedData[phone].profilePic = khata.customer.profilePic;
                }
                
                groupedData[phone].totalDue += khata.dueAmount;
                groupedData[phone].orderCount += 1;
                groupedData[phone].orders.push(khata);
            });

            const finalArray = Object.values(groupedData).sort((a, b) => b.totalDue - a.totalDue);
            setKhataList(finalArray);
            setFilteredList(finalArray);

            if (selectedCustomer) {
                const updatedCustomer = finalArray.find(c => c.phone === selectedCustomer.phone);
                if (updatedCustomer) {
                    setSelectedCustomer(updatedCustomer);
                    setAllLedgerData(updatedCustomer.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                } else {
                    setSelectedCustomer(null);
                }
            }
        } catch (error) {
            showToast("खाता डाटा ल्याउन सकिएन!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKhataSummary(); }, []);

    const handleSearch = (e) => {
        const text = e.target.value;
        setSearchQuery(text);
        if (text) setFilteredList(khataList.filter(item => item.name.toLowerCase().includes(text.toLowerCase()) || item.phone.includes(text)));
        else setFilteredList(khataList);
    };

    const openCustomerLedger = async (customer) => {
        setSelectedCustomer(customer);
        const customerOrders = customer.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
        setAllLedgerData(customerOrders);
    };

    const handleReceiveCash = async () => {
        const amount = parseFloat(cashAmount);
        if (!amount || amount <= 0 || amount > selectedCustomer.totalDue) return alert("कृपया सही रकम हाल्नुहोस्।");
        try {
            setSubmitting(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(`${API_URL}/api/khata/receive-cash`, { 
                phone: selectedCustomer.phone, amountReceived: amount 
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if(response.data.success) {
                showToast("रकम खातामा जम्मा भयो!", "success");
                setModalVisible(false); setCashAmount(''); fetchKhataSummary();
            }
        } catch (error) { showToast("नगद इन्ट्री गर्न सकिएन।", "error"); } finally { setSubmitting(false); }
    };

    const handleAddOldDue = async (isNewCustomer = false) => {
        const amount = parseFloat(isNewCustomer ? newKhataForm.amount : oldDueForm.amount);
        const name = isNewCustomer ? newKhataForm.name : selectedCustomer.name;
        const phone = isNewCustomer ? newKhataForm.phone : selectedCustomer.phone;
        const remarks = isNewCustomer ? newKhataForm.remarks : oldDueForm.remarks;
        const date = isNewCustomer ? newKhataForm.date : oldDueForm.date;

        if (!amount || amount <= 0 || !name || !phone) return alert("नाम, फोन र रकम अनिवार्य छ।");
        
        try {
            setSubmittingOldDue(true);
            const token = localStorage.getItem('adminToken');

            // 🌟 NAYA: यदि नयाँ ग्राहक हो र Existing User होइन भने, पहिले अटोमेटिक Register गरिदिने
            if (isNewCustomer && !newKhataForm.isExistingUser) {
                try {
                    await axios.post(`${API_URL}/api/auth/register`, {
                        name: newKhataForm.name,
                        phone: newKhataForm.phone,
                        email: newKhataForm.email || `${newKhataForm.phone}@kiranastore.com`,
                        address: newKhataForm.address || 'N/A',
                        landmark: newKhataForm.landmark || 'N/A',
                        password: newKhataForm.phone, // डिफल्ट पासवर्ड फोन नम्बर
                        confirmPassword: newKhataForm.phone
                    });
                } catch (regErr) {
                    console.log("User may already exist or registration failed", regErr);
                }
            }

            // त्यसपछि खातामा ओपनिङ ब्यालेन्स हाल्ने
            const response = await axios.post(`${API_URL}/api/khata/opening-balance`, { 
                phone, name, amount, remarks, date
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if(response.data.success) {
                showToast("पुरानो खाता सफलतापूर्वक थपियो!", "success");
                if (isNewCustomer) {
                    setNewKhataModalVisible(false);
                    setNewKhataForm({ name: '', phone: '', email: '', address: '', landmark: '', amount: '', remarks: 'Opening Balance (पुरानो खाता)', date: new Date().toISOString().split('T')[0], isExistingUser: false });
                } else {
                    setOldDueModalVisible(false); 
                    setOldDueForm({ amount: '', remarks: 'पुरानो खाताबाट सारिएको', date: new Date().toISOString().split('T')[0] });
                }
                fetchKhataSummary();
            }
        } catch (error) { showToast("पुरानो खाता थप्न सकिएन।", "error"); } finally { setSubmittingOldDue(false); }
    };

    const displayData = showAllHistory ? allLedgerData : allLedgerData.filter(o => o.paymentStatus !== 'PAID' && (o.totalAmount - (o.paidAmount || 0)) > 0);

    return (
        <div className="flex h-[calc(100vh-150px)] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans">
            <style dangerouslySetInnerHTML={{__html: `
                .fin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
                .fin-scroll::-webkit-scrollbar-track { background: transparent; }
                .fin-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .fin-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />

            {/* LEFT SIDEBAR: CUSTOMER DIRECTORY */}
            <div className="w-1/3 min-w-[320px] max-w-[380px] flex flex-col bg-[#f8fafc] border-r border-slate-200 z-10 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] relative">
                <div className="p-5 border-b border-slate-200 bg-white/90 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-[15px] font-black text-slate-800 flex items-center gap-2 tracking-wide uppercase">
                            <Users size={18} className="text-blue-600"/> Customer Directory
                        </h2>
                        <button onClick={() => setNewKhataModalVisible(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition shadow-sm shadow-blue-500/20">
                            <UserPlus size={14} /> New Ledger
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text" placeholder="Search name or phone..." value={searchQuery} onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 fin-scroll">
                    {loading ? (
                        <div className="flex justify-center py-12"><span className="text-slate-500 text-sm font-medium flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> Loading accounts...</span></div>
                    ) : filteredList.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium text-sm mb-4">कुनै उधारो खाता भेटिएन।</p>
                            <button onClick={() => setNewKhataModalVisible(true)} className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-2 hover:bg-blue-100 transition">
                                <PlusCircle size={14} /> नयाँ खाता खोल्नुहोस्
                            </button>
                        </div>
                    ) : (
                        filteredList.map((item) => {
                            const isSelected = selectedCustomer?.phone === item.phone;
                            return (
                                <div key={item.phone} onClick={() => openCustomerLedger(item)} 
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-l-4 group ${isSelected ? 'bg-blue-50/50 border-l-blue-600 border-t border-r border-b border-slate-200 shadow-sm' : 'bg-white border-l-transparent border-t border-r border-b border-transparent hover:border-slate-200 hover:shadow-sm'}`}
                                >
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                            {isValidPic(item.profilePic) ? (
                                                <img src={item.profilePic} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[13px] border shrink-0 ${isSelected ? 'bg-blue-200 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200'}`}>
                                                    {getInitials(item.name)}
                                                </div>
                                            )}
                                            <div className="overflow-hidden">
                                                <h3 className={`font-bold text-[14px] leading-tight truncate ${isSelected ? 'text-blue-800' : 'text-slate-800 group-hover:text-blue-600'}`}>{item.name}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium"><Phone size={10} className={isSelected ? "text-blue-400" : "text-slate-400"}/> {item.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Due</p>
                                            <p className="text-[14px] font-black text-rose-600 tabular-nums">{formatMoney(item.totalDue)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: LEDGER DETAILS */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                {!selectedCustomer ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                            <BookOpen size={40} className="text-slate-300" />
                        </div>
                        <h2 className="text-xl font-black text-slate-700 mb-2">Select a Customer Ledger</h2>
                        <p className="text-sm text-slate-500 font-medium">Click on any customer from the directory to view their financial statement.</p>
                    </div>
                ) : (
                    <>
                        {/* HEADER */}
                        <div className="bg-[#0f172a] text-white px-8 py-5 shrink-0 flex justify-between items-center shadow-lg relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                {isValidPic(selectedCustomer.profilePic) ? (
                                    <img src={selectedCustomer.profilePic} alt={selectedCustomer.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-600 shadow-md bg-slate-800" />
                                ) : (
                                    <div className="w-14 h-14 bg-slate-800 border-2 border-slate-600 shadow-md rounded-2xl flex items-center justify-center text-blue-300 font-black text-xl">
                                        {getInitials(selectedCustomer.name)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{selectedCustomer.name}</h2>
                                    <p className="text-slate-400 text-xs flex items-center gap-2 mt-1 font-medium"><Phone size={12}/> {selectedCustomer.phone}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="text-right">
                                    <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Total Outstanding</p>
                                    <p className="text-3xl leading-none font-black text-rose-400 tabular-nums tracking-tight">
                                        Rs {formatMoney(selectedCustomer.totalDue)}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-slate-700/50"></div>
                                <div className="flex gap-2">
                                    <button onClick={() => setOldDueModalVisible(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] transition-colors shadow-sm w-20">
                                        <PlusCircle size={16} /> Old Due
                                    </button>
                                    <button onClick={() => { setCashAmount(''); setModalVisible(true); }} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-bold text-[10px] transition-colors w-20">
                                        <Wallet size={16} /> Payment
                                    </button>
                                    <button onClick={() => { setCashAmount(selectedCustomer.totalDue.toString()); setModalVisible(true); }} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-black text-[10px] transition-colors shadow-sm w-20">
                                        <CheckCircle size={16} /> Settle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* TITLE BAR */}
                        <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-slate-400" />
                                <h3 className="font-bold text-slate-800 text-[15px]">Account Statement</h3>
                            </div>
                            <button onClick={() => setShowAllHistory(!showAllHistory)} className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                                <History size={14} /> {showAllHistory ? "Hide Settled Records" : "View Full History"}
                            </button>
                        </div>

                        {/* TABLE HEADER & LIST (Grid Aligned) */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 relative fin-scroll flex flex-col">
                            
                            <div className="grid grid-cols-12 gap-4 px-12 py-4 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                <div className="col-span-3">Date</div>
                                <div className="col-span-6">Particulars / Details</div>
                                <div className="col-span-3 text-right">Amount (Rs)</div>
                            </div>

                            <div className="p-6 space-y-4">
                                {displayData.length === 0 ? (
                                    <div className="py-16 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={32} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">Account Clear</h3>
                                        <p className="text-slate-500 text-sm font-medium">{showAllHistory ? 'कुनै रेकर्ड छैन।' : 'सबै हिसाब चुक्ता छ!'}</p>
                                    </div>
                                ) : displayData.map((item) => {
                                    const formattedDate = toBikramSambat(item.createdAt);
                                    const isOldDue = item.items?.length === 0;

                                    let particulars = '';
                                    if (!isOldDue && item.items && item.items.length > 0) {
                                        const itemsStr = item.items.map(prod => `${prod.name} (${prod.qty} ${prod.displayUnit || prod.unit || ''})`.trim()).join(', ');
                                        const subTotal = item.items.reduce((acc, prod) => acc + (prod.finalPrice || prod.price || 0), 0);
                                        const deliveryCharge = Math.max(0, item.totalAmount - subTotal);
                                        
                                        if (deliveryCharge > 0) {
                                            particulars = `${itemsStr}\n[+ डेलिभरी चार्ज Rs ${deliveryCharge}]`;
                                        } else {
                                            particulars = itemsStr;
                                        }
                                    } else {
                                        particulars = item.remarks || `सामान खरिद`;
                                    }

                                    return (
                                        <div key={item._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                            
                                            <div className={`grid grid-cols-12 gap-4 items-center px-6 py-5 ${isOldDue ? 'bg-amber-50/30' : ''}`}>
                                                <div className="col-span-3 text-[13px] font-bold text-slate-600">{formattedDate}</div>
                                                <div className={`col-span-6 text-[14px] font-medium whitespace-pre-line leading-relaxed ${isOldDue ? 'text-amber-800 italic' : 'text-slate-800'}`}>
                                                    {particulars}
                                                    {!isOldDue && <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Bill ID: {item._id.substring(0, 8)}</span>}
                                                </div>
                                                <div className="col-span-3 text-right text-[15px] font-black text-rose-600 tabular-nums">
                                                    Rs {formatMoney(item.totalAmount)}
                                                </div>
                                            </div>

                                            {item.paymentHistory?.map((pay, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-[#f0fdf4] border-t border-[#dcfce3]">
                                                    <div className="col-span-3 text-[12px] font-semibold text-slate-500 relative flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                        {toBikramSambat(pay.date)}
                                                    </div>
                                                    <div className="col-span-6 text-[13px] font-bold text-[#16a34a] flex items-center gap-1.5">
                                                        {pay.method === 'ESEWA' ? '🟩 eSewa' : pay.method === 'KHALTI' ? '🟪 Khalti' : '💵 Cash'} भुक्तानी
                                                    </div>
                                                    <div className="col-span-3 text-right text-[14px] font-black text-[#16a34a] tabular-nums">
                                                        (- Rs {formatMoney(pay.amount)})
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ========================================== */}
            {/* 1. CREATE NEW KHATA MODAL (With Registration Fields) */}
            {/* ========================================== */}
            {newKhataModalVisible && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-y-auto max-h-[90vh] shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl sticky top-0 z-10">
                            <h3 className="text-[15px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <UserPlus size={18} className="text-blue-600"/> Create New Ledger
                            </h3>
                            <button onClick={() => setNewKhataModalVisible(false)} className="text-slate-400 hover:text-rose-500 bg-white rounded-full p-1 border border-slate-200 transition-colors"><X size={16}/></button>
                        </div>
                        <div className="p-6">
                            <div className="relative mb-5">
                                <label className="block text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <Search size={12} /> एपको ग्राहक खोज्नुहोस् (Optional)
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Search by name or phone..." 
                                    value={userSearchTerm}
                                    onChange={(e) => { setUserSearchTerm(e.target.value); setShowUserDropdown(true); }}
                                    onFocus={() => setShowUserDropdown(true)}
                                    className="w-full px-4 py-2 border border-blue-200 bg-blue-50/30 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-slate-800"
                                />
                                {showUserDropdown && filteredUsers.length > 0 && (
                                    <div className="absolute left-0 right-0 top-[60px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
                                        {filteredUsers.map(u => (
                                            <div key={u._id} onClick={() => selectExistingUser(u)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition">
                                                <div className="flex items-center gap-2">
                                                    {isValidPic(u.profilePic) ? (
                                                        <img src={u.profilePic} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{getInitials(u.name)}</div>
                                                    )}
                                                    <span className="font-bold text-sm text-slate-800">{u.name}</span>
                                                </div>
                                                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{u.phone}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 my-4">
                                <div className="h-px bg-slate-200 flex-1"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Enter Manually</span>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Name (नाम) *</label>
                                        <input type="text" value={newKhataForm.name} onChange={(e) => setNewKhataForm({...newKhataForm, name: e.target.value, isExistingUser: false})} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-slate-800" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone (फोन) *</label>
                                        <input type="text" value={newKhataForm.phone} onChange={(e) => setNewKhataForm({...newKhataForm, phone: e.target.value, isExistingUser: false})} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-slate-800" />
                                    </div>
                                </div>
                                
                                {/* 🌟 NAYA: Registration Fields (Email, Address, Landmark) */}
                                {!newKhataForm.isExistingUser && (
                                    <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                                        <p className="text-xs font-bold text-blue-700 mb-2">नयाँ ग्राहकको अटो-रजिस्ट्रेसन विवरण (डिफल्ट पासवर्ड: मोबाइल नम्बर)</p>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <input type="email" placeholder="Gmail / Email Address" value={newKhataForm.email} onChange={(e) => setNewKhataForm({...newKhataForm, email: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <input type="text" placeholder="Delivery Address (उदा: चाबहिल)" value={newKhataForm.address} onChange={(e) => setNewKhataForm({...newKhataForm, address: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                        </div>
                                        <div className="relative">
                                            <Navigation className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <input type="text" placeholder="Landmark (नजिकको चिनिने ठाउँ)" value={newKhataForm.landmark} onChange={(e) => setNewKhataForm({...newKhataForm, landmark: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Opening Balance (पुरानो उधारो) *</label>
                                    <input type="number" value={newKhataForm.amount} onChange={(e) => setNewKhataForm({...newKhataForm, amount: e.target.value})} placeholder="0.00" className="w-full text-right text-2xl font-black text-rose-600 border-2 border-slate-200 rounded-xl py-2 px-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none tabular-nums" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">मिति (Date)</label>
                                        <input type="date" value={newKhataForm.date} onChange={(e) => setNewKhataForm({...newKhataForm, date: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-xs font-bold text-slate-700" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">विवरण (Remarks)</label>
                                        <input type="text" value={newKhataForm.remarks} onChange={(e) => setNewKhataForm({...newKhataForm, remarks: e.target.value})} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-xs font-bold text-slate-700" />
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={() => handleAddOldDue(true)} disabled={submittingOldDue} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20">
                                {submittingOldDue ? "Creating..." : <><CheckCircle size={18} /> Create Account & Ledger</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* 2. OLD DUE MODAL */}
            {/* ========================================== */}
            {oldDueModalVisible && selectedCustomer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-[15px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <PlusCircle size={18} className="text-blue-600"/> Add Old Due
                            </h3>
                            <button onClick={() => setOldDueModalVisible(false)} className="text-slate-400 hover:text-rose-500 bg-white rounded-full p-1 border border-slate-200 transition-colors"><X size={16}/></button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Purano Udharo Amount (Rs) *</label>
                                    <input type="number" value={oldDueForm.amount} onChange={(e) => setOldDueForm({...oldDueForm, amount: e.target.value})} placeholder="0.00" className="w-full text-right text-2xl font-black text-slate-800 border-2 border-slate-200 rounded-xl py-2 px-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none tabular-nums" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Date (मिति)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input type="date" value={oldDueForm.date} onChange={(e) => setOldDueForm({...oldDueForm, date: e.target.value})} className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-700" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Particulars (विवरण)</label>
                                    <input type="text" value={oldDueForm.remarks} onChange={(e) => setOldDueForm({...oldDueForm, remarks: e.target.value})} className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-700" />
                                </div>
                            </div>
                            
                            <button onClick={() => handleAddOldDue(false)} disabled={submittingOldDue} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20">
                                {submittingOldDue ? "Saving..." : <><CheckCircle size={18} /> Save Old Record</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* 3. PAYMENT ENTRY MODAL */}
            {/* ========================================== */}
            {modalVisible && selectedCustomer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-[15px] font-black uppercase tracking-wider text-slate-800">Record Payment</h3>
                            <button onClick={() => setModalVisible(false)} className="text-slate-400 hover:text-rose-500 bg-white rounded-full p-1 border border-slate-200 transition-colors"><X size={16}/></button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6 bg-rose-50/50 px-4 py-3 rounded-xl border border-rose-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Total Due</span>
                                <span className="text-xl font-black text-rose-600 tabular-nums">Rs {formatMoney(selectedCustomer.totalDue)}</span>
                            </div>
                            
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount Received (Rs)</label>
                            <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" className="w-full text-right text-3xl font-black text-slate-800 border-2 border-slate-200 rounded-xl py-3 px-4 mb-8 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all tabular-nums" autoFocus />
                            
                            <button onClick={handleReceiveCash} disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20">
                                {submitting ? "Processing..." : <><CheckCircle size={18} /> Confirm Payment</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}