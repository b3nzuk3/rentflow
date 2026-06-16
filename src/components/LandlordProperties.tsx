/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Building,
  Plus,
  MapPin,
  TrendingUp,
  ChevronRight,
  Filter,
  Eye,
  Trash2,
  Check,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Mail,
  Smartphone,
  Lock,
  Layers,
  Wrench,
  AlertOctagon,
  Tag
} from "lucide-react";
import { Property, Block, Unit, User, Organization } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LandlordPropertiesProps {
  currentUser: User;
  organization: Organization;
  properties: Property[];
  blocks: Block[];
  units: Unit[];
  onAddProperty: (name: string, location: string, description: string) => void;
  onAddBlock: (propertyId: string, name: string) => void;
  onAddUnit: (
    propertyId: string,
    blockId: string | null,
    unitCode: string,
    rentAmount: number,
    status: "Vacant" | "Reserved" | "Occupied" | "Notice Given" | "Under Maintenance"
  ) => void;
  onDeleteUnit: (unitId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdateUnitStatus: (
    unitId: string,
    status: "Vacant" | "Reserved" | "Occupied" | "Notice Given" | "Under Maintenance"
  ) => void;
  showInviteModalGlobal?: () => void;
}

export const LandlordProperties: React.FC<LandlordPropertiesProps> = ({
  currentUser,
  organization,
  properties,
  blocks,
  units,
  onAddProperty,
  onAddBlock,
  onAddUnit,
  onDeleteUnit,
  onDeleteBlock,
  onUpdateUnitStatus,
  showInviteModalGlobal,
}) => {
  // Navigation & selection
  const orgProperties = properties.filter(p => p.organizationId === organization.id);
  const [selectedPropId, setSelectedPropId] = useState<string>(() => {
    return orgProperties[0]?.id || "greenwood";
  });

  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("All");

  // Modals state
  const [showAddPropModal, setShowAddPropModal] = useState(false);
  const [propName, setPropName] = useState("");
  const [propLoc, setPropLoc] = useState("Nairobi, Westlands");
  const [propDesc, setPropDesc] = useState("");

  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [blockName, setBlockName] = useState("");

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [unitCode, setUnitCode] = useState("");
  const [unitRent, setUnitRent] = useState("35000");
  const [unitStatus, setUnitStatus] = useState<Unit["status"]>("Vacant");
  const [parentBlockId, setParentBlockId] = useState<string>("");

  // Role permissions checks (RBAC)
  const isCaretaker = currentUser.role === "caretaker";
  const isAccountant = currentUser.role === "accountant";
  const cannotModifyStructure = isCaretaker || isAccountant;
  const cannotViewFinancials = isCaretaker;

  // Form Submissions
  const handleAddProp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim()) return;
    onAddProperty(propName, propLoc, propDesc || `Isolated portfolio property in ${propLoc}`);
    setPropName("");
    setPropDesc("");
    setShowAddPropModal(false);
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName.trim()) return;
    onAddBlock(selectedPropId, blockName);
    setBlockName("");
    setShowAddBlockModal(false);
  };

  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim()) return;
    onAddUnit(
      selectedPropId,
      parentBlockId === "None" || !parentBlockId ? null : parentBlockId,
      unitCode,
      parseInt(unitRent) || 30000,
      unitStatus
    );
    setUnitCode("");
    setShowAddUnitModal(false);
  };

  // Safe Accessors
  const currentPropObj = properties.find(p => p.id === selectedPropId);
  const currentPropBlocks = blocks.filter(b => b.propertyId === selectedPropId);
  
  // Filter Units by Active property, Selected status, and Selected block
  const currentUnits = units.filter(u => u.propertyId === selectedPropId && u.organizationId === organization.id);
  
  const filteredUnits = currentUnits.filter(u => {
    const passStatus = filterStatus === "All" || u.status === filterStatus;
    const passBlock = selectedBlockId === "All" || u.blockId === selectedBlockId || (selectedBlockId === "None" && !u.blockId);
    return passStatus && passBlock;
  });

  const getStatusColor = (status: Unit["status"]) => {
    switch (status) {
      case "Occupied":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Vacant":
        return "bg-slate-50 text-slate-700 border-slate-250";
      case "Reserved":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Notice Given":
        return "bg-amber-50 text-amber-850 border-amber-250";
      case "Under Maintenance":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Actions */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Properties, Blocks & Units</h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Hierarchical multi-tenant portfolio structure isolated for <span className="font-bold text-primary">{organization.name}</span>.
          </p>
        </div>
        {!cannotModifyStructure && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddPropModal(true)}
              className="px-5 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Building className="w-4.5 h-4.5" />
              Add Property
            </button>
            <button
              onClick={() => setShowAddBlockModal(true)}
              className="px-5 py-3 border border-primary text-primary hover:bg-primary/5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Layers className="w-4.5 h-4.5" />
              Add Block
            </button>
          </div>
        )}
      </section>

      {/* Main split viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Selector: Property Asset List */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider">Properties Directory</h3>
              <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {orgProperties.length} Portfolios
              </span>
            </div>

            {orgProperties.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <Building className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-2" />
                <p className="text-xs font-bold font-mono">No properties drafted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orgProperties.map(item => {
                  const isActive = item.id === selectedPropId;
                  const propUnitsCount = units.filter(u => u.propertyId === item.id && u.organizationId === organization.id).length;
                  const propOccupied = units.filter(u => u.propertyId === item.id && u.status === "Occupied").length;
                  const computedOccupancy = propUnitsCount > 0 ? Math.round((propOccupied / propUnitsCount) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedPropId(item.id);
                        setFilterStatus("All");
                        setSelectedBlockId("All");
                      }}
                      className={`group cursor-pointer p-4 rounded-xl transition-all border-2 ${
                        isActive
                          ? "bg-primary/5 border-primary shadow-xs"
                          : "bg-white hover:bg-slate-50 border-outline-variant hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-on-surface-variant"
                            }`}
                          >
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-on-surface">{item.name}</h4>
                            <p className="text-xs font-mono font-medium text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {item.location}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isActive ? "text-primary translate-x-1" : "text-on-surface-variant opacity-40 group-hover:opacity-100"
                          }`}
                        />
                      </div>

                      {/* Info parameters info block */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-outline-variant/60 pt-2.5 text-xs">
                        <div>
                          <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Units</p>
                          <p className="font-bold text-on-surface mt-0.5">{propUnitsCount} registered</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold font-mono text-on-surface-variant uppercase">Occupancy</p>
                          <p className="font-bold text-on-surface mt-0.5">{propUnitsCount > 0 ? `${computedOccupancy}%` : "No units"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secure lock telemetry display */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold font-mono text-slate-700">
              <Lock className="w-4 h-4 text-primary" />
              SaaS RENT RECONCILIATION V1
            </div>
            <p className="text-slate-600 leading-relaxed font-mono text-[10px]">
              Mutations and additions directly commit ledger offsets to safe African tenant scopes. Caretaker access roles mask financial payouts.
            </p>
          </div>
        </aside>

        {/* Main Content Area: Units Grid */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Asset header details */}
            <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                  {currentPropObj?.name || "Greenwood Apartments"}
                </span>
                <h3 className="font-extrabold text-lg tracking-tight text-on-surface mt-1">
                  Active Rental Units Space
                </h3>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  Showing {filteredUnits.length} of {currentUnits.length} total units configured under this asset.
                </p>
              </div>
              {!cannotModifyStructure && (
                <button
                  onClick={() => {
                    // Set default block if any blocks exist
                    if (currentPropBlocks.length > 0) {
                      setParentBlockId(currentPropBlocks[0].id);
                    } else {
                      setParentBlockId("None");
                    }
                    setShowAddUnitModal(true);
                  }}
                  className="px-4 py-2 bg-primary text-white hover:bg-primary-hover rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Add Unit
                </button>
              )}
            </div>

            {/* Hierarchical Block Filter Segment */}
            {currentPropBlocks.length > 0 && (
              <div className="px-6 py-3 border-b border-outline-variant bg-slate-50 flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Property Block Filter:
                </span>
                <button
                  onClick={() => setSelectedBlockId("All")}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    selectedBlockId === "All"
                      ? "bg-white border-primary text-primary shadow-xs"
                      : "bg-transparent border-transparent text-on-surface-variant hover:text-primary"
                  }`}
                >
                  All Blocks
                </button>
                {currentPropBlocks.map(block => {
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <div
                      key={block.id}
                      className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-white border-primary text-primary shadow-xs"
                          : "bg-transparent border-transparent text-on-surface-variant hover:text-primary hover:bg-slate-100/50"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedBlockId(block.id)}
                        className="focus:outline-none"
                      >
                        {block.name}
                      </button>
                      
                      {!cannotModifyStructure && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete block "${block.name}"? Units associated with this block will stay in the portfolio but won't be assigned to any block.`)) {
                              onDeleteBlock(block.id);
                              if (isSelected) {
                                setSelectedBlockId("All");
                              }
                            }
                          }}
                          className={`p-0.5 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? "text-red-500 hover:bg-red-50"
                              : "text-on-surface-variant/40 hover:text-red-500 hover:bg-slate-200"
                          }`}
                          title={`Delete block "${block.name}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setSelectedBlockId("None")}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    selectedBlockId === "None"
                      ? "bg-white border-primary text-primary shadow-xs"
                      : "bg-transparent border-transparent text-on-surface-variant hover:text-primary"
                  }`}
                >
                  No Block Area
                </button>
              </div>
            )}

            {/* General Status Category Filters */}
            <div className="px-6 py-3 border-b border-outline-variant flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
                Unit Status:
              </span>
              {(["All", "Vacant", "Reserved", "Occupied", "Notice Given", "Under Maintenance"] as const).map(roleSt => (
                <button
                  key={roleSt}
                  onClick={() => setFilterStatus(roleSt)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                    filterStatus === roleSt
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-white border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {roleSt}
                </button>
              ))}
            </div>

            {/* Units list container */}
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
                      const associatedBlock = blocks.find(b => b.id === unit.blockId);

                      return (
                        <tr key={unit.id} className="hover:bg-primary/[0.02] transition-colors">
                          {/* Unit Code Info */}
                          <td className="px-6 py-4 font-bold text-sm text-on-surface">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-primary shrink-0" />
                              <span>{unit.unitCode}</span>
                            </div>
                          </td>

                          {/* Block assigned */}
                          <td className="px-6 py-4 text-xs font-mono font-medium text-on-surface-variant">
                            {associatedBlock ? (
                              <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                {associatedBlock.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">No Block Assigned</span>
                            )}
                          </td>

                          {/* Exact status color with easy dropdown for caretakers/managers */}
                          <td className="px-6 py-4">
                            {isCaretaker || !cannotModifyStructure ? (
                              <select
                                value={unit.status}
                                onChange={e => onUpdateUnitStatus(unit.id, e.target.value as Unit["status"])}
                                className={`px-2.5 py-1 border text-xs font-bold font-mono rounded-full focus:outline-none focus:ring-1 focus:ring-primary ${getStatusColor(unit.status)}`}
                              >
                                <option value="Vacant">Vacant</option>
                                <option value="Reserved">Reserved</option>
                                <option value="Occupied">Occupied</option>
                                <option value="Notice Given">Notice Given</option>
                                <option value="Under Maintenance">Under Maint.</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 border rounded-full text-xs font-bold font-mono ${getStatusColor(unit.status)}`}>
                                {unit.status}
                              </span>
                            )}
                          </td>

                          {/* Monthly Rent (Masked for Caretakers) */}
                          <td className="px-6 py-4 font-mono font-bold text-sm text-on-surface text-right">
                            {cannotViewFinancials ? (
                              <span className="text-on-surface-variant/55 italic">KSh ••••••</span>
                            ) : (
                              `KSh ${unit.rentAmount.toLocaleString()}`
                            )}
                          </td>

                          {/* Audit actions */}
                          <td className="px-6 py-4 text-center">
                            {cannotModifyStructure ? (
                              <span className="text-[10px] font-bold font-mono text-on-surface-variant flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" /> Read Only
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => onDeleteUnit(unit.id)}
                                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-650 hover:bg-red-50 transition-colors"
                                  title="Remove Unit"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination footer */}
            <div className="p-4 bg-slate-50 border-t border-outline-variant flex justify-between items-center text-xs font-bold font-mono text-on-surface-variant">
              <span>Showing {filteredUnits.length} of {currentUnits.length} Units configured</span>
              <div className="flex gap-1.5">
                <button disabled className="p-1.5 rounded-lg border border-outline-variant opacity-40">Previous</button>
                <button disabled className="p-1.5 rounded-lg border border-outline-variant opacity-40">Next</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add Property Dialog Modal */}
      <AnimatePresence>
        {showAddPropModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPropModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="font-extrabold text-base text-primary">Provision New Asset</h3>
                <button onClick={() => setShowAddPropModal(false)}>
                  <Plus className="w-5 h-5 rotate-45 text-on-surface-variant" />
                </button>
              </div>
              <form onSubmit={handleAddProp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunset Villas East"
                    value={propName}
                    onChange={e => setPropName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nakuru, Milimani"
                    value={propLoc}
                    onChange={e => setPropLoc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                    Description / Bio
                  </label>
                  <textarea
                    placeholder="e.g. 5 story building with 24 studio units and gated boundary..."
                    value={propDesc}
                    onChange={e => setPropDesc(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-background-custom border border-outline-variant rounded-xl text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Create Isolated Asset
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Block Dialog Modal */}
      <AnimatePresence>
        {showAddBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddBlockModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="font-extrabold text-base text-primary">Add Block Designation</h3>
                <button onClick={() => setShowAddBlockModal(false)}>
                  <Plus className="w-5 h-5 rotate-45 text-on-surface-variant" />
                </button>
              </div>
              <form onSubmit={handleAddBlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                    Block Name / Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block C, West Wing, Floor 1"
                    value={blockName}
                    onChange={e => setBlockName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                  />
                  <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                    Blocks are ideal for grouping multiple multi-story units inside Kenyan apartments.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Confirm Block Allocation
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Unit Dialog Modal */}
      <AnimatePresence>
        {showAddUnitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUnitModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="font-extrabold text-base text-primary">Provision Rental Unit</h3>
                <button onClick={() => setShowAddUnitModal(false)}>
                  <Plus className="w-5 h-5 rotate-45 text-on-surface-variant" />
                </button>
              </div>
              <form onSubmit={handleAddUnitSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                      Unit Code / Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B14, Penthouse 2"
                      value={unitCode}
                      onChange={e => setUnitCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                      Block Selection
                    </label>
                    <select
                      value={parentBlockId}
                      onChange={e => setParentBlockId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                    >
                      <option value="None">None (No Block)</option>
                      {currentPropBlocks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-on-surface mb-1">
                      Rent Amount (KSh/Mo)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 35000"
                      value={unitRent}
                      onChange={e => setUnitRent(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold font-mono uppercase text-on-surface mb-1">
                      Initial Status
                    </label>
                    <select
                      value={unitStatus}
                      onChange={e => setUnitStatus(e.target.value as Unit["status"])}
                      className="w-full px-3 py-2.5 bg-background-custom border border-outline-variant rounded-xl text-sm"
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Notice Given">Notice Given</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Provision Unit Space
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
