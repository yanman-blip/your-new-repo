import lingerieHero from "@/assets/lingerie-hero.jpg";
import lingerieSilk from "@/assets/lingerie-silk.jpg";
import lingerieRobe from "@/assets/lingerie-robe.jpg";
import lingerieBodysuit from "@/assets/lingerie-bodysuit.jpg";
import lingerieLace from "@/assets/lingerie-lace.jpg";

export type Collection = "Lace" | "Silk" | "Lounge" | "Everyday";

export type Product = {
  id: string;
  name: string;
  brand: Collection; // collection label, kept as `brand` for compatibility
  tagline: string;
  description: string;
  price: number;
  image: string;
  bg: string;
  accent: string;
  badge?: string;
  storage: string[]; // sizes — kept as `storage` for compatibility with existing UI
  colors: { name: string; hex: string }[];
  highlights: string[];
};

export const products: Product[] = [
  {
    id: "aurora-lace-set",
    name: "Aurora Lace Set",
    brand: "Lace",
    tagline: "Featherlight French lace, made to disappear.",
    description:
      "Our signature scalloped French lace bralette and matching brief — soft enough to sleep in, beautiful enough to be the only thing you wear.",
    price: 78,
    image: lingerieHero,
    bg: "bg-[oklch(0.94_0.04_15)]",
    accent: "text-[oklch(0.25_0.06_15)]",
    badge: "New",
    storage: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Blush", hex: "#f3c4cd" },
      { name: "Champagne", hex: "#e9d8b8" },
      { name: "Noir", hex: "#1c1c1e" },
    ],
    highlights: [
      "Hand-finished French Chantilly lace",
      "Buttery-soft modal lining",
      "No underwire, no bones, all-day comfort",
      "Coordinating brief included",
    ],
  },
  {
    id: "noir-silk-slip",
    name: "Noir Silk Slip",
    brand: "Silk",
    tagline: "100% mulberry silk. Cut on the bias. Liquid.",
    description:
      "A floor-skimming bias-cut slip in heavyweight 22-momme mulberry silk. The kind of piece that makes a Tuesday feel like an occasion.",
    price: 198,
    image: lingerieSilk,
    bg: "bg-[oklch(0.92_0.02_70)]",
    accent: "text-[oklch(0.2_0.04_60)]",
    badge: "Best seller",
    storage: ["XS", "S", "M", "L"],
    colors: [
      { name: "Noir", hex: "#1c1c1e" },
      { name: "Pearl", hex: "#ece4d6" },
      { name: "Bordeaux", hex: "#5a1f2a" },
    ],
    highlights: [
      "22-momme mulberry silk",
      "Bias cut for liquid drape",
      "Adjustable French-knot straps",
      "Hand-rolled hem",
    ],
  },
  {
    id: "cheri-satin-robe",
    name: "Chéri Satin Robe",
    brand: "Lounge",
    tagline: "The robe you'll never want to take off.",
    description:
      "Weighty satin, a generous wrap, and pockets where you need them. Equal parts loungewear and ceremony.",
    price: 128,
    image: lingerieRobe,
    bg: "bg-[oklch(0.95_0.02_85)]",
    accent: "text-[oklch(0.22_0.03_60)]",
    storage: ["XS / S", "M / L", "XL / XXL"],
    colors: [
      { name: "Ivory", hex: "#f3ead8" },
      { name: "Champagne", hex: "#e6cfa8" },
      { name: "Noir", hex: "#1c1c1e" },
    ],
    highlights: [
      "Heavyweight satin charmeuse",
      "Self-tie belt + interior tie",
      "Side-seam pockets",
      "Mid-calf length",
    ],
  },
  {
    id: "sage-seamless-bodysuit",
    name: "Sage Seamless Bodysuit",
    brand: "Everyday",
    tagline: "One piece. Zero seams. Wear it under everything.",
    description:
      "A second-skin bodysuit knit in a single seamless piece. Cool to the touch, four-way stretch, and so light you'll forget it.",
    price: 88,
    image: lingerieBodysuit,
    bg: "bg-[oklch(0.93_0.04_140)]",
    accent: "text-[oklch(0.25_0.05_140)]",
    storage: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Sage", hex: "#bccdb6" },
      { name: "Sand", hex: "#dccdb6" },
      { name: "Black", hex: "#1c1c1e" },
    ],
    highlights: [
      "Single-piece seamless knit",
      "Four-way stretch microfibre",
      "Snap-closure gusset",
      "Tagless, breathable, machine wash cold",
    ],
  },
  {
    id: "petale-lace-chemise",
    name: "Pétale Lace Chemise",
    brand: "Lace",
    tagline: "All-over floral lace, cut close, finished by hand.",
    description:
      "A short chemise in delicate floral lace with a sheer mesh inset. Romantic without being precious.",
    price: 118,
    image: lingerieLace,
    bg: "bg-[oklch(0.94_0.03_45)]",
    accent: "text-[oklch(0.22_0.04_30)]",
    badge: "Limited",
    storage: ["XS", "S", "M", "L"],
    colors: [
      { name: "Champagne", hex: "#e9d3b3" },
      { name: "Ivoire", hex: "#f1e7d3" },
      { name: "Noir", hex: "#1c1c1e" },
    ],
    highlights: [
      "All-over floral stretch lace",
      "Sheer mesh side panels",
      "Adjustable straps",
      "Above-the-knee length",
    ],
  },
  {
    id: "rosee-cotton-set",
    name: "Rosée Cotton Set",
    brand: "Everyday",
    tagline: "Everyday softness in heritage Pima cotton.",
    description:
      "A featherweight Pima cotton bralette and brief set with picot lace trim. The piece you'll reach for every day.",
    price: 64,
    image: lingerieHero,
    bg: "bg-[oklch(0.96_0.02_60)]",
    accent: "text-[oklch(0.22_0.03_30)]",
    storage: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Blush", hex: "#f3c4cd" },
      { name: "Ivory", hex: "#f1e7d3" },
      { name: "Sage", hex: "#bccdb6" },
    ],
    highlights: [
      "Long-staple Peruvian Pima cotton",
      "Picot lace trim",
      "Wireless, tagless, machine wash",
      "Coordinating brief included",
    ],
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
