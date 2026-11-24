const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/recipeController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Get the approved recipe categories
router.get("/categories", getRecipeCategories);

// Get the logged-in user's recipes
router.get("/my-recipes", authMiddleware, getMyRecipes);

// Get a specific recipe from the logged-in user's recipes
router.get("/my-recipes/:id", authMiddleware, getMyRecipeById);

// Upload images to a recipe
router.post(
  "/my-recipes/:id/images",
  authMiddleware,
  upload.array("images", 8),
  uploadRecipeImages
);

// Remove an image from a recipe
router.delete(
  "/my-recipes/:id/images/:imageId",
  authMiddleware,
  deleteRecipeImage
);

// Create a recipe draft
router.post("/", authMiddleware, createRecipe);

// Update one of the logged-in user's recipes
router.put("/my-recipes/:id", authMiddleware, updateRecipe);

// Publish one of the logged-in user's recipes
router.patch("/my-recipes/:id/publish", authMiddleware, publishRecipe);

// Unpublish one of the logged-in user's recipes
router.patch("/my-recipes/:id/unpublish", authMiddleware, unpublishRecipe);

// Delete one of the logged-in user's recipes
router.delete("/my-recipes/:id", authMiddleware, deleteRecipe);

// Get publicly available recipes
router.get("/public", getPublicRecipes);

// Get recipe details by ID
router.get("/:id", getRecipeById);

module.exports = router;
