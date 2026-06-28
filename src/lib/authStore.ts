// Lightweight client-side auth + analytics + product + reviews store (localStorage).
// Demo only — swap with Lovable Cloud later.

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  password?: string; // demo only
  provider: "email" | "google" | "facebook";
  role: "admin" | "customer";
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  minQty: number;
  price: number;
};

export type Review = {
  id: string;
  name: string;
  subject: "Company" | "Product Quality" | "Service";
  rating: number;
  text: string;
  createdAt: string;
};

const USERS_KEY = "arr_users";
const SESSION_KEY = "arr_session";
const VISITS_KEY = "arr_visits";
const PRODUCTS_KEY = "arr_products";
const SETTINGS_KEY = "arr_settings";
const REVIEWS_KEY = "arr_reviews";

export const DEFAULT_ADMIN_EMAIL = "admin@arrhenius.com";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

const read = <T>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

// ---------- Settings ----------
type Settings = { adminEmail: string; whatsapp: string; email: string; address: string };
export const getSettings = (): Settings =>
  read<Settings>(SETTINGS_KEY, {
    adminEmail: DEFAULT_ADMIN_EMAIL,
    whatsapp: "8260368742",
    email: "info@arrhenius.com",
    address: "Niladri Vihar, Bhubaneswar",
  });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

// ---------- Users ----------
export const getUsers = (): User[] => {
  const users = read<User[]>(USERS_KEY, []);
  if (!users.find((u) => u.email === DEFAULT_ADMIN_EMAIL)) {
    const admin: User = {
      id: "admin-seed",
      name: "Administrator",
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      provider: "email",
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    users.push(admin);
    write(USERS_KEY, users);
  }
  return users;
};

export const saveUsers = (users: User[]) => write(USERS_KEY, users);

export type AuthResult = { ok: boolean; user?: User; error?: string };

export const signup = (data: Omit<User, "id" | "role" | "createdAt" | "provider"> & { provider?: User["provider"] }): AuthResult => {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase()))
    return { ok: false, error: "Email already registered" };
  const settings = getSettings();
  const user: User = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    password: data.password,
    provider: data.provider ?? "email",
    role: data.email.toLowerCase() === settings.adminEmail.toLowerCase() ? "admin" : "customer",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  setSession(user);
  return { ok: true, user };
};

export const login = (email: string, password: string): AuthResult => {
  const users = getUsers();
  const settings = getSettings();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) return { ok: false, error: "Invalid email or password" };
  if (user.email.toLowerCase() === settings.adminEmail.toLowerCase() && user.role !== "admin") {
    user.role = "admin";
    saveUsers(users);
  }
  setSession(user);
  return { ok: true, user };
};

export const socialLogin = (provider: "google" | "facebook"):
  { ok: true; user: User } => {
  const fakeEmail = `${provider}.demo@arrhenius.local`;
  const users = getUsers();
  let user = users.find((u) => u.email === fakeEmail);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      name: provider === "google" ? "Google User" : "Facebook User",
      email: fakeEmail,
      provider,
      role: "customer",
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
  }
  setSession(user);
  return { ok: true, user };
};

// ---------- Session ----------
export const setSession = (user: User) => write(SESSION_KEY, { id: user.id, email: user.email });
export const clearSession = () => localStorage.removeItem(SESSION_KEY);
export const getSession = (): User | null => {
  const s = read<{ id: string; email: string } | null>(SESSION_KEY, null);
  if (!s) return null;
  return getUsers().find((u) => u.id === s.id) ?? null;
};

export const isLoggedIn = () => !!getSession();

// ---------- Visits ----------
export type Visit = { path: string; at: string; userId?: string };
export const trackVisit = (path: string) => {
  const visits = read<Visit[]>(VISITS_KEY, []);
  const session = read<{ id: string } | null>(SESSION_KEY, null);
  visits.push({ path, at: new Date().toISOString(), userId: session?.id });
  if (visits.length > 5000) visits.splice(0, visits.length - 5000);
  write(VISITS_KEY, visits);
};
export const getVisits = (): Visit[] => read<Visit[]>(VISITS_KEY, []);

// ---------- Products ----------
const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "Classic Cotton T-Shirt", category: "T-Shirts", minQty: 20, price: 220 },
  { id: "p2", name: "Premium Pullover Hoodie", category: "Hoodies", minQty: 20, price: 650 },
];
export const getProducts = (): Product[] => {
  const p = read<Product[]>(PRODUCTS_KEY, []);
  if (p.length === 0) {
    write(PRODUCTS_KEY, SEED_PRODUCTS);
    return SEED_PRODUCTS;
  }
  return p;
};
export const saveProducts = (p: Product[]) => write(PRODUCTS_KEY, p);

// ---------- Reviews ----------
export const getReviews = (): Review[] => read<Review[]>(REVIEWS_KEY, []);
export const addReview = (r: Omit<Review, "id" | "createdAt">): Review => {
  const list = getReviews();
  const review: Review = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  list.unshift(review);
  write(REVIEWS_KEY, list);
  return review;
};
