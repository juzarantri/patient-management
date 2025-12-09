/**
 * DynamoDB Client Configuration and Utility Functions
 *
 * This module sets up the AWS SDK for DynamoDB and provides a document client
 * for simplified interactions with DynamoDB tables.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Configure DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Create Document Client (handles marshalling/unmarshalling automatically)
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table name constant
export const PATIENTS_TABLE = process.env.PATIENTS_TABLE_NAME || "Patients";

// Export the raw client for custom operations if needed
export { client, DynamoDBClient };
export {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
};
