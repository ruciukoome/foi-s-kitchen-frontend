export type SpreadGroup = { key: string; title: string; options: string[] };
export type SpreadConfig = { groups: SpreadGroup[] };

export const defaultSpread: SpreadConfig = {
  groups: [
    {
      key: "proteins",
      title: "Proteins",
      options: ["Slow-stewed goat (mbuzi)", "Herb-roasted chicken", "Beef stew", "Grilled tilapia", "Bean & lentil stew (veg)"],
    },
    {
      key: "starches",
      title: "Starches",
      options: ["Steamed arrow roots (ndūma)", "Roasted sweet potatoes", "Spiced pilau", "Soft chapati", "Steamed rice"],
    },
    {
      key: "sides",
      title: "Veggies & sides",
      options: ["French beans & broccoli", "Roasted cauliflower", "Garden salad", "Kachumbari", "Sautéed greens"],
    },
    {
      key: "dietary",
      title: "Dietary needs",
      options: ["Vegetarian guests", "Gluten-free", "Salt-conscious", "Diabetic-friendly", "Halal"],
    },
  ],
};
