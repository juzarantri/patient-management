import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
import patientRoutes from "@/routes/patientRoutes";
import { initializeIndex } from "@/config/opensearch";

const app: Application = express();
const PORT = process.env.PORT || 3000;

/**
 * Initialize OpenSearch Index
 * This runs once on startup to ensure the index exists
 */
async function initializeServices(): Promise<void> {
  try {
    await initializeIndex();
  } catch (error) {
    console.warn(
      "⚠️  OpenSearch initialization failed. Continuing without OpenSearch..."
    );
    // Don't block server startup if OpenSearch fails
  }
}

/**
 * Middleware
 */

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for development
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */

// Basic route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to Patient Management API",
    status: "Server is running successfully",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      patients: "GET /api/patients",
      createPatient: "POST /api/patients",
      getPatient: "GET /api/patients/:patientId",
      updatePatient: "PUT /api/patients/:patientId",
      deletePatient: "DELETE /api/patients/:patientId",
      searchByAddress: "GET /api/patients/search/address?address=...",
      searchByCondition:
        "GET /api/patients/search/condition?condition=... (OpenSearch)",
    },
  });
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Patient API routes
app.use("/api/patients", patientRoutes);

/**
 * Error Handling Middleware
 */

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start Server
 */

// Initialize services and start server
initializeServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
      Server is running successfully
      URL: http://localhost:${PORT}
      API: http://localhost:${PORT}/api/patients
    `);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

export default app;
