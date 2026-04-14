'use client';

import { useState, useEffect } from 'react';
import { api, Inspection } from '@/lib/api';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import {
  Search, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight, ClipboardCheck, X, Car, Calendar, User, Palette
} from 'lucide-react';
import { toast } from 'sonner';

const INSPECTION_CATEGORIES = {
  tiresAndBrakes: {
    title: "Tires & Brakes",
    items: ["Front Left Tire", "Front Right Tire", "Rear Left Tire", "Rear Right Tire", "Spare Tire", "Front Brakes", "Rear Brakes", "Brake Fluid"]
  },
  exteriorBody: {
    title: "Exterior Body",
    items: ["Hood", "Front Bumper", "Rear Bumper", "Driver Door", "Pass. Door", "Rear Driver Door", "Rear Pass. Door", "Trunk / Tailgate", "Roof", "Paint / Finish"]
  },
  underHood: {
    title: "Under Hood",
    items: ["Engine Oil", "Coolant", "Power Steering", "Trans. Fluid", "Battery", "Belts & Hoses", "Air Filter", "Exhaust"]
  },
  lights: {
    title: "Lights",
    items: ["Headlights", "Tail Lights", "Turn Signals", "Brake Lights", "Reverse Lights", "Hazards"]
  },
  interiorCheck: {
    title: "Interior Check",
    items: ["Dashboard", "Seats / Upholstery", "Carpets / Mats", "Headliner", "A/C & Heat", "Radio / Nav", "Power Windows", "Door Locks", "Seat Belts", "Horn"]
  }
};

const DAMAGE_ZONES = [
  { id: "hood", title: "Hood", style: { left: '38%', top: '8%', width: '24%', height: '14%' } },
  { id: "roof", title: "Roof", style: { left: '35%', top: '25%', width: '30%', height: '22%' } },
  { id: "trunk", title: "Trunk", style: { left: '38%', top: '74%', width: '24%', height: '12%' } },
  { id: "driverFront", title: "Driver Front", style: { left: '12%', top: '14%', width: '22%', height: '12%' } },
  { id: "driverRear", title: "Driver Rear", style: { left: '12%', top: '60%', width: '22%', height: '12%' } },
  { id: "passFront", title: "Pass. Front", style: { left: '66%', top: '14%', width: '22%', height: '12%' } },
  { id: "passRear", title: "Pass. Rear", style: { left: '66%', top: '60%', width: '22%', height: '12%' } },
  { id: "frontBumper", title: "Front Bumper", style: { left: '30%', top: '2%', width: '40%', height: '6%' } },
  { id: "rearBumper", title: "Rear Bumper", style: { left: '30%', top: '88%', width: '40%', height: '6%' } },
];

function getRatingColor(rating: string | null) {
  switch (rating) {
    case 'good': return 'bg-emerald-500';
    case 'fair': return 'bg-amber-500';
    case 'poor': return 'bg-red-500';
    default: return 'bg-gray-300 dark:bg-gray-600';
  }
}

function getRatingBadgeStyle(rating: string | null) {
  switch (rating) {
    case 'good': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    case 'fair': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
    case 'poor': return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
  }
}

function getDamageSeverityColor(severity: string) {
  switch (severity) {
    case 'major': return 'bg-red-500/70 border-red-600';
    case 'moderate': return 'bg-amber-500/70 border-amber-600';
    case 'minor': return 'bg-yellow-400/70 border-yellow-500';
    default: return 'bg-gray-400/50 border-gray-500';
  }
}

export default function InspectionSection() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filtered, setFiltered] = useState<Inspection[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vehicleInfo: string } | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  useEffect(() => { loadInspections(); }, [page]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      inspections.filter(i =>
        i.vehicleInfo?.toLowerCase().includes(q) ||
        i.vin?.toLowerCase().includes(q) ||
        i.inspector?.toLowerCase().includes(q) ||
        i.color?.toLowerCase().includes(q) ||
        i.mileage?.toLowerCase().includes(q)
      )
    );
  }, [search, inspections]);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const res = await api.getInspections(page, 50);
      setInspections(res.inspections);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch { toast.error('Failed to load inspections'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteInspection(deleteTarget.id);
      toast.success('Inspection deleted');
      setDeleteTarget(null);
      loadInspections();
    } catch { toast.error('Failed to delete inspection'); }
  };

  const countRatings = (ratings: Record<string, string> | null) => {
    if (!ratings) return { good: 0, fair: 0, poor: 0 };
    const counts = { good: 0, fair: 0, poor: 0 };
    Object.values(ratings).forEach(r => {
      if (r === 'good') counts.good++;
      else if (r === 'fair') counts.fair++;
      else if (r === 'poor') counts.poor++;
    });
    return counts;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-500/20">
          <ClipboardCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inspections</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">View all multi-point vehicle inspections</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, VIN, inspector, color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} total</span>
          <button onClick={loadInspections} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Inspections Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{search ? 'No inspections match your search' : 'No inspections found'}</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((inspection) => {
              const ratings = countRatings(inspection.ratings);
              const damageCount = Array.isArray(inspection.damageMarks) ? inspection.damageMarks.length : 0;
              return (
                <div
                  key={inspection.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {inspection.vehicleInfo || 'Unknown Vehicle'}
                      </h3>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                        {inspection.vin || 'No VIN'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setSelectedInspection(inspection)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-violet-500 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: inspection.id, vehicleInfo: inspection.vehicleInfo || 'this inspection' })}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar size={12} />
                      <span>{inspection.date || new Date(inspection.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <User size={12} />
                      <span className="truncate">{inspection.inspector || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Car size={12} />
                      <span>{inspection.mileage ? `${inspection.mileage} mi` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Palette size={12} />
                      <span>{inspection.color || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Ratings Summary */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{ratings.good}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{ratings.fair}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{ratings.poor}</span>
                    </div>
                    {damageCount > 0 && (
                      <div className="ml-auto">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                          {damageCount} damage{damageCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Inspection"
          message={`Delete inspection for "${deleteTarget.vehicleInfo}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInspection(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedInspection.vehicleInfo || 'Vehicle Inspection'}</h2>
                  <p className="text-violet-200 text-sm">{selectedInspection.vin || 'No VIN'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInspection(null)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Vehicle Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.date || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Inspector</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.inspector || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Mileage</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.mileage || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Color</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedInspection.color || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ratings Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Inspection Ratings</h3>
                  <div className="space-y-4">
                    {Object.entries(INSPECTION_CATEGORIES).map(([key, category]) => (
                      <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{category.title}</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {category.items.map(item => {
                            const rating = selectedInspection.ratings?.[item] || null;
                            return (
                              <div key={item} className="flex items-center justify-between gap-2 py-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{item}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded capitalize ${getRatingBadgeStyle(rating)}`}>
                                  {rating || '—'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Damage Map Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Body Damage Map</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="relative w-full aspect-[3/4] max-w-[280px] mx-auto">
                      {/* Car outline SVG */}
                      <svg viewBox="0 0 200 280" className="w-full h-full">
                        <path
                          d="M40 40 Q100 20 160 40 L170 80 Q175 100 175 120 L175 200 Q175 220 170 240 L160 260 Q100 280 40 260 L30 240 Q25 220 25 200 L25 120 Q25 100 30 80 Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-300 dark:text-gray-500"
                        />
                        {/* Windshield */}
                        <path d="M50 70 Q100 55 150 70 L145 100 Q100 95 55 100 Z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-500" />
                        {/* Rear window */}
                        <path d="M55 200 Q100 195 145 200 L150 230 Q100 245 50 230 Z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-500" />
                        {/* Side mirrors */}
                        <ellipse cx="20" cy="85" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-500" />
                        <ellipse cx="180" cy="85" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-500" />
                        {/* Wheels */}
                        <ellipse cx="45" cy="90" rx="12" ry="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-400" />
                        <ellipse cx="155" cy="90" rx="12" ry="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-400" />
                        <ellipse cx="45" cy="210" rx="12" ry="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-400" />
                        <ellipse cx="155" cy="210" rx="12" ry="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-gray-400" />
                      </svg>

                      {/* Damage Zones Overlay */}
                      {DAMAGE_ZONES.map(zone => {
                        const damage = (selectedInspection.damageMarks as Array<{ zone: string; severity: string }> || [])
                          .find(d => d.zone === zone.id);
                        return (
                          <div
                            key={zone.id}
                            className={`absolute rounded-sm border-2 transition-all ${
                              damage ? getDamageSeverityColor(damage.severity) : 'bg-transparent border-transparent'
                            }`}
                            style={zone.style as React.CSSProperties}
                            title={damage ? `${zone.title}: ${damage.severity}` : zone.title}
                          />
                        );
                      })}
                    </div>

                    {/* Damage Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Damage Legend</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-red-500/70 border border-red-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Major</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-amber-500/70 border border-amber-600" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Moderate</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-yellow-400/70 border border-yellow-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Minor</span>
                        </div>
                      </div>
                    </div>

                    {/* Damage List */}
                    {Array.isArray(selectedInspection.damageMarks) && selectedInspection.damageMarks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Noted Damages</p>
                        <div className="space-y-1.5">
                          {(selectedInspection.damageMarks as Array<{ zone: string; severity: string }>).map((damage, i) => {
                            const zone = DAMAGE_ZONES.find(z => z.id === damage.zone);
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">{zone?.title || damage.zone}</span>
                                <span className={`px-1.5 py-0.5 rounded capitalize font-medium ${
                                  damage.severity === 'major' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                                  damage.severity === 'moderate' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                  'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                                }`}>
                                  {damage.severity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
