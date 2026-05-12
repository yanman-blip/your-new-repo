import heroPhone from "@/assets/hero-phone.jpg";
import phoneFold from "@/assets/phone-fold.jpg";
import phonePro from "@/assets/phone-pro.jpg";
import phoneMini from "@/assets/phone-mini.jpg";

export type Brand = "Apple" | "Samsung";

export type Product = {
  id: string;
  name: string;
  brand: Brand;
  tagline: string;
  description: string;
  price: number;
  image: string;
  bg: string;
  accent: string;
  badge?: string;
  storage: string[];
  colors: { name: string; hex: string }[];
  highlights: string[];
};

export const products: Product[] = [
  {
    id: "iphone-17-pro",
    name: "iPhone 17 Pro",
    brand: "Apple",
    tagline: "Titanium. Cinematic. Unstoppable.",
    description:
      "The flagship reimagined. Aerospace-grade titanium, the all-new A19 Pro chip, and the most cinematic display ever on iPhone.",
    price: 1299,
    image: heroPhone,
    bg: "bg-[oklch(0.18_0.04_265)]",
    accent: "text-white",
    badge: "New",
    storage: ["256GB", "512GB", "1TB"],
    colors: [
      { name: "Titanium Black", hex: "#1c1c1e" },
      { name: "Titanium Natural", hex: "#b6a98a" },
      { name: "Titanium Blue", hex: "#3a4a6b" },
    ],
    highlights: [
      "6.3\" Super Retina XDR ProMotion",
      "A19 Pro chip with 6-core GPU",
      "48MP Pro camera system",
      "Up to 33h video playback",
    ],
  },
  {
    id: "iphone-air",
    name: "iPhone Air",
    brand: "Apple",
    tagline: "Impossibly thin. Surprisingly powerful.",
    description: "The thinnest iPhone ever made, with the power of A19 and an all-day battery in a featherlight body.",
    price: 999,
    image: phoneMini,
    bg: "bg-[oklch(0.92_0.06_165)]",
    accent: "text-[oklch(0.2_0.04_165)]",
    storage: ["128GB", "256GB", "512GB"],
    colors: [
      { name: "Sky", hex: "#a8d8d3" },
      { name: "Cloud", hex: "#f1f1f1" },
      { name: "Midnight", hex: "#1c1c1e" },
    ],
    highlights: ["5.5mm thin titanium frame", "A19 chip", "48MP Fusion camera", "All-day battery life"],
  },
  {
    id: "iphone-17",
    name: "iPhone 17",
    brand: "Apple",
    tagline: "Everyday brilliance, refined.",
    description: "All the iPhone essentials — beautifully redesigned, with a brighter display and faster chip.",
    price: 799,
    image: phonePro,
    bg: "bg-[oklch(0.88_0.06_70)]",
    accent: "text-[oklch(0.2_0.04_60)]",
    storage: ["128GB", "256GB", "512GB"],
    colors: [
      { name: "Starlight", hex: "#f5e8d0" },
      { name: "Black", hex: "#1c1c1e" },
      { name: "Pink", hex: "#f7c8d0" },
    ],
    highlights: ["6.1\" Super Retina XDR", "A19 chip", "Dual 48MP camera", "Up to 27h video playback"],
  },
  {
    id: "galaxy-z-fold-6",
    name: "Galaxy Z Fold 6",
    brand: "Samsung",
    tagline: "Two screens. Endless possibilities.",
    description:
      "Open up to a 7.6\" tablet-class display, then fold it to slip in your pocket. The most versatile phone Samsung has ever built.",
    price: 1899,
    image: phoneFold,
    bg: "bg-[oklch(0.85_0.10_330)]",
    accent: "text-[oklch(0.2_0.05_300)]",
    badge: "Foldable",
    storage: ["256GB", "512GB", "1TB"],
    colors: [
      { name: "Pink", hex: "#f3b5d9" },
      { name: "Silver Shadow", hex: "#bcbcbc" },
      { name: "Navy", hex: "#1c2a4a" },
    ],
    highlights: [
      "7.6\" QXGA+ Dynamic AMOLED 2X",
      "Snapdragon 8 Gen 3 for Galaxy",
      "50MP wide + 12MP ultra-wide",
      "Galaxy AI built in",
    ],
  },
  {
    id: "galaxy-s25-ultra",
    name: "Galaxy S25 Ultra",
    brand: "Samsung",
    tagline: "AI-powered. Pro-grade. Ultra.",
    description:
      "The most powerful Galaxy ever, with a 200MP camera, S Pen built in, and Galaxy AI that turns ideas into reality.",
    price: 1399,
    image: heroPhone,
    bg: "bg-[oklch(0.20_0.03_260)]",
    accent: "text-white",
    badge: "Best Seller",
    storage: ["256GB", "512GB", "1TB"],
    colors: [
      { name: "Titanium Black", hex: "#1c1c1e" },
      { name: "Titanium Gray", hex: "#7c7c80" },
      { name: "Titanium Silver", hex: "#cfcfcf" },
    ],
    highlights: ["6.9\" QHD+ Dynamic AMOLED", "Snapdragon 8 Elite", "200MP Pro camera", "Built-in S Pen"],
  },
  {
    id: "galaxy-z-flip-6",
    name: "Galaxy Z Flip 6",
    brand: "Samsung",
    tagline: "Compact by design. Bold by nature.",
    description: "Flip it open. Flip the script. Big-phone power in a pocket-sized form factor.",
    price: 999,
    image: phoneFold,
    bg: "bg-[oklch(0.90_0.05_300)]",
    accent: "text-[oklch(0.2_0.05_300)]",
    storage: ["256GB", "512GB"],
    colors: [
      { name: "Mint", hex: "#bce3c5" },
      { name: "Silver", hex: "#dcdcdc" },
      { name: "Yellow", hex: "#f5e07d" },
    ],
    highlights: ["6.7\" FHD+ Dynamic AMOLED 2X", "FlexWindow cover screen", "50MP main camera", "Galaxy AI"],
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
