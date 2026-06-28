import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { catalog } from "@/data/catalog";
import { waLink } from "@/data/site";
import { getSession, clearSession } from "@/lib/authStore";

const mainLinks = [
  { hash: "#home", label: "Home" },
  { hash: "#collection", label: "Latest" },
  { hash: "#process", label: "Process" },
  { hash: "#factory", label: "Factory" },
  { hash: "#reviews", label: "Reactions" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [user, setUser] = useState(getSession());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setUser(getSession());
  }, [location.pathname]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate("/");
  };

  const handleHashClick = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname !== "/") {
      navigate(`/${hash}`);
      return;
    }
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", hash);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled ? "bg-cream/95 backdrop-blur shadow-sm" : "bg-cream"
      }`}
    >
      <div className="container-x flex items-center justify-between py-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          <a
            href="#home"
            onClick={(e) => handleHashClick(e, "#home")}
            className="text-sm font-medium uppercase tracking-wide transition hover:text-primary text-ink"
          >
            Home
          </a>
          <MegaMenu />
          {mainLinks.slice(1).map((l) => (
            <a
              key={l.hash}
              href={l.hash}
              onClick={(e) => handleHashClick(e, l.hash)}
              className="text-sm font-medium uppercase tracking-wide transition hover:text-primary text-ink"
            >
              {l.label}
            </a>
          ))}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `text-sm font-medium uppercase tracking-wide transition hover:text-primary ${
                isActive ? "text-primary" : "text-ink"
              }`
            }
          >
            Contact
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-ink text-cream px-3 py-2 rounded-md hover:bg-ink/90">
                  Admin
                </Link>
              )}
              <span className="hidden md:inline text-xs text-muted-foreground max-w-[120px] truncate">{user.name}</span>
              <button onClick={handleLogout} className="hidden md:inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-md hover:bg-muted" aria-label="Logout">
                <LogOut className="h-3.5 w-3.5" /> Log out
              </button>
            </>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide border border-ink text-ink px-3 py-2 rounded-md hover:bg-ink hover:text-cream transition">
              <UserIcon className="h-3.5 w-3.5" /> Log In
            </Link>
          )}
          <a
            href={waLink()}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex btn-wa !py-2 !px-4 text-xs"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            className="lg:hidden p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-cream">
          <div className="container-x py-4 flex flex-col gap-3">
            {!user ? (
              <Link to="/auth" onClick={() => setOpen(false)} className="py-2 font-semibold uppercase text-sm tracking-wide flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Log In / Sign Up
              </Link>
            ) : (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">{user.name}</span>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="text-xs font-medium flex items-center gap-1">
                  <LogOut className="h-3 w-3" /> Log out
                </button>
              </div>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-2 font-semibold uppercase text-sm tracking-wide text-primary">
                Admin Panel →
              </Link>
            )}
            <button
              onClick={() => setMobileCatOpen((v) => !v)}
              className="py-2 font-medium uppercase text-sm tracking-wide flex items-center justify-between"
            >
              Categories <ChevronDown className={`h-4 w-4 transition ${mobileCatOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileCatOpen && (
              <div className="pl-3 border-l border-border flex flex-col gap-1 mb-2">
                {catalog.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="py-1.5 text-xs uppercase tracking-wide text-muted-foreground hover:text-ink"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            {mainLinks.map((l) => (
              <a
                key={l.hash}
                href={l.hash}
                onClick={(e) => handleHashClick(e, l.hash)}
                className="py-2 font-medium uppercase text-sm tracking-wide"
              >
                {l.label}
              </a>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)} className="py-2 font-medium uppercase text-sm tracking-wide">
              Contact
            </Link>
            <a href={waLink()} target="_blank" rel="noreferrer" className="btn-wa mt-2 justify-center">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
