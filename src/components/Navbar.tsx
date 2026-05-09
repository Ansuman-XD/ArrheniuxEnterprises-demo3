import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, User as UserIcon, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { categories, waLink } from "@/data/site";
import { getSession, clearSession } from "@/lib/authStore";

const mainLinks = [
  { hash: "#home", label: "Home" },
  { hash: "#categories", label: "Categories" },
  { hash: "#releases", label: "New" },
  { hash: "#process", label: "Process" },
  { hash: "#factory", label: "Factory" },
  { hash: "#reactions", label: "Reactions" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
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
          {mainLinks.map((l) => (
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

        <div className="flex items-center gap-3">
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
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {categories.slice(0, 8).map((c) => (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="py-1 text-xs uppercase text-muted-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <a href={waLink()} target="_blank" rel="noreferrer" className="btn-wa mt-2 justify-center">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
