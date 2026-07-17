import f1 from "@/assets/factory-1.jpg";
import f2 from "@/assets/factory-2.jpg";
import f3 from "@/assets/factory-3.jpg";

const stats = [
  { num: "50K+", label: "Pieces / month capacity" },
  { num: "7–14", label: "Days turnaround" },
  { num: "120+", label: "Skilled artisans" },
  { num: "100%", label: "QC checked" },
];

export const FactorySection = () => (
  <section className="container-x py-20">
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      <div className="grid grid-cols-2 gap-3">
        <img src={f1} alt="Factory floor" loading="lazy" className="w-full h-full object-cover col-span-2 aspect-[4/3]" />
        <img src={f2} alt="Fabric rolls" loading="lazy" className="w-full h-full object-cover aspect-square" />
        <img src={f3} alt="Quality check" loading="lazy" className="w-full h-full object-cover aspect-square" />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">04 — Our Factory</span>
        <h2 className="font-display text-5xl md:text-6xl mt-2 leading-none">BUILT IN-HOUSE.<br /><span className="text-primary">SHIPPED ON TIME.</span></h2>
        <p className="mt-5 text-muted-foreground max-w-md">
          We own our production. From fabric sourcing to printing, embroidery, stitching and quality control — every step happens under one roof in Bhubaneswar.
        </p>
        <div className="grid grid-cols-2 gap-px bg-border mt-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-background p-5">
              <div className="font-display text-4xl text-primary">{s.num}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
