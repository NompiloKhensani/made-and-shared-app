const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getCurrentUser
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many attempts. Please try again in a few minutes.",
    });
  },
});

// Registration and login
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// Get logged-in user
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;