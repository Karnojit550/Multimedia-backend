const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const connectDB = require("./config/db");
const swaggerSpec = require("./docs/swagger");
const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/file.routes");
const ErrorHandler = require("./middlewares/error-middleware");

const app = express();
let databaseConnection;

app.disable("x-powered-by");

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Start the local connection when the application boots.
if (process.env.NODE_ENV !== "test") {
  databaseConnection = connectDB().catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    databaseConnection = undefined;
    return null;
  });
}

// Connect once before handling requests in local and serverless environments.
app.use(async (req, res, next) => {
  // Tests use mocked services and do not require a live database connection.
  if (process.env.NODE_ENV === "test") {
    return next();
  }
  databaseConnection ??= connectDB();

  try {
    const connection = await databaseConnection;

    if (!connection) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed."
      });
    }

    return next();
  } catch (error) {
    databaseConnection = undefined;

    return res.status(503).json({
      success: false,
      error: "Database connection failed."
    });
  }
});
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy.",
    timestamp: new Date().toISOString()
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

app.use(new ErrorHandler().notFound);
app.use(new ErrorHandler().error);

module.exports = app;
