import heroPhone from "@/assets/hero-phone.jpg";
import phoneFold from "@/assets/phone-fold.jpg";
import phonePro from "@/assets/phone-pro.jpg";
import phoneMini from "@/assets/phone-mini.jpg";

export type Product = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  image: string;
  bg: string;
  accent: string;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "orbit-pro",
    name: "Orbit Pro 17",
    tagline: "Titanium. Cinematic. Unstoppable.",
    price: 1299,
    image: heroPhone,
    bg: "bg-[oklch(0.18_0.04_265)]",
    accent: "text-white",
    badge: "New",
  },
  {
    id: "orbit-fold",
    name: "Orbit Fold X",
    tagline: "Two screens. Endless possibilities.",
    price: 1799,
    image: phoneFold,
    bg: "bg-[oklch(0.85_0.10_330)]",
    accent: "text-[oklch(0.2_0.05_300)]",
    badge: "Foldable",
  },
  {
    id: "orbit-air",
    name: "Orbit Air",
    tagline: "Effortless power, refined design.",
    price: 899,
    image: phonePro,
    bg: "bg-[oklch(0.88_0.06_70)]",
    accent: "text-[oklch(0.2_0.04_60)]",
  },
  {
    id: "orbit-mini",
    name: "Orbit Mini",
    tagline: "Small body. Big personality.",
    price: 699,
    image: phoneMini,
    bg: "bg-[oklch(0.92_0.06_165)]",
    accent: "text-[oklch(0.2_0.04_165)]",
  },
];
