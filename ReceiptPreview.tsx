
import React from 'react';
import { Receipt, SchoolProfile, FeeCategory } from '../types';

interface ReceiptPreviewProps {
  receipt: Receipt;
  schoolProfile: SchoolProfile;
  categories: FeeCategory[];
  compact?: boolean;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ 
  receipt, 
  schoolProfile, 
  categories,
  compact = false 
}) => {
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Fee';

  const dimensionsStyle = {
    width: '3.75in',
    height: '5.5in',
    padding: '0.1in',
  };

  return (
    <div 
      style={dimensionsStyle}
      id={compact ? undefined : "receipt-content-target"}
      className="receipt-container bg-white border-2 border-slate-900 mx-auto text-slate-800 flex flex-col shadow-none relative box-border overflow-hidden"
    >
      {/* Centered Header - Fixed Tracking to prevent PNG overlap */}
      <div className="flex flex-col items-center border-b-2 border-slate-900 pb-1 mb-1.5 text-center">
        <div className="flex items-center justify-center gap-2 w-full mb-0.5 px-1">
          {schoolProfile.logo && (
            <img 
              src={schoolProfile.logo} 
              alt="Logo" 
              className="w-10 h-10 object-contain flex-shrink-0" 
            />
          )}
          <h1 className="text-[19px] font-black text-slate-900 leading-tight uppercase tracking-normal flex-1">
            {schoolProfile.name}
          </h1>
        </div>
        <div className="w-full flex flex-col items-center">
          <p className="text-[9.5px] font-bold text-slate-700 uppercase tracking-normal leading-none mt-0.5">
            {schoolProfile.trustName}
          </p>
          <p className="text-[8px] text-slate-500 italic leading-tight max-w-[95%] mx-auto mt-1 tracking-normal">
            {schoolProfile.address}
          </p>
        </div>
      </div>

      {/* Meta Info Bar */}
      <div className="flex justify-between items-center mb-1.5 px-1">
        <div className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-black text-[8px] uppercase tracking-normal">
          REC NO: {receipt.receiptNo}
        </div>
        <div className="text-slate-900 font-black text-[8px] uppercase tracking-normal">
          Date: {new Date(receipt.dateOfPayment).toLocaleDateString('en-GB')}
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-1.5 text-[9px] px-1">
        <div className="flex border-b border-slate-200 pb-0.5 min-w-0 col-span-2">
          <span className="text-slate-400 w-16 flex-shrink-0 font-medium">Student:</span>
          <span className="font-bold uppercase truncate">{receipt.studentName}</span>
        </div>
        <div className="flex border-b border-slate-200 pb-0.5 min-w-0">
          <span className="text-slate-400 w-16 flex-shrink-0 font-medium">Class:</span>
          <span className="font-bold uppercase">{receipt.class}</span>
        </div>
        <div className="flex border-b border-slate-200 pb-0.5 min-w-0">
          <span className="text-slate-400 w-16 flex-shrink-0 font-medium">Section:</span>
          <span className="font-bold uppercase">{receipt.section || '-'}</span>
        </div>
        <div className="flex border-b border-slate-200 pb-0.5 min-w-0">
          <span className="text-slate-400 w-16 flex-shrink-0 font-medium">Roll No:</span>
          <span className="font-bold uppercase">{receipt.rollNo}</span>
        </div>
        <div className="flex border-b border-slate-200 pb-0.5 min-w-0">
          <span className="text-slate-400 w-16 flex-shrink-0 font-medium">Month/Yr:</span>
          <span className="font-bold uppercase">{receipt.monthYear}</span>
        </div>
        <div className="flex border-b border-slate-200 pb-0.5 min-w-0 col-span-2">
          <span className="text-slate-400 w-16 flex-shrink-0 font-medium">Contact:</span>
          <span className="font-bold uppercase">{receipt.mobileNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Fees Table */}
      <div className="border border-slate-900 rounded overflow-hidden mb-1.5 flex-grow">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-[7px] uppercase tracking-normal">
            <tr>
              <th className="py-1 px-3 border-r border-slate-700">Particulars</th>
              <th className="py-1 px-3 text-right border-r border-slate-700 w-16">Due (₹)</th>
              <th className="py-1 px-3 text-right w-16">Paid (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipt.fees.map((fee, idx) => (
              <tr key={idx} className="text-[8px]">
                <td className="py-1 px-3 border-r border-slate-200 uppercase font-bold text-slate-700 truncate max-w-[120px] tracking-normal">{getCategoryName(fee.categoryId)}</td>
                <td className="py-1 px-3 text-right border-r border-slate-200 text-slate-500 font-medium tracking-normal">₹{fee.amount.toLocaleString()}</td>
                <td className="py-1 px-3 text-right font-black text-emerald-800 bg-emerald-50/20 tracking-normal">₹{fee.paid.toLocaleString()}</td>
              </tr>
            ))}
            {/* Minimal filler rows */}
            {receipt.fees.length < 5 && Array.from({length: 5 - receipt.fees.length}).map((_, i) => (
              <tr key={i} className="h-5">
                <td className="border-r border-slate-100"></td>
                <td className="border-r border-slate-100"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-black border-t border-slate-900 text-[9px]">
            <tr>
              <td className="py-2 px-3 border-r border-slate-200 text-right uppercase tracking-normal">Total Amount Received</td>
              <td className="py-2 px-3 text-right border-r border-slate-200 tracking-normal">₹{receipt.totalAmount.toLocaleString()}</td>
              <td className="py-2.5 px-3 text-right text-emerald-900 tracking-normal">₹{receipt.totalPaid.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-1 px-1">
          <div className={`px-2 py-0.5 rounded border-2 font-black uppercase text-[9px] tracking-normal shadow-sm flex flex-col items-center leading-none ${receipt.totalDue > 0 ? 'bg-red-600 border-red-700 text-white' : 'bg-emerald-600 border-emerald-700 text-white'}`}>
            <span className="text-[6px] opacity-80 tracking-normal">BALANCE DUE</span>
            <span className="mt-0.5 font-bold tracking-normal">₹{receipt.totalDue.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <div className="w-32 border-t border-slate-900 pt-0.5">
               <p className="font-bold uppercase text-[6px] tracking-normal">Authorised Official Signature</p>
            </div>
          </div>
        </div>
        <div className="text-[5px] text-slate-400 text-center border-t border-slate-50 pt-0.5 uppercase font-black tracking-normal">
          COMPUTER GENERATED RECEIPT • AL-IBTIDA
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
