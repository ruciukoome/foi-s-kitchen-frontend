import plan5 from "@/assets/plan-5-meals.jpg";
import plan10 from "@/assets/plan-10-meals.jpg";
import plan14 from "@/assets/plan-14-meals.jpg";

export type Plan = {
  id: string;
  name: string;
  price: number;
  cadence: string;
  image: string;
  includes: string[];
  tags: string[];
};

export const plans: Plan[] = [
  {
    id: "5-meals",
    name: "5 Meals",
    price: 4500,
    cadence: "per week",
    image: plan5,
    includes: [
      "5 portioned meals, delivered fresh weekly",
      "Protein, carb and veg in every box",
      "Delivered to your door step",
      "Swap dishes each week",
    ],
    tags: ["Weekly", "Balanced"],
  },
  {
    id: "10-meals",
    name: "10 Meals",
    price: 6800,
    cadence: "per week",
    image: plan10,
    includes: [
      "10 portioned meals, delivered fresh weekly",
      "Lunch and dinner covered",
      "Delivered to your door step",
      "Adjust for allergies and portion size",
    ],
    tags: ["Most popular", "Weekly"],
  },
  {
    id: "14-meals",
    name: "14 Meals",
    price: 9500,
    cadence: "per week",
    image: plan14,
    includes: [
      "14 portioned meals, delivered fresh weekly",
      "Two meals a day, all week",
      "Delivered to your door step",
      "Best value per meal",
    ],
    tags: ["Best value", "Weekly"],
  },
];
