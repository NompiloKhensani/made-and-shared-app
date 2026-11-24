const express = require("express");
const router = express.Router();

const {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes
} = require("../controllers/savedRecipeController");

const authMiddleware = require("../middleware/authMiddleware");

// Get the logged-in user's saved recipes
router.get("/", authMiddleware, getSavedRecipes);

// Save a recipe
router.post("/", authMiddleware, saveRecipe);

// Remove a saved recipe
router.delete("/:recipeId", authMiddleware, unsaveRecipe);

module.exports = router;