const RECIPE_CATEGORIES = [
  "Breakfast",
  "Light meals",
  "Chicken",
  "Beef & lamb",
  "Seafood",
  "Vegetarian",
  "Pasta & grains",
  "Braai",
  "Baked goods",
  "Desserts",
  "Drinks",
  "Sides",
];

const isValidRecipeCategory = (category) => {
  return RECIPE_CATEGORIES.includes(category);
};

module.exports = {
  RECIPE_CATEGORIES,
  isValidRecipeCategory,
};
