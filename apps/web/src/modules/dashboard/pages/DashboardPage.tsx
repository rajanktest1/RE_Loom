import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/shared/api/client';

interface DashboardStats {
  totalProjects: number;
  availableUnits: number;
  activeLeads: number;
  totalSales: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    availableUnits: 0,
    activeLeads: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [projectsRes, leadsRes] = await Promise.allSettled([
          api.get('/inventory/projects'),
          api.get('/crm/leads'),
        ]);

        let totalProjects = 0;
        let availableUnits = 0;
        if (projectsRes.status === 'fulfilled') {
          const projects = projectsRes.value.data.data || [];
          totalProjects = projects.length;
          availableUnits = projects.reduce((sum: number, p: { totalUnits: number }) => sum + p.totalUnits, 0);
        }

        let activeLeads = 0;
        let totalSales = 0;
        if (leadsRes.status === 'fulfilled') {
          const leads = leadsRes.value.data.data || [];
          activeLeads = leads.filter((l: { status: string }) =>
            !['lost', 'booked'].includes(l.status)
          ).length;
          totalSales = leads.filter((l: { status: string }) => l.status === 'booked').length;
        }

        setStats({ totalProjects, availableUnits, activeLeads, totalSales });
      } catch {
        // silently fail — dashboard shows 0s
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Projects" value={loading ? '...' : String(stats.totalProjects)} color="blue" />
        <StatCard title="Total Units" value={loading ? '...' : String(stats.availableUnits)} color="green" />
        <StatCard title="Active Leads" value={loading ? '...' : String(stats.activeLeads)} color="yellow" />
        <StatCard title="Bookings" value={loading ? '...' : String(stats.totalSales)} color="purple" />
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/inventory" className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
          <p className="text-sm text-gray-500 mt-1">View stacking plan, units, pricing &amp; locks</p>
          <span className="text-primary-600 text-sm font-medium mt-3 inline-block">View →</span>
        </Link>
        <Link to="/supply-chain" className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">Supply Chain</h3>
          <p className="text-sm text-gray-500 mt-1">Vendors, purchase orders &amp; milestones</p>
          <span className="text-primary-600 text-sm font-medium mt-3 inline-block">View →</span>
        </Link>
        <Link to="/crm" className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">CRM</h3>
          <p className="text-sm text-gray-500 mt-1">Leads, bookings &amp; payment tracking</p>
          <span className="text-primary-600 text-sm font-medium mt-3 inline-block">View →</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Funnel</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder — will be implemented in Phase 6
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Construction Progress</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder — will be implemented in Phase 6
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${colorMap[color] || ''}`}>{value}</p>
    </div>
  );
}
