export function CRMPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CRM & Sales</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
          + Add Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium">New Leads</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">--</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium">Site Visits</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">--</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium">Negotiations</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">--</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium">Bookings</p>
          <p className="text-2xl font-bold text-green-700 mt-1">--</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Pipeline</h2>
        <div className="border rounded-lg p-8 text-center text-gray-400">
          Kanban board will be rendered here — Phase 4
        </div>
      </div>
    </div>
  );
}
