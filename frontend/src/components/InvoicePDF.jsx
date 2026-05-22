import React from 'react';
import { Printer, Shield, CheckCircle } from 'lucide-react';

const InvoicePDF = ({ order, items, onClose }) => {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm print:p-0 print:bg-white print:relative">
      
      {/* Container Card */}
      <div className="w-full max-w-2xl overflow-hidden border border-white/10 rounded-2xl bg-[#0b101d] shadow-2xl print:border-none print:shadow-none print:bg-white print:rounded-none">
        
        {/* Modal actions headers (hidden in print) */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#070b14]/80 print:hidden">
          <h3 className="text-sm font-semibold tracking-wide text-cyan-400 uppercase">Print Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={triggerPrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-[#090D16] hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold border rounded-lg border-white/10 hover:bg-white/5 text-white/70"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Body Content */}
        <div id="printable-area" className="p-8 text-white bg-[#0b101d] font-mono print:text-black print:bg-white">
          <div className="flex justify-between items-start border-b border-dashed border-white/20 print:border-black/20 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-cyan-400 print:text-black" />
                <h1 className="text-xl font-bold tracking-tight">APEX FULFILLMENT OS</h1>
              </div>
              <p className="text-xs text-white/50 print:text-black/60">Fulfillment Hub Cairo-East #FC-02</p>
              <p className="text-xs text-white/50 print:text-black/60">System Operator Terminal</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-cyan-400 print:text-black">ORD-{order.OrderID}</h2>
              <p className="text-xs text-white/50 print:text-black/60">Date: {new Date(order.OrderDate).toLocaleDateString()}</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded border border-cyan-400/30 text-cyan-400 uppercase print:border-black print:text-black font-bold">
                {order.Status}
              </span>
            </div>
          </div>

          {/* Delivery Coordinates */}
          <div className="grid grid-cols-2 gap-4 py-6 border-b border-dashed border-white/20 print:border-black/20 text-xs">
            <div>
              <p className="text-white/40 print:text-black/40 uppercase mb-1">Customer Details</p>
              <p className="font-bold">{order.FullName}</p>
              <p className="text-white/60 print:text-black/60">{order.Phone}</p>
            </div>
            <div>
              <p className="text-white/40 print:text-black/40 uppercase mb-1">Delivery Destination</p>
              <p className="font-bold">{order.City}</p>
              <p className="text-white/60 print:text-black/60">{order.Address}</p>
            </div>
          </div>

          {/* Items checklist table */}
          <div className="py-6">
            <h3 className="text-xs text-cyan-400 print:text-black uppercase font-bold tracking-wider mb-4">Packaged Checklist</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 print:border-black/10 text-white/40 print:text-black/40 pb-2">
                  <th className="py-2 font-normal">Product Description</th>
                  <th className="py-2 font-normal">SKU Code</th>
                  <th className="py-2 font-normal text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 print:border-black/5">
                    <td className="py-3 font-semibold">{item.ProductName}</td>
                    <td className="py-3 text-white/60 print:text-black/60">{item.SKU}</td>
                    <td className="py-3 text-right font-bold">{item.Quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer certification details */}
          <div className="flex flex-col items-center justify-center pt-8 border-t border-dashed border-white/20 print:border-black/20 text-[10px] text-white/40 print:text-black/60">
            <CheckCircle className="w-8 h-8 mb-2 text-cyan-400 print:text-black" />
            <p className="font-bold uppercase tracking-widest">Validated & Sealed</p>
            <p className="mt-1">Authorized by APEX Logistics Systems LLC Egypt</p>
            <p className="text-[8px] mt-2 text-white/20 print:text-black/40 font-sans">© 2026 APEX Fulfillment. All rights reserved.</p>
          </div>
        </div>

      </div>
      
      {/* Inject custom printing overrides styled for desktop layout */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
};

export default InvoicePDF;
export { InvoicePDF };
