
const mongoose = require("mongoose");

const savedRecipeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent users from saving the same recipe more than once
savedRecipeSchema.index(
  { user: 1, recipe: 1 },
  { unique: true }
);

// Support efficient retrieval of a user's saved recipes
savedRecipeSchema.index({ user: 1, createdAt: -1 });

const SavedRecipe = mongoose.model("SavedRecipe", savedRecipeSchema);

module.exports = SavedRecipe;
