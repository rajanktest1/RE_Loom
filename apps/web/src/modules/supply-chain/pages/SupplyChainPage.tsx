export function SupplyChainPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Supply Chain & Construction</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Vendors</h2>
          <p className="text-3xl font-bold text-blue-700">--</p>
          <p className="text-sm text-gray-500 mt-1">Active vendors</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Purchase Orders</h2>
          <p className="text-3xl font-bold text-orange-700">--</p>
          <p className="text-sm text-gray-500 mt-1">Pending orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Milestones</h2>
          <p className="text-3xl font-bold text-green-700">--</p>
          <p className="text-sm text-gray-500 mt-1">Completed this month</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Milestone Timeline</h2>
        <div className="border rounded-lg p-8 text-center text-gray-400">
          Gantt chart / timeline view will be rendered here — Phase 3
        </div>
      </div>
    </div>
  );
}
