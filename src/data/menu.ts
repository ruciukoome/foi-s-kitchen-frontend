import mandazi from "@/assets/menu-mandazi.jpg";
import pancakes from "@/assets/menu-pancakes.jpg";
import sausages from "@/assets/menu-sausages.jpg";
import pilau from "@/assets/menu-pilau.jpg";
import mshikaki from "@/assets/menu-mshikaki.jpg";
import samosasCooked from "@/assets/menu-samosas-cooked.jpg";
import samosasRaw from "@/assets/menu-samosas-raw.jpg";
import chapatis from "@/assets/menu-chapatis.jpg";
import sauteedPotatoes from "@/assets/menu-sauteed-potatoes.jpg";
import bananaBread from "@/assets/menu-banana-bread.jpg";
import blueberryCake from "@/assets/menu-blueberry-cake.jpg";
import vanillaLoaf from "@/assets/menu-vanilla-loaf.jpg";

export const categories = ["Breakfast", "Mains", "Sides", "Desserts"] as const;

export type Category = (typeof categories)[number];
export type Diet = "Vegetarian" | "Vegan" | "High protein" | "Gluten free";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  diet: Diet[];
};

export const menuItems: MenuItem[] = [
  {
    id: "mandazis",
    name: "Mandazis",
    description: "Soft, lightly spiced mandazis, fried the morning they go out.",
    price: 500,
    category: "Breakfast",
    image: mandazi,
    diet: ["Vegetarian"],
  },
  {
    id: "pancakes",
    name: "Pancakes",
    description: "Fluffy pancakes, stacked and ready for honey or syrup.",
    price: 750,
    category: "Breakfast",
    image: pancakes,
    diet: ["Vegetarian"],
  },
  {
    id: "sausages",
    name: "Sausages (10)",
    description: "Ten grilled beef sausages — breakfast trays or snack platters.",
    price: 500,
    category: "Breakfast",
    image: sausages,
    diet: ["High protein"],
  },
  {
    id: "pilau",
    name: "Pilau",
    description: "Slow-spiced pilau rice, served by the portion.",
    price: 250,
    category: "Mains",
    image: pilau,
    diet: [],
  },
  {
    id: "mshikaki",
    name: "Mshikaki Beef (10)",
    description: "Ten marinated beef skewers, charcoal-grilled with lime.",
    price: 1000,
    category: "Mains",
    image: mshikaki,
    diet: ["High protein", "Gluten free"],
  },
  {
    id: "samosas-cooked",
    name: "Cooked Samosas (20)",
    description: "Twenty crisp beef samosas, fried and ready to serve.",
    price: 1200,
    category: "Sides",
    image: samosasCooked,
    diet: ["High protein"],
  },
  {
    id: "samosas-precooked",
    name: "Pre-cooked Samosas",
    description: "Folded and filled, ready to fry at home whenever you need them.",
    price: 1000,
    category: "Sides",
    image: samosasRaw,
    diet: [],
  },
  {
    id: "chapatis",
    name: "Chapatis",
    description: "Soft layered chapatis, made to order for the table.",
    price: 1000,
    category: "Sides",
    image: chapatis,
    diet: ["Vegetarian"],
  },
  {
    id: "sauteed-potatoes",
    name: "Sautéed Potatoes",
    description: "Golden potatoes tossed with herbs — a simple, sturdy side.",
    price: 250,
    category: "Sides",
    image: sauteedPotatoes,
    diet: ["Vegetarian", "Gluten free"],
  },
  {
    id: "banana-bread",
    name: "Banana Bread",
    description: "A whole loaf, moist and lightly sweet. Great with chai.",
    price: 700,
    category: "Desserts",
    image: bananaBread,
    diet: ["Vegetarian"],
  },
  {
    id: "blueberry-cake",
    name: "Blueberry Cake",
    description: "Buttery sponge folded with blueberries, baked fresh.",
    price: 700,
    category: "Desserts",
    image: blueberryCake,
    diet: ["Vegetarian"],
  },
  {
    id: "vanilla-loaf",
    name: "Vanilla Loaf Cake",
    description: "Classic vanilla loaf — easy to slice, easy to share.",
    price: 450,
    category: "Desserts",
    image: vanillaLoaf,
    diet: ["Vegetarian"],
  },
];
