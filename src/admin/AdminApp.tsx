import { useState } from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import AdminInquiries from "./pages/AdminInquiries";
import AdminSettings from "./pages/AdminSettings";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAdminAuth();
  const links = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/products", label: "Products" },
    { to: "/admin/categories", label: "Categories" },
    { to: "/admin/inquiries", label: "Inquiries" },
    { to: "/admin/settings", label: "Settings" },
  ];
  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 min-h-screen p-5 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Arrhenius</h1>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((l) => {
          const active = l.end ? location.pathname === l.to : location.pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-md text-sm transition ${
                active ? "bg-emerald-600 text-white" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="mt-4 px-3 py-2 rounded-md text-sm bg-slate-800 hover:bg-slate-700 text-slate-200"
      >
        Logout
      </button>
    </aside>
  );
};

const ProtectedShell = () => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/products" element={<AdminProducts />} />
          <Route path="/categories" element={<AdminCategories />} />
          <Route path="/inquiries" element={<AdminInquiries />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AdminApp = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={<ProtectedShell />} />
      </Routes>
    </AdminAuthProvider>
  );
};

export default AdminApp;
