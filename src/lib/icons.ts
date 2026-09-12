import {
  Bike,
  ChefHat,
  ClipboardCheck,
  Clock,
  CookingPot,
  Heart,
  Leaf,
  MessageCircle,
  Salad,
  ShieldCheck,
  Sparkles,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** Icon names Foi can pick from in the CMS. */
export const iconMap: Record<string, LucideIcon> = {
  Leaf,
  ChefHat,
  MessageCircle,
  ClipboardCheck,
  CookingPot,
  Bike,
  Clock,
  Heart,
  Salad,
  ShieldCheck,
  Sparkles,
  Truck,
  UtensilsCrossed,
};

export const iconNames = Object.keys(iconMap);

export function iconFor(name?: string): LucideIcon {
  return (name && iconMap[name]) || Sparkles;
}
