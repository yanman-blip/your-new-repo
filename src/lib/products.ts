import { supabase } from "@/integrations/supabase/client";

export type Collection = "Lace" | "Silk" | "Lounge" | "Everyday";

export type Product = {
  id: string;
  name: string;
  brand: Collection; // collection label, kept as `brand` for compatibility
  tagline: string;
  description: string;
  price: number;
  image: string;
  gallery?: string[];
  bg: string;
  accent: string;
  badge?: string;
  storage: string[]; // sizes - kept as `storage` for compatibility with existing UI
  colors: { name: string; hex: string }[];
  highlights: string[];
};

export const baseProducts: Product[] = [
  {
    "id": "1-set-womens-sexy-lingerie-black-sheer-backless-bodysuit-garter-stockings-pantyh",
    "name": "1 Set Women's Sexy Lingerie Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose Heart Pattern Design No Need To Remove Convenient For Play Hollow-Out Design Seductive Full Of Love Ideal For Valentine's Day",
    "brand": "Lace",
    "tagline": "1 Set Women's Sexy Lingerie Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose Heart Pattern Design No Need To Remove Convenient For Play Hollow-Out Design Seductive Full Of Love Ideal For Valentine's Day - boutique pick for your collection.",
    "description": "Imported from your public catalog: 1 Set Women's Sexy Lingerie Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose Heart Pattern Design No Need To Remove Convenient For Play Hollow-Out Design Seductive Full Of Love Ideal For Valentine's Day.",
    "price": 12,
    "image": "/1 Set Women's Sexy Lingerie, Black Sheer Backless Bodysuit + Garter Stockings + Pantyhose, Heart Pattern Design, No Need To Remove, Convenient For Play, Hollow-Out Design, Seductive, Full Of Love, Ideal For Valentine's Day/1746022225321e3a921929caf887c4d4ec193805e2_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "1pc-women-sexy-lingerie-bodysuit-sexy-fishnet-cover-up-without-bikini-for-music-",
    "name": "1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit",
    "brand": "Lace",
    "tagline": "1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit - boutique pick for your collection.",
    "description": "Imported from your public catalog: 1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit.",
    "price": 13,
    "image": "/1PC Women Sexy Lingerie Bodysuit Sexy Fishnet Cover Up Without Bikini For Music Festival Hollow Out Bodycon Dress See Through Beachwear Summer Women's Swimwear Clothing Swimsuit/17473763427c366c313e2b41b2c3a7fb6c654004b7_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "2-pcs-undercover-seductive-wear",
    "name": "2 PCs undercover seductive wear",
    "brand": "Lace",
    "tagline": "2 PCs undercover seductive wear - boutique pick for your collection.",
    "description": "Imported from your public catalog: 2 PCs undercover seductive wear.",
    "price": 14,
    "image": "/2 PCs undercover seductive wear/black/1670032236228213049aa2af646d63c3bea1ce12a8_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "2pcs-set-dark-aesthetic-sexy-lingerie-set-3pcs-women-lace-bra-and-panty-set-with",
    "name": "2pcs Set Dark Aesthetic Sexy Lingerie Set 3pcs Women Lace Bra And Panty Set With Underwire And No Padding Suitable For Outerwear Create A Bad Girl Look",
    "brand": "Lace",
    "tagline": "2pcs Set Dark Aesthetic Sexy Lingerie Set 3pcs Women Lace Bra And Panty Set With Underwire And No Padding Suitable For Outerwear Create A Bad Girl Look - boutique pick for your collection.",
    "description": "Imported from your public catalog: 2pcs Set Dark Aesthetic Sexy Lingerie Set 3pcs Women Lace Bra And Panty Set With Underwire And No Padding Suitable For Outerwear Create A Bad Girl Look.",
    "price": 15,
    "image": "/2pcs Set Dark Aesthetic Sexy Lingerie Set, 3pcs Women Lace Bra And Panty Set With Underwire And No Padding, Suitable For Outerwear, Create A Bad Girl Look/BLACK/17563681270439f097dcfeb878a6769bc9eab21392_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "2pcs-womens-sexy-lingerie-set-lace-satin-splice-sexy-club-outfit-suitable-for-ho",
    "name": "2pcs Women's Sexy Lingerie Set Lace & Satin Splice Sexy Club Outfit Suitable For Home Holiday Party Romantic Occasions",
    "brand": "Lounge",
    "tagline": "2pcs Women's Sexy Lingerie Set Lace & Satin Splice Sexy Club Outfit Suitable For Home Holiday Party Romantic Occasions - boutique pick for your collection.",
    "description": "Imported from your public catalog: 2pcs Women's Sexy Lingerie Set Lace & Satin Splice Sexy Club Outfit Suitable For Home Holiday Party Romantic Occasions.",
    "price": 16,
    "image": "/2pcs Women's Sexy Lingerie Set, Lace & Satin Splice Sexy Club Outfit, Suitable For Home, Holiday, Party, Romantic Occasions/1749515992f90a09684a2558430f3c4ce6906325ae_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "3pcs-sexy-lingerie-set-for-women-with-underwire-bra-g-string-and-mini-skirt",
    "name": "3pcs Sexy Lingerie Set For Women (With Underwire Bra G-String And Mini Skirt)",
    "brand": "Lace",
    "tagline": "3pcs Sexy Lingerie Set For Women (With Underwire Bra G-String And Mini Skirt) - boutique pick for your collection.",
    "description": "Imported from your public catalog: 3pcs Sexy Lingerie Set For Women (With Underwire Bra G-String And Mini Skirt).",
    "price": 17,
    "image": "/3pcs Sexy Lingerie Set For Women (With Underwire Bra, G-String, And Mini Skirt)/17674949420ceba769f5d12919145a03aaf886f17f_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "3pcs-womens-black-sexy-patent-leather-metallic-strap-halloween-costume-mesh-slit",
    "name": "3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set Suitable For Home Private Party Or Nightclub Wear Sexy Lingerie",
    "brand": "Lace",
    "tagline": "3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set Suitable For Home Private Party Or Nightclub Wear Sexy Lingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: 3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set Suitable For Home Private Party Or Nightclub Wear Sexy Lingerie.",
    "price": 12,
    "image": "/3pcs Women's Black Sexy Patent Leather Metallic Strap Halloween Costume Mesh Slit Maxi Dress Lingerie Set, Suitable For Home, Private Party Or Nightclub Wear, Sexy Lingerie/175394207917e55770b830b744c9600e556222f67e_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "3pcs-womens-sexy-lingerie-set-front-hook-34-cup-bra-with-adjustable-straps-and-m",
    "name": "3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor Adjustable Garter Belt And Sexy Thong. Lace Accents Comfortable Lingerie Set Suitable For Elegant Occ",
    "brand": "Lace",
    "tagline": "3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor Adjustable Garter Belt And Sexy Thong. Lace Accents Comfortable Lingerie Set Suitable For Elegant Occ - boutique pick for your collection.",
    "description": "Imported from your public catalog: 3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor Adjustable Garter Belt And Sexy Thong. Lace Accents Comfortable Lingerie Set Suitable For Elegant Occ.",
    "price": 13,
    "image": "/3pcs Women's Sexy Lingerie Set Front Hook 34 Cup Bra With Adjustable Straps And Metal Chain Decor, Adjustable Garter Belt, And Sexy Thong. Lace Accents, Comfortable Lingerie Set Suitable For Elegant Occ/BLACK/1749092202370a3138523fb21387aa45fc44fe91c2_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "4pcs-mature-series-lace-patchwork-underwire-bodycon-dress-set",
    "name": "4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set",
    "brand": "Lace",
    "tagline": "4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set - boutique pick for your collection.",
    "description": "Imported from your public catalog: 4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set.",
    "price": 14,
    "image": "/4pcs Mature Series Lace Patchwork Underwire Bodycon Dress Set/black/172871697512cbf3ccaaaeca9aa85fd76df226d34d_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "4pcs-womens-punk-style-choker-with-spaghetti-strap-garter-belt-leg-ring-and-sexy",
    "name": "4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie",
    "brand": "Lace",
    "tagline": "4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: 4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie.",
    "price": 15,
    "image": "/4pcs Women's Punk Style Choker With Spaghetti Strap Garter Belt & Leg Ring And Sexy Ruffle Dress Set Lingerie/171806864869c8f8a5884cac96640e41d515763e15_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "chasethenight-2pcs-women-sexy-mesh-lingerie-set-for-going-out-lingerie-for-women",
    "name": "ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out Lingerie For Women Sexy Valentine's Day Sexy Lingerie",
    "brand": "Lace",
    "tagline": "ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out Lingerie For Women Sexy Valentine's Day Sexy Lingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out Lingerie For Women Sexy Valentine's Day Sexy Lingerie.",
    "price": 16,
    "image": "/ChaseTheNight 2pcs Women Sexy Mesh Lingerie Set For Going Out, Lingerie For Women,Sexy,Valentine's Day,Sexy Lingerie,/black/17418625425253c235d0e4b40efad744effd139943_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "crystal-vow-hollow-out-scallop-trim-lace-panty-lingerie-bridallingerie",
    "name": "Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie",
    "brand": "Lace",
    "tagline": "Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie - boutique pick for your collection.",
    "description": "Imported from your public catalog: Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie.",
    "price": 17,
    "image": "/Crystal Vow Hollow Out Scallop Trim Lace Panty Lingerie Bridallingerie/black/1703813861e16c7eb32332f898e2e429b76ebebe7b_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "empressenvy-womens-classic-sexy-black-lace-semi-sheer-babydoll-with-cut-out-deta",
    "name": "EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap Short Length Lingerie Set Baddie Look",
    "brand": "Lace",
    "tagline": "EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap Short Length Lingerie Set Baddie Look - boutique pick for your collection.",
    "description": "Imported from your public catalog: EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap Short Length Lingerie Set Baddie Look.",
    "price": 12,
    "image": "/EmpressEnvy Women's Classic Sexy Black Lace Semi Sheer Babydoll With Cut Out Details And Spaghetti Strap, Short Length Lingerie Set, Baddie Look/black/1772607749b43cdb6d086c5696a54df4ecae69474a_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "floral-underwire-puff-sleeve-lace-patchwork-top-thong-skirt-3pcs-set-bridal-ling",
    "name": "Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set Going Out",
    "brand": "Lace",
    "tagline": "Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set Going Out - boutique pick for your collection.",
    "description": "Imported from your public catalog: Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set Going Out.",
    "price": 13,
    "image": "/Floral Underwire Puff Sleeve Lace Patchwork Top + Thong + Skirt 3pcs Set Bridal Lingerie Set, Going Out/17200713865ac2497ceedd0dd6e15d95e15ea798a9_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "hollow-out-leopard-print-wrap-around-sexy-lingerie-for-going-out",
    "name": "Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out",
    "brand": "Lace",
    "tagline": "Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out - boutique pick for your collection.",
    "description": "Imported from your public catalog: Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out.",
    "price": 14,
    "image": "/Hollow Out Leopard Print Wrap-Around Sexy Lingerie For Going Out/172135882235d10006bbb27007f4fd4e5a03da08b9_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "ladies-sexy-pu-leather-backless-halter-neck-lingerie-dress",
    "name": "Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress",
    "brand": "Lace",
    "tagline": "Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress - boutique pick for your collection.",
    "description": "Imported from your public catalog: Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress.",
    "price": 15,
    "image": "/Ladies' Sexy Pu Leather Backless Halter Neck Lingerie Dress/1733913680dd2435df435fdf12e33eb3bbd6dd44b9_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "plus-size-lingerie-hollow-out-cover-up-sheer-solid-color-high-elasticity-lace-dr",
    "name": "Plus Size Lingerie Hollow Out Cover-Up Sheer Solid Color High Elasticity Lace Dress",
    "brand": "Lace",
    "tagline": "Plus Size Lingerie Hollow Out Cover-Up Sheer Solid Color High Elasticity Lace Dress - boutique pick for your collection.",
    "description": "Imported from your public catalog: Plus Size Lingerie Hollow Out Cover-Up Sheer Solid Color High Elasticity Lace Dress.",
    "price": 16,
    "image": "/Plus Size Lingerie, Hollow Out Cover-Up, Sheer Solid Color High Elasticity Lace Dress/black/172319711197d8b2c0bee3cb51cc4b46ad769849ef_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "seduluxe-1pc-lace-front-closure-wireless-bra-for-women",
    "name": "Seduluxe 1pc Lace Front Closure Wireless Bra For Women",
    "brand": "Lace",
    "tagline": "Seduluxe 1pc Lace Front Closure Wireless Bra For Women - boutique pick for your collection.",
    "description": "Imported from your public catalog: Seduluxe 1pc Lace Front Closure Wireless Bra For Women.",
    "price": 17,
    "image": "/Seduluxe 1pc Lace Front Closure Wireless Bra For Women/17665634013ea16b4f7e41bd4b5453a812e2821723_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "sleeveless-sexy-bandage-dress-elegant-black-white-round-neck-long-fitted-design-",
    "name": "Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem Tie Detail Suitable For Summer Party & Evening Wear",
    "brand": "Lace",
    "tagline": "Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem Tie Detail Suitable For Summer Party & Evening Wear - boutique pick for your collection.",
    "description": "Imported from your public catalog: Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem Tie Detail Suitable For Summer Party & Evening Wear.",
    "price": 12,
    "image": "/Sleeveless Sexy Bandage Dress - Elegant Black & White Round Neck Long Fitted Design - Slit Hem, Tie Detail, Suitable For Summer Party & Evening Wear/1740214819109aa8bb843d14d0635e1cdfd731200c_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "solid-color-hollow-out-mesh-bra-and-triangle-underwear-sexy-lingerie-set-2pcs-fo",
    "name": "Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set 2pcs. For Going Out",
    "brand": "Lace",
    "tagline": "Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set 2pcs. For Going Out - boutique pick for your collection.",
    "description": "Imported from your public catalog: Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set 2pcs. For Going Out.",
    "price": 13,
    "image": "/Solid Color Hollow Out Mesh Bra And Triangle Underwear Sexy Lingerie Set, 2pcs. For Going Out/17183471834525119197fbde4123ff4d5bb4ffc2b7_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "sxy-commute-minimalist-office-old-money-simple-womens-striped-hollow-out-patchwo",
    "name": "SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings Everyday Casual Wear",
    "brand": "Everyday",
    "tagline": "SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings Everyday Casual Wear - boutique pick for your collection.",
    "description": "Imported from your public catalog: SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings Everyday Casual Wear.",
    "price": 14,
    "image": "/SXY Commute Minimalist Office Old Money Simple Women's Striped Hollow Out Patchwork Skinny Leggings, Everyday Casual Wear/BLACK/170548244174619fb6b70dd4cabf6561ab0a7fca7a_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "badge": "New",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "womens-fashionable-tie-dye-slim-flared-long-pants",
    "name": "Women's Fashionable Tie Dye Slim Flared Long Pants",
    "brand": "Everyday",
    "tagline": "Women's Fashionable Tie Dye Slim Flared Long Pants - boutique pick for your collection.",
    "description": "Imported from your public catalog: Women's Fashionable Tie Dye Slim Flared Long Pants.",
    "price": 15,
    "image": "/Women's Fashionable Tie Dye Slim Flared Long Pants/17114260010f674ff4cd464a34df19efdabc46a7e8_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "womens-high-waist-solid-color-flare-yoga-leggings-workout-running-fitness-pants-",
    "name": "Women's High Waist Solid Color Flare Yoga Leggings Workout Running Fitness Pants Black Spring",
    "brand": "Everyday",
    "tagline": "Women's High Waist Solid Color Flare Yoga Leggings Workout Running Fitness Pants Black Spring - boutique pick for your collection.",
    "description": "Imported from your public catalog: Women's High Waist Solid Color Flare Yoga Leggings Workout Running Fitness Pants Black Spring.",
    "price": 16,
    "image": "/Women's High Waist Solid Color Flare Yoga Leggings, Workout Running Fitness Pants Black Spring/black/174408129146654656e74be917ca457b3eebbb0aec_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  },
  {
    "id": "womens-solid-color-halter-lace-sexy-bra-and-panty-set",
    "name": "Women's Solid Color Halter Lace Sexy Bra And Panty Set",
    "brand": "Lace",
    "tagline": "Women's Solid Color Halter Lace Sexy Bra And Panty Set - boutique pick for your collection.",
    "description": "Imported from your public catalog: Women's Solid Color Halter Lace Sexy Bra And Panty Set.",
    "price": 17,
    "image": "/Women's Solid Color Halter Lace Sexy Bra And Panty Set/17008956254cfda8afcbc659e4bcb1348649747124_thumbnail_600x.jpg",
    "bg": "bg-[oklch(0.94_0.03_30)]",
    "accent": "text-[oklch(0.22_0.04_30)]",
    "storage": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#1c1c1e"
      },
      {
        "name": "White",
        "hex": "#f5f3ee"
      }
    ],
    "highlights": [
      "Curated from your uploaded public assets",
      "Comfort-forward fit",
      "Boutique catalog styling",
      "Available while stock lasts"
    ]
  }
];

const CUSTOM_PRODUCTS_KEY = "joys-closet-custom-products-v1";
type ProductsListener = () => void;
const productListeners = new Set<ProductsListener>();

function getOptionalSupabase(): any | null {
  try {
    return supabase as any;
  } catch {
    return null;
  }
}

function readCustomProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(products));
}

function notifyProductsChanged() {
  productListeners.forEach((listener) => listener());
}

export function subscribeProducts(listener: ProductsListener) {
  productListeners.add(listener);
  return () => productListeners.delete(listener);
}

export function getProducts(): Product[] {
  const customProducts = readCustomProducts();
  if (customProducts.length === 0) return baseProducts;
  return [...customProducts, ...baseProducts.filter((p) => !customProducts.some((c) => c.id === p.id))];
}

export function createCustomProduct(input: {
  name: string;
  brand: Collection;
  price: number;
  image: string;
  gallery?: string[];
  tagline?: string;
  description?: string;
  badge?: string;
  colors?: { name: string; hex: string }[];
  storage?: string[];
  highlights?: string[];
}) {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84);

  const id = `${slug}-${Date.now().toString().slice(-6)}`;
  const next: Product = {
    id,
    name: input.name,
    brand: input.brand,
    price: input.price,
    image: input.image,
    gallery: input.gallery && input.gallery.length > 0 ? input.gallery : [input.image],
    tagline: input.tagline?.trim() || `${input.name} - new arrival from admin catalog.`,
    description: input.description?.trim() || input.name,
    badge: input.badge?.trim() || "New",
    storage: input.storage && input.storage.length > 0 ? input.storage : ["S", "M", "L", "XL"],
    colors: input.colors && input.colors.length > 0 ? input.colors : [{ name: "Black", hex: "#1c1c1e" }],
    highlights: input.highlights && input.highlights.length > 0 ? input.highlights : [
      "Added from admin panel",
      "Limited availability",
      "Curated boutique catalog",
    ],
    bg: "bg-[oklch(0.94_0.03_30)]",
    accent: "text-[oklch(0.22_0.04_30)]",
  };

  const customProducts = readCustomProducts();
  writeCustomProducts([next, ...customProducts]);
  notifyProductsChanged();

  const client = getOptionalSupabase();
  if (client) {
    void client.from("products").upsert({
      id: next.id,
      name: next.name,
      brand: next.brand,
      price: next.price,
      image: next.image,
      is_published: true,
      payload: next,
    });
  }

  return next;
}

export function getCustomProducts(): Product[] {
  return readCustomProducts();
}

export function updateCustomProduct(
  id: string,
  input: {
    name: string;
    brand: Collection;
    price: number;
    image: string;
    gallery?: string[];
    tagline?: string;
    description?: string;
    badge?: string;
    colors?: { name: string; hex: string }[];
    storage?: string[];
    highlights?: string[];
  },
): Product | null {
  const customProducts = readCustomProducts();
  const index = customProducts.findIndex((p) => p.id === id);
  if (index < 0) return null;

  const prev = customProducts[index];
  const next: Product = {
    ...prev,
    id,
    name: input.name,
    brand: input.brand,
    price: input.price,
    image: input.image,
    gallery: input.gallery && input.gallery.length > 0 ? input.gallery : [input.image],
    tagline: input.tagline?.trim() || `${input.name} - updated from admin catalog.`,
    description: input.description?.trim() || input.name,
    badge: input.badge?.trim() || prev.badge || "New",
    storage: input.storage && input.storage.length > 0 ? input.storage : prev.storage,
    colors: input.colors && input.colors.length > 0 ? input.colors : prev.colors,
    highlights: input.highlights && input.highlights.length > 0 ? input.highlights : prev.highlights,
  };

  const updated = [...customProducts];
  updated[index] = next;
  writeCustomProducts(updated);
  notifyProductsChanged();

  const client = getOptionalSupabase();
  if (client) {
    void client
      .from("products")
      .upsert({
        id: next.id,
        name: next.name,
        brand: next.brand,
        price: next.price,
        image: next.image,
        is_published: true,
        payload: next,
      });
  }

  return next;
}

export function deleteCustomProduct(id: string): boolean {
  const customProducts = readCustomProducts();
  const next = customProducts.filter((p) => p.id !== id);
  if (next.length === customProducts.length) return false;
  writeCustomProducts(next);
  notifyProductsChanged();

  const client = getOptionalSupabase();
  if (client) {
    void client.from("products").delete().eq("id", id);
  }

  return true;
}

export async function fetchCustomProducts(): Promise<Product[]> {
  const client = getOptionalSupabase();
  if (!client) return readCustomProducts();

  try {
    const { data, error } = await client
      .from("products")
      .select("payload, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    if (error || !data) return readCustomProducts();

    const remote = data
      .map((row: any) => row?.payload as Product | null)
      .filter(Boolean) as Product[];

    if (remote.length === 0) return readCustomProducts();
    writeCustomProducts(remote);
    notifyProductsChanged();
    return remote;
  } catch {
    return readCustomProducts();
  }
}

export const products: Product[] = getProducts();

export const getProduct = (id: string) => getProducts().find((p) => p.id === id);
