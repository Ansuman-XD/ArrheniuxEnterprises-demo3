import { Quote } from "lucide-react";

const reactions = [
  { quote: "Stitching is *chef's kiss*. Felt like premium retail.", name: "Rahul M.", industry: "Startup" },
  { quote: "Colours were exactly what we approved on the mockup.", name: "Anushka P.", industry: "Education" },
  { quote: "Reordered twice in 3 months. Says it all.", name: "Prakash R.", industry: "Hospitality" },
  { quote: "Uniforms across 4 branches — zero defects.", name: "Sneha I.", industry: "Logistics" },
  { quote: "Sublimation print held up after 20+ washes.", name: "Aman K.", industry: "Sports" },
  { quote: "Smooth from sample to bulk. Very rare.", name: "Meera J.", industry: "Beauty" },
];

export const ClientReactions = () => (
  <section id="reactions" className="container-x py-20">
    <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">08 — Reactions</span>
        <h2 className="font-display text-5xl md:text-6xl mt-2">CLIENT REACTIONS</h2>
      </div>
      <p className="max-w-sm text-muted-foreground text-sm">
        Short, real reactions from founders, HRs and event leads we've shipped for.
      </p>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {reactions.map((r) => (
        <figure
          key={r.name}
          className="relative bg-secondary border border-border p-6 flex flex-col gap-4 hover:border-primary transition group"
        >
          <Quote className="h-7 w-7 text-primary/70 group-hover:text-primary transition" />
          <blockquote className="font-condensed text-2xl leading-tight text-ink">
            "{r.quote}"
          </blockquote>
          <figcaption className="mt-auto flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm font-medium text-ink">{r.name}</span>
            <span className="text-[10px] uppercase tracking-widest bg-ink text-cream px-2 py-1">
              {r.industry}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  </section>
);
