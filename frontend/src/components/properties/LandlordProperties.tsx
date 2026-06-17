"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Property, Unit, Block } from "@/types";

type UnitStatus = Unit["status"];

const UNIT_STATUSES: UnitStatus[] = [
  "Vacant",
  "Reserved",
  "Occupied",
  "Notice Given",
  "Under Maintenance",
];

const STATUS_BADGE: Record<UnitStatus, string> = {
  Vacant: "bg-emerald-50 text-emerald-700",
  Reserved: "bg-blue-50 text-blue-700",
  Occupied: "bg-primary/10 text-primary",
  "Notice Given": "bg-amber-50 text-amber-700",
  "Under Maintenance": "bg-red-50 text-red-700",
};

const KENYA_LOCATIONS = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Nyeri",
  "Machakos",
  "Kisii",
  "Malindi",
  "Kitale",
  "Garissa",
  "Kakamega",
  "Naivasha",
  "Nanyuki",
];

function StatusBadge({ status }: { status: UnitStatus }) {
  return (
    <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold tracking-tight text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LandlordProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | UnitStatus>("All");

  // Modals
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Property form
  const [propName, setPropName] = useState("");
  const [propLocation, setPropLocation] = useState(KENYA_LOCATIONS[0]);
  const [propDescription, setPropDescription] = useState("");
  const [propSubmitting, setPropSubmitting] = useState(false);

  // Unit form
  const [unitCode, setUnitCode] = useState("");
  const [unitRent, setUnitRent] = useState("");
  const [unitBlockId, setUnitBlockId] = useState("");
  const [unitStatus, setUnitStatus] = useState<UnitStatus>("Vacant");
  const [unitSubmitting, setUnitSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch user role for rent masking
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserRole(parsed.role || null);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  const isCaretaker = userRole === "caretaker";

  // Fetch properties on mount
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/properties");
      setProperties(data);
      if (data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setError("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }, [selectedProperty]);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch units and blocks when property selected
  useEffect(() => {
    if (!selectedProperty) return;
    const prop = selectedProperty;

    async function fetchPropertyData() {
      setUnitsLoading(true);
      try {
        const [unitsRes, blocksRes] = await Promise.all([
          api.get("/units", { params: { property_id: prop.id } }),
          api.get("/blocks", { params: { property_id: prop.id } }).catch(() => ({ data: [] })),
        ]);
        setUnits(unitsRes.data);
        setBlocks(blocksRes.data);
      } catch (err) {
        console.error("Failed to fetch property data:", err);
      } finally {
        setUnitsLoading(false);
      }
    }
    fetchPropertyData();
  }, [selectedProperty]);

  const filteredUnits =
    statusFilter === "All" ? units : units.filter((u) => u.status === statusFilter);

  const handleAddProperty = async () => {
    if (!propName.trim()) return;
    setPropSubmitting(true);
    try {
      const { data } = await api.post("/properties", {
        name: propName.trim(),
        location: propLocation,
        description: propDescription.trim() || undefined,
      });
      setProperties((prev) => [...prev, data]);
      setSelectedProperty(data);
      setShowPropertyModal(false);
      setPropName("");
      setPropLocation(KENYA_LOCATIONS[0]);
      setPropDescription("");
    } catch (err) {
      console.error("Failed to create property:", err);
      setError("Failed to create property.");
    } finally {
      setPropSubmitting(false);
    }
  };

  const handleAddUnit = async () => {
    if (!unitCode.trim() || !unitRent || !selectedProperty) return;
    setUnitSubmitting(true);
    try {
      const { data } = await api.post("/units", {
        property_id: selectedProperty.id,
        block_id: unitBlockId || null,
        unit_code: unitCode.trim(),
        rent_amount: parseFloat(unitRent),
        status: unitStatus,
      });
      setUnits((prev) => [...prev, data]);
      setShowUnitModal(false);
      setUnitCode("");
      setUnitRent("");
      setUnitBlockId("");
      setUnitStatus("Vacant");
    } catch (err) {
      console.error("Failed to create unit:", err);
      setError("Failed to create unit.");
    } finally {
      setUnitSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      await api.delete(`/units/${unitId}`);
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete unit:", err);
      setError("Failed to delete unit.");
    }
  };

  const handleStatusChange = async (unitId: string, newStatus: UnitStatus) => {
    try {
      await api.patch(`/units/${unitId}/status`, { status: newStatus });
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error("Failed to update unit status:", err);
      setError("Failed to update unit status.");
    }
  };

  const getBlockName = (blockId: string | null) => {
    if (!blockId) return "—";
    const block = blocks.find((b) => b.id === blockId);
    return block ? block.name : "—";
  };

  const formatRent = (amount: number) => {
    if (isCaretaker) return "****";
    return `KSh ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Properties, Blocks & Units
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Hierarchical multi-tenant portfolio structure.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPropertyModal(true)}
            className="px-5 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
            </svg>
            Add Property
          </button>
          {selectedProperty && (
            <button
              onClick={() => setShowUnitModal(true)}
              className="px-5 py-3 bg-white border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Unit
            </button>
          )}
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar — Properties List */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider">
                Properties Directory
              </h3>
              <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {properties.length}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-xs font-bold font-mono text-on-surface-variant">
                  Loading properties...
                </p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <svg
                  className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
                </svg>
                <p className="text-xs font-bold font-mono">No properties yet.</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Click "Add Property" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedProperty?.id === prop.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-outline-variant hover:border-primary/40 hover:bg-surface-container/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-on-surface tracking-tight">
                          {prop.name}
                        </h4>
                        <p className="text-xs font-semibold text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {prop.location}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full shrink-0 ${
                          prop.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                    {prop.description && (
                      <p className="text-xs text-on-surface-variant mt-2 line-clamp-1">
                        {prop.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main — Units Table */}
        <section className="lg:col-span-8 space-y-6">
          {!selectedProperty ? (
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-12 text-center text-on-surface-variant">
              <svg
                className="w-12 h-12 mx-auto stroke-1 opacity-30 mb-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" />
              </svg>
              <p className="text-sm font-bold text-on-surface">
                Select a property to view units.
              </p>
            </div>
          ) : (
            <>
              {/* Property header card */}
              <div className="flat-card rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-on-surface tracking-tight">
                      {selectedProperty.name}
                    </h3>
                    <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {selectedProperty.location}
                    </p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div className="bg-surface-container/60 rounded-xl px-4 py-2">
                      <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                        Total Units
                      </p>
                      <p className="text-lg font-extrabold text-on-surface">{units.length}</p>
                    </div>
                    <div className="bg-surface-container/60 rounded-xl px-4 py-2">
                      <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                        Vacant
                      </p>
                      <p className="text-lg font-extrabold text-emerald-600">
                        {units.filter((u) => u.status === "Vacant").length}
                      </p>
                    </div>
                    <div className="bg-surface-container/60 rounded-xl px-4 py-2">
                      <p className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                        Occupied
                      </p>
                      <p className="text-lg font-extrabold text-primary">
                        {units.filter((u) => u.status === "Occupied").length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status filter buttons */}
              <div className="flex flex-wrap gap-2">
                {(["All", ...UNIT_STATUSES] as const).map((status) => {
                  const count =
                    status === "All"
                      ? units.length
                      : units.filter((u) => u.status === status).length;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 ${
                        statusFilter === status
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white border border-outline-variant text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                      }`}
                    >
                      {status}
                      <span className="ml-1.5 opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Units table */}
              <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                {unitsLoading ? (
                  <div className="p-12 text-center">
                    <p className="text-sm font-bold font-mono text-on-surface-variant">
                      Loading units...
                    </p>
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant">
                    <svg
                      className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                    <p className="text-sm font-bold">
                      {statusFilter === "All"
                        ? "No units yet."
                        : `No ${statusFilter.toLowerCase()} units.`}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {statusFilter === "All"
                        ? 'Click "Add Unit" to create one.'
                        : "Try a different filter."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-outline-variant">
                          <th className="px-5 py-3.5 text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                            Unit Code
                          </th>
                          <th className="px-5 py-3.5 text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                            Block
                          </th>
                          <th className="px-5 py-3.5 text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                            Status
                          </th>
                          <th className="px-5 py-3.5 text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant">
                            Rent
                          </th>
                          <th className="px-5 py-3.5 text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnits.map((unit) => (
                          <tr
                            key={unit.id}
                            className="border-b border-outline-variant/50 hover:bg-surface-container/30 transition-colors"
                          >
                            <td className="px-5 py-4">
                              <span className="text-sm font-extrabold font-mono text-on-surface">
                                {unit.unit_code}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-semibold text-on-surface-variant">
                                {getBlockName(unit.block_id)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={unit.status} />
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-bold font-mono text-on-surface">
                                {formatRent(unit.rent_amount)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Status quick-change dropdown */}
                                <select
                                  value={unit.status}
                                  onChange={(e) =>
                                    handleStatusChange(unit.id, e.target.value as UnitStatus)
                                  }
                                  className="text-xs font-bold font-mono px-2 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface-variant hover:border-primary/40 focus:outline-none focus:border-primary cursor-pointer"
                                >
                                  {UNIT_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>

                                {/* Delete button */}
                                {deleteConfirm === unit.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDeleteUnit(unit.id)}
                                      className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-2.5 py-1.5 bg-surface-container text-on-surface-variant text-xs font-bold rounded-lg hover:bg-surface-container/80 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(unit.id)}
                                    className="p-2 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete unit"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add Property Modal */}
      <Modal
        open={showPropertyModal}
        onClose={() => {
          setShowPropertyModal(false);
          setPropName("");
          setPropLocation(KENYA_LOCATIONS[0]);
          setPropDescription("");
        }}
        title="Add New Property"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Property Name *
            </label>
            <input
              type="text"
              value={propName}
              onChange={(e) => setPropName(e.target.value)}
              placeholder="e.g. Sunrise Apartments"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Location
            </label>
            <select
              value={propLocation}
              onChange={(e) => setPropLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {KENYA_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Description
            </label>
            <textarea
              value={propDescription}
              onChange={(e) => setPropDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowPropertyModal(false);
                setPropName("");
                setPropLocation(KENYA_LOCATIONS[0]);
                setPropDescription("");
              }}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProperty}
              disabled={propSubmitting || !propName.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {propSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Property"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Unit Modal */}
      <Modal
        open={showUnitModal}
        onClose={() => {
          setShowUnitModal(false);
          setUnitCode("");
          setUnitRent("");
          setUnitBlockId("");
          setUnitStatus("Vacant");
        }}
        title={`Add Unit — ${selectedProperty?.name ?? ""}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Unit Code *
            </label>
            <input
              type="text"
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value)}
              placeholder="e.g. A101"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                Rent Amount (KSh) *
              </label>
              <input
                type="number"
                value={unitRent}
                onChange={(e) => setUnitRent(e.target.value)}
                placeholder="e.g. 25000"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
                Status
              </label>
              <select
                value={unitStatus}
                onChange={(e) => setUnitStatus(e.target.value as UnitStatus)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {UNIT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Block
            </label>
            <select
              value={unitBlockId}
              onChange={(e) => setUnitBlockId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">No block</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowUnitModal(false);
                setUnitCode("");
                setUnitRent("");
                setUnitBlockId("");
                setUnitStatus("Vacant");
              }}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUnit}
              disabled={unitSubmitting || !unitCode.trim() || !unitRent}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {unitSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Unit"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
