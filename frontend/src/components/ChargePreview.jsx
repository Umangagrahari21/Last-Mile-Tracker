import React from 'react';
import { DollarSign } from 'lucide-react';

const ChargePreview = ({ chargeData }) => {
  if (!chargeData) return null;

  const rows = [
    { label: 'Volumetric Weight', value: `${chargeData.volumetricWeight} kg` },
    { label: 'Billed Weight', value: `${chargeData.billedWeight} kg`, bold: true },
    { label: 'Rate per kg', value: `₹${chargeData.ratePerKg}` },
  ];

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-white font-black text-sm">Charge Breakdown</h3>
      </div>

      <div className="p-5 space-y-3">
        {rows.map(({ label, value, bold }) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className={`${bold ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>{value}</span>
          </div>
        ))}

        <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Base Charge</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">₹{chargeData.baseCharge}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">COD Surcharge</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {chargeData.codSurcharge > 0 ? `₹${chargeData.codSurcharge}` : 'None'}
            </span>
          </div>
        </div>

        <div className="border-t-2 border-indigo-200 dark:border-indigo-500/30 pt-3 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-slate-800 dark:text-slate-200">Total</span>
            <span className="text-2xl font-black gradient-text">₹{chargeData.totalCharge}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargePreview;
