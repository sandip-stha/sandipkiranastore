import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Search, Phone, Wallet, CheckCircle, X, History, FileText, ArrowDownRight, Users, BookOpen, User, PlusCircle, Calendar, UserPlus } from 'lucide-react';

const toBikramSambat = (dateStr) => {
    const date = new Date(dateStr || Date.now());
    const bsYear = date.getFullYear() + 56 + (date.getMonth() >= 3 && date.getDate() >= 14 ? 1 : 0);
    const nepaliMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
    let bsMonthIndex = (date.getMonth() + 9) % 12;
    let bsDay = (date.getDate() + 17) % 30;
    if (bsDay === 0) bsDay = 30;
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const dayNep = bsDay.toString().split('').map(d => nepaliDigits[d] || d).join('');
    const yearNep = bsYear.toString().split('').map(d => nepaliDigits[d] || d).join('');
    return `${dayNep} ${nepaliMonths[bsMonthIndex]} ${yearNep}`;
};

const formatMoney = (amount) => {
    return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 🌟 Props मा users = [] थपिएको छ
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
    const [newKhataForm, setNewKhataForm] = useState({ name: '', phone: '', amount: '', remarks: 'Opening Balance (पुरानो खाता)', date: new Date().toISOString().split('T')[0] });
    
    // 🌟 Registered User Search States
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const filteredUsers = useMemo(() => {
        if (!users || !userSearchTerm.trim()) return [];
        return users.filter(u => 
          u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
          u.phone?.includes(userSearchTerm)
        ).slice(0, 5);
    }, [users, userSearchTerm]);

    const selectExistingUser = (user) => {
        setNewKhataForm({ ...newKhataForm, name: user.name, phone: user.phone });
        setUserSearchTerm('');
        setShowUserDropdown(false);
    };

    const fetchKhataSummary = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            // 🚨 मुख्य परिवर्तन: Order को सट्टा Khata API बाट सबै डाटा तान्ने
            const res = await axios.get(`${API_URL}/api/khata/all`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            // भुक्तानी भइनसकेका खाताहरू मात्र छान्ने
            const pendingKhatas = res.data.filter(khata => {
                return khata.status !== 'PAID' && (khata.dueAmount > 0);
            });
            
            // ग्राहकको नम्बर अनुसार ग्रुप गर्ने (Grouping)
            const groupedData = {};
            pendingKhatas.forEach(khata => {
                const phone = khata.customer?.phone || 'Unknown Phone';
                const name = khata.customer?.name || 'Unknown Customer';
                
                if (!groupedData[phone]) {
                    groupedData[phone] = { 
                        name, 
                        phone, 
                        email: khata.customer?.email, 
                        totalDue: 0, 
                        orderCount: 0, 
                        orders: [] // पुरानै UI नबिग्रियोस् भनेर नाम orders नै राखेको
                    };
                }
                
                groupedData[phone].totalDue += khata.dueAmount;
                groupedData[phone].orderCount += 1;
                groupedData[phone].orders.push(khata);
            });

            // धेरै उधारो हुनेलाई माथि देखाउने
            const finalArray = Object.values(groupedData).sort((a, b) => b.totalDue - a.totalDue);
            setKhataList(finalArray);
            setFilteredList(finalArray);

            // यदि कोही Customer पहिले नै Select भएको थियो भने त्यसको डाटा Update गर्ने
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
            // 🚨 यहाँ URL परिवर्तन गरिएको छ! 
            const response = await axios.post(`${API_URL}/api/khata/receive-cash`, { 
                phone: selectedCustomer.phone, 
                amountReceived: amount 
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if(response.data.success) {
                showToast("रकम खातामा जम्मा भयो!", "success");
                setModalVisible(false); 
                setCashAmount(''); 
                fetchKhataSummary();
            }
        } catch (error) {
            showToast("नगद इन्ट्री गर्न सकिएन।", "error");
        } finally {
            setSubmitting(false);
        }
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
            
            const response = await axios.post(`${API_URL}/api/khata/opening-balance`, { 
                phone, name, amount, remarks, date
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if(response.data.success) {
                showToast("पुरानो खाता सफलतापूर्वक थपियो!", "success");
                if (isNewCustomer) {
                    setNewKhataModalVisible(false);
                    setNewKhataForm({ name: '', phone: '', amount: '', remarks: 'Opening Balance (पुरानो खाता)', date: new Date().toISOString().split('T')[0] });
                } else {
                    setOldDueModalVisible(false); 
                    setOldDueForm({ amount: '', remarks: 'पुरानो खाताबाट सारिएको', date: new Date().toISOString().split('T')[0] });
                }
                fetchKhataSummary();
            }
        } catch (error) {
            showToast("पुरानो खाता थप्न सकिएन।", "error");
        } finally {
            setSubmittingOldDue(false);
        }
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
                        <button 
                            onClick={() => setNewKhataModalVisible(true)} 
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition shadow-sm shadow-blue-500/20"
                        >
                            <UserPlus size={14} /> New Ledger
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search name or phone..." 
                            value={searchQuery}
                            onChange={handleSearch}
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
                                <div 
                                    key={item.phone} 
                                    onClick={() => openCustomerLedger(item)} 
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-l-4 group ${
                                        isSelected ? 'bg-blue-50/50 border-l-blue-600 border-t border-r border-b border-slate-200 shadow-sm' : 'bg-white border-l-transparent border-t border-r border-b border-transparent hover:border-slate-200 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className={`font-bold text-[15px] leading-tight ${isSelected ? 'text-blue-800' : 'text-slate-800 group-hover:text-blue-600'}`}>{item.name}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium"><Phone size={11} className={isSelected ? "text-blue-400" : "text-slate-400"}/> {item.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Due</p>
                                            <p className="text-[15px] font-black text-rose-600 tabular-nums">{formatMoney(item.totalDue)}</p>
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
                        <div className="bg-[#0f172a] text-white px-8 py-5 shrink-0 flex justify-between items-center shadow-lg relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                            
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-blue-400">
                                    <User size={24} />
                                </div>
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

                        <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-slate-400" />
                                <h3 className="font-bold text-slate-800 text-[15px]">Account Statement</h3>
                            </div>
                            <button onClick={() => setShowAllHistory(!showAllHistory)} className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                                <History size={14} /> {showAllHistory ? "Hide Settled Records" : "View Full History"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50/50 relative fin-scroll">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 z-10">
                                    <tr>
                                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest w-48">Date</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Particulars / Details</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right w-40">Debit (Rs)</th>
                                        <th className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right w-40">Credit (Rs)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/60">
                                    {displayData.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-24 text-center bg-white">
                                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle size={32} className="text-emerald-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">Account Clear</h3>
                                                <p className="text-slate-500 text-sm font-medium">{showAllHistory ? 'कुनै रेकर्ड छैन।' : 'सबै हिसाब चुक्ता छ!'}</p>
                                            </td>
                                        </tr>
                                    ) : displayData.map((item) => {
                                        const formattedDate = toBikramSambat(item.createdAt);
                                        const isOldDue = item.items?.length === 0;
                                        let particulars = isOldDue ? item.remarks : (item.items?.map(p => `${p.name} (${p.qty})`).join(', ') || item.remarks);

                                        return (
                                            <React.Fragment key={item._id}>
                                                <tr className={`bg-white hover:bg-slate-50/80 transition-colors group ${isOldDue ? 'bg-amber-50/20' : ''}`}>
                                                    <td className="px-8 py-5 text-[13px] font-bold text-slate-600 align-top">{formattedDate}</td>
                                                    <td className="px-8 py-5 align-top">
                                                        <p className={`text-[14px] font-medium whitespace-normal leading-relaxed max-w-2xl ${isOldDue ? 'text-amber-800 italic' : 'text-slate-800'}`}>
                                                            {particulars}
                                                        </p>
                                                        {!isOldDue && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Bill ID: {item._id.substring(0, 8)}</p>}
                                                    </td>
                                                    <td className="px-8 py-5 text-right align-top bg-rose-50/10 group-hover:bg-rose-50/30 transition-colors">
                                                        <span className="text-[15px] font-black text-rose-600 tabular-nums">{formatMoney(item.totalAmount)}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right align-top"><span className="text-[15px] font-medium text-slate-300">-</span></td>
                                                </tr>
                                                
                                                {item.paymentHistory?.map((pay, index) => (
                                                    <tr key={index} className="bg-emerald-50/30 border-t border-emerald-100/50">
                                                        <td className="px-8 py-3.5 text-[13px] font-semibold text-slate-500 pl-14 relative">
                                                            <div className="absolute left-8 top-0 w-px h-6 bg-emerald-200"></div>
                                                            <div className="absolute left-8 top-6 w-4 h-px bg-emerald-200"></div>
                                                            {toBikramSambat(pay.date)}
                                                        </td>
                                                        <td className="px-8 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center"><ArrowDownRight size={12} strokeWidth={3}/></span>
                                                                <span className="text-[13px] font-bold text-emerald-700">{pay.method} Payment Received</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-3.5 text-right"><span className="text-[14px] font-medium text-slate-300">-</span></td>
                                                        <td className="px-8 py-3.5 text-right"><span className="text-[14px] font-black text-emerald-600 tabular-nums">{formatMoney(pay.amount)}</span></td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* ========================================== */}
            {/* 🌟 1. CREATE NEW KHATA MODAL (For Offline/New OR Existing Users) */}
            {/* ========================================== */}
            {newKhataModalVisible && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-visible shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                            <h3 className="text-[15px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <UserPlus size={18} className="text-blue-600"/> Create New Ledger
                            </h3>
                            <button onClick={() => setNewKhataModalVisible(false)} className="text-slate-400 hover:text-rose-500 bg-white rounded-full p-1 border border-slate-200 transition-colors"><X size={16}/></button>
                        </div>
                        <div className="p-6">
                            
                            {/* 🌟 SEARCH APP USER (NEW FEATURE) */}
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
                                            <div 
                                                key={u._id} 
                                                onClick={() => selectExistingUser(u)}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition"
                                            >
                                                <span className="font-bold text-sm text-slate-800">{u.name}</span>
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
                                        <input 
                                            type="text" 
                                            value={newKhataForm.name}
                                            onChange={(e) => setNewKhataForm({...newKhataForm, name: e.target.value})}
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone (फोन) *</label>
                                        <input 
                                            type="text" 
                                            value={newKhataForm.phone}
                                            onChange={(e) => setNewKhataForm({...newKhataForm, phone: e.target.value})}
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-slate-800"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Opening Balance (पुरानो उधारो) *</label>
                                    <input 
                                        type="number" 
                                        value={newKhataForm.amount}
                                        onChange={(e) => setNewKhataForm({...newKhataForm, amount: e.target.value})}
                                        placeholder="0.00"
                                        className="w-full text-right text-2xl font-black text-rose-600 border-2 border-slate-200 rounded-xl py-2 px-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none tabular-nums"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">मिति (Date)</label>
                                        <input 
                                            type="date" 
                                            value={newKhataForm.date}
                                            onChange={(e) => setNewKhataForm({...newKhataForm, date: e.target.value})}
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-xs font-bold text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">विवरण (Remarks)</label>
                                        <input 
                                            type="text" 
                                            value={newKhataForm.remarks}
                                            onChange={(e) => setNewKhataForm({...newKhataForm, remarks: e.target.value})}
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-xs font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleAddOldDue(true)} 
                                disabled={submittingOldDue}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
                                {submittingOldDue ? "Creating..." : <><CheckCircle size={18} /> Create Account</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* 2. OLD DUE MODAL (For Existing Selected Customer) */}
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
                                    <input 
                                        type="number" 
                                        value={oldDueForm.amount}
                                        onChange={(e) => setOldDueForm({...oldDueForm, amount: e.target.value})}
                                        placeholder="0.00"
                                        className="w-full text-right text-2xl font-black text-slate-800 border-2 border-slate-200 rounded-xl py-2 px-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none tabular-nums"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Date (मिति)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input 
                                            type="date" 
                                            value={oldDueForm.date}
                                            onChange={(e) => setOldDueForm({...oldDueForm, date: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-700"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Particulars (विवरण)</label>
                                    <input 
                                        type="text" 
                                        value={oldDueForm.remarks}
                                        onChange={(e) => setOldDueForm({...oldDueForm, remarks: e.target.value})}
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-700"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleAddOldDue(false)} 
                                disabled={submittingOldDue}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
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
                            <input 
                                type="number" 
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full text-right text-3xl font-black text-slate-800 border-2 border-slate-200 rounded-xl py-3 px-4 mb-8 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all tabular-nums"
                                autoFocus
                            />
                            
                            <button 
                                onClick={handleReceiveCash} 
                                disabled={submitting}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
                            >
                                {submitting ? "Processing..." : <><CheckCircle size={18} /> Confirm Payment</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}