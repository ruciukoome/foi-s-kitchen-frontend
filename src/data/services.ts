import corporate from "@/assets/corporate.jpg";
import wedding from "@/assets/wedding-1.jpg";
import mealPrep from "@/assets/plan-10-meals.jpg";

export type Service = {
  id: string;
  name: string;
  description: string;
  image: string;
  to: string;
  category: "corporate" | "weddings" | "meal-prep";
};

export const services: Service[] = [
  {
    id: "corporate",
    name: "Corporate Catering",
    description: "Office lunches, boardroom teas and full event catering that arrive hot and on time.",
    image: corporate,
    to: "/services?category=corporate",
    category: "corporate",
  },
  {
    id: "weddings",
    name: "Weddings & Private Events",
    description: "Menus built around your day — from intimate gatherings to 300-guest celebrations.",
    image: wedding,
    to: "/services?category=weddings",
    category: "weddings",
  },
  {
    id: "meal-prep",
    name: "Meal Prep Plans",
    description: "Fresh, portioned meals delivered weekly to your doorstep. Pick your plan, we cook.",
    image: mealPrep,
    to: "/services?category=meal-prep",
    category: "meal-prep",
  },
];
