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
    premium: makeSubs("custom-fabric-t-shirts", polos, "premium", [
      "240 GSM Cotton Polo T-Shirt",
      "240 GSM Polycotton Polo T-Shirt",
      "240 GSM CP Polo T-Shirt",
      "240 GSM Spun Polo T-Shirt (Polyester)",
      "240 GSM Honeycomb Polo T-Shirt (Polyester)",
      "180 GSM SAP Matty Polo T-Shirt (Premium Polyester)",
      "180 GSM Dotnet Polo T-Shirt (Polyester)",
      "170 GSM Nirmal Net Polo T-Shirt (Polyester)",
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
      "Premium Backpack",
      "Umbrella",
      "Pen",
      "Badge",
      "Event Lanyard",
      "Bottle",
    ], 2),
  },
  {
    slug: "corporate-welcome-kit",
    name: "Corporate Welcome Kit",
    image: corporate,
    hasTiers: false,
    blurb: "Ready-to-ship welcome kits for new hires, events, colleges and teams.",
    items: [
      ...makeSubs("corporate-welcome-kit", corporate, undefined, [
        "Basic Welcome Kit",
      ], 2),
      // Classic Kit gets four themed products (Employee/Conference/College/Team)
      ...makeSubs("corporate-welcome-kit", corporate, undefined, [
        "Classic Welcome Kit",
      ], 1).map((s) => {
        const themed = ["Employee Welcome Kit", "Conference Welcome Kit", "College Welcome Kit", "Team Welcome Kit"];
        s.products = themed.map((n) => {
          __id++;
          __ts += 1000;
          return {
            id: `c${__id}`,
            name: n,
            categorySlug: "corporate-welcome-kit",
            subSlug: s.slug,
            tier: undefined,
            fabric: "Kit",
            gsm: "Kit",
            moq: 20,
            price: `₹1200`,
            image: corporate,
            gallery: [corporate, corporate, corporate, corporate],
            colors: DEFAULT_COLORS,
            description: `${n} — configurable welcome kit. Includes a customised t-shirt plus your selected merch add-ons. One free customised tote bag included with every kit.`,
            material: "Curated bundle",
            isNew: true,
            addedAt: __ts,
          } as CatalogProduct;
        });
        return s;
      }),
      ...makeSubs("corporate-welcome-kit", corporate, undefined, [
        "Premium Welcome Kit",
      ], 2),
    ],
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
      "ARRHENIUX Oversized T-Shirt",
      "ARRHENIUX Hoodie",
      "ARRHENIUX Polo T-Shirt",
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

export const listingHref = (catSlug: string, tier: string | undefined, subSlug: string) =>
  `/category/${catSlug}/${tier ?? "_"}/${subSlug}`;

// ---------- Garment vs non-garment ----------
const NON_GARMENT = new Set(["custom-accessories", "corporate-welcome-kit"]);
export const isNonGarmentCategory = (slug: string) => NON_GARMENT.has(slug);
export const isArrheniuxCategory = (slug: string) => slug === "arrheniux-t-shirts";
export const isWelcomeKitCategory = (slug: string) => slug === "corporate-welcome-kit";

// Print type is offered on everything EXCEPT non-garment items and the ARRHENIUX line.
export const supportsPrint = (catSlug: string) =>
  !isNonGarmentCategory(catSlug) && !isArrheniuxCategory(catSlug);

// ---------- Pricing helpers ----------
export const priceValue = (p: Pick<CatalogProduct, "price">) =>
  Number(String(p.price).replace(/[^\d.]/g, "")) || 0;

// Per-piece courier
export const COURIER_PER_PC = 30;
export const GST_RATE = 0.05; // default 5%
export const BULK_DISCOUNT_PCT = 40;
export const BULK_THRESHOLD = 80;
export const B2B_MOQ = 14;
export const B2B_STEP = 2;
export const ARR_SIZE_MAX = 3; // ARRHENIUX per-size cap

// Per-product MOQ: ARRHENIUX = 1, everything else = 5 (accessories may override)
export const getMOQ = (p: Pick<CatalogProduct, "categorySlug" | "subSlug">) => {
  if (isArrheniuxCategory(p.categorySlug)) return 1;
  const rule = getAccessoryRules(p.subSlug);
  if (rule) return rule.moq;
  return 5;
};

export const getMaxQty = (p: Pick<CatalogProduct, "categorySlug" | "subSlug">) => {
  const rule = getAccessoryRules(p.subSlug);
  if (rule) return rule.max;
  return BULK_THRESHOLD;
};

// Retail-tier % discount (below bulk threshold)
export const getDiscountPct = (qty: number, p?: Pick<CatalogProduct, "subSlug">) => {
  if (p) {
    const rule = getAccessoryRules(p.subSlug);
    if (rule && !rule.discountEnabled) return 0;
  }
  if (qty >= 50) return 30;
  if (qty >= 25) return 20;
  if (qty >= 10) return 10;
  return 0;
};

// Human-friendly product code
export const productCode = (p: Pick<CatalogProduct, "id" | "categorySlug">) => {
  const catInitials = p.categorySlug
    .split("-")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3);
  return `ARR-${catInitials}-${p.id.toUpperCase()}`;
};

// ---------- Accessory / non-garment per-product rules ----------
export type AccessoryRule = {
  moq: number;
  max: number;
  gstPct: number; // 5 or 18
  discountEnabled: boolean;
  oem?: boolean;
  // Print config: which method(s) allowed, which option ids under each, or FREE-only note
  print:
    | { kind: "none" }
    | { kind: "free"; label: string } // e.g. Pen "Company Name Printing — FREE"
    | { kind: "custom"; methods: Array<{ id: "embroidery" | "dtf" | "sublimation"; options: { id: string; label: string; pricePerPc: number }[] }> };
  note?: string;
};

const ACCESSORY_RULES: Record<string, AccessoryRule> = {
  "canvas-tote": {
    moq: 5, max: 80, gstPct: 5, discountEnabled: false,
    print: { kind: "custom", methods: [{ id: "dtf", options: [
      { id: "tote-a4", label: "A4 Print", pricePerPc: 40 },
      { id: "tote-company-name", label: "Company Name (8×2 inch)", pricePerPc: 30 },
    ]}]},
  },
  "safety-goggle": {
    moq: 50, max: 80, gstPct: 18, discountEnabled: false, oem: true,
    print: { kind: "none" },
  },
  "premium-backpack": {
    moq: 50, max: 80, gstPct: 18, discountEnabled: false, oem: true,
    print: { kind: "custom", methods: [{ id: "dtf", options: [
      { id: "bp-logo", label: "Logo (3×3 inch)", pricePerPc: 20 },
    ]}]},
  },
  "pen": {
    moq: 50, max: 80, gstPct: 18, discountEnabled: false, oem: true,
    print: { kind: "free", label: "Company Name Printing — FREE" },
  },
  "badge": {
    moq: 50, max: 80, gstPct: 18, discountEnabled: false,
    print: { kind: "free", label: "Printed Logo — FREE" },
  },
  "mug": {
    moq: 50, max: 80, gstPct: 18, discountEnabled: false, oem: true,
    print: { kind: "custom", methods: [{ id: "sublimation", options: [
      { id: "mug-logo", label: "Company Logo (Sublimation)", pricePerPc: 0 },
    ]}]},
  },
  "cap": {
    moq: 50, max: 80, gstPct: 5, discountEnabled: false, oem: true,
    print: { kind: "custom", methods: [{ id: "dtf", options: [
      { id: "cap-logo", label: "Logo (2×2 inch)", pricePerPc: 10 },
    ]}]},
  },
  "umbrella": {
    moq: 50, max: 80, gstPct: 5, discountEnabled: false,
    print: { kind: "custom", methods: [
      { id: "dtf", options: [
        { id: "umb-single", label: "Single Logo (3×3 inch)", pricePerPc: 10 },
        { id: "umb-double", label: "Double Logo", pricePerPc: 20 },
        { id: "umb-triple", label: "Triple Logo", pricePerPc: 30 },
      ]},
      { id: "sublimation", options: [
        { id: "umb-sub-single", label: "Single Logo (3×3 inch)", pricePerPc: 10 },
        { id: "umb-sub-double", label: "Double Logo", pricePerPc: 20 },
        { id: "umb-sub-triple", label: "Triple Logo", pricePerPc: 30 },
      ]},
    ]},
  },
  "event-lanyard": {
    moq: 50, max: 80, gstPct: 5, discountEnabled: false,
    print: { kind: "custom", methods: [{ id: "sublimation", options: [
      { id: "lan-double", label: "Double-Sided Logo", pricePerPc: 20 },
    ]}]},
  },
};

export const getAccessoryRules = (subSlug?: string): AccessoryRule | null => {
  if (!subSlug) return null;
  return ACCESSORY_RULES[subSlug] ?? null;
};

// GST% for a product (5% default, some accessories 18%)
export const getGstPct = (p: Pick<CatalogProduct, "subSlug">) => {
  const rule = getAccessoryRules(p.subSlug);
  return rule ? rule.gstPct / 100 : GST_RATE;
};

// Sample price = 1 pc at unit price + courier + GST (a small stand-alone charge)
export const samplePrice = (p: CatalogProduct) => {
  const unit = priceValue(p);
  const gst = Math.round((unit + COURIER_PER_PC) * getGstPct(p));
  return unit + COURIER_PER_PC + gst;
};

// ---------- Welcome Kit config ----------
export const WELCOME_KIT_MIN = 20;
export const WELCOME_KIT_ITEMS = [
  { id: "tshirt", label: "T-Shirt", required: true },
  { id: "mug", label: "Mug" },
  { id: "pen", label: "Pen" },
  { id: "notebook", label: "Notebook" },
  { id: "bottle", label: "Bottle" },
  { id: "keychain", label: "Key Chain" },
  { id: "backpack", label: "Backpack" },
] as const;
export const WELCOME_KIT_MIN_ITEMS = 3;

// ---------- B2B curated subcategories ----------
export type B2BSub = {
  slug: string;
  name: string;
  catSlug: string;
  tier?: Tier;
  subName: string;
};
export const B2B_SUBCATEGORIES: B2BSub[] = [
  { slug: "oversized-tshirt", name: "Oversized T-Shirt", catSlug: "oversized-t-shirts", tier: "premium", subName: "Cotton Oversized T-Shirts" },
  { slug: "dryfit-collar", name: "Dry Fit Collar Neck T-Shirt", catSlug: "corporate-wear", tier: "premium", subName: "Drifit SAP Matty Collar Neck T-Shirts" },
  { slug: "american-fleece", name: "American Fleece Hoodies", catSlug: "hoodies", tier: "premium", subName: "American Fleece Hoodies" },
  { slug: "solid-collar", name: "Solid Collar Neck T-Shirt", catSlug: "corporate-wear", tier: "regular", subName: "Spun Collar Neck T-Shirt" },
  { slug: "dryfit-solid-collar", name: "Dry Fit Solid Collar Neck T-Shirt", catSlug: "corporate-wear", tier: "premium", subName: "Drifit SAP Matty Collar Neck T-Shirts" },
  { slug: "round-neck", name: "Round Neck T-Shirt", catSlug: "custom-round-neck-t-shirts", tier: "regular", subName: "Spun Round Neck T-Shirt" },
];

export const getB2BProducts = (b2bSlug: string): CatalogProduct[] => {
  const b = B2B_SUBCATEGORIES.find((x) => x.slug === b2bSlug);
  if (!b) return [];
  const cat = findCategory(b.catSlug);
  if (!cat) return [];
  const subs = cat.hasTiers ? (b.tier === "regular" ? cat.regular : cat.premium) ?? [] : cat.items ?? [];
  const sub = subs.find((s) => s.name === b.subName) || subs[0];
  return sub?.products ?? [];
};

// Valid B2B agent codes (demo). Replace with backend validation later.
export const B2B_AGENT_CODES = ["AGENT2024", "ARR-B2B", "DEALER100"];

// Legacy print type placeholder
export type PrintType = { id: string; label: string; pricePerPc: number };
export const PRINT_TYPES: PrintType[] = [{ id: "none", label: "No Print", pricePerPc: 0 }];
export const findPrintType = (_id: string): PrintType => PRINT_TYPES[0];
