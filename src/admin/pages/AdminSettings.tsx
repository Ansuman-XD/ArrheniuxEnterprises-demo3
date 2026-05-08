import { useState } from "react";

const AdminSettings = () => {
  const [whatsapp, setWhatsapp] = useState("8260368742");
  const [email, setEmail] = useState("info@arrhenius.com");
  const [address, setAddress] = useState("Niladri Vihar, Bhubaneswar");
  const [saved, setSaved] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-slate-500 mb-6">Update business contact information</p>

      <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">WhatsApp Number</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Business Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md text-sm font-medium">
            Save Changes
          </button>
          {saved && <span className="text-sm text-emerald-600">Saved!</span>}
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
