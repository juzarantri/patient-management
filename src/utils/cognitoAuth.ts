/**
 * Cognito Authentication Helper CLI
 *
 * Usage:
 *   npm run auth <username> <password>
 *
 * This script can:
 * 1. Generate SECRET_HASH for this demo
 * 2. Authenticate with Cognito
 * 3. Return access token for API testing
 */

import crypto from "crypto";
import { execSync } from "child_process";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const USERNAME = process.argv[2];
const PASSWORD = process.argv[3];

if (!USERNAME || !PASSWORD) {
  console.error("Usage: npm run auth <username> <password>");
  console.error("\nExample:");
  console.error("  npm run auth juzarantri Creole@123");
  process.exit(1);
}

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const REGION = process.env.AWS_REGION || "ap-south-1";

if (!CLIENT_ID) {
  console.error("Error: COGNITO_CLIENT_ID not set in .env");
  process.exit(1);
}

/**
 * Generate SECRET_HASH
 */
function generateSecretHash(
  username: string,
  clientId: string,
  clientSecret: string
): string {
  const message = username + clientId;
  const hmac = crypto.createHmac("SHA256", clientSecret);
  hmac.update(message);
  return hmac.digest("base64");
}

/**
 * Authenticate with Cognito
 */
async function authenticate(): Promise<void> {
  try {
    console.log("\nAuthenticating with Cognito...");
    console.log(`Region: ${REGION}`);
    console.log(`Client ID: ${CLIENT_ID}`);
    console.log(`Username: ${USERNAME}`);

    let authParams = `USERNAME=${USERNAME},PASSWORD=${PASSWORD}`;

    // Add SECRET_HASH
    const secretHash = generateSecretHash(USERNAME, CLIENT_ID, CLIENT_SECRET);
    authParams += `,SECRET_HASH=${secretHash}`;

    // Build AWS CLI command
    const command = `aws cognito-idp initiate-auth \
      --auth-flow USER_PASSWORD_AUTH \
      --client-id ${CLIENT_ID} \
      --auth-parameters ${authParams} \
      --region ${REGION}`;

    console.log("\n Sending authentication request...\n");

    // Execute AWS CLI command
    const result = execSync(command, { encoding: "utf-8" });
    const response = JSON.parse(result);

    if (response.AuthenticationResult?.AccessToken) {
      const token = response.AuthenticationResult.AccessToken;
      const expiresIn = response.AuthenticationResult.ExpiresIn || 3600;

      console.log("Authentication successful!\n");
      console.log("TOKEN INFORMATION\n");
      console.log(
        `\n Expires in: ${expiresIn} seconds (~${Math.floor(
          expiresIn / 60
        )} minutes)`
      );
      console.log(`\nAccess Token:\n${token}\n`);

      if (response.AuthenticationResult?.RefreshToken) {
        console.log(
          `\n Refresh Token:\n${response.AuthenticationResult.RefreshToken}\n`
        );
      }

      console.log("\n How to use this token:\n");
      console.log("1. Copy the Access Token above");
      console.log("\n2. Use it in API requests:\n");
      console.log("   curl -X POST http://localhost:3000/api/patients \\");
      console.log("     -H 'Authorization: Bearer <ACCESS_TOKEN>' \\");
      console.log('     -H "Content-Type: application/json" \\');
      console.log(
        '     -d \'{"name":"John","address":"123 St","conditions":[],"allergies":[]}\''
      );
      console.log("\n3. Or use with Postman:");
      console.log("   - Create new POST request");
      console.log("   - Add Authorization header: Bearer <ACCESS_TOKEN>");
      console.log("   - Add body as JSON");
      console.log("\n");
    } else {
      console.error("Authentication failed: No access token in response");
      console.error("Response:", response);
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Authentication failed!");
    console.error("\nError:", errorMessage);

    if (errorMessage.includes("NotAuthorizedException")) {
      console.error("\n Possible issues:");
      console.error("  1. Username or password is incorrect");
      console.error("  2. User is not confirmed in Cognito");
      console.error("  3. User has been disabled");
    } else if (errorMessage.includes("SECRET_HASH")) {
      console.error("\n CLIENT_SECRET issue:");
      console.error("  Make sure COGNITO_CLIENT_SECRET is set in .env");
    }

    process.exit(1);
  }
}

// Run authentication
authenticate();
