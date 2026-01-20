import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Printer, Save, History, Settings, FileText, 
  Menu, X, Download, LayoutGrid, CheckCircle2, AlertCircle, Trash, Home, Users, ArrowRight, RefreshCw, Image as ImageIcon, CopyPlus, Eraser
} from 'lucide-react';
import { FeeCategory, SchoolProfile, Receipt, SelectedFee, PrintLayout } from './types';
import { DEFAULT_FEE_CATEGORIES, DEFAULT_SCHOOL_PROFILE } from './constants';
import ReceiptPreview from './components/ReceiptPreview';
import LogoUploader from './components/LogoUploader';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'admin' | 'bulk'>('generate');
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
  const [categories, setCategories] = useState<FeeCategory[]>(DEFAULT_FEE_CATEGORIES);
  const [history, setHistory] = useState<Receipt[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [printQueue, setPrintQueue] = useState<string[]>([]); 

  // Single Form State
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfPayment, setDateOfPayment] = useState(new Date().toISOString().split('T')[0]);
  const [monthYear, setMonthYear] = useState('');
  
  // Bulk Form State
  const [bulkStudents, setBulkStudents] = useState<{ id: string, name: string, cls: string, sec: string, roll: string }[]>([
    { id: crypto.randomUUID(), name: '', cls: '', sec: '', roll: '' }
  ]);

  const [selectedFeesData, setSelectedFeesData] = useState<Record<string, { total: number, paid: number }>>({});
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);

  const generateNo = () => `ALB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Initialize data
  useEffect(() => {
    const p = localStorage.getItem('schoolProfile');
    const c = localStorage.getItem('feeCategories');
    const h = localStorage.getItem('receiptHistory');
    const q = localStorage.getItem('printQueue');
    if (p) setSchoolProfile(JSON.parse(p));
    if (c) setCategories(JSON.parse(c));
    if (h) setHistory(JSON.parse(h));
    if (q) setPrintQueue(JSON.parse(q));
    setReceiptNo(generateNo());
  }, []);

  useEffect(() => {
    localStorage.setItem('schoolProfile', JSON.stringify(schoolProfile));
    localStorage.setItem('feeCategories', JSON.stringify(categories));
    localStorage.setItem('receiptHistory', JSON.stringify(history));
    localStorage.setItem('printQueue', JSON.stringify(printQueue));
  }, [schoolProfile, categories, history, printQueue]);

  const totals = useMemo(() => {
    const selectedValues = Object.values(selectedFeesData) as { total: number; paid: number }[];
    return selectedValues.reduce<{ total: number; paid: number; due: number }>(
      (acc, curr) => {
        acc.total += curr.total;
        acc.paid += curr.paid;
        acc.due += (curr.total - curr.paid);
        return acc;
      },
      { total: 0, paid: 0, due: 0 }
    );
  }, [selectedFeesData]);

  const handleResetForm = () => {
    setStudentName('');
    setClassName('');
    setSection('');
    setRollNo('');
    setReceiptNo(generateNo());
    setGuardianName('');
    setMobileNumber('');
    setMonthYear('');
    setSelectedFeesData({});
    setCurrentReceipt(null);
    setBulkStudents([{ id: crypto.randomUUID(), name: '', cls: '', sec: '', roll: '' }]);
  };

  const handleToggle = (id: string, amt: number) => {
    setSelectedFeesData((p: Record<string, { total: number, paid: number }>) => {
      const n = { ...p };
      if (n[id]) {
        delete n[id];
      } else {
        n[id] = { total: amt, paid: amt };
      }
      return n;
    });
  };

  const createReceipt = (name: string, cls: string, sec: string, roll: string): Receipt => ({
    id: crypto.randomUUID(),
    receiptNo: receiptNo || generateNo(),
    studentName: name,
    class: cls,
    section: sec,
    rollNo: roll,
    guardianName: guardianName || 'Parent/Guardian',
    mobileNumber: mobileNumber || 'N/A',
    dateOfPayment,
    monthYear: monthYear || '',
    fees: Object.entries(selectedFeesData).map(([cid, d]): SelectedFee => {
      const data = d as { total: number; paid: number };
      return {
        categoryId: cid, 
        amount: data.total, 
        paid: data.paid, 
        due: data.total - data.paid
      };
    }),
    totalAmount: totals.total,
    totalPaid: totals.paid,
    totalDue: totals.due,
    createdAt: Date.now()
  });

  const handleGenSingle = () => {
    if (!studentName || totals.total === 0) return alert('Enter student name and select fees.');
    const r = createReceipt(studentName, className, section, rollNo);
    setCurrentReceipt(r);
    setHistory(p => [r, ...p]);
    setPrintQueue(prev => [...prev, r.id]);
    alert('Receipt generated and added to A4 queue!');
  };

  const handleAddToA4 = () => {
    let r = currentReceipt;
    if (!r) {
      if (!studentName || totals.total === 0) return alert('Enter student name and select fees.');
      r = createReceipt(studentName, className, section, rollNo);
      setCurrentReceipt(r);
      setHistory(p => [r, ...p]);
    }
    setPrintQueue(prev => [...new Set([...prev, r!.id])]);
    alert('Receipt added to A4 print queue!');
  };

  const handleGenBulk = () => {
    const valid = bulkStudents.filter(s => s.name.trim() !== '');
    if (valid.length === 0) return alert('Enter at least one student name.');
    if (totals.total === 0) return alert('Please select at least one fee category.');
    
    const rs = valid.map(s => createReceipt(s.name, s.cls, s.sec, s.roll));
    setHistory(p => [...rs, ...p]);
    setPrintQueue(prev => [...prev, ...rs.map(r => r.id)]);
    setActiveTab('history');
    alert(`${rs.length} receipts generated and added to A4 print queue.`);
  };

  const handleDownloadPDF = async (targetId: string = 'receipt-content-target') => {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    // @ts-ignore
    if (window.html2pdf) {
      const isOverlay = targetId === 'print-engine-overlay';
      
      // Temporary visibility adjustment to fix "empty PDF" issue for capture engine
      const originalVisibility = element.style.visibility;
      const originalPosition = element.style.position;
      const originalLeft = element.style.left;
      
      element.style.visibility = 'visible';
      element.style.position = 'relative';
      element.style.left = '0';

      const opt = {
        margin: 0,
        filename: isOverlay ? `A4_Batch_${Date.now()}.pdf` : `Receipt_${currentReceipt?.receiptNo || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      try {
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF Download failed", err);
        alert("Failed to generate PDF.");
      } finally {
        element.style.visibility = originalVisibility;
        element.style.position = originalPosition;
        element.style.left = originalLeft;
      }
    } else {
      window.print();
    }
  };

  const handleDownloadPNG = async (targetId: string = 'receipt-content-target') => {
    const element = document.getElementById(targetId);
    if (!element) return;
    // @ts-ignore
    if (window.html2canvas) {
      try {
        const originalStyle = element.style.letterSpacing;
        element.style.letterSpacing = 'normal';
        // @ts-ignore
        const canvas = await window.html2canvas(element, {
          scale: 6, // Increased scale for ultra-high-res quality (approx 600dpi equivalent)
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 0,
          removeContainer: true,
          onclone: (clonedDoc: Document) => {
            const clonedEl = clonedDoc.getElementById(targetId);
            if (clonedEl) {
              clonedEl.style.setProperty('-webkit-font-smoothing', 'antialiased');
              clonedEl.style.textRendering = 'optimizeLegibility';
            }
          }
        });
        element.style.letterSpacing = originalStyle;
        const link = document.createElement('a');
        link.download = `Receipt_${currentReceipt?.receiptNo || Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      } catch (err) {
        console.error("PNG Download failed", err);
        alert("Failed to generate PNG.");
      }
    } else {
      alert("PNG generation library not loaded.");
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const receiptsToPrint = useMemo(() => {
    if (printQueue.length > 0) {
      return printQueue.map(id => history.find(r => r.id === id)).filter(Boolean) as Receipt[];
    }
    return currentReceipt ? [currentReceipt] : [];
  }, [printQueue, history, currentReceipt]);

  const SidebarItem = ({ icon: Icon, label, tab }: any) => (
    <button
      onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold transition-all ${
        activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} /> {label}
    </button>
  );

  const handleDeleteReceipt = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this receipt permanently?')) {
      setHistory(prev => prev.filter(item => item.id !== id));
      setPrintQueue(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Empty the current print queue?')) {
      setPrintQueue([]);
    }
  };

  const chunkedReceipts = useMemo(() => {
    const size = 4;
    const result = [];
    for (let i = 0; i < receiptsToPrint.length; i += size) {
      result.push(receiptsToPrint.slice(i, i + size));
    }
    return result;
  }, [receiptsToPrint]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-x-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform md:relative md:translate-x-0 no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-10 text-indigo-700">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-indigo-200 shadow-lg"><FileText size={22} /></div>
            <span className="text-2xl font-black tracking-tighter">AL-IBTIDA</span>
          </div>
          <nav className="flex-1 space-y-1.5">
            <SidebarItem icon={Home} label="New Receipt" tab="generate" />
            <SidebarItem icon={Users} label="Bulk Batch" tab="bulk" />
            <SidebarItem icon={History} label="A4 Print Manager" tab="history" />
            <SidebarItem icon={Settings} label="Master Settings" tab="admin" />
          </nav>
          <div className="mt-auto border-t pt-4">
             <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center gap-3 overflow-hidden">
                {schoolProfile.logo && <img src={schoolProfile.logo} className="w-8 h-8 rounded-md bg-white p-0.5 object-contain" />}
                <p className="text-[10px] font-black truncate uppercase leading-tight">{schoolProfile.name}</p>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-print p-4 md:p-10">
        <header className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-xl font-black text-indigo-700">AL-IBTIDA</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white rounded-lg border shadow-sm"><Menu /></button>
        </header>

        {(activeTab === 'generate' || activeTab === 'bulk') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-6 border-l-4 border-indigo-500 pl-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase">REC NO:</label>
                    <div className="flex items-center gap-1 border-b border-indigo-100">
                      <input type="text" value={receiptNo} onChange={e => setReceiptNo(e.target.value)} className="bg-transparent font-black text-[11px] text-indigo-600 outline-none w-28 py-0.5" />
                      <button onClick={() => setReceiptNo(generateNo())} className="text-indigo-300 hover:text-indigo-600"><RefreshCw size={10}/></button>
                    </div>
                  </div>
                </div>
                
                {activeTab === 'generate' ? (
                  <div className="space-y-4">
                    <input type="text" placeholder="Student's Full Name" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 transition-all border-slate-200" />
                    <div className="grid grid-cols-3 gap-3">
                      <input type="text" placeholder="Class" value={className} onChange={e => setClassName(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl font-bold bg-slate-50 border-slate-200" />
                      <input type="text" placeholder="Section" value={section} onChange={e => setSection(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl font-bold bg-slate-50 border-slate-200" />
                      <input type="text" placeholder="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl font-bold bg-slate-50 border-slate-200" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bulkStudents.map((s, idx) => (
                      <div key={s.id} className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 group">
                        <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{idx+1}</div>
                        <input type="text" placeholder="Name" value={s.name} onChange={e => {
                          const n = [...bulkStudents]; n[idx].name = e.target.value; setBulkStudents(n);
                        }} className="flex-1 px-3 py-2.5 border rounded-xl font-bold text-xs" />
                        <input type="text" placeholder="Cls" value={s.cls} onChange={e => {
                          const n = [...bulkStudents]; n[idx].cls = e.target.value; setBulkStudents(n);
                        }} className="w-14 px-2 py-2.5 border rounded-xl font-bold text-xs" />
                        <button onClick={() => setBulkStudents(bulkStudents.filter(item => item.id !== s.id))} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setBulkStudents([...bulkStudents, { id: crypto.randomUUID(), name: '', cls: '', sec: '', roll: '' }])} className="w-full py-3.5 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 font-black text-[11px] uppercase hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"><Plus size={16} /> Add Another</button>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Guardian's Name" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl font-bold bg-slate-50 border-slate-200" />
                  <input type="text" placeholder="Contact Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl font-bold bg-slate-50 border-slate-200" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Payment Date</label>
                    <input type="date" value={dateOfPayment} onChange={e => setDateOfPayment(e.target.value)} className="w-full px-4 py-3 border rounded-2xl font-bold bg-slate-50 text-xs border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Month / Year</label>
                    <input type="text" placeholder="e.g. June 2025" value={monthYear} onChange={e => setMonthYear(e.target.value)} className="w-full px-4 py-3 border rounded-2xl font-bold bg-slate-50 text-xs border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-l-4 border-emerald-500 pl-3">Fee Categories</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {categories.filter(c => c.isEnabled).map(cat => (
                    <div key={cat.id} className={`p-4 rounded-2xl border-2 transition-all ${selectedFeesData[cat.id] ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-slate-50'}`}>
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <button onClick={() => handleToggle(cat.id, cat.defaultAmount)} className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectedFeesData[cat.id] ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}><CheckCircle2 size={14} /></button>
                        <span className="flex-1 font-black text-xs uppercase text-slate-700 tracking-tight">{cat.name}</span>
                      </div>
                      {selectedFeesData[cat.id] && (
                        <div className="flex gap-4 mt-3">
                          <div className="flex-1"><label className="text-[8px] font-bold text-slate-400 block mb-1">DUE AMT</label><input type="number" value={selectedFeesData[cat.id].total} onChange={e => setSelectedFeesData({...selectedFeesData, [cat.id]: {...selectedFeesData[cat.id], total: parseFloat(e.target.value)||0}})} className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white" /></div>
                          <div className="flex-1"><label className="text-[8px] font-bold text-emerald-500 block mb-1">PAID AMT</label><input type="number" value={selectedFeesData[cat.id].paid} onChange={e => setSelectedFeesData({...selectedFeesData, [cat.id]: {...selectedFeesData[cat.id], paid: parseFloat(e.target.value)||0}})} className="w-full px-3 py-2 border-emerald-200 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50/30" /></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={activeTab === 'generate' ? handleGenSingle : handleGenBulk} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"><Save size={16} /> Save Record</button>
                  <button onClick={handleResetForm} className="px-6 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 uppercase text-[10px]">Clear</button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 sticky top-4">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Receipt Preview</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                       <button onClick={() => handleDownloadPNG('receipt-content-target')} disabled={!currentReceipt} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-emerald-700 disabled:opacity-20 shadow-lg shadow-emerald-100 transition-all"><ImageIcon size={16} /> PNG</button>
                       <button onClick={() => handleDownloadPDF('receipt-content-target')} disabled={!currentReceipt} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 disabled:opacity-20 shadow-lg shadow-indigo-100 transition-all"><Download size={16} /> PDF</button>
                       <button onClick={handleAddToA4} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all"><CopyPlus size={16} /> ADD TO A4</button>
                       <button onClick={handleTriggerPrint} disabled={!currentReceipt} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-xs hover:bg-black shadow-lg shadow-slate-100 transition-all"><Printer size={16} /> PRINT</button>
                    </div>
                  </div>
                  <div className="bg-slate-100 p-8 rounded-3xl border-2 border-dashed border-slate-200 flex justify-center items-center min-h-[500px]">
                    {currentReceipt ? (
                      <div className="scale-[0.85] sm:scale-100 transform transition-transform">
                        <ReceiptPreview receipt={currentReceipt} schoolProfile={schoolProfile} categories={categories} />
                      </div>
                    ) : (
                      <div className="text-slate-300 font-black uppercase text-[10px] tracking-widest text-center flex flex-col items-center gap-3"><AlertCircle size={40} /> Fill details to see preview</div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
             <div className="bg-white p-7 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Print Batch Queue</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-indigo-600 font-black uppercase px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">{printQueue.length} Students in Queue</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {Math.ceil(printQueue.length / 4)} A4 Pages required</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                   <button onClick={handleClearQueue} className="px-4 py-3.5 rounded-2xl border-2 border-red-100 text-red-400 font-black text-[10px] uppercase hover:bg-red-50 flex items-center gap-2"><Eraser size={14} /> Clear Queue</button>
                   <button onClick={() => setPrintQueue(history.map(r => r.id))} className="px-4 py-3.5 rounded-2xl border-2 border-slate-200 font-black text-[10px] uppercase hover:bg-slate-50">Select All History</button>
                   <button onClick={() => handleDownloadPDF('print-engine-overlay')} disabled={printQueue.length === 0} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs disabled:opacity-20 shadow-xl shadow-indigo-100 transition-all active:scale-95"><Download size={18} /> DOWNLOAD A4 PDF</button>
                   <button onClick={handleTriggerPrint} disabled={printQueue.length === 0} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs disabled:opacity-20 shadow-xl shadow-slate-100 transition-all active:scale-95"><Printer size={18} /> PRINT BATCH</button>
                </div>
             </div>
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-5 w-10 text-center">SEL</th>
                      <th className="px-6 py-5">Student Record</th>
                      <th className="px-6 py-5">Total Paid</th>
                      <th className="px-6 py-5">Generation Date</th>
                      <th className="px-6 py-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {history.map(r => (
                      <tr key={r.id} className={`hover:bg-slate-50 group cursor-pointer transition-all ${printQueue.includes(r.id) ? 'bg-indigo-50/50' : ''}`} onClick={() => setPrintQueue(p => p.includes(r.id) ? p.filter(i => i !== r.id) : [...p, r.id])}>
                        <td className="px-6 py-4 text-center">
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${printQueue.includes(r.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                            {printQueue.includes(r.id) && <CheckCircle2 size={12} />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black uppercase text-slate-800">{r.studentName}</div>
                          <div className="text-[10px] font-bold text-slate-400">Class {r.class} | {r.receiptNo}</div>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-700">₹{r.totalPaid.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={(e) => handleDeleteReceipt(e, r.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-xl">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase text-[11px] tracking-widest">No billing history found</div>}
             </div>
          </div>
        )}

        {activeTab === 'admin' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b pb-4">Institution Settings</h2>
                 <LogoUploader currentLogo={schoolProfile.logo} onLogoChange={l => setSchoolProfile({...schoolProfile, logo: l})} />
                 <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Display Name</label><input type="text" value={schoolProfile.name} onChange={e => setSchoolProfile({...schoolProfile, name: e.target.value.toUpperCase()})} className="w-full px-5 py-4 border rounded-2xl font-black bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Trust Name</label><input type="text" value={schoolProfile.trustName} onChange={e => setSchoolProfile({...schoolProfile, trustName: e.target.value})} className="w-full px-5 py-4 border rounded-2xl font-bold bg-slate-50 border-slate-200" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Official Address</label><textarea value={schoolProfile.address} onChange={e => setSchoolProfile({...schoolProfile, address: e.target.value})} className="w-full px-5 py-4 border rounded-2xl font-medium text-sm h-28 bg-slate-50 resize-none border-slate-200"></textarea></div>
                 </div>
                 <button onClick={() => alert('Institution settings saved!')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black active:scale-95 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest text-xs">Save Master Config</button>
              </div>
           </div>
        )}
      </main>

      <div id="print-engine-overlay" className="print-only">
        {receiptsToPrint.length > 0 && (
          <div className="batch-print-container bg-white">
            {chunkedReceipts.map((pageBatch, pageIndex) => (
              <div 
                key={pageIndex} 
                className="a4-sheet" 
                style={{ 
                  width: '210mm', 
                  height: '297mm', 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: '2mm',
                  padding: '5mm', 
                  boxSizing: 'border-box', 
                  background: 'white',
                  pageBreakAfter: 'always'
                }}
              >
                {pageBatch.map((r) => (
                  <div key={r.id} className="flex items-center justify-center overflow-hidden">
                    <ReceiptPreview receipt={r} schoolProfile={schoolProfile} categories={categories} compact />
                  </div>
                ))}
                {pageBatch.length < 4 && Array.from({ length: 4 - pageBatch.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-[3.75in] h-[5.5in]"></div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .print-only { position: fixed; top: -10000px; left: -10000px; z-index: -1; }
        .a4-sheet { break-after: page; page-break-after: always; overflow: hidden; position: relative; }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          #root { display: none !important; }
          .print-only { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; display: block !important; z-index: 9999 !important; background: white !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;