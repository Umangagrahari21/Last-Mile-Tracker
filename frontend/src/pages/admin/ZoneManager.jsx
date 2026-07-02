import React, { useState, useEffect } from 'react';
import { getZones, createZone, deleteZone, addArea, deleteArea } from '../../api/zone.api';
import { toast } from 'react-toastify';
import { MapPin, Plus, Trash2, X, RefreshCw, Layers, Globe } from 'lucide-react';

const ZONE_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
];

const ZoneManager = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newZoneName, setNewZoneName] = useState('');
  const [creatingZone, setCreatingZone] = useState(false);
  const [newAreaPins, setNewAreaPins] = useState({});
  const [newAreaNames, setNewAreaNames] = useState({});

  const fetchZones = async () => {
    setLoading(true);
    try { setZones(await getZones()); }
    catch { toast.error('Failed to fetch zones'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchZones(); }, []);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    setCreatingZone(true);
    try {
      await createZone(newZoneName.trim());
      toast.success('Zone created!');
      setNewZoneName('');
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create zone');
    } finally { setCreatingZone(false); }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Delete this zone? All associated pincodes will be removed.')) return;
    try { await deleteZone(zoneId); toast.success('Zone deleted'); fetchZones(); }
    catch { toast.error('Failed to delete zone'); }
  };

  const handleAddArea = async (zoneId) => {
    const pin = newAreaPins[zoneId];
    const name = newAreaNames[zoneId];
    if (!pin || !name) { toast.warn('Pincode and area name required'); return; }
    if (!/^\d{6}$/.test(pin)) { toast.warn('Pincode must be exactly 6 digits'); return; }
    try {
      await addArea(zoneId, { pincode: pin, name });
      toast.success('Area added!');
      setNewAreaPins(p => ({ ...p, [zoneId]: '' }));
      setNewAreaNames(p => ({ ...p, [zoneId]: '' }));
      fetchZones();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add area'); }
  };

  const handleDeleteArea = async (areaId) => {
    try { await deleteArea(areaId); toast.success('Area removed'); fetchZones(); }
    catch { toast.error('Failed to remove area'); }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h1 className="section-title">Zone & Pincode Manager</h1>
          </div>
          <p className="section-subtitle">{zones.length} zone{zones.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={fetchZones} disabled={loading} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin360' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Create Zone Panel */}
        <div className="glass-card rounded-2xl p-5 h-fit animate-slide-up">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> Add New Zone
          </h3>
          <form onSubmit={handleCreateZone} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Zone Name</label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="e.g. Zone-North" value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="input-field pl-9" />
              </div>
            </div>
            <button type="submit" disabled={creatingZone} className="btn-primary w-full text-sm">
              <Plus className="w-4 h-4" />
              {creatingZone ? 'Creating...' : 'Create Zone'}
            </button>
          </form>
        </div>

        {/* Zone Cards */}
        <div className="lg:col-span-3">
          {loading && zones.length === 0 ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-indigo-500 animate-spin360" /></div>
          ) : zones.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No zones yet. Create one to start.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {zones.map((zone, idx) => {
                const grad = ZONE_COLORS[idx % ZONE_COLORS.length];
                return (
                  <div key={zone.id} className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                    {/* Zone header bar */}
                    <div className={`bg-gradient-to-r ${grad} p-4 flex justify-between items-center`}>
                      <div>
                        <h4 className="text-white font-black text-base">{zone.name}</h4>
                        <span className="text-white/60 text-[10px] font-mono">ID: {zone.id.slice(-6)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {zone.areas.length} areas
                        </span>
                        <button onClick={() => handleDeleteZone(zone.id)}
                          className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-red-500 rounded-lg text-white transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Areas list */}
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {zone.areas.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-2">No pincodes yet.</p>
                        ) : zone.areas.map(area => (
                          <div key={area.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg text-xs border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="font-black text-slate-800 dark:text-slate-100">{area.pincode}</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{area.name}</span>
                            <button onClick={() => handleDeleteArea(area.id)}
                              className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors ml-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add area form */}
                      <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add Pincode</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input type="text" placeholder="Pincode" maxLength="6"
                            value={newAreaPins[zone.id] || ''}
                            onChange={(e) => setNewAreaPins(p => ({ ...p, [zone.id]: e.target.value }))}
                            className="input-field pl-3 py-1.5 text-xs" />
                          <input type="text" placeholder="Area Name"
                            value={newAreaNames[zone.id] || ''}
                            onChange={(e) => setNewAreaNames(p => ({ ...p, [zone.id]: e.target.value }))}
                            className="input-field pl-3 py-1.5 text-xs" />
                        </div>
                        <button onClick={() => handleAddArea(zone.id)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-100 dark:border-indigo-500/20 hover:border-transparent">
                          <Plus className="w-3.5 h-3.5" /> Add Area
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneManager;
