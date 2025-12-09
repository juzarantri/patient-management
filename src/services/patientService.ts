/**
 * Patient Service Layer
 *
 * This module contains all business logic for patient operations.
 */

import { v4 as uuidv4 } from "uuid";
import {
  docClient,
  PATIENTS_TABLE,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@/config/database";
import {
  indexPatient,
  deletePatientIndex,
  searchPatientsByCondition as searchOpenSearch,
  getOpenSearchClient,
} from "@/config/opensearch";
import {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
} from "@/types/patient";

/**
 * Create a new patient record
 */
export const createPatient = async (
  input: CreatePatientInput
): Promise<Patient> => {
  const now = new Date().toISOString();
  const patient: Patient = {
    patientId: uuidv4(),
    name: input.name,
    address: input.address,
    conditions: input.conditions,
    allergies: input.allergies,
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: PATIENTS_TABLE,
    Item: patient,
    // Prevent overwriting existing patient
    ConditionExpression: "attribute_not_exists(patientId)",
  });

  await docClient.send(command);

  // Index in OpenSearch for fast searching
  await indexPatient(patient).catch((error) => {
    console.error("Warning: Failed to index patient in OpenSearch:", error);
  });

  return patient;
};

/**
 * Get a patient by ID
 */
export const getPatientById = async (
  patientId: string
): Promise<Patient | null> => {
  const command = new GetCommand({
    TableName: PATIENTS_TABLE,
    Key: { patientId },
  });

  const response = await docClient.send(command);
  return (response.Item as Patient) || null;
};

/**
 * Update a patient record
 */
export const updatePatient = async (
  input: UpdatePatientInput
): Promise<Patient> => {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Build dynamic update expression
  if (input.name !== undefined) {
    updateExpressions.push("#name = :name");
    expressionAttributeNames["#name"] = "name";
    expressionAttributeValues[":name"] = input.name;
  }

  if (input.address !== undefined) {
    updateExpressions.push("#address = :address");
    expressionAttributeNames["#address"] = "address";
    expressionAttributeValues[":address"] = input.address;
  }

  if (input.conditions !== undefined) {
    updateExpressions.push("#conditions = :conditions");
    expressionAttributeNames["#conditions"] = "conditions";
    expressionAttributeValues[":conditions"] = input.conditions;
  }

  if (input.allergies !== undefined) {
    updateExpressions.push("#allergies = :allergies");
    expressionAttributeNames["#allergies"] = "allergies";
    expressionAttributeValues[":allergies"] = input.allergies;
  }

  // Always update the updatedAt timestamp
  updateExpressions.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = new Date().toISOString();

  if (updateExpressions.length === 1) {
    // Only updatedAt was set, meaning no actual updates
    throw new Error("No fields to update");
  }

  const command = new UpdateCommand({
    TableName: PATIENTS_TABLE,
    Key: { patientId: input.patientId },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    // Ensure patient exists before updating
    ConditionExpression: "attribute_exists(patientId)",
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(command);
  const updatedPatient = response.Attributes as Patient;

  // Update in OpenSearch index
  await indexPatient(updatedPatient).catch((error) => {
    console.error("Warning: Failed to update patient in OpenSearch:", error);
  });

  return updatedPatient;
};

/**
 * Delete a patient record
 */
export const deletePatient = async (patientId: string): Promise<void> => {
  const command = new DeleteCommand({
    TableName: PATIENTS_TABLE,
    Key: { patientId },
    // Ensure patient exists before deleting
    ConditionExpression: "attribute_exists(patientId)",
  });

  await docClient.send(command);

  // Remove from OpenSearch index
  await deletePatientIndex(patientId).catch((error) => {
    console.error("Warning: Failed to delete patient from OpenSearch:", error);
  });
};

/**
 * Find patients by address
 */
export const findPatientsByAddress = async (
  address: string
): Promise<Patient[]> => {
  const command = new QueryCommand({
    TableName: PATIENTS_TABLE,
    IndexName: "AddressIndex",
    KeyConditionExpression: "#address = :address",
    ExpressionAttributeNames: {
      "#address": "address",
    },
    ExpressionAttributeValues: {
      ":address": address,
    },
  });

  const response = await docClient.send(command);
  return (response.Items as Patient[]) || [];
};

/**
 * Find patients by condition using OpenSearch
 * Falls back to DynamoDB Scan if OpenSearch is not configured
 */
export const findPatientsByCondition = async (
  condition: string
): Promise<Patient[]> => {
  // Try OpenSearch first if available
  if (getOpenSearchClient()) {
    try {
      console.log(`Searching for condition '${condition}' in OpenSearch...`);
      const results = await searchOpenSearch(condition);
      console.log(`Found ${results.length} patients in OpenSearch`);
      return results;
    } catch (error) {
      console.error("OpenSearch search failed, falling back to DynamoDB");
      // Fall through to DynamoDB Scan
    }
  }

  // Fallback to DynamoDB Scan (slower, but works without OpenSearch)
  console.log(`Falling back to DynamoDB Scan for condition '${condition}'...`);
  const command = new ScanCommand({
    TableName: PATIENTS_TABLE,
    FilterExpression: "contains(#conditions, :condition)",
    ExpressionAttributeNames: {
      "#conditions": "conditions",
    },
    ExpressionAttributeValues: {
      ":condition": condition,
    },
  });

  const response = await docClient.send(command);
  return (response.Items as Patient[]) || [];
};

/**
 * List all patients
 */
export const listPatients = async (
  limit: number = 50,
  lastEvaluatedKey?: Record<string, any>
): Promise<{ patients: Patient[]; lastKey?: Record<string, any> }> => {
  const command = new ScanCommand({
    TableName: PATIENTS_TABLE,
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  });

  const response = await docClient.send(command);
  return {
    patients: (response.Items as Patient[]) || [],
    lastKey: response.LastEvaluatedKey,
  };
};
