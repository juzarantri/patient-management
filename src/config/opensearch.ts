/**
 * AWS OpenSearch Configuration
 *
 * This module sets up the AWS SDK for OpenSearch (Elasticsearch)
 * for fast, full-text search of patient data by conditions.
 *
 * Why OpenSearch?
 * - DynamoDB Scans are slow for large datasets (O(n) complexity)
 * - OpenSearch provides full-text search capabilities
 * - Fast filtering and aggregation
 * - Better for production with millions of records
 */

import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

// OpenSearch configuration
const OPENSEARCH_DOMAIN = process.env.OPENSEARCH_DOMAIN || "";
const OPENSEARCH_REGION = process.env.AWS_REGION || "ap-south-1";
const PATIENTS_INDEX = process.env.OPENSEARCH_INDEX || "patients";

if (!OPENSEARCH_DOMAIN) {
  console.warn(
    "OPENSEARCH_DOMAIN not configured. Search by condition will use DynamoDB Scan (slower)."
  );
}

/**
 * Initialize OpenSearch Client with AWS Signature V4 authentication
 */
let opensearchClient: Client | null = null;

export function getOpenSearchClient(): Client | null {
  if (!OPENSEARCH_DOMAIN) {
    return null;
  }

  if (!opensearchClient) {
    opensearchClient = new Client({
      ...AwsSigv4Signer({
        region: OPENSEARCH_REGION,
        service: "es",
        getCredentials: defaultProvider(),
      }),
      node: `https://${OPENSEARCH_DOMAIN}:443`,
    });

    console.log(
      `OpenSearch Client initialized for domain: ${OPENSEARCH_DOMAIN}`
    );
  }

  return opensearchClient;
}

/**
 * Create/Update the patients index with proper mapping
 * This is called once during application startup
 */
export async function initializeIndex(): Promise<void> {
  const client = getOpenSearchClient();

  if (!client) {
    console.log("OpenSearch not configured. Skipping index initialization.");
    return;
  }

  try {
    // Check if index exists
    let indexExists = false;
    try {
      const response = await client.indices.exists({
        index: PATIENTS_INDEX,
      });
      indexExists = response.body === true;
    } catch (error: any) {
      throw error;
    }

    if (indexExists) {
      console.log(`Index '${PATIENTS_INDEX}' already exists.`);
      return;
    }

    // Create index with mappings
    await client.indices.create({
      index: PATIENTS_INDEX,
      body: {
        settings: {
          index: {
            number_of_shards: 1,
            number_of_replicas: 1,
            // Refresh interval for faster indexing
            refresh_interval: "1s",
          },
          analysis: {
            analyzer: {
              default: {
                type: "standard",
              },
              // Custom analyzer for medical terms
              medical_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "asciifolding"],
              },
            },
          },
        },
        mappings: {
          properties: {
            patientId: {
              type: "keyword", // Exact match, not analyzed
            },
            name: {
              type: "text",
              analyzer: "standard",
              fields: {
                keyword: {
                  type: "keyword", // For exact matching
                },
              },
            },
            address: {
              type: "text",
              analyzer: "standard",
              fields: {
                keyword: {
                  type: "keyword",
                },
              },
            },
            conditions: {
              type: "text",
              analyzer: "medical_analyzer",
              fields: {
                keyword: {
                  type: "keyword", // For exact filtering
                },
              },
            },
            allergies: {
              type: "text",
              analyzer: "medical_analyzer",
              fields: {
                keyword: {
                  type: "keyword",
                },
              },
            },
            createdAt: {
              type: "date",
            },
            updatedAt: {
              type: "date",
            },
          },
        },
      },
    });

    console.log(`Index '${PATIENTS_INDEX}' created successfully.`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("resource_already_exists")
    ) {
      console.log(`Index '${PATIENTS_INDEX}' already exists.`);
    } else {
      console.error("Failed to initialize OpenSearch index:", error);
      throw error;
    }
  }
}

/**
 * Index a patient document in OpenSearch
 * This will be called after creating or updating a patient
 */
export async function indexPatient(patient: any): Promise<void> {
  const client = getOpenSearchClient();

  if (!client) {
    console.log("OpenSearch not configured. Skipping indexing.");
    return;
  }

  try {
    await client.index({
      index: PATIENTS_INDEX,
      id: patient.patientId,
      body: patient,
      refresh: true, // Immediately available for search
    });

    console.log(`Patient ${patient.patientId} indexed in OpenSearch.`);
  } catch (error) {
    console.error("Failed to index patient:", error);
  }
}

/**
 * Delete a patient document from OpenSearch
 * This will be called after deleting a patient
 */
export async function deletePatientIndex(patientId: string): Promise<void> {
  const client = getOpenSearchClient();

  if (!client) {
    return;
  }

  try {
    await client.delete({
      index: PATIENTS_INDEX,
      id: patientId,
      refresh: true,
    });

    console.log(`✅ Patient ${patientId} removed from OpenSearch.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not_found")) {
      // Document doesn't exist - that's fine
      return;
    }
    console.error("❌ Failed to delete patient from index:", error);
  }
}

/**
 * Search patients by condition using OpenSearch
 */
export async function searchPatientsByCondition(
  condition: string
): Promise<any[]> {
  const client = getOpenSearchClient();

  if (!client) {
    return [];
  }

  try {
    const response = await client.search({
      index: PATIENTS_INDEX,
      body: {
        query: {
          multi_match: {
            query: condition,
            fields: ["conditions^2", "name", "address"], // Boost conditions field
            fuzziness: "AUTO", // Handle typos
            operator: "or",
          },
        },
        size: 100, // Max results
        from: 0,
      },
    });

    // Extract hits from response
    const hits = response.body.hits.hits;
    return hits.map((hit: any) => hit._source);
  } catch (error) {
    console.error("OpenSearch query failed:", error);
    throw error;
  }
}

export { PATIENTS_INDEX, OPENSEARCH_DOMAIN, OPENSEARCH_REGION };
