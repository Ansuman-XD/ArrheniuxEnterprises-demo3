import { MessageCircle } from "lucide-react";
import { waLink } from "@/data/site";

export const FloatingWhatsApp = () => (
  <a
    href={waLink()}
    target="_blank"
    rel="noreferrer"
    aria-label="Chat on WhatsApp"
    className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--whatsapp))] text-white shadow-lg hover:scale-110 transition"
  >
    <MessageCircle className="h-6 w-6" />
    <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--whatsapp))] opacity-50 animate-ping" />
  </a>
);
