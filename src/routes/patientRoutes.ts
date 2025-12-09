/**
 * Patient Routes
 *
 * This module defines all patient-related API endpoints and maps them to controllers.
 *
 * Authentication:
 * - POST, PUT, DELETE operations require valid Cognito JWT token
 * - GET operations are public and don't require authentication
 */

import { Router } from "express";
import * as patientController from "@/controllers/patientController";
import { authMiddleware } from "@/middleware/authMiddleware";

const router = Router();

/**
 * Patient CRUD Operations
 */

// Create a new patient (PROTECTED)
// POST /api/patients
// Requires: Authorization header with valid Cognito JWT
router.post("/", authMiddleware, patientController.createPatientHandler);

// List all patients with pagination (PUBLIC)
// GET /api/patients?limit=50
router.get("/", patientController.listPatientsHandler);

// Get a specific patient by ID (PUBLIC)
// GET /api/patients/:patientId
router.get("/:patientId", patientController.getPatientHandler);

// Update a patient (PROTECTED)
// PUT /api/patients/:patientId
// Requires: Authorization header with valid Cognito JWT
router.put(
  "/:patientId",
  authMiddleware,
  patientController.updatePatientHandler
);

// Delete a patient (PROTECTED)
// DELETE /api/patients/:patientId
// Requires: Authorization header with valid Cognito JWT
router.delete(
  "/:patientId",
  authMiddleware,
  patientController.deletePatientHandler
);

/**
 * Patient Search Operations (PUBLIC)
 */

// Find patients by address
// GET /api/patients/search/address?address=...
router.get("/search/address", patientController.findPatientsByAddressHandler);

// Find patients by condition
// GET /api/patients/search/condition?condition=...
router.get(
  "/search/condition",
  patientController.findPatientsByConditionHandler
);

export default router;
