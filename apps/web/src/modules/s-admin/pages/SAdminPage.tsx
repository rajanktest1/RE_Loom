import { useEffect, useState, FormEvent } from 'react';
import api from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Navigate } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  location: { address: string; city: string; state: string; pincode: string };
  totalUnits: number;
  reraNumber: string;
  status: string;
  startDate: string;
  expectedCompletion: string;
  description?: string;
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
};

export function SAdminPage() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

  // Guard: only super_admin
  if (user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchProjects = () => {
    setLoading(true);
    api.get('/inventory/projects')
      .then(({ data }) => setProjects(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProject) return;
    setSaving(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await api.put(`/inventory/projects/${editingProject._id}`, {
        name: fd.get('name'),
        location: {
          address: fd.get('address'),
          city: fd.get('city'),
          state: fd.get('state'),
          pincode: fd.get('pincode'),
        },
        totalUnits: Number(fd.get('totalUnits')),
        reraNumber: fd.get('reraNumber'),
        status: fd.get('status'),
        startDate: fd.get('startDate'),
        expectedCompletion: fd.get('expectedCompletion'),
        description: fd.get('description'),
      });
      setEditingProject(null);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const toDateInput = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">S-ADMIN Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Super Admin — Edit project details</p>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase">
          Super Admin Only
        </span>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">All Projects ({projects.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No projects found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RERA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.location.city}, {project.location.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{project.reraNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.totalUnits}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800'}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setEditingProject(project)}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingProject(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Project</h3>
            <p className="text-sm text-gray-500 mb-4">Editing: {editingProject.name}</p>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input name="name" required defaultValue={editingProject.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RERA Number *</label>
                  <input name="reraNumber" required defaultValue={editingProject.reraNumber} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input name="address" required defaultValue={editingProject.location.address} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input name="city" required defaultValue={editingProject.location.city} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input name="state" required defaultValue={editingProject.location.state} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input name="pincode" required defaultValue={editingProject.location.pincode} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Units *</label>
                    <input name="totalUnits" type="number" min="1" required defaultValue={editingProject.totalUnits} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" defaultValue={editingProject.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input name="startDate" type="date" required defaultValue={toDateInput(editingProject.startDate)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion *</label>
                    <input name="expectedCompletion" type="date" required defaultValue={toDateInput(editingProject.expectedCompletion)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows={2} defaultValue={editingProject.description || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
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
