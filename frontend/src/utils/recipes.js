export function getRecipeId(recipe) {
  const id = recipe?._id ?? recipe?.id;
  return typeof id === "string" ? id : "";
}

export function getRecipeKey(recipe, index = 0) {
  return getRecipeId(recipe) || `recipe-${index}`;
}

// Drafts may only store a creator id, so use the signed-in name when they own it.
export function getRecipeCookName(recipe, currentUser) {
  const creator = recipe?.creator;

  if (creator && typeof creator === "object" && creator.username) {
    return creator.username;
  }

  const creatorId =
    creator && typeof creator === "object" ? creator._id || creator.id : creator;

  if (
    currentUser?.username &&
    currentUser?.id &&
    creatorId &&
    String(creatorId) === String(currentUser.id)
  ) {
    return currentUser.username;
  }

  return "";
}

export function extractRecipeList(data) {
  return Array.isArray(data?.recipes) ? data.recipes : [];
}

// One search result per recipe name. Prefer the original over an adaptation.
export function collapseRecipesByName(recipes) {
  const groups = new Map();

  recipes.forEach((recipe) => {
    const key = String(recipe?.name || "").trim().toLowerCase();

    if (!key) {
      return;
    }

    const group = groups.get(key);

    if (!group) {
      groups.set(key, { recipe, count: 1 });
      return;
    }

    group.count += 1;

    if (!recipe.basedOn && group.recipe.basedOn) {
      group.recipe = recipe;
    }
  });

  return Array.from(groups.values()).map(({ recipe, count }) => ({
    ...recipe,
    variationCount: count,
  }));
}

export function extractCategoryList(data, fallback = []) {
  const list = data?.categories;
  return Array.isArray(list) && list.length > 0 ? list : fallback;
}
