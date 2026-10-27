// Kitchen items, and which ones each remedy needs (water is assumed).
export const ITEMS = [
  { id: "honey", name: "Honey" },
  { id: "lemon", name: "Lemon" },
  { id: "salt", name: "Table salt" },
  { id: "ginger", name: "Fresh ginger" },
  { id: "peppermint", name: "Peppermint tea or fresh mint" },
  { id: "chamomile", name: "Chamomile tea" },
  { id: "oats", name: "Rolled oats" },
  { id: "fruit", name: "Berries or prunes" },
  { id: "seeds", name: "Chia or flaxseed" },
  { id: "milk", name: "Milk or plant milk" },
  { id: "turmeric", name: "Ground turmeric" },
  { id: "pepper", name: "Black pepper" },
  { id: "cinnamon", name: "Cinnamon" },
  { id: "aloe", name: "Aloe vera (plant or gel)" },
  { id: "cranberry", name: "Cranberry juice" },
  { id: "washcloth", name: "Clean washcloths" },
  { id: "moisturizer", name: "Moisturizer" },
  { id: "lavender", name: "Lavender essential oil" },
  { id: "spray", name: "Small spray bottle" },
  { id: "rinse", name: "Sinus rinse kit + saline packets" },
  { id: "safewater", name: "Distilled or sterile water" },
  { id: "bandage", name: "Clean bandages" },
];

export const NEEDS = {
  "honey-lemon": ["honey", "lemon"],
  "salt-gargle": ["salt"],
  "saline-rinse": ["rinse", "safewater"],
  "ginger-tea": ["ginger"],
  "peppermint-tea": ["peppermint"],
  "fiber-oats": ["oats", "fruit", "seeds"],
  "oatmeal-bath": ["oats", "moisturizer"],
  "cool-compress": ["washcloth", "moisturizer"],
  "burn-first-aid": ["bandage"],
  aloe: ["aloe"],
  "stye-compress": ["washcloth"],
  "chamomile-tea": ["chamomile"],
  lavender: ["lavender", "spray"],
  "golden-milk": ["milk", "turmeric", "pepper", "cinnamon"],
  cranberry: ["cranberry"],
};

export function itemName(id) {
  return (ITEMS.find((i) => i.id === id) || { name: id }).name;
}
