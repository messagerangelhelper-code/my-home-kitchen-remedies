// Kitchen Nutrition: everyday recipes that add nutrients to a balanced diet.
// These are food, not remedies: never say they treat, cure or prevent anything.
// Nutrient facts come from the NIH Office of Dietary Supplements fact sheets.

const ODS = (name, slug) => ({ name: `NIH Office of Dietary Supplements: ${name}`, url: `https://ods.od.nih.gov/factsheets/${slug}-Consumer/` });

export const NUTRITION = [
  {
    id: "whole-body-smoothie",
    title: "Whole-Body Power Smoothie",
    icon: "🥤",
    serves: "2 glasses",
    time: "5 min",
    intro:
      "A nutrient-dense smoothie with ingredients that bring nutrients every body system uses: calcium, potassium, fiber, protein, omega-3 fats, vitamins A, C, E and K, folate, magnesium and zinc. It's food, not medicine: it adds nutrients to a balanced diet and doesn't treat any condition.",
    ingredients: [
      "1 cup plain Greek yogurt or kefir (or plant yogurt)",
      "1 cup fresh spinach, packed",
      "1 small banana, frozen in chunks",
      "1/2 cup mixed berries (fresh or frozen)",
      "1/2 small orange, peeled",
      "1/2 small carrot, chopped",
      "1 tablespoon chia seeds",
      "1 tablespoon ground flaxseed",
      "1 tablespoon pumpkin seeds",
      "1 teaspoon fresh ginger, peeled",
      "1 cup water or milk",
      "1/4 ripe avocado (booster for vitamin E and creaminess)",
    ],
    steps: [
      "Add the water or milk and the yogurt first, so the blades spin freely.",
      "Add the spinach, banana, berries, orange, carrot and avocado.",
      "Add the chia, flax, pumpkin seeds and ginger.",
      "Blend on high until completely smooth, about 60 to 90 seconds. Add a splash of water if it's too thick.",
      "Pour into two glasses and drink right away. Chia thickens it as it sits, so stir if you wait.",
    ],
    systems: [
      ["Heart & blood (circulatory)", "Potassium for a steady heartbeat; iron and folate for red blood cells", "Banana, spinach, orange"],
      ["Lungs (respiratory)", "Vitamin A, which helps the lungs work properly, and vitamin C", "Carrot, berries, orange"],
      ["Digestion", "Fiber, plus live cultures in yogurt or kefir", "Chia, flax, berries, yogurt"],
      ["Brain & nerves", "Omega-3 fats (ALA), folate and vitamin B12", "Chia, flax, spinach, yogurt"],
      ["Muscles", "Protein, potassium and magnesium", "Greek yogurt, banana, pumpkin seeds"],
      ["Bones (skeletal)", "Calcium, vitamin K and magnesium (avocado's healthy fats help the body absorb vitamin K)", "Yogurt, spinach, pumpkin seeds, avocado"],
      ["Immune & lymph", "Vitamins C, A and E, zinc, and fluids (lymph is mostly water)", "Berries, orange, carrot, avocado, pumpkin seeds, water"],
      ["Hormones (endocrine)", "Iodine; fiber slows how fast sugar enters the blood", "Dairy, chia, flax"],
      ["Kidneys & bladder (urinary)", "Fluids", "The water or milk base"],
      ["Reproductive", "Folate and zinc", "Spinach, orange, pumpkin seeds"],
      ["Skin (integumentary)", "Vitamin C for collagen, vitamins A and E, healthy fats and water", "Berries, orange, carrot, avocado"],
    ],
    avoid: [
      { who: ["meds"], text: "Take warfarin (Coumadin)? Spinach is high in vitamin K, which affects how warfarin works. Keep how much you eat steady and ask your doctor." },
      { who: [], text: "Kidney disease? Banana, spinach and orange are high in potassium. Ask your doctor before adding high-potassium drinks." },
      { who: [], text: "Diabetes? The fruit adds natural sugar. Drink it with a meal, or use half the banana." },
      { who: ["baby"], text: "Not for babies under 1 year as a drink. Whole seeds and dairy amounts aren't suited to infants." },
      { who: [], text: "Allergic to dairy, seeds or any ingredient? Leave it out or swap it (plant yogurt for dairy-free)." },
    ],
    sources: [
      ODS("Potassium", "Potassium"),
      ODS("Calcium", "Calcium"),
      ODS("Vitamin K", "VitaminK"),
      ODS("Folate", "Folate"),
      ODS("Magnesium", "Magnesium"),
      ODS("Zinc", "Zinc"),
      ODS("Vitamin C", "VitaminC"),
      ODS("Vitamin A", "VitaminA"),
      ODS("Omega-3 fatty acids", "Omega3FattyAcids"),
      ODS("Iodine", "Iodine"),
      ODS("Vitamin B12", "VitaminB12"),
      ODS("Vitamin E", "VitaminE"),
    ],
  },
];
