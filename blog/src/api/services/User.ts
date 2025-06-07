// src/api/services/User.ts
import clientPromise from "../../lib/mongodb";
import { User } from "../models/User";
import { ObjectId } from "mongodb";

export async function createUser(data: Omit<User, '_id'>) {
  try {
    const client = await clientPromise();
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
    
    // If this is a database connection error during build, provide a more helpful message
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      throw new Error('Database service unavailable - this operation requires a database connection');
    }
    
    throw error;
  }
}

export async function getUser(email: string) {
  try {
    const client = await clientPromise();
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ email });
    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    
    // If this is a database connection error during build, return null instead of throwing
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      console.warn('Database unavailable, returning null for user lookup');
      return null;
    }
    
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const client = await clientPromise();
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(id) 
    });
    
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    
    // If this is a database connection error during build, return null
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      console.warn('Database unavailable, returning null for user lookup by ID');
      return null;
    }
    
    throw error;
  }
}

export async function isFirstUser(): Promise<boolean> {
  try {
    const client = await clientPromise();
    const db = client.db("myapp");
    const count = await db.collection("users").countDocuments();
    return count === 0;
  } catch (error) {
    console.error('Error checking if first user:', error);
    
    // If database is unavailable, assume it's not the first user for safety
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      console.warn('Database unavailable, assuming not first user');
      return false;
    }
    
    return false;
  }
}

export async function makeSuperUser(userId: string) {
  try {
    const client = await clientPromise();
    const db = client.db("myapp");
    
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
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
    const client = await clientPromise();
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
        oauthLogin: true
      };
      
      const result = await db.collection("users").insertOne(newUser);
      
      user = {
        _id: result.insertedId,
        ...newUser
      };
      
      console.log(`Created new user via ${provider} OAuth:`, email);
      
      // Also add an entry to the accounts collection for compatibility with NextAuth
      try {
        await db.collection("accounts").insertOne({
          userId: result.insertedId,
          provider: provider,
          providerAccountId: email, // When we don't have the real provider ID
          type: "oauth",
          created_at: new Date(),
          updated_at: new Date()
        });
      } catch (accErr) {
        console.warn("Non-critical error creating account entry:", accErr);
      }
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
            oauthLogin: true
          } 
        }
      );
      
      // Update the local user object to reflect the changes
      user.provider = provider;
      user.oauthLogin = true;
      if (image && !user.image) {
        user.image = image;
      }
      
      console.log(`Updated existing user with ${provider} OAuth:`, email);
    } else {
      console.log(`User already exists with OAuth: ${email}`);
      // User exists and has previously used OAuth, just update the lastLoginAt
      // and update image if provided
      const updateFields: any = { 
        lastLoginAt: new Date(),
        oauthLogin: true 
      };
      
      if (image && !user.image) {
        updateFields.image = image;
      }
      
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: updateFields }
      );
      
      // Update the local user object
      user.lastLoginAt = new Date();
      user.oauthLogin = true;
      if (image && !user.image) {
        user.image = image;
      }
    }
    
    console.log(`OAuth user ready:`, {
      id: user._id.toString(),
      email: user.email,
      provider: user.provider,
      isSuperUser: user.isSuperUser
    });
    
    return user;
  } catch (error) {
    console.error('Error in getOrCreateOAuthUser:', error);
    
    // If this is a database connection error during build, return null
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      console.warn('Database unavailable, cannot create/get OAuth user');
      return null;
    }
    
    throw error;
  }
}
