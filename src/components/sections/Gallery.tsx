import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";

const items = [
  { img: g1, tag: "Education", client: "SCAL Institute" },
  { img: g2, tag: "Corporate", client: "Cubicle Co." },
  { img: g3, tag: "Streetwear", client: "Riot Studio" },
  { img: g4, tag: "Hospitality", client: "GreenLeaf Cafe" },
  { img: g5, tag: "Sports", client: "FC Bhubaneswar" },
  { img: g6, tag: "Tech", client: "Pearl Reef" },
];

export const Gallery = () => (
  <section className="bg-secondary py-20">
    <div className="container-x">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">05 — Clients</span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">CLIENTS WITH WORK</h2>
        </div>
        <p className="max-w-sm text-muted-foreground text-sm">
          From college fests to corporate uniforms, here's a glimpse of what we've made.
        </p>
      </div>
      <div className="columns-2 md:columns-3 gap-3 space-y-3">
        {items.map((it, i) => (
          <figure key={i} className="break-inside-avoid relative group overflow-hidden bg-background">
            <img src={it.img} alt={it.client} loading="lazy" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
            <figcaption className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-ink/90 to-transparent text-cream">
              <span className="text-[10px] uppercase tracking-widest text-accent">{it.tag}</span>
              <p className="font-condensed text-lg leading-tight">{it.client}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);
