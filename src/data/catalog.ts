import tshirts from "@/assets/cat-tshirts.jpg";
import hoodies from "@/assets/cat-hoodies.jpg";
import polos from "@/assets/cat-polos.jpg";
import sweatshirts from "@/assets/cat-sweatshirts.jpg";
import jeans from "@/assets/cat-jeans.jpg";
import joggers from "@/assets/cat-joggers.jpg";
import caps from "@/assets/cat-caps.jpg";
import shorts from "@/assets/cat-shorts.jpg";
import jackets from "@/assets/cat-jackets.jpg";
import totes from "@/assets/cat-totes.jpg";
import uniforms from "@/assets/cat-uniforms.jpg";
import corporate from "@/assets/cat-corporate.jpg";

export type Tier = "regular" | "premium";

export type CatalogProduct = {
  id: string;
  name: string;
  categorySlug: string;
  subSlug: string;
  tier?: Tier;
  fabric: string;
  gsm: string;
  moq: number;
  price: string;
  image: string;
  gallery: string[];
  colors: string[];
  description: string;
  material: string;
  isNew?: boolean;
  addedAt: number;
};

export type Subcategory = {
  slug: string;
  name: string;
  tier?: Tier;
  image: string;
  products: CatalogProduct[];
};

export type CatalogCategory = {
  slug: string;
  name: string;
  image: string;
  hasTiers: boolean;
  blurb: string;
  regular?: Subcategory[];
  premium?: Subcategory[];
  items?: Subcategory[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const DEFAULT_COLORS = ["#f5f1e8", "#1a1a1a", "#2a5d3e", "#c97a4a"];

let __id = 0;
let __ts = Date.now();

const makeProducts = (
  baseName: string,
  catSlug: string,
  subSlug: string,
  image: string,
  tier: Tier | undefined,
  count = 3
): CatalogProduct[] => {
  const out: CatalogProduct[] = [];
  for (let i = 1; i <= count; i++) {
    __id++;
    __ts += 1000;
    const priceBase = tier === "premium" ? 540 : 280;
    const price = priceBase + i * 30;
    out.push({
      id: `c${__id}`,
      name: count > 1 ? `${baseName} — Style ${i}` : baseName,
      categorySlug: catSlug,
      subSlug,
      tier,
      fabric: baseName,
      gsm: tier === "premium" ? "Premium" : "Standard",
      moq: 20,
      price: `₹${price}`,
      image,
      gallery: [image, image, image, image, image, image],
      colors: DEFAULT_COLORS,
      description: `${baseName} — engineered for bulk corporate and event orders. Pre-shrunk, bio-washed, made in-house with strict QC.`,
      material: baseName,
      isNew: i === 1,
      addedAt: __ts,
    });
  }
  return out;
};

const makeSubs = (
  catSlug: string,
  image: string,
  tier: Tier | undefined,
  names: string[],
  perSub = 3
): Subcategory[] =>
  names.map((name) => {
    const slug = slugify(name);
    return {
      slug,
      name,
      tier,
      image,
      products: makeProducts(name, catSlug, slug, image, tier, perSub),
    };
  });

export const catalog: CatalogCategory[] = [
  {
    slug: "oversized-t-shirts",
    name: "Oversized T-Shirts",
    image: tshirts,
    hasTiers: true,
    blurb: "Drop-shoulder fits in heavy and lightweight builds.",
    regular: makeSubs("oversized-t-shirts", tshirts, "regular", [
      "Polycotton Oversized T-Shirts",
    ]),
    premium: makeSubs("oversized-t-shirts", tshirts, "premium", [
      "Cotton Oversized T-Shirts",
      "Terry / Loopnet Oversized T-Shirts",
    ]),
  },
  {
    slug: "hoodies",
    name: "Hoodies",
    image: hoodies,
    hasTiers: true,
    blurb: "Fleece-lined, structured hoods, double-stitched seams.",
    regular: makeSubs("hoodies", hoodies, "regular", ["Spun Fleece Hoodies"]),
    premium: makeSubs("hoodies", hoodies, "premium", [
      "Polycotton Hoodies",
      "American Fleece Hoodies",
      "Cotton Hoodies",
    ]),
  },
  {
    slug: "jersey",
    name: "Jersey",
    image: sweatshirts,
    hasTiers: true,
    blurb: "Sublimation-ready jerseys for sports, events and teams.",
    regular: makeSubs("jersey", sweatshirts, "regular", [
      "All Over Printed Jersey",
      "Front Printed Jersey",
      "Front & Back Printed Jersey",
    ]),
    premium: makeSubs("jersey", sweatshirts, "premium", [
      "All Over Printed Jersey",
      "Front Printed Jersey",
      "Front & Back Printed Jersey",
    ]),
  },
  {
    slug: "custom-fabric-t-shirts",
    name: "Custom Fabric T-Shirts",
    image: tshirts,
    hasTiers: true,
    blurb: "Pick your exact fabric and GSM — built to spec.",
    regular: makeSubs("custom-fabric-t-shirts", tshirts, "regular", [
      "Spun Matty 240 GSM",
      "Spun Matty 220 GSM",
      "Dotnet Polyester 180 GSM",
      "Dotnet Polyester 160 GSM",
      "Dotnet Polyester 120 GSM",
      "Nirmal Net Polyester 120 GSM",
      "Kohili Net Polyester 120 GSM",
    ]),
    premium: makeSubs("custom-fabric-t-shirts", tshirts, "premium", [
      "Cotton 240 GSM",
      "Cotton 180 GSM",
      "Polycotton 240 GSM",
      "Polycotton 220 GSM",
      "Polycotton 180 GSM",
      "SAP Matty Premium Polyester 180 GSM",
      "SAP Matty Premium Polyester 160 GSM",
    ]),
  },
  {
    slug: "corporate-wear",
    name: "Corporate Wear",
    image: corporate,
    hasTiers: true,
    blurb: "Collar-neck programs for offices, events and field teams.",
    regular: makeSubs("corporate-wear", corporate, "regular", [
      "Spun Collar Neck T-Shirt",
      "Cut & Sew Collar Neck T-Shirts",
      "Corporate Economy Collar Neck T-Shirt",
      "Reunions Collar Neck T-Shirts",
      "Marketing Collar Neck T-Shirts",
      "Petrol Pump Collar Neck T-Shirts",
      "Conference Collar Neck T-Shirts",
      "Gym Collar Neck T-Shirts",
      "Garage Collar Neck T-Shirts",
      "NGO Collar Neck T-Shirts",
      "Dotnet White Collar Neck T-Shirt",
      "Festival Group Collar Neck T-Shirts",
      "Ranglan Collar Neck T-Shirt",
    ]),
    premium: makeSubs("corporate-wear", corporate, "premium", [
      "Cotton Collar Neck T-Shirts",
      "Blended Collar Neck T-Shirts",
      "Drifit SAP Matty Collar Neck T-Shirts",
      "Reunions Collar Neck T-Shirts",
      "Marketing Collar Neck T-Shirts",
      "Petrol Pump Collar Neck T-Shirts",
      "Conference Collar Neck T-Shirts",
      "Gym Collar Neck T-Shirts",
      "Garage Collar Neck T-Shirts",
      "NGO Collar Neck T-Shirts",
      "SAP Matty White Collar Neck T-Shirt",
      "Cut & Sew Collar Neck T-Shirts",
      "Festival Group Collar Neck T-Shirts",
      "SAP Matty Ranglan Collar Neck T-Shirt",
    ]),
  },
  {
    slug: "custom-round-neck-t-shirts",
    name: "Custom Round Neck T-Shirts",
    image: tshirts,
    hasTiers: true,
    blurb: "Classic crew tees across every common fabric build.",
    regular: makeSubs("custom-round-neck-t-shirts", tshirts, "regular", [
      "Spun Round Neck T-Shirt",
      "Corporate Polyester Round Neck T-Shirt",
      "Dotnet White Round Neck T-Shirt",
      "Gym Round Neck T-Shirt",
    ]),
    premium: makeSubs("custom-round-neck-t-shirts", tshirts, "premium", [
      "Cotton Round Neck T-Shirt",
      "Polycotton Round Neck T-Shirt",
      "Corporate SAP Matty Round Neck T-Shirt",
      "SAP Matty White Round Neck T-Shirt",
      "Cotton Gym Round Neck T-Shirt",
    ]),
  },
  {
    slug: "aprons",
    name: "Aprons",
    image: uniforms,
    hasTiers: true,
    blurb: "Functional aprons for hospitals, kitchens and universities.",
    regular: makeSubs("aprons", uniforms, "regular", [
      "University Apron",
      "Nurse Apron",
      "Medical Apron",
    ]),
    premium: makeSubs("aprons", uniforms, "premium", [
      "University Apron",
      "Nurse Apron",
      "Medical Apron",
    ]),
  },
  {
    slug: "custom-accessories",
    name: "Custom Accessories",
    image: totes,
    hasTiers: false,
    blurb: "Branded merch and add-ons to round out your kit.",
    items: makeSubs("custom-accessories", totes, undefined, [
      "Canvas Tote",
      "Mug",
      "Safety Goggle",
      "Cap",
      "Premium Conference Backpack",
      "Umbrella",
      "Pen",
      "Event ID Card",
      "Badge",
      "Bottle",
    ], 2),
  },
  {
    slug: "corporate-joining-kits",
    name: "Corporate Joining Kits",
    image: corporate,
    hasTiers: false,
    blurb: "Ready-to-ship welcome kits for new hires.",
    items: makeSubs("corporate-joining-kits", corporate, undefined, [
      "Basic Joining Kit",
      "Classic Joining Kit",
      "Premium Joining Kit",
    ], 2),
  },
  {
    slug: "arrheniux-t-shirts",
    name: "ARRHENIUX T-Shirts",
    image: tshirts,
    hasTiers: false,
    blurb: "Our in-house premium line — branded, finished, fully ready.",
    items: makeSubs("arrheniux-t-shirts", tshirts, "premium", [
      "ARRHENIUX Cotton Round Neck T-Shirt",
      "ARRHENIUX Cotton Collar Neck T-Shirt",
      "ARRHENIUX Blend Collar Neck T-Shirt",
      "ARRHENIUX Dryfit Collar Neck T-Shirt",
    ], 2),
  },
];

// ---------- Helpers ----------
export const findCategory = (slug?: string) =>
  catalog.find((c) => c.slug === slug);

export const getSubsForTier = (cat: CatalogCategory, tier?: string): Subcategory[] => {
  if (!cat.hasTiers) return cat.items ?? [];
  if (tier === "regular") return cat.regular ?? [];
  if (tier === "premium") return cat.premium ?? [];
  return [];
};

export const findSubcategory = (cat: CatalogCategory, tier: string | undefined, subSlug?: string) => {
  const subs = cat.hasTiers ? getSubsForTier(cat, tier) : cat.items ?? [];
  return subs.find((s) => s.slug === subSlug);
};

export const allProducts = (): CatalogProduct[] =>
  catalog.flatMap((c) =>
    c.hasTiers
      ? [...(c.regular ?? []), ...(c.premium ?? [])].flatMap((s) => s.products)
      : (c.items ?? []).flatMap((s) => s.products)
  );

export const findProduct = (id?: string): CatalogProduct | undefined =>
  allProducts().find((p) => p.id === id);

export const latestProducts = (n = 9): CatalogProduct[] =>
  allProducts()
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, n);

export const productHref = (p: CatalogProduct) => `/product/${p.id}`;

// Non-tiered categories use "_" as the tier slot so the URL never collides
// with the tier route (/category/:cat/:tier).
export const listingHref = (catSlug: string, tier: string | undefined, subSlug: string) =>
  `/category/${catSlug}/${tier ?? "_"}/${subSlug}`;

// ---------- Garment vs non-garment ----------
const NON_GARMENT = new Set(["custom-accessories", "corporate-joining-kits"]);
export const isNonGarmentCategory = (slug: string) => NON_GARMENT.has(slug);

// ---------- Pricing helpers ----------
export const priceValue = (p: Pick<CatalogProduct, "price">) =>
  Number(String(p.price).replace(/[^\d.]/g, "")) || 0;

export const COURIER_FEE = 30;

export const getDiscountPct = (qty: number) => {
  if (qty >= 50) return 30;
  if (qty >= 25) return 20;
  if (qty >= 10) return 10;
  return 0;
};

export const BULK_THRESHOLD = 100;
