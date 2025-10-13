// Authentication middleware - verifies Firebase ID tokens
import type { Request, Response, NextFunction } from "express";
import { auth } from "../firebase-admin";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      req.userId = decodedToken.uid;
      next();
    } catch (error: any) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
