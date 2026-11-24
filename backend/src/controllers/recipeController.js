// Recipe CRUD, publishing, images, and public search.
const mongoose = require("mongoose");

const {
  RECIPE_CATEGORIES,
  isValidRecipeCategory,
} = require("../config/recipeCategories");

const Recipe = require("../models/Recipe");
const SavedRecipe = require("../models/SavedRecipe");
const PrivateNote = require("../models/PrivateNote");

const { uploadImage, deleteImage } = require("../services/cloudinaryService");
const escapeRegex = require("../utils/escapeRegex");

const CREATOR_FIELDS = "username profilePhoto isPrivate";

const collapseRecipesByName = (recipes) => {
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
};

// Check whether a recipe can be used as the inspiration for another recipe
const validateBasedOnRecipe = async (
  basedOn,
  userId,
  currentRecipeId = null,
) => {
  // Allow users to remove an existing inspiration reference
  if (basedOn === null || basedOn === "") {
    return { valid: true };
  }

  // basedOn must be a valid MongoDB document ID
  if (!mongoose.isValidObjectId(basedOn)) {
    return {
      valid: false,
      message: "The original recipe reference is invalid.",
    };
  }

  // Prevent a recipe from referencing itself
  if (currentRecipeId && basedOn.toString() === currentRecipeId.toString()) {
    return {
      valid: false,
      message: "A recipe cannot be based on itself.",
    };
  }

  const originalRecipe = await Recipe.findById(basedOn).populate({
    path: "creator",
    select: "isPrivate",
  });

  if (!originalRecipe) {
    return {
      valid: false,
      message: "The original recipe could not be found.",
    };
  }

  // A user may use their own recipes, including drafts
  const isOwner =
    originalRecipe.creator &&
    originalRecipe.creator._id.toString() === userId.toString();

  if (isOwner) {
    return { valid: true };
  }

  // Other users' recipes must be published and publicly accessible
  if (
    !originalRecipe.isPublished ||
    !originalRecipe.creator ||
    originalRecipe.creator.isPrivate
  ) {
    return {
      valid: false,
      message: "This recipe is not publicly available.",
    };
  }

  return { valid: true };
};

// Get the full details of an existing recipe
const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    const recipe = await Recipe.findOne({
      _id: id,
      isPublished: true,
    }).populate({
      path: "creator",
      select: CREATOR_FIELDS,
    }).populate({
      path: "basedOn",
      select: "name creator",
      populate: {
        path: "creator",
        select: "username isPrivate",
      },
    });

    if (!recipe || !recipe.creator || recipe.creator.isPrivate) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    const escapedName = escapeRegex(recipe.name);

    const variationDocs = escapedName
      ? await Recipe.find({
          _id: { $ne: recipe._id },
          isPublished: true,
          name: { $regex: `^${escapedName}$`, $options: "i" },
        })
          .populate({
            path: "creator",
            select: CREATOR_FIELDS,
            match: { isPrivate: false },
          })
          .sort({ publishedAt: -1, createdAt: -1 })
      : [];

    const variations = variationDocs
      .filter((item) => item.creator)
      .map((item) => item.toObject());

    return res.status(200).json({
      recipe: recipe.toObject(),
      variations,
    });
  } catch (error) {
    console.error("Recipe retrieval failed:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to retrieve this recipe at the moment.",
    });
  }
};

// Create a new recipe draft
const createRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      preparationTime,
      cookingTime,
      servings,
      category,
      ingredients,
      instructions,
      basedOn,
    } = req.body;

    // Only allow approved categories for recipes
    if (!isValidRecipeCategory(category)) {
      return res.status(400).json({
        message: "Please select a valid recipe category.",
      });
    }

    // Validate the original recipe if one was provided
    if (basedOn !== undefined && basedOn !== null) {
      const validation = await validateBasedOnRecipe(basedOn, req.user.id);

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message,
        });
      }
    }

    const recipe = await Recipe.create({
      creator: req.user.id,
      name,
      description,
      preparationTime,
      cookingTime,
      servings,
      category,
      ingredients,
      instructions,
      basedOn,
      isPublished: false,
    });

    return res.status(201).json({
      message: "Recipe draft created successfully!",
      recipe: recipe.toObject(),
    });
  } catch (error) {
    console.error("Recipe creation failed:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to create your recipe at the moment.",
    });
  }
};

// Get all recipes belonging to the logged-in user
const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      creator: req.user.id,
    })
      .populate({
        path: "creator",
        select: CREATOR_FIELDS,
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: recipes.length,
      recipes: recipes.map((recipe) => recipe.toObject()),
    });
  } catch (error) {
    console.error("Fetching user recipes failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your recipes at the moment.",
    });
  }
};

// Get one recipe belonging to the logged-in user
const getMyRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    }).populate({
      path: "creator",
      select: CREATOR_FIELDS,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    return res.status(200).json({
      recipe: recipe.toObject(),
    });
  } catch (error) {
    console.error("Fetching your recipe failed:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to retrieve your recipe at the moment.",
    });
  }
};

// Update a recipe
const updateRecipe = async (req, res) => {
  try {
    const {
      name,
      description,
      preparationTime,
      cookingTime,
      servings,
      category,
      ingredients,
      instructions,
      basedOn,
    } = req.body;

    // Validate category only when the user submits a category change
    if (category !== undefined && !isValidRecipeCategory(category)) {
      return res.status(400).json({
        message: "Please select a valid recipe category.",
      });
    }

    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    // Validate the original recipe if one was provided
    if (basedOn !== undefined && basedOn !== null) {
      const validation = await validateBasedOnRecipe(
        basedOn,
        req.user.id,
        recipe._id,
      );

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message,
        });
      }
    }

    if (name !== undefined) recipe.name = name;
    if (description !== undefined) recipe.description = description;
    if (preparationTime !== undefined) recipe.preparationTime = preparationTime;
    if (cookingTime !== undefined) recipe.cookingTime = cookingTime;
    if (servings !== undefined) recipe.servings = servings;
    if (category !== undefined) recipe.category = category;
    if (ingredients !== undefined) recipe.ingredients = ingredients;
    if (instructions !== undefined) recipe.instructions = instructions;
    if (basedOn !== undefined) recipe.basedOn = basedOn;

    await recipe.save();

    return res.status(200).json({
      message: "Recipe updated successfully!",
      recipe,
    });
  } catch (error) {
    console.error("Recipe update failed:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to update your recipe at the moment.",
    });
  }
};

// Publish a recipe
const publishRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    if (recipe.isPublished) {
      return res.status(400).json({
        message: "This recipe has already been published.",
      });
    }

    if (!isValidRecipeCategory(recipe.category)) {
      return res.status(400).json({
        message: "Please select a valid recipe category.",
      });
    }

    if (!recipe.images?.length) {
      return res.status(400).json({
        message: "Add a cover image before publishing.",
      });
    }

    recipe.isPublished = true;
    recipe.publishedAt = new Date();

    await recipe.save();

    return res.status(200).json({
      message: "Recipe published successfully!",
      recipe,
    });
  } catch (error) {
    console.error("Recipe publishing failed:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to publish your recipe at the moment.",
    });
  }
};

// Unpublish a recipe
const unpublishRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    if (!recipe.isPublished) {
      return res.status(400).json({
        message: "This recipe is already a draft.",
      });
    }

    recipe.isPublished = false;
    recipe.publishedAt = null;

    await recipe.save();

    await SavedRecipe.deleteMany({
      recipe: recipe._id,
    });

    return res.status(200).json({
      message: "Recipe unpublished successfully!",
      recipe,
    });
  } catch (error) {
    console.error("Recipe unpublishing failed:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to unpublish your recipe at the moment.",
    });
  }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    await Recipe.deleteOne({ _id: recipe._id });

    await SavedRecipe.deleteMany({
      recipe: recipe._id,
    });

    await Recipe.updateMany(
      { basedOn: recipe._id },
      { $unset: { basedOn: 1 } },
    );

    await PrivateNote.deleteMany({ recipe: recipe._id });

    for (const image of recipe.images || []) {
      if (!image?.publicId) {
        continue;
      }

      try {
        await deleteImage(image.publicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete recipe image from Cloudinary:",
          cloudinaryError.message,
        );
      }
    }

    return res.status(200).json({
      message: "Recipe deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    console.error("Recipe deletion error:", error);

    return res.status(500).json({
      message: "Failed to delete recipe.",
    });
  }
};

// Get public recipes with optional search and filters
const getPublicRecipes = async (req, res) => {
  try {
    const search = req.query.search;
    const category = req.query.category;

    // Validate query parameter types
    if (
      (search !== undefined && typeof search !== "string") ||
      (category !== undefined && typeof category !== "string")
    ) {
      return res.status(400).json({
        message: "Invalid recipe filter parameters.",
      });
    }

    const searchTerm = search?.trim();
    const categoryFilter = category?.trim();

    const recipeFilter = {
      isPublished: true,
    };

    // Search recipe names only
    if (searchTerm) {
      const escapedSearch = escapeRegex(searchTerm);

      recipeFilter.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const recipes = await Recipe.find(recipeFilter)
      .populate({
        path: "creator",
        select: CREATOR_FIELDS,
        match: { isPrivate: false },
      })
      .sort({ publishedAt: -1, createdAt: -1 });

    const wantedCategory = isValidRecipeCategory(categoryFilter)
      ? categoryFilter
      : null;

    const publicRecipes = recipes
      .filter((recipe) => recipe.creator)
      .map((recipe) => recipe.toObject());

    const visibleRecipes = categoryFilter
      ? publicRecipes.filter((recipe) => recipe.category === wantedCategory)
      : publicRecipes;

    const recipesForResponse = searchTerm
      ? collapseRecipesByName(visibleRecipes)
      : visibleRecipes;

    return res.status(200).json({
      count: recipesForResponse.length,
      recipes: recipesForResponse,
    });
  } catch (error) {
    console.error("Fetching public recipes failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve public recipes at the moment.",
    });
  }
};

// Upload images to an existing recipe
const uploadRecipeImages = async (req, res) => {
  const uploadedImages = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please select at least one image to upload.",
      });
    }

    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    if (recipe.images.length + req.files.length > 8) {
      return res.status(400).json({
        message: "A recipe cannot have more than 8 images.",
      });
    }

    for (const file of req.files) {
      const image = await uploadImage(file.buffer, "recipes");
      uploadedImages.push(image);
    }

    recipe.images.push(...uploadedImages);

    await recipe.save();

    return res.status(200).json({
      message: "Recipe images uploaded successfully.",
      images: recipe.images,
    });
  } catch (error) {
    // Remove any images uploaded before an error occurred
    for (const image of uploadedImages) {
      try {
        await deleteImage(image.publicId);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up uploaded recipe image:",
          cleanupError.message,
        );
      }
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Recipe image upload error:", error);

    return res.status(500).json({
      message: "Failed to upload recipe images.",
    });
  }
};

// Remove an image from an existing recipe
const deleteRecipeImage = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      creator: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found in your kitchen.",
      });
    }

    const image = recipe.images.id(req.params.imageId);

    if (!image) {
      return res.status(404).json({
        message: "Image not found.",
      });
    }

    const publicId = image.publicId;

    recipe.images.pull(req.params.imageId);

    await recipe.save();

    // Remove the image from Cloudinary after updating the recipe
    try {
      await deleteImage(publicId);
    } catch (cloudinaryError) {
      console.error(
        "Failed to delete recipe image from Cloudinary:",
        cloudinaryError.message,
      );
    }

    return res.status(200).json({
      message: "Recipe image removed successfully.",
      images: recipe.images,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe or image ID.",
      });
    }

    console.error("Recipe image deletion error:", error);

    return res.status(500).json({
      message: "Failed to remove recipe image.",
    });
  }
};

// Get the approved recipe categories
const getRecipeCategories = (req, res) => {
  return res.status(200).json({
    count: RECIPE_CATEGORIES.length,
    categories: RECIPE_CATEGORIES,
  });
};

module.exports = {
  getRecipeById,
  createRecipe,
  getMyRecipes,
  getMyRecipeById,
  updateRecipe,
  publishRecipe,
  unpublishRecipe,
  deleteRecipe,
  getPublicRecipes,
  uploadRecipeImages,
  deleteRecipeImage,
  getRecipeCategories,
};
