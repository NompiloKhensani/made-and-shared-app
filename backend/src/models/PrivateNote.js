
const mongoose = require("mongoose");

const privateNoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1
    }
  },
  {
    timestamps: true
  }
);

// Retrieve a user's notes, most recently updated first
privateNoteSchema.index({ user: 1, updatedAt: -1 });
privateNoteSchema.index({ user: 1, recipe: 1, updatedAt: -1 });

const PrivateNote = mongoose.model("PrivateNote", privateNoteSchema);

module.exports = PrivateNote;
