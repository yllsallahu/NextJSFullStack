// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getUser, createUser } from "../../../src/api/services/User";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Ju lutem plotësoni të gjitha fushat" 
      });
    }

    // Check if user exists
    const existingUser = await getUser(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: "Përdoruesi me këtë email ekziston" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await createUser({
      name,
      email,
      password: hashedPassword,
      isSuperUser: false,
      createdAt: new Date()
    });

    // Return success but don't include password
    return res.status(201).json({
      success: true,
      user: {
        id: result.insertedId,
        name,
        email
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // If this is a database connection error, provide a more helpful message
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      return res.status(503).json({ 
        error: "Shërbimi i regjistrimit nuk është i disponueshëm. Ju lutem provoni përsëri më vonë." 
      });
    }
    
    // If it's a user validation error, return it as-is
    if (error instanceof Error && (
      error.message.includes('Email është i regjistruar tashmë') ||
      error.message.includes('Database service unavailable')
    )) {
      return res.status(409).json({ 
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: "Gabim gjatë regjistrimit të përdoruesit" 
    });
  }
}
