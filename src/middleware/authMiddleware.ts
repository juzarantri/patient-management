/**
 * Authentication Middleware
 *
 * This middleware validates Cognito JWT tokens from Authorization headers
 * and attaches the authenticated user's claims to the request object.
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/config/cognito";

/**
 * Extend Express Request type to include user claims
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string; // User's unique identifier
        username: string; // Cognito username
        email?: string; // User's email
        [key: string]: any; // Other claims from the token
      };
    }
  }
}

/**
 * Authentication Middleware
 * Validates Cognito JWT token and extracts user information
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: "Authorization header is missing",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if header follows Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Invalid authorization header format. Expected: Bearer <token>",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token and extract claims
    const claims = await verifyAccessToken(token);

    // Attach user information to request object
    req.user = {
      sub: claims.sub,
      username: claims.username,
      email: claims.email as string,
      ...claims,
    };

    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Token verification failed";

    res.status(401).json({
      success: false,
      error: `Unauthorized: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    });
  }
};
