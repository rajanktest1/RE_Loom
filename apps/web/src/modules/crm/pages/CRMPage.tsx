import { useEffect, useState, FormEvent } from 'react';
import api from '@/shared/api/client';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  budget?: number;
  interestedProject?: string;
  assignedTo?: string;
  createdAt: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  joinDate: string;
  status: 'active' | 'on_leave' | 'inactive';
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contacted', color: 'bg-indigo-100 text-indigo-800' },
  site_visit: { label: 'Site Visit', color: 'bg-yellow-100 text-yellow-800' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  booked: { label: 'Booked', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800' },
};

const LEAD_SOURCES = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'walk_in', label: 'Walk In' },
  { value: 'broker', label: 'Broker' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'phone_inquiry', label: 'Phone Inquiry' },
  { value: 'email_campaign', label: 'Email Campaign' },
];

const TEAM_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-600',
};

const SALES_TEAM: TeamMember[] = [
  { id: 1, name: 'Priya Sharma', email: 'priya.sharma@reloom.com', phone: '+91 9812345001', designation: 'Sales Manager', department: 'Sales', joinDate: '2022-03-15', status: 'active' },
  { id: 2, name: 'Rahul Verma', email: 'rahul.verma@reloom.com', phone: '+91 9812345002', designation: 'Senior Sales Executive', department: 'Sales', joinDate: '2022-06-01', status: 'active' },
  { id: 3, name: 'Anita Desai', email: 'anita.desai@reloom.com', phone: '+91 9812345003', designation: 'Sales Executive', department: 'Sales', joinDate: '2022-09-10', status: 'active' },
  { id: 4, name: 'Vikram Mehta', email: 'vikram.mehta@reloom.com', phone: '+91 9812345004', designation: 'CRM Specialist', department: 'CRM', joinDate: '2023-01-05', status: 'active' },
  { id: 5, name: 'Neha Kapoor', email: 'neha.kapoor@reloom.com', phone: '+91 9812345005', designation: 'Sales Executive', department: 'Sales', joinDate: '2023-02-20', status: 'active' },
  { id: 6, name: 'Arjun Nair', email: 'arjun.nair@reloom.com', phone: '+91 9812345006', designation: 'Team Lead', department: 'Sales', joinDate: '2021-11-12', status: 'active' },
  { id: 7, name: 'Kavitha Rao', email: 'kavitha.rao@reloom.com', phone: '+91 9812345007', designation: 'Sales Coordinator', department: 'Operations', joinDate: '2023-04-18', status: 'on_leave' },
  { id: 8, name: 'Suresh Iyer', email: 'suresh.iyer@reloom.com', phone: '+91 9812345008', designation: 'Senior CRM Analyst', department: 'CRM', joinDate: '2022-07-22', status: 'active' },
  { id: 9, name: 'Divya Joshi', email: 'divya.joshi@reloom.com', phone: '+91 9812345009', designation: 'Sales Executive', department: 'Sales', joinDate: '2023-05-30', status: 'active' },
  { id: 10, name: 'Manish Gupta', email: 'manish.gupta@reloom.com', phone: '+91 9812345010', designation: 'Channel Partner Manager', department: 'Partnerships', joinDate: '2022-01-10', status: 'active' },
  { id: 11, name: 'Rashmi Pillai', email: 'rashmi.pillai@reloom.com', phone: '+91 9812345011', designation: 'Inside Sales Rep', department: 'Sales', joinDate: '2023-08-14', status: 'active' },
  { id: 12, name: 'Aakash Singh', email: 'aakash.singh@reloom.com', phone: '+91 9812345012', designation: 'Sales Executive', department: 'Sales', joinDate: '2023-09-01', status: 'active' },
  { id: 13, name: 'Pooja Reddy', email: 'pooja.reddy@reloom.com', phone: '+91 9812345013', designation: 'CRM Manager', department: 'CRM', joinDate: '2021-08-25', status: 'active' },
  { id: 14, name: 'Karan Malhotra', email: 'karan.malhotra@reloom.com', phone: '+91 9812345014', designation: 'Sales Trainee', department: 'Sales', joinDate: '2024-01-08', status: 'active' },
  { id: 15, name: 'Shruti Bhat', email: 'shruti.bhat@reloom.com', phone: '+91 9812345015', designation: 'Customer Success Lead', department: 'CRM', joinDate: '2022-10-03', status: 'on_leave' },
  { id: 16, name: 'Deepak Chauhan', email: 'deepak.chauhan@reloom.com', phone: '+91 9812345016', designation: 'Sales Executive', department: 'Sales', joinDate: '2023-11-20', status: 'active' },
  { id: 17, name: 'Meera Patel', email: 'meera.patel@reloom.com', phone: '+91 9812345017', designation: 'Pre-Sales Consultant', department: 'Sales', joinDate: '2023-03-12', status: 'active' },
  { id: 18, name: 'Sanjay Tiwari', email: 'sanjay.tiwari@reloom.com', phone: '+91 9812345018', designation: 'Area Sales Manager', department: 'Sales', joinDate: '2021-05-17', status: 'inactive' },
  { id: 19, name: 'Lakshmi Venkat', email: 'lakshmi.venkat@reloom.com', phone: '+91 9812345019', designation: 'Sales Executive', department: 'Sales', joinDate: '2024-02-01', status: 'active' },
  { id: 20, name: 'Rohan Saxena', email: 'rohan.saxena@reloom.com', phone: '+91 9812345020', designation: 'Digital Sales Specialist', department: 'Marketing', joinDate: '2023-06-25', status: 'active' },
];

export function CRMPage() {
  const [activeTab, setActiveTab] = useState<'team' | 'leads'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLead, setShowAddLead] = useState(false);
  const [addingLead, setAddingLead] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    api.get('/crm/leads').then(({ data }) => {
      setLeads(data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const countByStatus = (status: string) => leads.filter((l) => l.status === status).length;
  const activeTeamCount = SALES_TEAM.filter((m) => m.status === 'active').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CRM & Sales</h1>
        {activeTab === 'leads' && (
          <button onClick={() => setShowAddLead(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            + Add Lead
          </button>
        )}
      </div>

      {/* Two-Card Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setActiveTab('team')}
          className={`p-6 rounded-xl shadow-sm text-left transition-all border-2 ${
            activeTab === 'team'
              ? 'bg-primary-50 border-primary-500 shadow-md'
              : 'bg-white border-transparent hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${activeTab === 'team' ? 'bg-primary-100' : 'bg-gray-100'}`}>
              👥
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${activeTab === 'team' ? 'text-primary-700' : 'text-gray-900'}`}>
                CRM & Sales Team
              </h3>
              <p className="text-sm text-gray-500">{SALES_TEAM.length} members • {activeTeamCount} active</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`p-6 rounded-xl shadow-sm text-left transition-all border-2 ${
            activeTab === 'leads'
              ? 'bg-primary-50 border-primary-500 shadow-md'
              : 'bg-white border-transparent hover:border-gray-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${activeTab === 'leads' ? 'bg-primary-100' : 'bg-gray-100'}`}>
              📋
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${activeTab === 'leads' ? 'text-primary-700' : 'text-gray-900'}`}>
                Leads
              </h3>
              <p className="text-sm text-gray-500">{loading ? '...' : `${leads.length} total leads`}</p>
            </div>
          </div>
        </button>
      </div>

      {/* ===== TEAM VIEW ===== */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Sales Team Members ({SALES_TEAM.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {SALES_TEAM.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{member.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(member.joinDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${TEAM_STATUS_COLORS[member.status]}`}>
                        {member.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== LEADS VIEW ===== */}
      {activeTab === 'leads' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-3">
              <p className="text-xs text-gray-500 font-medium">New Leads</p>
              <p className="text-xl font-bold text-blue-700 mt-0.5">{loading ? '...' : countByStatus('new') + countByStatus('contacted')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3">
              <p className="text-xs text-gray-500 font-medium">Site Visits</p>
              <p className="text-xl font-bold text-yellow-700 mt-0.5">{loading ? '...' : countByStatus('site_visit')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3">
              <p className="text-xs text-gray-500 font-medium">Negotiations</p>
              <p className="text-xl font-bold text-orange-700 mt-0.5">{loading ? '...' : countByStatus('negotiation')}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3">
              <p className="text-xs text-gray-500 font-medium">Bookings</p>
              <p className="text-xl font-bold text-green-700 mt-0.5">{loading ? '...' : countByStatus('booked')}</p>
            </div>
          </div>

          {/* Lead Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">All Leads ({leads.length})</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No leads found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_LABELS[lead.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[lead.status]?.label || lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{lead.source}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddLead(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Lead</h3>
            <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setAddingLead(true);
              const form = e.currentTarget;
              const formData = new FormData(form);
              const budgetMin = formData.get('budgetMin');
              const budgetMax = formData.get('budgetMax');
              try {
                await api.post('/crm/leads', {
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  source: formData.get('source'),
                  stage: 'new',
                  ...(budgetMin || budgetMax ? { budget: { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 } } : {}),
                });
                setShowAddLead(false);
                fetchLeads();
              } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to create lead');
              } finally {
                setAddingLead(false);
              }
            }}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. Amit Patel" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="amit@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input name="phone" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source *</label>
                  <select name="source" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select source</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min (₹)</label>
                    <input name="budgetMin" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="5000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max (₹)</label>
                    <input name="budgetMax" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="10000000" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button type="submit" disabled={addingLead} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  {addingLead ? 'Creating...' : 'Create Lead'}
                </button>
                <button type="button" onClick={() => setShowAddLead(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
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
