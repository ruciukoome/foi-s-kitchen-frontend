import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import wedding1 from "@/assets/wedding-1.jpg";
import wedding2 from "@/assets/wedding-2.jpg";
import corporate from "@/assets/corporate.jpg";
import kitchen1 from "@/assets/kitchen-1.jpg";
import kitchen2 from "@/assets/kitchen-2.jpg";
import nyama from "@/assets/menu-nyama.jpg";
import pilau from "@/assets/menu-pilau.jpg";
import cake from "@/assets/menu-mango-cake.jpg";
import platter from "@/assets/menu-fruit-platter.jpg";

export const galleryFilters = [
  "All",
  "Weddings",
  "Corporate",
  "Food",
  "Kitchen",
] as const;

export type GalleryFilter = (typeof galleryFilters)[number];

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  filter: Exclude<GalleryFilter, "All">;
};

// [PLACEHOLDER] Real event and food photography.
export const galleryItems: GalleryItem[] = [
  { id: "g1", src: wedding1, alt: "Wedding reception table setting", filter: "Weddings" },
  { id: "g2", src: hero2, alt: "Garden event buffet at golden hour", filter: "Weddings" },
  { id: "g3", src: wedding2, alt: "Canapés served at an outdoor wedding", filter: "Weddings" },
  { id: "g4", src: corporate, alt: "Boardroom lunch catering setup", filter: "Corporate" },
  { id: "g5", src: hero3, alt: "Meal prep containers ready for delivery", filter: "Corporate" },
  { id: "g6", src: hero1, alt: "Kenyan feast spread on a wooden table", filter: "Food" },
  { id: "g7", src: nyama, alt: "Grilled nyama choma on a wooden board", filter: "Food" },
  { id: "g8", src: pilau, alt: "Plate of beef pilau", filter: "Food" },
  { id: "g9", src: cake, alt: "Slice of mango cream cake", filter: "Food" },
  { id: "g10", src: platter, alt: "Tropical fruit platter", filter: "Food" },
  { id: "g11", src: kitchen1, alt: "Fresh vegetables prepped in the kitchen", filter: "Kitchen" },
  { id: "g12", src: kitchen2, alt: "Meals being packed into containers", filter: "Kitchen" },
];
