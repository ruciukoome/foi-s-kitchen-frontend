// [PLACEHOLDER] Business details — swap for the real ones when confirmed.
export const site = {
  name: "Foi's Kitchen",
  tagline: "Home-style food, cooked fresh for Nairobi.",
  phoneDisplay: "+254 758 996 440",
  phoneTel: "+254758996440",
  whatsapp: "254758996440",
  email: "hello@foiskitchen.co.ke",
  address: "Kilimani, Nairobi, Kenya",
  hours: [
    { day: "Mon – Fri", time: "7:00am – 8:00pm" },
    { day: "Saturday", time: "8:00am – 8:00pm" },
    { day: "Sunday", time: "9:00am – 5:00pm" },
  ],
  mapEmbed:
    "https://www.google.com/maps?q=Kilimani,+Nairobi,+Kenya&output=embed",
};

export function waLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const currency = (amount: number) =>
  `KSh ${amount.toLocaleString("en-KE")}`;
