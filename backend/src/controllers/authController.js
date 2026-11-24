const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const escapeRegex = require("../utils/escapeRegex");

const presentUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  profilePhoto: user.profilePhoto,
  isPrivate: user.isPrivate,
});

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    { id: String(userId) },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please provide a username, email, and password."
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        message: "Username must be between 3 and 30 characters."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long."
      });
    }

    const existingEmail = await User.findOne({
      email: cleanEmail
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const escapedUsername = escapeRegex(cleanUsername);
    const existingUsername = await User.findOne({
      username: {
        $regex: `^${escapedUsername}$`,
        $options: "i",
      },
    });

    if (existingUsername) {
      return res.status(409).json({
        message: "This username is already taken."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      message: "Account created successfully!",
      token,
      user: presentUser(newUser),
    });

  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        message: duplicatedField === "email"
          ? "An account with this email already exists."
          : "This username is already taken."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Please check your registration details."
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      message: "Unable to register your account at the moment."
    });
  }
};

// Log in an existing user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please provide an email and password."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: presentUser(user),
    });

  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      message: "Unable to login at the moment."
    });
  }
};

// Get currently authenticated user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User account not found."
      });
    }

    return res.status(200).json({
      user: presentUser(user),
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    console.error("Fetching current user failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your account at the moment."
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};
