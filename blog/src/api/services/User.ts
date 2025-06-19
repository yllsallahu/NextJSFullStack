// src/api/services/User.ts
import clientPromise from "../../lib/mongodb";
import { User } from "../models/User";
import { ObjectId } from "mongodb";
import { safeObjectId } from "../../lib/mongodb-utils";

export async function createUser(data: Omit<User, '_id'>) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    // Check if this is the first user (will be made super user)
    const userCount = await db.collection("users").countDocuments();
    const isSuperUser = userCount === 0 ? true : Boolean(data.isSuperUser);
    
    // Ensure email is unique
    const existingUser = await db.collection("users").findOne({ email: data.email });
    if (existingUser) {
      throw new Error("Email është i regjistruar tashmë");
    }
    
    const result = await db.collection("users").insertOne({
      ...data,
      isSuperUser,
      createdAt: new Date()
    });
    
    return result;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

export async function getUser(email: string) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ email });
    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const objectId = safeObjectId(id);
    if (!objectId) {
      console.warn(`Invalid user ID provided: ${id}`);
      return null;
    }
    
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ 
      _id: objectId 
    });
    
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}

export async function isFirstUser(): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    const count = await db.collection("users").countDocuments();
    return count === 0;
  } catch (error) {
    console.error('Error checking if first user:', error);
    return false;
  }
}

export async function makeSuperUser(userId: string) {
  try {
    const objectId = safeObjectId(userId);
    if (!objectId) {
      throw new Error(`Invalid user ID provided: ${userId}`);
    }
    
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const result = await db.collection("users").updateOne(
      { _id: objectId },
      { $set: { isSuperUser: true } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }
    
    return result;
  } catch (error) {
    console.error('Error in makeSuperUser:', error);
    throw error;
  }
}

// Function to handle user from OAuth providers like Google
export async function getOrCreateOAuthUser(email: string, name: string, provider: string, image?: string, forceLink: boolean = false) {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    console.log(`OAuth login attempt: ${email} (${provider})`);
    
    // First attempt to find the user by email
    let user = await db.collection("users").findOne({ email });
    
    // If user doesn't exist, create a new one
    if (!user) {
      console.log(`Creating new user for ${email}`);
      
      // Check if this is the first user (will be made super user)
      const userCount = await db.collection("users").countDocuments();
      const isSuperUser = userCount === 0 ? true : false;
      
      const newUser = {
        name,
        email,
        provider,
        image,
        isSuperUser,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        oauthLogin: true,
        emailVerified: new Date() // Add this for NextAuth compatibility
      };
      
      const result = await db.collection("users").insertOne(newUser);
      
      user = {
        _id: result.insertedId,
        ...newUser
      };
      
      console.log(`Created new user via ${provider} OAuth:`, email);
      
      // Don't create account entry here - let NextAuth handle it
      // The account creation should be handled by NextAuth's adapter
      
    } else if (!user.provider || forceLink) {
      console.log(`Updating existing user with OAuth details: ${email}`);
      // If user exists but doesn't have a provider (was created via credentials),
      // or if forceLink is true, update the user to mark that they've now used OAuth
      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { 
            provider,
            image: image || user.image,
            lastLoginAt: new Date(),
            oauthLogin: true,
            emailVerified: new Date() // Add this for NextAuth compatibility
          } 
        }
      );
      
      // Update the local user object to reflect the changes
      user.provider = provider;
      user.oauthLogin = true;
      user.emailVerified = new Date();
      if (image && !user.image) {
        user.image = image;
      }
      
      console.log(`Updated existing user with ${provider} OAuth:`, email);
    } else {
      console.log(`User already exists with OAuth: ${email}`);
    }
    
    return user;
  } catch (error) {
    console.error('Error in getOrCreateOAuthUser:', error);
    throw error;
  }
}
