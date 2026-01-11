import React, { useState, useRef, useEffect } from 'react';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore'; 
import { Loader2, UploadCloud, AlertTriangle, WifiOff, Save, CheckCircle2, Trash2, Zap } from 'lucide-react';
import { db, CATEGORIES, TABS } from '../config/constants';
import { LocalRepository } from '../services/localRepository'; // NEW: Offline DB Service
import { StorageService } from '../services/storageService';
import { ParserService } from '../services/parserService';
import { loadScript } from '../utils/helpers';
import UnitSelector from '../components/domain/UnitSelector';
import TransactionItem from '../components/domain/TransactionItem';

const AddPage = ({ user, appId, setActiveTab, showToast, triggerConfirm }) => {
    // --- MANUAL ENTRY STATE ---
    const [mode, setMode] = useState('manual');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [cat, setCat] = useState('food');
    const [type, setType] = useState('expense');
    const [transUnit, setTransUnit] = useState(1);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- OFFLINE SCANNER STATE ---
    const [parsing, setParsing] = useState(false);
    const [draftTransactions, setDraftTransactions] = useState([]); // Holds Local Data
    const [ocrProgress, setOcrProgress] = useState(0);
    const [isScanned, setIsScanned] = useState(false);
    const fileRef = useRef(null);

    // 1. Load Offline Drafts on Mount
    useEffect(() => {
        if (mode === 'upload') {
            loadDrafts();
        }
    }, [mode]);

    const loadDrafts = async () => {
        try {
            const drafts = await LocalRepository.getAllDrafts();
            if (drafts.length > 0) {
                setDraftTransactions(drafts);
                showToast(`Loaded ${drafts.length} offline items`, "info");
            }
        } catch (e) {
            console.error("Local DB Error", e);
        }
    };

    // 2. Handle Manual Save (Direct to Cloud)
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const finalAmount = parseFloat(amount) * transUnit;
        try {
            await StorageService.saveTransaction(user.uid, { 
                amount: finalAmount, 
                description: desc, 
                category: cat, 
                type, 
                isRecurring 
            });
            showToast(isRecurring ? "Recurring bill added!" : "Added!", "success");
            setAmount(''); setDesc(''); setTransUnit(1); setIsRecurring(false);
        } catch(e) { showToast("Error saving", "error"); }
        setIsSubmitting(false);
    };

    // 3. Handle File Upload (Saves to LOCAL DB)
    const handleFile = async (e) => {
        const f = e.target.files[0];
        if(!f) return;
        
        // Load PDF Lib if needed
        if (f.name.toLowerCase().endsWith('.pdf') && !window.pdfjsLib) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        setParsing(true);
        setIsScanned(false);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                let lines = [];
                let fullText = "";

                if (f.name.toLowerCase().endsWith('.pdf')) {
                    const pdf = await window.pdfjsLib.getDocument({data: ev.target.result}).promise;
                    lines = await ParserService.extractLinesFromPdf(pdf); 
                    fullText = lines.join('\n');
                } else {
                    fullText = await f.text();
                    lines = fullText.split('\n');
                }

                // Detect Mode & Parse
                const detection = ParserService.detectMode(fullText);
                let results = [];

                if (detection === 'OCR') {
                    setIsScanned(true);
                    showToast("Scanning Image PDF...", "info");
                    const ocrLines = await ParserService.performOCR(f, (p) => setOcrProgress(p));
                    results = ParserService.processLines(ocrLines, 'OCR');
                } else {
                    results = ParserService.processLines(lines, 'TEXT');
                }

                // SAVE TO LOCAL DB
                if (results.length > 0) {
                    await LocalRepository.saveDrafts(results);
                    setDraftTransactions(results); 
                    showToast(`${results.length} items saved locally!`, "success");
                } else {
                    showToast("No transactions found", "error");
                }

            } catch (err) {
                console.error(err);
                showToast("Error reading file", "error");
            } finally {
                setParsing(false);
            }
        };
        
        if(f.name.toLowerCase().endsWith('.pdf')) reader.readAsArrayBuffer(f); else reader.readAsText(f);
    };

    // 4. Sync to Cloud (Push Local -> Firestore)
    const handleSyncToCloud = () => {
        triggerConfirm(`Sync ${draftTransactions.length} items to Cloud?`, async () => {
            setIsSubmitting(true);
            try {
                const batch = writeBatch(db);
                
                draftTransactions.forEach(t => {
                    const docRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'));
                    
                    // ZOHO VALUE: Audit Trail Metadata
                    batch.set(docRef, {
                        ...t,
                        source: t.confidence < 80 ? 'ocr' : 'pdf', 
                        verificationStatus: 'verified', // User reviewed it by clicking Sync
                        mlReady: true,
                        createdAt: serverTimestamp()
                    });
                });

                await batch.commit();
                
                // Clear Local DB on success
                await LocalRepository.clearDrafts();
                setDraftTransactions([]);
                
                showToast("Synced to Cloud successfully!", "success");
                setActiveTab(TABS.HOME);

            } catch (e) {
                console.error(e);
                showToast("Sync failed. Data saved locally.", "error");
            } finally {
                setIsSubmitting(false);
            }
        });
    };

    // 5. Clear Local Drafts
    const clearLocalData = async () => {
        triggerConfirm("Discard all local drafts?", async () => {
            await LocalRepository.clearDrafts();
            setDraftTransactions([]);
            showToast("Drafts cleared", "info");
        });
    };

    return (
        <div className="animate-in slide-in-from-bottom-12">
            
            {/* Tab Switcher */}
            <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                <button onClick={() => setMode('manual')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Manual</button>
                <button onClick={() => setMode('upload')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'upload' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>
                    Upload {draftTransactions.length > 0 && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{draftTransactions.length}</span>}
                </button>
            </div>

            {mode === 'manual' ? (
                // --- MANUAL FORM ---
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-lg text-sm font-bold ${type === 'expense' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500'}`}>Expense</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-lg text-sm font-bold ${type === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}>Income</button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="text-center">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Amount</label>
                            <div className="relative inline-block w-full">
                                <span className="absolute left-1/2 -ml-16 top-1/2 -translate-y-1/2 text-slate-500 text-4xl font-light">₹</span>
                                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-center bg-transparent border-b border-white/10 text-5xl font-black text-white py-4 outline-none" placeholder="0" required />
                            </div>
                        </div>
                        <UnitSelector currentUnit={transUnit} onSelect={setTransUnit} className="max-w-[280px] mx-auto w-full" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {CATEGORIES.map(c => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${cat === c.id ? 'bg-white/10 border-white/30' : 'border-transparent opacity-50'}`}><c.icon className="w-5 h-5"/><span className="text-[10px]">{c.name}</span></button>)}
                    </div>
                    <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 bg-white/5 rounded-xl text-white outline-none" placeholder="Description" required />
                    
                    {/* Recurring Toggle */}
                    <div onClick={() => setIsRecurring(!isRecurring)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all mb-4 ${isRecurring ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRecurring ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}><Zap className="w-4 h-4" /></div>
                            <div><p className={`text-sm font-bold ${isRecurring ? 'text-blue-300' : 'text-slate-300'}`}>Repeat Monthly</p><p className="text-[10px] text-slate-500">Auto-remind me every month</p></div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isRecurring ? 'bg-blue-500' : 'bg-slate-700'}`}><div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`}></div></div>
                    </div>

                    <button disabled={isSubmitting} className="w-full bg-blue-600 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20">{isSubmitting ? 'Saving...' : 'Save Transaction'}</button>
                </form>
            ) : (
                // --- OFFLINE SCANNER ---
                <div className="space-y-6">
                    {/* Dropzone */}
                    <div onClick={() => !parsing && fileRef.current.click()} className={`border-2 border-dashed border-white/10 rounded-[2rem] p-8 text-center cursor-pointer transition-all group hover:bg-white/5 ${parsing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {parsing ? (
                            <div>
                                <Loader2 className="w-10 h-10 text-cyan-400 mx-auto mb-4 animate-spin" />
                                <h3 className="font-bold text-white">Processing Locally...</h3>
                                {ocrProgress > 0 && <p className="text-xs text-cyan-300 mt-2">OCR Analysis: {ocrProgress}%</p>}
                                <p className="text-[10px] text-slate-500 mt-2">Data stays on your device</p>
                            </div>
                        ) : (
                            <div>
                                <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold text-white">Scan Statement</h3>
                                <p className="text-xs text-slate-500 mt-2">SBI, HDFC, ICICI, Axis • Unlimited Pages</p>
                            </div>
                        )}
                        <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept=".pdf,.csv" disabled={parsing} />
                    </div>
                    
                    {/* Draft List */}
                    {draftTransactions.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <WifiOff className="w-4 h-4 text-emerald-400" />
                                    <h3 className="font-bold text-white">Offline Drafts ({draftTransactions.length})</h3>
                                </div>
                                <button onClick={clearLocalData} className="p-2 hover:bg-rose-500/10 rounded-full text-rose-400 transition-colors" title="Clear Drafts">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Low Confidence Warning */}
                            {draftTransactions.some(t => t.confidence < 70) && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-4 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-amber-200 font-bold">Review Needed</p>
                                        <p className="text-[10px] text-amber-200/70">Some items have low confidence. Please verify amounts.</p>
                                    </div>
                                </div>
                            )}

                            <div className="max-h-80 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                                {draftTransactions.map((t, i) => <TransactionItem key={i} item={t} />)}
                            </div>

                            <button 
                                onClick={handleSyncToCloud} 
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isSubmitting ? 'Syncing...' : 'Sync to Cloud'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddPage;