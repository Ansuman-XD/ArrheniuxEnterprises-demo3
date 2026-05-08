const stats = [
  { label: "Total Products", value: 48 },
  { label: "Categories", value: 12 },
  { label: "New Inquiries", value: 7 },
  { label: "Orders This Week", value: 23 },
];

const AdminDashboard = () => (
  <div>
    <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
    <p className="text-slate-500 mb-6">Overview of your store activity</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">{s.label}</p>
          <p className="text-3xl font-bold mt-2">{s.value}</p>
        </div>
      ))}
    </div>
    <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h2 className="font-semibold mb-3">Recent Activity</h2>
      <ul className="text-sm text-slate-600 space-y-2">
        <li>• New inquiry from "Tech Corp" — 2h ago</li>
        <li>• Product "Cotton Polo" updated — 5h ago</li>
        <li>• Category "Hoodies" created — 1d ago</li>
      </ul>
    </div>
  </div>
);

export default AdminDashboard;
