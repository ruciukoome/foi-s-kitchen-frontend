/**
 * Seeds the Foi's Kitchen CMS: uploads every src/assets image to the "media"
 * storage bucket and fills each content table with the site's current copy.
 *
 *   bun run scripts/seed-cms.ts
 *
 * Safe to re-run: rows are matched on their natural key and updated.
 */
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env["EXT_SUPABASE_URL"];
const key = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
if (!url || !key) throw new Error("EXT_SUPABASE_URL / EXT_SUPABASE_SERVICE_ROLE_KEY missing");

const db = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = "media";
const ASSETS = join(process.cwd(), "src/assets");

const labelFor = (file: string) => {
  if (file.startsWith("menu-")) return "menu";
  if (file.startsWith("plan-")) return "plan";
  if (file.startsWith("hero-")) return "hero";
  if (file.startsWith("wedding-")) return "wedding";
  if (file.startsWith("kitchen-")) return "kitchen";
  if (file.startsWith("founder")) return "founder";
  if (file.startsWith("corporate")) return "service";
  if (file.startsWith("logo")) return "brand";
  return "general";
};

const mime = (file: string) =>
  extname(file) === ".png" ? "image/png" : extname(file) === ".webp" ? "image/webp" : "image/jpeg";

async function ensureBucket() {
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
    });
    if (error) throw error;
    console.log("created bucket:", BUCKET);
  }
}

/** filename -> media_assets id */
const media = new Map<string, string>();

async function uploadAssets() {
  const files = (await readdir(ASSETS)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  for (const file of files) {
    const body = await readFile(join(ASSETS, file));
    const path = `site/${file}`;
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(path, body, { contentType: mime(file), upsert: true, cacheControl: "31536000" });
    if (upErr) throw upErr;

    const publicUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const { data: existing } = await db
      .from("media_assets")
      .select("id")
      .eq("storage_path", path)
      .maybeSingle();

    if (existing) {
      media.set(file, existing.id as string);
      await db.from("media_assets").update({ url: publicUrl, label: labelFor(file) }).eq("id", existing.id);
    } else {
      const { data, error } = await db
        .from("media_assets")
        .insert({
          storage_path: path,
          url: publicUrl,
          label: labelFor(file),
          alt_text: file.replace(/\.[a-z]+$/i, "").replace(/-/g, " "),
        })
        .select("id")
        .single();
      if (error) throw error;
      media.set(file, data.id as string);
    }
  }
  console.log(`media_assets: ${media.size}`);
}

const img = (file: string) => media.get(file) ?? null;

/** Upsert rows matched on a natural key column. */
async function upsertRows(
  table: string,
  matchColumn: string,
  rows: Record<string, unknown>[],
) {
  for (const row of rows) {
    const { data: existing } = await db
      .from(table)
      .select("id")
      .eq(matchColumn, row[matchColumn] as string)
      .maybeSingle();
    const { error } = existing
      ? await db.from(table).update(row).eq("id", existing.id)
      : await db.from(table).insert(row);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  const { count } = await db.from(table).select("*", { count: "exact", head: true });
  console.log(`${table}: ${count}`);
}

async function seedMenu() {
  await upsertRows("menu_items", "name", [
    { name: "Mandazis", description: "Soft, lightly spiced mandazis, fried the morning they go out.", price: 500, category: "Breakfast", image_id: img("menu-mandazi.jpg"), diet_tags: ["Vegetarian"], sort_order: 1 },
    { name: "Pancakes", description: "Fluffy pancakes, stacked and ready for honey or syrup.", price: 750, category: "Breakfast", image_id: img("menu-pancakes.jpg"), diet_tags: ["Vegetarian"], sort_order: 2 },
    { name: "Sausages (10)", description: "Ten grilled beef sausages — breakfast trays or snack platters.", price: 500, category: "Breakfast", image_id: img("menu-sausages.jpg"), diet_tags: ["High protein"], sort_order: 3 },
    { name: "Pilau", description: "Slow-spiced pilau rice, served by the portion.", price: 250, category: "Mains", image_id: img("menu-pilau.jpg"), diet_tags: [], sort_order: 4 },
    { name: "Mshikaki Beef (10)", description: "Ten marinated beef skewers, charcoal-grilled with lime.", price: 1000, category: "Mains", image_id: img("menu-mshikaki.jpg"), diet_tags: ["High protein", "Gluten free"], sort_order: 5 },
    { name: "Cooked Samosas (20)", description: "Twenty crisp beef samosas, fried and ready to serve.", price: 1200, category: "Sides", image_id: img("menu-samosas-cooked.jpg"), diet_tags: ["High protein"], sort_order: 6 },
    { name: "Pre-cooked Samosas", description: "Folded and filled, ready to fry at home whenever you need them.", price: 1000, category: "Sides", image_id: img("menu-samosas-raw.jpg"), diet_tags: [], sort_order: 7 },
    { name: "Chapatis", description: "Soft layered chapatis, made to order for the table.", price: 1000, category: "Sides", image_id: img("menu-chapatis.jpg"), diet_tags: ["Vegetarian"], sort_order: 8 },
    { name: "Sautéed Potatoes", description: "Golden potatoes tossed with herbs — a simple, sturdy side.", price: 250, category: "Sides", image_id: img("menu-sauteed-potatoes.jpg"), diet_tags: ["Vegetarian", "Gluten free"], sort_order: 9 },
    { name: "Banana Bread", description: "A whole loaf, moist and lightly sweet. Great with chai.", price: 700, category: "Desserts", image_id: img("menu-banana-bread.jpg"), diet_tags: ["Vegetarian"], sort_order: 10 },
    { name: "Blueberry Cake", description: "Buttery sponge folded with blueberries, baked fresh.", price: 700, category: "Desserts", image_id: img("menu-blueberry-cake.jpg"), diet_tags: ["Vegetarian"], sort_order: 11 },
    { name: "Vanilla Loaf Cake", description: "Classic vanilla loaf — easy to slice, easy to share.", price: 450, category: "Desserts", image_id: img("menu-vanilla-loaf.jpg"), diet_tags: ["Vegetarian"], sort_order: 12 },
  ]);
}

async function seedServices() {
  await upsertRows("services", "category", [
    { category: "corporate", name: "Corporate Catering", description: "Office lunches, boardroom teas and full event catering that arrive hot and on time.", image_id: img("corporate.jpg"), sort_order: 1 },
    { category: "weddings", name: "Weddings & Private Events", description: "Menus built around your day — from intimate gatherings to 300-guest celebrations.", image_id: img("wedding-1.jpg"), sort_order: 2 },
    { category: "meal-prep", name: "Meal Prep Plans", description: "Fresh, portioned meals delivered weekly to your doorstep. Pick your plan, we cook.", image_id: img("plan-10-meals.jpg"), sort_order: 3 },
  ]);

  await upsertRows("service_tiers", "name", [
    { service_category: "corporate", name: "Desk Lunch", price: 650, unit: "per head", note: null, image_id: img("corporate.jpg"), cta_type: "quote", sort_order: 1, features: ["One main + one side", "Fresh juice or water", "Boxed and labelled", "Delivered by 12:30pm"] },
    { service_category: "corporate", name: "Meeting Spread", price: 1200, unit: "per head", note: null, image_id: img("corporate.jpg"), cta_type: "quote", sort_order: 2, features: ["Two mains + two sides", "Salad and dessert", "Chafing dishes and serving staff", "Setup 30 min before"] },
    { service_category: "corporate", name: "Company Event", price: 1900, unit: "per head", note: null, image_id: img("corporate.jpg"), cta_type: "quote", sort_order: 3, features: ["Full buffet, four mains", "Live nyama choma station", "Drinks station and desserts", "Full service team"] },
    { service_category: "weddings", name: "Intimate", price: 1800, unit: "per guest", note: "Up to 60 guests", image_id: img("wedding-1.jpg"), cta_type: "quote", sort_order: 1, features: ["Three-course plated or buffet", "Service team of four", "Crockery and chafing dishes", "Cake cutting service"] },
    { service_category: "weddings", name: "Celebration", price: 2400, unit: "per guest", note: "60 – 200 guests", image_id: img("hero-2.jpg"), cta_type: "quote", sort_order: 2, features: ["Five-dish buffet + dessert table", "Canapés on arrival", "Full service and clearing team", "Drinks station"] },
    { service_category: "weddings", name: "Grand", price: 3200, unit: "per guest", note: "200+ guests", image_id: img("wedding-2.jpg"), cta_type: "quote", sort_order: 3, features: ["Full buffet with live stations", "Dedicated event lead", "Bridal table service", "Late-night bites"] },
    { service_category: "meal-prep", name: "5 Meals", price: 4500, unit: "per week", note: null, image_id: img("plan-5-meals.jpg"), cta_type: "cart", sort_order: 1, features: ["5 portioned meals, delivered fresh weekly", "Protein, carb and veg in every box", "Delivered to your door step", "Swap dishes each week"] },
    { service_category: "meal-prep", name: "10 Meals", price: 6800, unit: "per week", note: null, image_id: img("plan-10-meals.jpg"), cta_type: "cart", sort_order: 2, features: ["10 portioned meals, delivered fresh weekly", "Lunch and dinner covered", "Delivered to your door step", "Adjust for allergies and portion size"] },
    { service_category: "meal-prep", name: "14 Meals", price: 9500, unit: "per week", note: null, image_id: img("plan-14-meals.jpg"), cta_type: "cart", sort_order: 3, features: ["14 portioned meals, delivered fresh weekly", "Two meals a day, all week", "Delivered to your door step", "Best value per meal"] },
  ]);

  await upsertRows("meal_plans", "name", [
    { name: "5 Meals", price: 4500, cadence: "per week", image_id: img("plan-5-meals.jpg"), sort_order: 1, tags: ["Weekly", "Balanced"], includes: ["5 portioned meals, delivered fresh weekly", "Protein, carb and veg in every box", "Delivered to your door step", "Swap dishes each week"] },
    { name: "10 Meals", price: 6800, cadence: "per week", image_id: img("plan-10-meals.jpg"), sort_order: 2, tags: ["Most popular", "Weekly"], includes: ["10 portioned meals, delivered fresh weekly", "Lunch and dinner covered", "Delivered to your door step", "Adjust for allergies and portion size"] },
    { name: "14 Meals", price: 9500, cadence: "per week", image_id: img("plan-14-meals.jpg"), sort_order: 3, tags: ["Best value", "Weekly"], includes: ["14 portioned meals, delivered fresh weekly", "Two meals a day, all week", "Delivered to your door step", "Best value per meal"] },
  ]);
}

async function seedTestimonials() {
  await upsertRows("testimonials", "name", [
    { name: "Wanjiru M.", role: "Wedding, Karen", quote: "Foi fed 180 guests and every single plate was hot. Guests still talk about the pilau.", rating: 5, sort_order: 1 },
    { name: "Brian O.", role: "Office Manager, Westlands", quote: "We order team lunch every Friday. Always on time, always the same quality.", rating: 5, sort_order: 2 },
    { name: "Aisha K.", role: "Meal prep client", quote: "The Lean & Light plan changed my week. I stopped skipping lunch entirely.", rating: 5, sort_order: 3 },
    { name: "Peter G.", role: "Birthday party, Kilimani", quote: "Booked on WhatsApp in ten minutes. The nyama choma was perfect.", rating: 5, sort_order: 4 },
  ]);
}

async function seedGallery() {
  await upsertRows("gallery_items", "caption", [
    { caption: "Wedding reception table setting", category: "Weddings", image_id: img("wedding-1.jpg"), sort_order: 1 },
    { caption: "Garden event buffet at golden hour", category: "Weddings", image_id: img("hero-2.jpg"), sort_order: 2 },
    { caption: "Canapés served at an outdoor wedding", category: "Weddings", image_id: img("wedding-2.jpg"), sort_order: 3 },
    { caption: "Boardroom lunch catering setup", category: "Corporate", image_id: img("corporate.jpg"), sort_order: 4 },
    { caption: "Meal prep containers ready for delivery", category: "Corporate", image_id: img("hero-3.jpg"), sort_order: 5 },
    { caption: "Kenyan feast spread on a wooden table", category: "Food", image_id: img("hero-1.jpg"), sort_order: 6 },
    { caption: "Grilled nyama choma on a wooden board", category: "Food", image_id: img("menu-nyama.jpg"), sort_order: 7 },
    { caption: "Plate of beef pilau", category: "Food", image_id: img("menu-pilau.jpg"), sort_order: 8 },
    { caption: "Slice of mango cream cake", category: "Food", image_id: img("menu-mango-cake.jpg"), sort_order: 9 },
    { caption: "Tropical fruit platter", category: "Food", image_id: img("menu-fruit-platter.jpg"), sort_order: 10 },
    { caption: "Fresh vegetables prepped in the kitchen", category: "Kitchen", image_id: img("kitchen-1.jpg"), sort_order: 11 },
    { caption: "Meals being packed into containers", category: "Kitchen", image_id: img("kitchen-2.jpg"), sort_order: 12 },
  ]);
}

const urlOf = (file: string) => db.storage.from(BUCKET).getPublicUrl(`site/${file}`).data.publicUrl;

async function seedSections() {
  const rows = [
    {
      page_slug: "home",
      section_key: "hero",
      sort_order: 1,
      content: {
        slides: [
          { id: "catering", eyebrow: "Nairobi · Catering & meal prep", title: "Home-style food, cooked fresh and delivered hot.", copy: "Catering for weddings, offices and family gatherings — 20 guests or 300.", cardLabel: "Catering", cardNote: "Events of any size", image: urlOf("hero-2.jpg"), to: "/quote", cta: "Request a quotation" },
          { id: "meal-prep", eyebrow: "Meal prep plans", title: "A week of good food, delivered on one day.", copy: "5, 10 or 14 meals prepped fresh and dropped at your door every week.", cardLabel: "Meal prep", cardNote: "From KSh 4,500", image: urlOf("hero-3.jpg"), to: "/services", category: "meal-prep", cta: "See the plans" },
          { id: "order", eyebrow: "Order online", title: "For the days you'd rather not cook.", copy: "Pick your plates, tell us where you are, and we'll bring them hot.", cardLabel: "Order today", cardNote: "Delivered hot", image: urlOf("menu-pilau.jpg"), to: "/order", cta: "Order now" },
          { id: "menu", eyebrow: "The menu", title: "Pilau, chapatis, samosas and everything in between.", copy: "Browse the full kitchen — breakfast, mains, sides and desserts.", cardLabel: "The menu", cardNote: "Browse everything", image: urlOf("hero-1.jpg"), to: "/menu", cta: "See the menu" },
        ],
      },
    },
    {
      page_slug: "home",
      section_key: "feature-icons",
      sort_order: 2,
      content: {
        items: [
          { icon: "Leaf", title: "Fresh daily", body: "Cooked the morning it's delivered. Never reheated stock." },
          { icon: "ChefHat", title: "Custom catering", body: "From 20-person office lunches to 300-guest weddings." },
          { icon: "MessageCircle", title: "WhatsApp support", body: "A real person replies. Usually within a few minutes." },
        ],
      },
    },
    {
      page_slug: "home",
      section_key: "how-it-works",
      sort_order: 3,
      content: {
        items: [
          { icon: "ClipboardCheck", title: "Order", body: "Pick your dishes or tell us about the event." },
          { icon: "MessageCircle", title: "Confirm", body: "We agree the menu, timing and price on WhatsApp." },
          { icon: "CookingPot", title: "Prepare", body: "Everything is cooked fresh in our Nairobi kitchen." },
          { icon: "Bike", title: "Deliver", body: "Hot, on time, wherever you are in the city." },
        ],
      },
    },
    {
      page_slug: "about",
      section_key: "hero",
      sort_order: 1,
      content: {
        eyebrow: "About us",
        title: "It started with Sunday lunch for the neighbours.",
        intro: "Foi's Kitchen grew out of a home kitchen in Nairobi where there was always one more plate. Today we cater events, prep weekly meals and deliver daily orders — with the same cooking.",
      },
    },
    {
      page_slug: "about",
      section_key: "founder-story",
      sort_order: 2,
      content: {
        eyebrow: "The founder",
        heading: '"If I wouldn\'t serve it to my family, it doesn\'t leave the kitchen."',
        paragraphs: [
          "[PLACEHOLDER] Foi trained at home before she ever trained professionally. What began as catering for friends' weddings turned into a full kitchen serving offices, families and celebrations across Nairobi.",
          "[PLACEHOLDER] She still writes every menu herself and tastes every pot before it goes out the door.",
        ],
        imageUrl: urlOf("founder.jpg"),
        imageAlt: "Foi in her kitchen",
      },
    },
    {
      page_slug: "about",
      section_key: "brand-values",
      sort_order: 3,
      content: {
        eyebrow: "What we stand for",
        heading: "Three things we don't bend on",
        items: [
          { title: "Cooked, not assembled", body: "Every sauce, stew and chapati is made from scratch on the day." },
          { title: "Clean kitchen, always", body: "Daily deep cleans, gloved handling, sealed containers, cold chain kept." },
          { title: "Say yes to people", body: "Dietary needs, late changes, tight budgets — we'll find a way." },
        ],
      },
    },
    {
      page_slug: "about",
      section_key: "hygiene",
      sort_order: 4,
      content: {
        eyebrow: "Inside the kitchen",
        heading: "Hygiene you can see",
        images: [urlOf("kitchen-1.jpg"), urlOf("kitchen-2.jpg")],
      },
    },
    {
      page_slug: "about",
      section_key: "numbers",
      sort_order: 5,
      content: {
        items: [
          { value: "8", label: "Years cooking for Nairobi" },
          { value: "600+", label: "Events served" },
          { value: "120", label: "Weekly meal prep clients" },
          { value: "4.9", label: "Average review score" },
        ],
      },
    },
    {
      page_slug: "services",
      section_key: "corporate",
      sort_order: 1,
      content: {
        eyebrow: "Office food that arrives on time and tastes like home.",
        bullets: ["Clear per-head pricing", "Minimum order: 20 people", "Orders confirmed at least 24 hours ahead"],
        tags: ["Kenyan classic", "Light & lean", "Plant forward"],
        whatsapp: "Hi Foi's Kitchen! I'd like corporate catering for my team.",
      },
    },
    {
      page_slug: "services",
      section_key: "weddings",
      sort_order: 2,
      content: {
        eyebrow: "The food people remember, long after the speeches.",
        bullets: ["Generous, home-style menus", "Weddings need at least 6 weeks’ notice", "Private parties need 2 weeks’ notice"],
        tags: ["Weddings", "Ruracios", "Birthdays", "Private parties"],
        whatsapp: "Hi Foi's Kitchen! I'm planning a wedding and would like to talk about catering.",
      },
    },
    {
      page_slug: "services",
      section_key: "meal-prep",
      sort_order: 3,
      content: {
        eyebrow: "Your week, cooked and portioned.",
        bullets: ["Cooked fresh and delivered weekly", "Sealed, labelled containers", "Adjusted for allergies and portion size"],
        tags: ["Weekly", "Balanced", "Most popular", "Best value"],
        whatsapp: "Hi Foi's Kitchen! I'd like help choosing a meal prep plan.",
      },
    },
    {
      page_slug: "global",
      section_key: "business-info",
      sort_order: 1,
      content: {
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
        mapEmbed: "https://www.google.com/maps?q=Kilimani,+Nairobi,+Kenya&output=embed",
      },
    },
  ];

  const { error } = await db
    .from("page_sections")
    .upsert(rows, { onConflict: "page_slug,section_key" });
  if (error) throw new Error(`page_sections: ${error.message}`);
  const { count } = await db.from("page_sections").select("*", { count: "exact", head: true });
  console.log(`page_sections: ${count}`);
}

await ensureBucket();
await uploadAssets();
await seedMenu();
await seedServices();
await seedTestimonials();
await seedGallery();
await seedSections();
console.log("seed complete");
