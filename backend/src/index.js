require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const recipeRoutes = require("./routes/recipeRoutes");
const authRoutes = require("./routes/authRoutes");
const savedRecipeRoutes = require("./routes/savedRecipeRoutes");
const privateNoteRoutes = require("./routes/privateNoteRoutes");
const profileRoutes = require("./routes/profileRoutes");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Add it to backend/.env.");
  process.exit(1);
}

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && configuredOrigins.length === 0) {
  console.error(
    "CLIENT_URL is not set. Add your live frontend origin so the browser can call this API.",
  );
  process.exit(1);
}

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? configuredOrigins
    : [
        ...new Set([
          ...configuredOrigins,
          "http://localhost:5173",
          "http://localhost:5174",
        ]),
      ];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/saved-recipes", savedRecipeRoutes);
app.use("/api/private-notes", privateNoteRoutes);
app.use("/api/profiles", profileRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Made & Shared API is running!",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "Each image must be 5MB or smaller.",
    });
  }

  if (
    error.code === "LIMIT_FILE_COUNT" ||
    /JPG, PNG and WebP/i.test(error.message || "")
  ) {
    return res.status(400).json({
      message: error.message || "That image could not be uploaded.",
    });
  }

  console.error(error);
  return res.status(500).json({
    message: "Something went wrong.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Made & Shared server running on port ${PORT}`);
  });

  let isShuttingDown = false;

  const shutdown = (signal) => {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.log(`${signal} received. Shutting down server...`);

    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error.message);
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
