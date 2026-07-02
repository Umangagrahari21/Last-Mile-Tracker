import React, { useState, useEffect } from 'react';
import { getRateCards, createRateCard, deleteRateCard } from '../../api/ratecard.api';
import { getZones } from '../../api/zone.api';
import { toast } from 'react-toastify';
import { DollarSign, Plus, Trash2, RefreshCw, ArrowRight, Tag } from 'lucide-react';

const fieldLabel = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5";

const RateCardManager = () => {
  const [rateCards, setRateCards] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneFromId, setZoneFromId] = useState('');
  const [zoneToId, setZoneToId] = useState('');
  const [orderType, setOrderType] = useState('B2C');
  const [ratePerKg, setRatePerKg] = useState('');
  const [codSurcharge, setCodSurcharge] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cardsData, zonesData] = await Promise.all([getRateCards(), getZones()]);
      setRateCards(cardsData);
      setZones(zonesData);
    } catch { toast.error('Failed to load rate cards'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!zoneFromId || !zoneToId || !ratePerKg) { toast.warn('All fields are required'); return; }
    setCreating(true);
    try {
      await createRateCard({ zoneFromId, zoneToId, orderType, ratePerKg: parseFloat(ratePerKg), codSurcharge: codSurcharge ? parseFloat(codSurcharge) : 0 });
      toast.success('Rate card created!');
      setRatePerKg(''); setCodSurcharge('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create rate card'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Delete this rate card?')) return;
    try { await deleteRateCard(cardId); toast.success('Rate card deleted'); fetchData(); }
    catch { toast.error('Failed to delete rate card'); }
  };

  const selectClass = "input-field pl-3";

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h1 className="section-title">Rate Card Manager</h1>
          </div>
          <p className="section-subtitle">{rateCards.length} rate card{rateCards.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin360' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Create Form */}
        <div className="glass-card rounded-2xl p-5 h-fit animate-slide-up">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" /> Add Rate Card
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className={fieldLabel}>Zone From (Pickup)</label>
              <select required value={zoneFromId} onChange={(e) => setZoneFromId(e.target.value)} className={selectClass}>
                <option value="" disabled>Select Zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Zone To (Drop)</label>
              <select required value={zoneToId} onChange={(e) => setZoneToId(e.target.value)} className={selectClass}>
                <option value="" disabled>Select Zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['B2C','B2B'].map(t => (
                  <button key={t} type="button" onClick={() => setOrderType(t)}
                    className={`py-2 rounded-xl text-sm font-black border-2 transition-all ${orderType === t
                      ? t === 'B2C' ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300'
                                    : 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Rate per kg (₹)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" step="0.01" required placeholder="e.g. 30" value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>COD Surcharge (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" step="0.01" placeholder="e.g. 25" value={codSurcharge}
                  onChange={(e) => setCodSurcharge(e.target.value)} className="input-field" />
              </div>
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full text-sm">
              <Plus className="w-4 h-4" />
              {creating ? 'Saving...' : 'Add Rate Card'}
            </button>
          </form>
        </div>

        {/* Rate Cards */}
        <div className="lg:col-span-3">
          {loading && rateCards.length === 0 ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin360" /></div>
          ) : rateCards.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center text-slate-400">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No rate cards defined yet.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Desktop view table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>From Zone</th><th>To Zone</th><th>Type</th>
                      <th>Rate / kg</th><th>COD Surcharge</th><th className="text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateCards.map((card, idx) => (
                      <tr key={card.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                        <td>
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            {card.zoneFrom?.name}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                            {card.zoneTo?.name}
                          </div>
                        </td>
                        <td>
                          <span className={`badge text-xs ${card.orderType === 'B2B' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30' : 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30'}`}>
                            {card.orderType}
                          </span>
                        </td>
                        <td>
                          <span className="font-black text-slate-900 dark:text-white text-base">₹{card.ratePerKg}</span>
                          <span className="text-xs text-slate-400 ml-1">/kg</span>
                        </td>
                        <td>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {card.codSurcharge > 0 ? `₹${card.codSurcharge}` : <span className="text-slate-400">None</span>}
                          </span>
                        </td>
                        <td className="text-center">
                          <button onClick={() => handleDelete(card.id)}
                            className="w-7 h-7 flex items-center justify-center mx-auto text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view card list */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {rateCards.map((card, idx) => (
                  <div key={card.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span>{card.zoneFrom?.name}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{card.zoneTo?.name}</span>
                      </div>
                      <button onClick={() => handleDelete(card.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">Rate Card type</span>
                        <span className={`badge text-[10px] ${card.orderType === 'B2B' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30' : 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30'}`}>
                          {card.orderType}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">Rate</span>
                        <div className="font-black text-slate-900 dark:text-white">₹{card.ratePerKg}<span className="text-[10px] text-slate-400 font-medium">/kg</span></div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">COD Fee</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300">{card.codSurcharge > 0 ? `₹${card.codSurcharge}` : 'None'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateCardManager;
