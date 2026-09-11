export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
};

// [PLACEHOLDER] Real reviews to be dropped in.
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Wanjiru M.",
    role: "Wedding, Karen",
    quote:
      "Foi fed 180 guests and every single plate was hot. Guests still talk about the pilau.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Brian O.",
    role: "Office Manager, Westlands",
    quote:
      "We order team lunch every Friday. Always on time, always the same quality.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Aisha K.",
    role: "Meal prep client",
    quote:
      "The Lean & Light plan changed my week. I stopped skipping lunch entirely.",
    rating: 5,
  },
  {
    id: "t4",
    name: "Peter G.",
    role: "Birthday party, Kilimani",
    quote: "Booked on WhatsApp in ten minutes. The nyama choma was perfect.",
    rating: 5,
  },
];
