const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const SavedRecipe = require("../models/SavedRecipe");
const PrivateNote = require("../models/PrivateNote");
const {
  uploadImage,
  deleteImage,
} = require("../services/cloudinaryService");
const escapeRegex = require("../utils/escapeRegex");

// Get a public user profile
const getPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;

    if (typeof username !== "string" || !username.trim()) {
      return res.status(404).json({
        message: "Profile not found."
      });
    }

    const escapedUsername = escapeRegex(username.trim());

    const user = await User.findOne({
      username: {
        $regex: `^${escapedUsername}$`,
        $options: "i"
      }
    }).select("username profilePhoto isPrivate");

    if (!user || user.isPrivate) {
      return res.status(404).json({
        message: "Profile not found."
      });
    }

    const recipes = await Recipe.find({
      creator: user._id,
      isPublished: true,
    })
      .select(
        "name description images preparationTime cookingTime servings category publishedAt creator basedOn"
      )
      .populate({
        path: "creator",
        select: "username profilePhoto isPrivate",
      })
      .sort({ publishedAt: -1 });

    return res.status(200).json({
      profile: {
        username: user.username,
        profilePhoto: user.profilePhoto,
        recipes
      }
    });

  } catch (error) {
    console.error("Fetching public profile failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve this profile at the moment."
    });
  }
};

// Get the logged-in user's own profile
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "username email profilePhoto isPrivate createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User profile not found."
      });
    }

    return res.status(200).json({
      profile: user
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    console.error("Fetching your profile failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your profile at the moment."
    });
  }
};

// Update the logged-in user's profile
const updateMyProfile = async (req, res) => {
  try {
    const { username, isPrivate } = req.body || {};

    if (
      username === undefined &&
      isPrivate === undefined
    ) {
      return res.status(400).json({
        message: "Please provide a username or privacy setting to update."
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User profile not found."
      });
    }

    // Update username
    if (username !== undefined) {
      if (typeof username !== "string") {
        return res.status(400).json({
          message: "Username must be text."
        });
      }

      const normalizedUsername = username.trim();

      if (
        normalizedUsername.length < 3 ||
        normalizedUsername.length > 30
      ) {
        return res.status(400).json({
          message: "Username must be between 3 and 30 characters."
        });
      }

      const escapedUsername = escapeRegex(normalizedUsername);
      const existingUser = await User.findOne({
        username: {
          $regex: `^${escapedUsername}$`,
          $options: "i",
        },
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return res.status(409).json({
          message: "That username is already taken."
        });
      }

      user.username = normalizedUsername;
    }

    // Update profile privacy
    if (isPrivate !== undefined) {
      if (typeof isPrivate !== "boolean") {
        return res.status(400).json({
          message: "Profile privacy must be true or false."
        });
      }

      user.isPrivate = isPrivate;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully!",
      profile: {
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        isPrivate: user.isPrivate
      }
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "That username is already taken."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error("Updating your profile failed:", error.message);

    return res.status(500).json({
      message: "Unable to update your profile at the moment."
    });
  }
};

// Upload or replace the logged-in user's profile photo
const uploadProfilePhoto = async (req, res) => {
  let uploadedImage;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a profile photo.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    uploadedImage = await uploadImage(
      req.file.buffer,
      "profile-photos"
    );

    const oldPublicId = user.profilePhotoPublicId;

    user.profilePhoto = uploadedImage.url;
    user.profilePhotoPublicId = uploadedImage.publicId;

    await user.save();

    // Delete the previous image after saving the replacement
    if (oldPublicId) {
      try {
        await deleteImage(oldPublicId);
      } catch (error) {
        console.error("Old profile photo deletion failed:", error);
      }
    }

    return res.status(200).json({
      message: "Profile photo uploaded successfully.",
      profilePhoto: user.profilePhoto,
    });

  } catch (error) {
    // Clean up the newly uploaded image if saving fails
    if (uploadedImage?.publicId) {
      try {
        await deleteImage(uploadedImage.publicId);
      } catch (deleteError) {
        console.error("Uploaded image cleanup failed:", deleteError);
      }
    }

    console.error("Profile photo upload error:", error.message);

    return res.status(500).json({
      message: "Failed to upload profile photo.",
    });
  }
};

// Remove the logged-in user's profile photo
const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const oldPublicId = user.profilePhotoPublicId;

    user.profilePhoto = "";
    user.profilePhotoPublicId = "";

    await user.save();

    if (oldPublicId) {
      try {
        await deleteImage(oldPublicId);
      } catch (error) {
        console.error("Profile photo deletion failed:", error);

        return res.status(200).json({
          message:
            "Profile photo removed from your profile, but Cloudinary cleanup failed.",
        });
      }
    }

    return res.status(200).json({
      message: "Profile photo removed successfully.",
      profilePhoto: "",
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    console.error("Profile photo removal error:", error.message);

    return res.status(500).json({
      message: "Failed to remove profile photo.",
    });
  }
};

const deleteMyAccount = async (req, res) => {
  try {
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    const confirmation =
      typeof req.body.confirmation === "string"
        ? req.body.confirmation.trim()
        : "";

    if (!password) {
      return res.status(400).json({
        message: "Please enter your password to delete your account.",
      });
    }

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        message: 'Type DELETE to confirm that you want to remove your account.',
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "The password you entered is incorrect.",
      });
    }

    const recipes = await Recipe.find({
      creator: user._id,
    });

    const recipeIds = recipes.map((recipe) => recipe._id);

    for (const recipe of recipes) {
      for (const image of recipe.images || []) {
        if (!image.publicId) continue;

        try {
          await deleteImage(image.publicId);
        } catch (error) {
          console.error(
            "Failed to delete recipe image during account deletion:",
            error.message,
          );
        }
      }
    }

    if (user.profilePhotoPublicId) {
      try {
        await deleteImage(user.profilePhotoPublicId);
      } catch (error) {
        console.error(
          "Failed to delete profile photo during account deletion:",
          error.message,
        );
      }
    }

    await Recipe.updateMany(
      { basedOn: { $in: recipeIds } },
      { $unset: { basedOn: 1 } },
    );
    await Recipe.deleteMany({ _id: { $in: recipeIds } });
    await SavedRecipe.deleteMany({
      $or: [{ user: user._id }, { recipe: { $in: recipeIds } }],
    });
    await PrivateNote.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    return res.status(200).json({
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("Account deletion failed:", error.message);

    return res.status(500).json({
      message: "Unable to delete your account at the moment.",
    });
  }
};

module.exports = {
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  deleteMyAccount,
};
