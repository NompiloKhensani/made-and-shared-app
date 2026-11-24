const mongoose = require("mongoose");
const { isValidRecipeCategory } = require("../config/recipeCategories");

const recipeSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
            trim: true,
          },
          publicId: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [],
      validate: {
        validator: (images) => images.length <= 8,
        message: "A recipe cannot have more than 8 images.",
      },
    },

    preparationTime: {
      type: Number,
      min: 0,
    },

    cookingTime: {
      type: Number,
      required: true,
      min: 0,
    },

    servings: {
      type: Number,
      min: 1,
    },

    category: {
      type: String,
      required: true,
      validate: {
        validator: function (category) {
          return isValidRecipeCategory(category);
        },
        message: "Please select a valid recipe category.",
      },
    },

    ingredients: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },

          quantity: {
            type: String,
            required: true,
            trim: true,
          },

          optional: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
      validate: {
        validator: (ingredients) =>
          ingredients.every(
            (ingredient) =>
              ingredient.name.trim().length > 0 &&
              ingredient.quantity.trim().length > 0,
          ),
        message: "Every ingredient must have a name and quantity.",
      },
    },

    instructions: {
      type: [
        {
          type: String,
          trim: true,
          required: true,
        },
      ],
      required: true,
      validate: [
        {
          validator: (instructions) =>
            Array.isArray(instructions) && instructions.length > 0,
          message: "A recipe must have at least one instruction.",
        },
        {
          validator: (instructions) =>
            instructions.every(
              (instruction) =>
                typeof instruction === "string" &&
                instruction.trim().length > 0,
            ),
          message: "Instructions cannot contain empty steps.",
        },
      ],
    },

    basedOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;
