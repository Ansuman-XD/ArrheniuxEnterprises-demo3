const inquiries = [
  { id: 1, name: "Rahul Sharma", company: "Tech Corp", message: "Need 200 polos with logo", date: "2026-05-07" },
  { id: 2, name: "Priya Singh", company: "School Uniforms Ltd", message: "Quote for 500 uniforms", date: "2026-05-06" },
  { id: 3, name: "Aman Verma", company: "Event Co", message: "100 hoodies, urgent", date: "2026-05-05" },
];

const AdminInquiries = () => (
  <div>
    <h1 className="text-2xl font-bold mb-1">Inquiries</h1>
    <p className="text-slate-500 mb-6">Customer messages from your website</p>

    <div className="space-y-3">
      {inquiries.map((i) => (
        <div key={i.id} className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-slate-500">{i.company}</p>
            </div>
            <span className="text-xs text-slate-400">{i.date}</span>
          </div>
          <p className="text-sm text-slate-700">{i.message}</p>
          <div className="mt-3 flex gap-2">
            <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700">
              Reply on WhatsApp
            </button>
            <button className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200">
              Mark Resolved
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AdminInquiries;
