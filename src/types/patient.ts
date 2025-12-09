/**
 * Type definitions for Patient entity
 */

export interface Patient {
  patientId: string;
  name: string;
  address: string;
  conditions: string[];
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input type for creating a patient
 */
export interface CreatePatientInput {
  name: string;
  address: string;
  conditions: string[];
  allergies: string[];
}

/**
 * Input type for updating a patient
 */
export interface UpdatePatientInput {
  patientId: string;
  name?: string;
  address?: string;
  conditions?: string[];
  allergies?: string[];
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
