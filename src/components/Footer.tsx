import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { categories, ADDRESS, EMAIL, WHATSAPP_DISPLAY, waLink } from "@/data/site";

export const Footer = () => (
  <footer className="bg-ink text-cream mt-24">
    <div className="container-x py-16">
      <div className="grid gap-12 md:grid-cols-4">
        <div>
          <h3 className="font-display text-3xl tracking-wider">ARRHENIX</h3>
          <p className="mt-4 text-sm text-cream/70 max-w-xs">
            Factory-direct custom apparel for brands, teams, schools and businesses across India. Min order 20 pieces.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="#" aria-label="Instagram" className="p-2 border border-cream/30 hover:bg-cream hover:text-ink transition"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="p-2 border border-cream/30 hover:bg-cream hover:text-ink transition"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="YouTube" className="p-2 border border-cream/30 hover:bg-cream hover:text-ink transition"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-condensed text-xl mb-4">CATALOG</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="hover:text-cream">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-condensed text-xl mb-4">SUPPORT</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link to="/contact" className="hover:text-cream">Contact Us</Link></li>
            <li><a href="#" className="hover:text-cream">FAQs</a></li>
            <li><a href="#" className="hover:text-cream">Return Policy</a></li>
            <li><a href="#" className="hover:text-cream">Track Order</a></li>
            <li><a href="#" className="hover:text-cream">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-cream">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-condensed text-xl mb-4">CONTACT</h4>
          <ul className="space-y-3 text-sm text-cream/70">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {ADDRESS}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0" /> {WHATSAPP_DISPLAY}</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0" /> {EMAIL}</li>
          </ul>
          <a href={waLink()} target="_blank" rel="noreferrer" className="btn-wa mt-5 w-full justify-center">
            <MessageCircle className="h-4 w-4" /> Order on WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-cream/10 text-xs text-cream/50 flex flex-col md:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} Arrhenix. All rights reserved.</span>
        <span>Made with care in Bhubaneswar.</span>
      </div>
    </div>
  </footer>
);
