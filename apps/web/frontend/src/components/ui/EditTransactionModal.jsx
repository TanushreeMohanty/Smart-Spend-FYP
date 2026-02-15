import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, Type, ShieldAlert } from 'lucide-react';
import { CATEGORIES } from '../../../../../../packages/shared/config/constants';
import { normalizeDate } from '../../../../../../packages/shared/utils/helpers';

const EditTransactionModal = ({ isOpen, onClose, transaction, onSave }) => {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: '',
        type: '',
        date: ''
    });
    
    // Track if the original was verified
    const isOriginalVerified = transaction?.confidence > 0;
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        if (transaction) {
            let dateStr = '';
            const d = normalizeDate(transaction.date);
            if (d) dateStr = d.toISOString().split('T')[0];

            setFormData({
                id: transaction.id,
                amount: transaction.amount,
                description: transaction.description,
                category: transaction.category,
                type: transaction.type,
                date: dateStr
            });
            setShowWarning(false); // Reset warning
        }
    }, [transaction, isOpen]);

    // Detect if user is tampering with the Amount
    const handleAmountChange = (e) => {
        const newAmt = e.target.value;
        setFormData({...formData, amount: newAmt});
        if (isOriginalVerified && parseFloat(newAmt) !== parseFloat(transaction.amount)) {
            setShowWarning(true);
        } else {
            setShowWarning(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date),
            // If they tampered, we remove the verified badge
            confidence: showWarning ? 0 : transaction.confidence 
        };
        onSave(finalData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Edit Transaction</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    
                    {/* THE EDIT GUARD WARNING */}
                    {showWarning && (
                        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                            <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-rose-400">Tampering Detected</h4>
                                <p className="text-[10px] text-rose-200/80 leading-relaxed mt-1">
                                    This record was verified by your Bank Statement. Changing the amount may lead to <strong>Misreporting under Section 270A</strong> (200% Penalty).
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</label>
                             <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleAmountChange} // Hooked here
                                    className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-4 text-white font-bold outline-none focus:border-blue-500 ${showWarning ? 'border-rose-500 text-rose-400' : 'border-white/10'}`}
                                    required
                                />
                             </div>
                        </div>
                        {/* ... Rest of form inputs (Type, Date, Desc, Category) same as before ... */}
                        <div className="flex-1 space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                             <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500 appearance-none capitalize">
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                             </select>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</label>
                         <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500" required />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                         <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500" required />
                    </div>

                    {/* Categories Grid - Same as before */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} type="button" onClick={() => setFormData({...formData, category: cat.id})} className={`p-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${formData.category === cat.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}>
                                    <cat.icon className="w-3 h-3" /> {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 mt-4">
                        {showWarning ? 'Confirm & Mark Unverified' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;