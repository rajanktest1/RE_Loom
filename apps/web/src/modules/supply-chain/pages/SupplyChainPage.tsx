import { useEffect, useState } from 'react';
import api from '@/shared/api/client';

interface Vendor {
  _id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  vendorName?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Milestone {
  _id: string;
  name: string;
  phase: string;
  status: string;
  completionPercentage: number;
  dueDate: string;
}

export function SupplyChainPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/supply-chain/vendors'),
      api.get('/supply-chain/purchase-orders'),
      api.get('/supply-chain/milestones'),
    ]).then(([vendorsRes, ordersRes, milestonesRes]) => {
      if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data.data || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.data || []);
      if (milestonesRes.status === 'fulfilled') setMilestones(milestonesRes.value.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Supply Chain & Construction</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Vendors</h2>
          <p className="text-3xl font-bold text-blue-700">{loading ? '...' : vendors.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active vendors</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Purchase Orders</h2>
          <p className="text-3xl font-bold text-orange-700">{loading ? '...' : orders.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Milestones</h2>
          <p className="text-3xl font-bold text-green-700">{loading ? '...' : `${completedMilestones}/${milestones.length}`}</p>
          <p className="text-sm text-gray-500 mt-1">Completed</p>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Vendors ({vendors.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{v.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.contactPerson}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Milestones ({milestones.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Milestone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {milestones.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{m.phase}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${m.completionPercentage}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{m.completionPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(m.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        m.status === 'completed' ? 'bg-green-100 text-green-800' :
                        m.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
