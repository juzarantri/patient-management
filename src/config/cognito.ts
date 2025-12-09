/**
 * AWS Cognito Configuration
 *
 * This module sets up JWT verification for Cognito tokens.
 * It validates access tokens.
 */

import { CognitoJwtVerifier } from "aws-jwt-verify";

// Initialize the JWT Verifier for Cognito Access Tokens
export const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || "",
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID || "",
});

/**
 * Verify Cognito Access Token
 * Returns the decoded token claims if valid
 */
export const verifyAccessToken = async (token: string) => {
  try {
    const claims = await accessTokenVerifier.verify(token);
    return claims;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid or expired token");
  }
};
