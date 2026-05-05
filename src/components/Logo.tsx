import logo from "@/assets/arrhenius-logo.png";
import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 ${className}`}>
    <img src={logo} alt="Arrhenix" className="h-10 w-auto md:h-12" />
    <span className="font-display text-lg md:text-xl tracking-wider text-ink">ARRHENIX</span>
  </Link>
);
