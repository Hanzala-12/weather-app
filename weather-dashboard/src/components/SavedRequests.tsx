import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Edit2, Trash2, Download, Table, X } from 'lucide-react';

export interface SavedRequest {
  id: string;
  location: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function SavedRequests({ currentLocation }: { currentLocation: string }) {
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ location: currentLocation, startDate: '', endDate: '', notes: '' });

  useEffect(() => {
    setFormData(prev => ({ ...prev, location: currentLocation }));
  }, [currentLocation]);

  const api = (path: string) => `${API_BASE}${path}`;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(api('/api/history'));
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.warn('Backend unavailable, using local storage');
      const stored = localStorage.getItem('saved_weather_requests');
      if (stored) {
        try { setRequests(JSON.parse(stored)); } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { location: formData.location, date_from: formData.startDate, date_to: formData.endDate, notes: formData.notes || null };

    if (isEditing) {
      try {
        const res = await fetch(api(`/api/history/${isEditing}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setRequests(prev => prev.map(r => r.id === isEditing ? { ...r, ...body } : r));
        }
      } catch (e) {
        console.warn('Failed to update');
      }
      setIsEditing(null);
    } else {
      try {
        const res = await fetch(api('/api/history'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          setRequests(prev => [...prev, created]);
        }
      } catch (e) {
        console.warn('Failed to save');
        const newRequest: SavedRequest = { id: Date.now().toString(), location: body.location, startDate: body.date_from || '', endDate: body.date_to || '', notes: body.notes || '' };
        setRequests(prev => [...prev, newRequest]);
        const stored: SavedRequest[] = JSON.parse(localStorage.getItem('saved_weather_requests') || '[]');
        stored.push(newRequest);
        localStorage.setItem('saved_weather_requests', JSON.stringify(stored));
      }
    }
    setFormData({ location: currentLocation, startDate: '', endDate: '', notes: '' });
  };

  const handleEdit = (req: SavedRequest) => {
    setIsEditing(req.id);
    setFormData({ location: req.location, startDate: req.startDate, endDate: req.endDate, notes: req.notes });
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(api(`/api/history/${id}`), { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete on backend');
    }
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleExportCSV = () => {
    if (requests.length === 0) return;
    const header = Object.keys(requests[0]).join(',');
    const rows = requests.map(req => Object.values(req).map(v => `"${v}"`).join(','));
    const csvData = [header, ...rows].join('\n');
    downloadFile(csvData, 'searches.csv', 'text/csv');
  };

  const handleExportJSON = () => {
    if (requests.length === 0) return;
    downloadFile(JSON.stringify(requests, null, 2), 'searches.json', 'application/json');
  };

  const handleExportMD = () => {
    if (requests.length === 0) return;
    const header = '| Location | Start Date | End Date | Notes |';
    const sep = '|---|---|---|---|';
    const rows = requests.map(req => {
      const esc = (v: string) => v.replace(/\|/g, '\\|');
      return `| ${esc(req.location)} | ${esc(req.startDate)} | ${esc(req.endDate)} | ${esc(req.notes)} |`;
    });
    const md = [header, sep, ...rows].join('\n');
    downloadFile(md, 'searches.md', 'text/markdown');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-panel"
      style={{
        padding: 24,
        borderRadius: '1.5rem',
        marginTop: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          Saved Weather Requests
        </h3>
        {requests.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportCSV} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleExportJSON} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
              <Download size={14} /> JSON
            </button>
            <button onClick={handleExportMD} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
              <Download size={14} /> MD
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: 24 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h4 style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               {isEditing ? 'Update Request' : 'New Request'}
             </h4>
             {isEditing && (
                <button type="button" onClick={() => { setIsEditing(null); setFormData({ location: currentLocation, startDate: '', endDate: '', notes: '' }); }} className="text-white/50 hover:text-white/80">
                  <X size={14} />
                </button>
             )}
          </div>
          
          <input
            required
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 w-full"
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              required
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 w-full"
            />
            <input
              required
              type="date"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 w-full"
            />
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 w-full"
          />
          <button
            type="submit"
            className="mt-2 bg-white/90 hover:bg-white text-black font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={16} />
            {isEditing ? 'Update Selection' : 'Save Request'}
          </button>
        </form>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[120px] text-white/30">
              <span className="text-sm">Loading...</span>
            </div>
          ) : requests.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-2 px-3 border-b border-white/10 text-xs font-medium text-white/50 uppercase tracking-wider">Location</th>
                  <th className="py-2 px-3 border-b border-white/10 text-xs font-medium text-white/50 uppercase tracking-wider">Date Range</th>
                  <th className="py-2 px-3 border-b border-white/10 text-xs font-medium text-white/50 uppercase tracking-wider">Notes</th>
                  <th className="py-2 px-3 border-b border-white/10 text-xs font-medium text-white/50 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {requests.map(req => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group"
                    >
                      <td className="py-3 px-3 border-b border-white/5 text-sm text-white/90 font-medium">
                        {req.location}
                      </td>
                      <td className="py-3 px-3 border-b border-white/5 text-xs text-white/70">
                        {new Date(req.startDate).toLocaleDateString()} &mdash; {new Date(req.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 border-b border-white/5 text-xs text-white/50 max-w-[120px] truncate">
                        {req.notes || '—'}
                      </td>
                      <td className="py-3 px-3 border-b border-white/5 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(req)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(req.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-white/30">
              <Table size={24} className="mb-2 opacity-50" />
              <span className="text-sm">No saved searches yet</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
