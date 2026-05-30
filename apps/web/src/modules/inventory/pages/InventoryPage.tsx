import { useState, useEffect, useCallback, FormEvent } from 'react';
import api from '@/shared/api/client';

interface Unit {
  _id: string;
  floor: number;
  unitNumber: string;
  type: string;
  status: 'available' | 'soft_locked' | 'sold' | 'blocked' | 'under_maintenance';
  currentPrice: number;
  facing: string;
  lockedBy?: string;
  lockExpiresAt?: string;
  carpetArea: number;
  superBuiltupArea: number;
}

interface Project {
  _id: string;
  name: string;
  location: { city: string };
  totalUnits: number;
}

interface Block {
  _id: string;
  name: string;
  totalFloors: number;
  unitsPerFloor: number;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  available: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  soft_locked: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  sold: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
  blocked: { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' },
  under_maintenance: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
};

function formatPrice(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function InventoryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [stackingPlan, setStackingPlan] = useState<Record<number, Unit[]>>({});
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ available: 0, locked: 0, sold: 0, maintenance: 0, total: 0 });
  const [showAddProject, setShowAddProject] = useState(false);
  const [addingProject, setAddingProject] = useState(false);

  const fetchProjects = () => {
    api.get('/inventory/projects').then(({ data }) => {
      setProjects(data.data || []);
      if (data.data?.length > 0 && !selectedProject) setSelectedProject(data.data[0]._id);
    }).catch(() => {});
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch blocks when project changes
  useEffect(() => {
    if (!selectedProject) return;
    api.get(`/inventory/blocks?projectId=${selectedProject}`).then(({ data }) => {
      setBlocks(data.data || []);
      if (data.data?.length > 0) setSelectedBlock(data.data[0]._id);
    }).catch(() => {});
  }, [selectedProject]);

  // Fetch stacking plan when block changes
  const fetchStackingPlan = useCallback(async () => {
    if (!selectedProject || !selectedBlock) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory/units/stacking-plan?projectId=${selectedProject}&blockId=${selectedBlock}`);
      const plan = data.data || {};
      setStackingPlan(plan);

      // Calculate stats
      const allUnits = Object.values(plan).flat() as Unit[];
      setStats({
        available: allUnits.filter((u) => u.status === 'available').length,
        locked: allUnits.filter((u) => u.status === 'soft_locked').length,
        sold: allUnits.filter((u) => u.status === 'sold').length,
        maintenance: allUnits.filter((u) => u.status === 'under_maintenance').length,
        total: allUnits.length,
      });
    } catch {
      setStackingPlan({});
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedBlock]);

  useEffect(() => {
    fetchStackingPlan();
  }, [fetchStackingPlan]);

  const handleLockUnit = async (unitId: string) => {
    try {
      await api.post(`/inventory/units/${unitId}/lock`, { userId: 'current-user', durationMinutes: 20 });
      fetchStackingPlan();
      setSelectedUnit(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to lock unit');
    }
  };

  const handleUnlockUnit = async (unitId: string) => {
    try {
      await api.post(`/inventory/units/${unitId}/unlock`, { userId: 'current-user' });
      fetchStackingPlan();
      setSelectedUnit(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock unit');
    }
  };

  const floors = Object.keys(stackingPlan).map(Number).sort((a, b) => b - a);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <button onClick={() => setShowAddProject(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
          + Add Project
        </button>
      </div>

      {/* Project & Block Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name} - {p.location.city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Block / Tower</label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm min-w-[150px]"
            >
              {blocks.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-3">
          <p className="text-xs text-gray-500">Total Units</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-3">
          <p className="text-xs text-green-600 font-medium">Available</p>
          <p className="text-xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-sm p-3">
          <p className="text-xs text-yellow-600 font-medium">Soft Locked</p>
          <p className="text-xl font-bold text-yellow-700">{stats.locked}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-sm p-3">
          <p className="text-xs text-red-600 font-medium">Sold</p>
          <p className="text-xl font-bold text-red-700">{stats.sold}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow-sm p-3">
          <p className="text-xs text-orange-600 font-medium">Under Maintenance</p>
          <p className="text-xl font-bold text-orange-700">{stats.maintenance}</p>
        </div>
      </div>

      {/* Stacking Plan Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Stacking Plan</h2>
          <div className="flex gap-2 text-xs">
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <span key={status} className={`px-2 py-1 rounded ${colors.bg} ${colors.text} capitalize`}>
                {status.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading stacking plan...</div>
        ) : floors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium mb-2">No Data</p>
            <p>Select a project and block, or run seed scripts to populate data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-16">Floor</th>
                  {stackingPlan[floors[0]]?.map((_, i) => (
                    <th key={i} className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                      Unit {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {floors.map((floor) => (
                  <tr key={floor} className="border-t border-gray-100">
                    <td className="px-2 py-1 text-sm font-medium text-gray-600">{floor}F</td>
                    {stackingPlan[floor]?.map((unit) => {
                      const colors = STATUS_COLORS[unit.status] || STATUS_COLORS.available;
                      return (
                        <td key={unit._id} className="px-1 py-1">
                          <button
                            onClick={() => setSelectedUnit(unit)}
                            className={`w-full p-2 rounded-md border ${colors.bg} ${colors.border} hover:opacity-80 transition-opacity text-left`}
                          >
                            <div className={`text-xs font-semibold ${colors.text}`}>{unit.unitNumber}</div>
                            <div className="text-[10px] text-gray-600">{unit.type}</div>
                            <div className="text-[10px] font-medium text-gray-700">{formatPrice(unit.currentPrice)}</div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unit Detail Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUnit(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedUnit.unitNumber}</h3>
                <p className="text-sm text-gray-500">{selectedUnit.type} • {selectedUnit.facing.replace('_', ' ')}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_COLORS[selectedUnit.status]?.bg} ${STATUS_COLORS[selectedUnit.status]?.text}`}>
                {selectedUnit.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Floor</p>
                <p className="font-medium">{selectedUnit.floor}</p>
              </div>
              <div>
                <p className="text-gray-500">Carpet Area</p>
                <p className="font-medium">{selectedUnit.carpetArea} sqft</p>
              </div>
              <div>
                <p className="text-gray-500">Super Built-up</p>
                <p className="font-medium">{selectedUnit.superBuiltupArea} sqft</p>
              </div>
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-bold text-primary-600">{formatPrice(selectedUnit.currentPrice)}</p>
              </div>
            </div>

            {selectedUnit.lockedBy && (
              <div className="mb-4 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                Locked by: {selectedUnit.lockedBy}
                {selectedUnit.lockExpiresAt && (
                  <span> • Expires: {new Date(selectedUnit.lockExpiresAt).toLocaleTimeString()}</span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {selectedUnit.status === 'available' && (
                <button
                  onClick={() => handleLockUnit(selectedUnit._id)}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
                >
                  Lock Unit (20 min)
                </button>
              )}
              {selectedUnit.status === 'soft_locked' && (
                <button
                  onClick={() => handleUnlockUnit(selectedUnit._id)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                >
                  Release Lock
                </button>
              )}
              <button
                onClick={() => setSelectedUnit(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddProject(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Project</h3>
            <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setAddingProject(true);
              const form = e.currentTarget;
              const formData = new FormData(form);
              try {
                await api.post('/inventory/projects', {
                  name: formData.get('name'),
                  location: {
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    pincode: formData.get('pincode'),
                  },
                  totalUnits: Number(formData.get('totalUnits')),
                  reraNumber: formData.get('reraNumber'),
                  status: formData.get('status'),
                  startDate: formData.get('startDate'),
                  expectedCompletion: formData.get('expectedCompletion'),
                  description: formData.get('description'),
                });
                setShowAddProject(false);
                fetchProjects();
              } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to create project');
              } finally {
                setAddingProject(false);
              }
            }}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. Sunrise Heights" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RERA Number *</label>
                  <input name="reraNumber" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. RERA/2024/001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input name="address" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Street address" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input name="city" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input name="state" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input name="pincode" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="560001" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Units *</label>
                    <input name="totalUnits" type="number" min="1" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input name="startDate" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion *</label>
                    <input name="expectedCompletion" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Brief project description" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button type="submit" disabled={addingProject} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  {addingProject ? 'Creating...' : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowAddProject(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
