const cover = (id) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80`;

const CATEGORIES = [
  {
    name: "Breakfast",
    cover: cover("1567620905732-2d1ec7ab7445"),
    detail: "Oats, eggs, pancakes and slow mornings.",
  },
  {
    name: "Light meals",
    cover: cover("1619096252214-ef06c45683e3"),
    detail: "Sandwiches, wraps, pizza and quick plates.",
  },
  {
    name: "Chicken",
    cover: cover("1598103442097-8b74394b95c6"),
    detail: "Roasts, stews, tray bakes and easy favourites.",
  },
  {
    name: "Beef & lamb",
    cover: cover("1432139509613-5c4255815697"),
    detail: "Steak, chops, mince and hearty potjies.",
  },
  {
    name: "Seafood",
    cover: cover("1763647738062-d83e44328a6f"),
    detail: "Fish, prawns and coastal plates.",
  },
  {
    name: "Vegetarian",
    cover: cover("1512621776951-a57141f2eefd"),
    detail: "Plant-led meals with plenty of flavour.",
  },
  {
    name: "Pasta & grains",
    cover: cover("1551183053-bf91a1d81141"),
    detail: "Pasta, rice, pap and hearty bowls.",
  },
  {
    name: "Braai",
    cover: cover("1609534751961-f396ded2af99"),
    detail: "Fire, marinade and everything off the grid.",
  },
  {
    name: "Baked goods",
    cover: cover("1578985545062-69928b1d9587"),
    detail: "Cakes, rusks, bread, pies and everything from the oven.",
  },
  {
    name: "Desserts",
    cover: cover("1476887334197-56adbf254e1a"),
    detail: "Malva, tarts, ice cream and sweet finishes.",
  },
  {
    name: "Drinks",
    cover: cover("1514362545857-3bc16c4c7d1b"),
    detail: "Cordials, smoothies, coffee and something cold.",
  },
  {
    name: "Sides",
    cover: cover("1572928896925-36df69c2567c"),
    detail: "Salads, veg and the extras that complete a plate.",
  },
];

export const RECIPE_CATEGORIES = CATEGORIES.map((category) => category.name);

export const CATEGORY_COVER_IMAGES = Object.fromEntries(
  CATEGORIES.map((category) => [category.name, category.cover]),
);

export const CATEGORY_DETAILS = Object.fromEntries(
  CATEGORIES.map((category) => [category.name, category.detail]),
);
