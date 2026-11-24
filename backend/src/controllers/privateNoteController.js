const PrivateNote = require("../models/PrivateNote");
const Recipe = require("../models/Recipe");
const User = require("../models/User");

// Check whether a user can access a recipe
const canAccessRecipe = async (recipe, userId) => {
  // Users can always access their own recipes, including drafts
  const isOwner = recipe.creator?.toString() === userId;

  if (isOwner) {
    return true;
  }

  // Other users can only access published recipes
  if (!recipe.isPublished || !recipe.creator) {
    return false;
  }

  // The creator's profile must be public
  const creator = await User.findById(recipe.creator).select("isPrivate");

  return Boolean(creator && !creator.isPrivate);
};

// Create a private note
const createPrivateNote = async (req, res) => {
  try {
    const { title, content, recipeId } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Please provide a title and note content.",
      });
    }

    let recipe = null;

    if (recipeId) {
      recipe = await Recipe.findById(recipeId);

      if (!recipe) {
        return res.status(404).json({
          message: "Recipe not found.",
        });
      }

      const isAccessible = await canAccessRecipe(recipe, req.user.id);

      if (!isAccessible) {
        return res.status(404).json({
          message: "Recipe not found.",
        });
      }
    }

    const privateNote = await PrivateNote.create({
      user: req.user.id,
      recipe: recipe ? recipe._id : null,
      title,
      content,
    });

    return res.status(201).json({
      message: "Private note created successfully!",
      privateNote,
    });
  } catch (error) {
    console.error("Creating private note failed:", error.message);

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

    return res.status(500).json({
      message: "Unable to create your private note at the moment.",
    });
  }
};

// Get all private notes belonging to the logged-in user
const getPrivateNotes = async (req, res) => {
  try {
    const filter = { user: req.user.id };

    if (req.query.recipeId) {
      filter.recipe = req.query.recipeId;
    }

    const privateNotes = await PrivateNote.find(filter)
      .populate({
        path: "recipe",
        select: "name images isPublished",
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: privateNotes.length,
      privateNotes,
    });
  } catch (error) {
    console.error("Fetching private notes failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your private notes at the moment.",
    });
  }
};

// Update a private note
const updatePrivateNote = async (req, res) => {
  try {
    const { title, content, recipeId } = req.body;

    const privateNote = await PrivateNote.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!privateNote) {
      return res.status(404).json({
        message: "Private note not found.",
      });
    }

    if (title !== undefined) {
      privateNote.title = title;
    }

    if (content !== undefined) {
      privateNote.content = content;
    }

    // Update or remove the recipe association
    if (recipeId !== undefined) {
      if (!recipeId) {
        privateNote.recipe = null;
      } else {
        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
          return res.status(404).json({
            message: "Recipe not found.",
          });
        }

        const isAccessible = await canAccessRecipe(recipe, req.user.id);

        if (!isAccessible) {
          return res.status(404).json({
            message: "Recipe not found.",
          });
        }

        privateNote.recipe = recipe._id;
      }
    }

    await privateNote.save();

    return res.status(200).json({
      message: "Private note updated successfully!",
      privateNote,
    });
  } catch (error) {
    console.error("Updating private note failed:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid note or recipe ID.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to update your private note at the moment.",
    });
  }
};

// Delete a private note
const deletePrivateNote = async (req, res) => {
  try {
    const privateNote = await PrivateNote.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!privateNote) {
      return res.status(404).json({
        message: "Private note not found.",
      });
    }

    return res.status(200).json({
      message: "Private note deleted successfully!",
    });
  } catch (error) {
    console.error("Deleting private note failed:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid note ID.",
      });
    }

    return res.status(500).json({
      message: "Unable to delete your private note at the moment.",
    });
  }
};

module.exports = {
  createPrivateNote,
  getPrivateNotes,
  updatePrivateNote,
  deletePrivateNote,
};
