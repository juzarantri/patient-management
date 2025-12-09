/**
 * Patient Controller Layer
 *
 * This module handles HTTP request/response handling for patient endpoints.
 */

import { Request, Response } from "express";
import * as patientService from "@/services/patientService";
import {
  CreatePatientInput,
  UpdatePatientInput,
  ApiResponse,
} from "@/types/patient";

/**
 * Create a new patient
 * POST /patients
 */
export const createPatientHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, address, conditions, allergies } = req.body;

    // Validation
    if (!name || !address || !conditions || !allergies) {
      res.status(400).json({
        success: false,
        error: "Name, address, conditions, and allergies are required",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const input: CreatePatientInput = {
      name,
      address,
      conditions: conditions || [],
      allergies: allergies || [],
    };

    const patient = await patientService.createPatient(input);
    res.status(201).json({
      success: true,
      data: patient,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create patient";
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Get a patient by ID
 * GET /patients/:patientId
 */
export const getPatientHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID is required",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const patient = await patientService.getPatientById(patientId);

    if (!patient) {
      res.status(404).json({
        success: false,
        error: "Patient not found",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: patient,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve patient";
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Update a patient
 * PUT /patients/:patientId
 */
export const updatePatientHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { name, address, conditions, allergies } = req.body;

    if (!patientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID is required",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const input: UpdatePatientInput = {
      patientId,
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(conditions !== undefined && { conditions }),
      ...(allergies !== undefined && { allergies }),
    };

    const patient = await patientService.updatePatient(input);
    res.status(200).json({
      success: true,
      data: patient,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update patient";

    if (
      errorMessage.includes("No fields to update") ||
      errorMessage.includes("attribute_not_exists")
    ) {
      res.status(400).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Delete a patient
 * DELETE /patients/:patientId
 */
export const deletePatientHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID is required",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    await patientService.deletePatient(patientId);
    res.status(200).json({
      success: true,
      data: { patientId },
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete patient";
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * List all patients with pagination
 * GET /patients?limit=50
 */
export const listPatientsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const lastKey = req.query.lastKey
      ? JSON.parse(req.query.lastKey as string)
      : undefined;

    const result = await patientService.listPatients(limit, lastKey);
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list patients";
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Find patients by address
 * GET /patients/search/address?address=...
 */
export const findPatientsByAddressHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { address } = req.query;

    if (!address) {
      res.status(400).json({
        success: false,
        error: "Address query parameter is required",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const patients = await patientService.findPatientsByAddress(
      address as string
    );
    res.status(200).json({
      success: true,
      data: patients,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to search patients";
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};

/**
 * Find patients by condition
 * GET /patients/search/condition?condition=...
 */
export const findPatientsByConditionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { condition } = req.query;

    if (!condition) {
      res.status(400).json({
        success: false,
        error: "Condition query parameter is required",
        timestamp: new Date().toISOString(),
      } as ApiResponse);
      return;
    }

    const patients = await patientService.findPatientsByCondition(
      condition as string
    );
    res.status(200).json({
      success: true,
      data: patients,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to search patients";
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
};
