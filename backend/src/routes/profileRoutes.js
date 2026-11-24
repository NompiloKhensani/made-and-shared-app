const express = require("express");
const router = express.Router();

const {
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  deleteMyAccount
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Get the logged-in user's own profile
router.get("/me", authMiddleware, getMyProfile);

// Update the logged-in user's profile
router.put("/me", authMiddleware, updateMyProfile);

// Upload or replace the profile photo
router.post(
  "/me/photo",
  authMiddleware,
  upload.single("profilePhoto"),
  uploadProfilePhoto
);

// Remove the profile photo
router.delete("/me/photo", authMiddleware, deleteProfilePhoto);

// Permanently delete the logged-in user's account
router.delete("/me", authMiddleware, deleteMyAccount);

// Get a public profile by username
router.get("/:username", getPublicProfile);

module.exports = router;