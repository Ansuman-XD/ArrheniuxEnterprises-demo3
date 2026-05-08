import { useState } from "react";

type Product = { id: number; name: string; category: string; minQty: number; price: string };

const seed: Product[] = [
  { id: 1, name: "Classic Cotton T-Shirt", category: "T-Shirts", minQty: 20, price: "₹220" },
  { id: 2, name: "Pullover Hoodie", category: "Hoodies", minQty: 20, price: "₹650" },
  { id: 3, name: "Polo Shirt", category: "Polos", minQty: 20, price: "₹380" },
];

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>(seed);
  const [form, setForm] = useState<Omit<Product, "id">>({ name: "", category: "", minQty: 20, price: "" });

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) return;
    setProducts([...products, { ...form, id: Date.now() }]);
    setForm({ name: "", category: "", minQty: 20, price: "" });
  };

  const remove = (id: number) => setProducts(products.filter((p) => p.id !== id));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Products</h1>
      <p className="text-slate-500 mb-6">Manage your product catalog</p>

      <form onSubmit={addProduct} className="bg-white p-5 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <input className="border border-slate-300 rounded-md px-3 py-2 text-sm md:col-span-2" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="border border-slate-300 rounded-md px-3 py-2 text-sm" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium">Add</button>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Min Qty</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">{p.minQty}</td>
                <td className="px-4 py-3">{p.price}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(p.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
