import { useState } from "react";

const AdminCategories = () => {
  const [categories, setCategories] = useState<string[]>([
    "T-Shirts", "Hoodies", "Polos", "Jackets", "Joggers", "Caps", "Uniforms",
  ]);
  const [name, setName] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCategories([...categories, name.trim()]);
    setName("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Categories</h1>
      <p className="text-slate-500 mb-6">Organize products into categories</p>

      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-md text-sm font-medium">
          Add Category
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((c) => (
          <div key={c} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center">
            <span className="font-medium">{c}</span>
            <button
              onClick={() => setCategories(categories.filter((x) => x !== c))}
              className="text-red-600 text-sm hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
