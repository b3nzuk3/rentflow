"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Property, Block, Unit } from "@/types";
import { Building, Plus, MapPin, ChevronRight, Layers, Trash2, Lock, Check, X } from "lucide-react";

export function LandlordProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropId, setSelectedPropId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("All");

  // Modals
  const [showAddPropModal, setShowAddPropModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);

  // Form state
  const [propName, setPropName] = useState("");
  const [propLoc, setPropLoc] = useState("Nairobi, Westlands");
  const [propDesc, setPropDesc] = useState("");
  const [blockName, setBlockName] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [unitRent, setUnitRent] = useState("35000");
  const [unitStatus, setUnitStatus] = useState<Unit["status"]>("Vacant");
  const [parentBlockId, setParentBlockId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propsRes, blocksRes, unitsRes] = await Promise.all([
        api.get("/properties"),
        api.get("/blocks"),
        api.get("/units"),
      ]);
      setProperties(propsRes.data);
      setBlocks(blocksRes.data);
      setUnits(unitsRes.data);
      if (propsRes.data.length > 0 && !selectedPropId) {
        setSelectedPropId(propsRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load properties data", err);
    } finally {
      setLoading(false);
    }
  };

  const currentProp = properties.find(p => p.id === selectedPropId);
  const currentPropBlocks = blocks.filter(b => b.property_id === selectedPropId);
  const currentUnits = units.filter(u => u.property_id === selectedPropId);

  const filteredUnits = currentUnits.filter(u => {
    const passStatus = filterStatus === "All" || u.status === filterStatus;
    const passBlock = selectedBlockId === "All" || u.block_id === selectedBlockId || (selectedBlockId === "None" && !u.block_id);
    return passStatus && passBlock;
  });

  const handleAddProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim()) return;
    try {
      await api.post("/properties", { name: propName, location: propLoc, description: propDesc });
      setPropName(""); setPropDesc(""); setShowAddPropModal(false);
      loadData();
    } catch (err) { console.error("Failed to add property", err); }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName.trim() || !selectedPropId) return;
    try {
      await api.post("/blocks", { property_id: selectedPropId, name: blockName });
      setBlockName(""); setShowAddBlockModal(false);
      loadData();
    } catch (err) { console.error("Failed to add block", err); }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim() || !selectedPropId) return;
    try {
      await api.post("/units", {
        property_id: selectedPropId,
        block_id: parentBlockId === "None" || !parentBlockId ? null : parentBlockId,
        unit_code: unitCode,
        rent_amount: parseInt(unitRent) || 30000,
        status: unitStatus,
      });
      setUnitCode(""); setShowAddUnitModal(false);
      loadData();
    } catch (err) { console.error("Failed to add unit", err); }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Delete this unit?")) return;
    try {
      await api.delete(`/units/${unitId}`);
      loadData();
    } catch (err) { console.error("Failed to delete unit", err); }
  };

  const handleDeleteBlock = async (blockId: string, blockName: string) => {
    if (!confirm(`Delete block "${blockName}"? Units will be unassigned from this block.`)) return;
    try {
      await api.delete(`/blocks/${blockId}`);
      if (selectedBlockId === blockId) setSelectedBlockId("All");
      loadData();
    } catch (err) { console.error("Failed to delete block", err); }
  };

  const handleUpdateUnitStatus = async (unitId: string, status: Unit["status"]) => {
    try {
      await api.patch(`/units/${unitId}/status`, { status });
      loadData();
    } catch (err) { console.error("Failed to update unit status", err); }
  };

  const getStatusColor = (status: Unit["status"]) => {
    switch (status) {
      case "Occupied": return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Vacant": return "bg-slate-50 text-slate-700 border-slate-250";
      case "Reserved": return "bg-blue-50 text-blue-800 border-blue-200";
      case "Notice Given": return "bg-amber-50 text-amber-850 border-amber-250";
      case "Under Maintenance": return "bg-rose-50 text-rose-800 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Properties, Blocks & Units</h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Hierarchical multi-tenant portfolio structure isolated for <span className="font-bold text-primary">Amani Property Group Ltd</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowAddPropModal(true)} className="px-5 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            <Building className="w-4.5 h-4.5" /> Add Property
          </button>
          <button onClick={() => setShowAddBlockModal(true)} className="px-5 py-3 border border-primary text-primary hover:bg-primary/5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95">
            <Layers className="w-4.5 h-4.5" /> Add Block
          </button>
        </div>
      </section>

      {/* Main split viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Property List */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider">Properties Directory</h3>
              <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{properties.length} Portfolios</span>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <Building className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-2" />
                <p className="text-xs font-bold font-mono">No properties drafted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map(prop => {
                  const isActive = prop.id === selectedPropId;
                  const propUnits = units.filter(u => u.property_id === prop.id);
                  const propOccupied = propUnits.filter(u => u.status === "Occupied").length;
                  const occupancy = propUnits.length > 0 ? Math.round((propOccupied / propUnits.length) * 100) : 0;

                  return (
                    <div key={prop.id} onClick={() => { setSelectedPropId(prop.id); setFilterStatus("All"); setSelectedBlockId("All"); }}
                      className={`group cursor-pointer p-4 rounded-xl transition-all border-2 ${isActive ? "bg-primary/5 border-primary shadow-xs" : "bg-white hover:bg-slate-50 border-outline-variant hover:border-primary/20"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-on-surface-variant"}`}>
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-on-surface">{prop.name}</h4>
                            <p className="text-xs font-mono font-medium text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-primary" />{prop.location}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isActive ? "text-primary translate-x-1" : "text-on-surface-variant opacity-40 group-hover:opacity-100"}`} />
                      </div>
                      <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-outline-variant/60 pt-2.5 text-xs">
                        <div>
                          <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Units</p>
                          <p className="font-bold text-on-surface mt-0.5">{propUnits.length} registered</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Occupancy</p>
                          <p className="font-bold text-on-surface mt-0.5">{propUnits.length > 0 ? `${occupancy}%` : "No units"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security info */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold font-mono text-slate-700">
              <Lock className="w-4 h-4 text-primary" /> SaaS RENT RECONCILIATION V1
            </div>
            <p className="text-slate-600 leading-relaxed font-mono text-[10px]">
              Mutations and additions directly commit ledger offsets to safe African tenant scopes. Caretaker access roles mask financial payouts.
            </p>
          </div>
        </aside>

        {/* Main Content: Units */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                  {currentProp?.name || "Select a property"}
                </span>
                <h3 className="font-extrabold text-lg tracking-tight text-on-surface mt-1">Active Rental Units Space</h3>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  Showing {filteredUnits.length} of {currentUnits.length} total units configured under this asset.
                </p>
              </div>
              <button onClick={() => {
                if (currentPropBlocks.length > 0) setParentBlockId(currentPropBlocks[0].id);
                else setParentBlockId("None");
                setShowAddUnitModal(true);
              }} className="px-4 py-2 bg-primary text-white hover:bg-primary-hover rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs">
                <Plus className="w-4 h-4" /> Add Unit
              </button>
            </div>

            {/* Block Filter */}
            {currentPropBlocks.length > 0 && (
              <div className="px-6 py-3 border-b border-outline-variant bg-slate-50 flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Property Block Filter:
                </span>
                <button onClick={() => setSelectedBlockId("All")}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${selectedBlockId === "All" ? "bg-white border-primary text-primary shadow-xs" : "bg-transparent border-transparent text-on-surface-variant hover:text-primary"}`}>
                  All Blocks
                </button>
                {currentPropBlocks.map(block => {
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <div key={block.id} className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded text-xs font-bold border transition-all ${isSelected ? "bg-white border-primary text-primary shadow-xs" : "bg-transparent border-transparent text-on-surface-variant hover:text-primary hover:bg-slate-100/50"}`}>
                      <button onClick={() => setSelectedBlockId(block.id)} className="focus:outline-none">{block.name}</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id, block.name); }}
                        className={`p-0.5 rounded-md transition-colors ${isSelected ? "text-red-500 hover:bg-red-50" : "text-on-surface-variant/40 hover:text-red-500 hover:bg-slate-200"}`}
                        title={`Delete block "${block.name}"`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <button onClick={() => setSelectedBlockId("None")}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${selectedBlockId === "None" ? "bg-white border-primary text-primary shadow-xs" : "bg-transparent border-transparent text-on-surface-variant hover:text-primary"}`}>
                  No Block Area
                </button>
              </div>
            )}

            {/* Status Filter */}
            <div className="px-6 py-3 border-b border-outline-variant flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">Unit Status:</span>
              {(["All", "Vacant", "Reserved", "Occupied", "Notice Given", "Under Maintenance"] as const).map(status => (
                <button key={status} onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${filterStatus === status ? "bg-primary text-white border-primary shadow-xs" : "bg-white border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary"}`}>
                  {status}
                </button>
              ))}
            </div>

            {/* Units Table */}
            <div className="overflow-x-auto">
              {filteredUnits.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant">
                  <Building className="w-12 h-12 mx-auto stroke-1 opacity-30 mb-3" />
                  <p className="text-sm font-bold text-on-surface">No units configured in this filter set.</p>
                  <p className="text-xs text-on-surface-variant mt-1">Change block criteria or add a unit to get started.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-outline-variant">
                      <th className="px-6 py-3 text-xs font-bold font-mono text-on-surface-variant uppercase">Unit Code</th>
                      <th className="px-6 py-3 text-xs font-bold font-mono text-on-surface-variant uppercase">Block Designation</th>
                      <th className="px-6 py-3 text-xs font-bold font-mono text-on-surface-variant uppercase">Lease Status</th>
                      <th className="px-6 py-3 text-xs font-bold font-mono text-on-surface-variant uppercase text-right">Monthly Rent</th>
                      <th className="px-6 py-3 text-xs font-bold font-mono text-on-surface-variant uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {filteredUnits.map(unit => {
                      const associatedBlock = blocks.find(b => b.id === unit.block_id);
                      return (
                        <tr key={unit.id} className="hover:bg-primary/[0.02] transition-colors">
                          <td className="px-6 py-4 font-bold text-sm text-on-surface">
                            <div className="flex items-center gap-2"><Building className="w-4 h-4 text-primary shrink-0" /><span>{unit.unit_code}</span></div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono font-medium text-on-surface-variant">
                            {associatedBlock ? (
                              <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{associatedBlock.name}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">No Block Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <select value={unit.status} onChange={e => handleUpdateUnitStatus(unit.id, e.target.value as Unit["status"])}
                              className={`px-2.5 py-1 border text-xs font-bold font-mono rounded-full focus:outline-none focus:ring-1 focus:ring-primary ${getStatusColor(unit.status)}`}>
                              <option value="Vacant">Vacant</option>
                              <option value="Reserved">Reserved</option>
                              <option value="Occupied">Occupied</option>
                              <option value="Notice Given">Notice Given</option>
                              <option value="Under Maintenance">Under Maint.</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-sm text-on-surface text-right">KSh {unit.rent_amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleDeleteUnit(unit.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-650 hover:bg-red-50 transition-colors" title="Remove Unit">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Add Property Modal */}
      {showAddPropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddPropModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-extrabold text-primary">Add New Property</h3>
              <button onClick={() => setShowAddPropModal(false)}><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <form onSubmit={handleAddProp} className="space-y-4">
              <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Property Name</label>
                <input type="text" required placeholder="e.g. Greenwood Apartments Phase II" value={propName} onChange={e => setPropName(e.target.value)} className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background-custom" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Location</label>
                  <select value={propLoc} onChange={e => setPropLoc(e.target.value)} className="w-full px-3 py-2.5 border border-outline-variant rounded-xl text-sm bg-background-custom">
                    <option value="Nairobi, Westlands">Nairobi, Westlands</option>
                    <option value="Nairobi, Kilimani">Nairobi, Kilimani</option>
                    <option value="Nairobi, Karen">Nairobi, Karen</option>
                    <option value="Mombasa, Nyali">Mombasa, Nyali</option>
                  </select></div>
              </div>
              <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Description</label>
                <textarea value={propDesc} onChange={e => setPropDesc(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background-custom" /></div>
              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm">Create Property</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddBlockModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-extrabold text-primary">Add New Block</h3>
              <button onClick={() => setShowAddBlockModal(false)}><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <form onSubmit={handleAddBlock} className="space-y-4">
              <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Block Name</label>
                <input type="text" required placeholder="e.g. Block C" value={blockName} onChange={e => setBlockName(e.target.value)} className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div>
              <p className="text-[10px] text-zinc-400 font-mono">Adding block to: <strong>{currentProp?.name}</strong></p>
              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm">Create Block</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddUnitModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <h3 className="text-base font-extrabold text-primary">Add New Unit</h3>
              <button onClick={() => setShowAddUnitModal(false)}><X className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
            <form onSubmit={handleAddUnit} className="space-y-4">
              <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Unit Code</label>
                <input type="text" required placeholder="e.g. Unit C01" value={unitCode} onChange={e => setUnitCode(e.target.value)} className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div>
              <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Block Assignment</label>
                <select value={parentBlockId} onChange={e => setParentBlockId(e.target.value)} className="w-full px-3 py-2.5 border border-outline-variant rounded-xl text-sm">
                  <option value="None">No Block</option>
                  {currentPropBlocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Monthly Rent (KSh)</label>
                  <input type="number" value={unitRent} onChange={e => setUnitRent(e.target.value)} className="w-full px-3.5 py-2.5 border border-outline-variant rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" /></div>
                <div><label className="block text-xs font-bold font-mono text-on-surface mb-1.5 uppercase">Status</label>
                  <select value={unitStatus} onChange={e => setUnitStatus(e.target.value as Unit["status"])} className="w-full px-3 py-2.5 border border-outline-variant rounded-xl text-sm">
                    <option value="Vacant">Vacant</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Notice Given">Notice Given</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select></div>
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm">Create Unit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
