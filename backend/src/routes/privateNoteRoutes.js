const express = require("express");
const router = express.Router();

const {
  createPrivateNote,
  getPrivateNotes,
  updatePrivateNote,
  deletePrivateNote
} = require("../controllers/privateNoteController");

const authMiddleware = require("../middleware/authMiddleware");

// All private note routes require authentication
router.use(authMiddleware);

// Get all private notes
router.get("/", getPrivateNotes);

// Create a private note
router.post("/", createPrivateNote);

// Update a private note
router.put("/:id", updatePrivateNote);

// Delete a private note
router.delete("/:id", deletePrivateNote);

module.exports = router;