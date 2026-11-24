const SavedRecipe = require("../models/SavedRecipe");
const Recipe = require("../models/Recipe");

const saveRecipe = async (req, res) => {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({
        message: "Please provide a recipe ID.",
      });
    }

    const recipe = await Recipe.findById(recipeId).populate({
      path: "creator",
      select: "isPrivate",
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    const isPublic =
      recipe.isPublished && recipe.creator && !recipe.creator.isPrivate;

    if (!isPublic) {
      return res.status(404).json({
        message: "Recipe not found.",
      });
    }

    if (
      recipe.creator._id.toString() === req.user.id
    ) {
      return res.status(400).json({
        message: "You cannot save your own recipe.",
      });
    }

    const existingSave = await SavedRecipe.findOne({
      user: req.user.id,
      recipe: recipeId,
    });

    if (existingSave) {
      return res.status(409).json({
        message: "You have already saved this recipe.",
      });
    }

    const savedRecipe = await SavedRecipe.create({
      user: req.user.id,
      recipe: recipeId,
    });

    return res.status(201).json({
      message: "Recipe saved successfully!",
      savedRecipe,
    });
  } catch (error) {
    console.error("Saving recipe failed:", error.message);

    // Handle duplicate saves, including simultaneous requests
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already saved this recipe.",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to save this recipe at the moment.",
    });
  }
};

const unsaveRecipe = async (req, res) => {
  try {
    const savedRecipe = await SavedRecipe.findOneAndDelete({
      user: req.user.id,
      recipe: req.params.recipeId,
    });

    if (!savedRecipe) {
      return res.status(404).json({
        message: "Saved recipe not found.",
      });
    }

    return res.status(200).json({
      message: "Recipe removed from your saved recipes.",
    });
  } catch (error) {
    console.error("Removing saved recipe failed:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid recipe ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to remove this saved recipe at the moment.",
    });
  }
};

const getSavedRecipes = async (req, res) => {
  try {
    const savedRecipes = await SavedRecipe.find({
      user: req.user.id,
    })
      .populate({
        path: "recipe",
        populate: {
          path: "creator",
          select: "username profilePhoto isPrivate",
        },
      })
      .sort({ createdAt: -1 });

    const availableRecipes = savedRecipes.filter((saved) => {
      const recipe = saved.recipe;

      if (!recipe) {
        return false;
      }

      return recipe.isPublished && recipe.creator && !recipe.creator.isPrivate;
    });

    return res.status(200).json({
      count: availableRecipes.length,
      savedRecipes: availableRecipes,
    });
  } catch (error) {
    console.error("Fetching saved recipes failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your saved recipes at the moment.",
    });
  }
};

module.exports = {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes,
};
