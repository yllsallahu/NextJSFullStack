// This file contains a direct fix for the OAuth account linking issue
// Save this as linkAccountFix.ts in the same directory as User.ts

import clientPromise from "../../../src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * This is a direct bypass function to fix OAuth account linking issues.
 * It will find accounts by email and link them to the OAuth provider.
 */
export async function linkOAuthAccount(email: string, providerId: string, providerType: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    console.log(`🔗 Attempting to link account for ${email} with provider ${providerType}`);
    
    // First check if this user exists in the users collection
    const user = await db.collection("users").findOne({ email });
    
    if (!user) {
      console.log(`⚠️ No user found with email ${email} to link`);
      return false;
    }
    
    console.log(`✅ Found user: ${user._id} with email ${email}`);
    
    // Check if we have an account record in the accounts collection
    const existingAccount = await db.collection("accounts").findOne({ 
      userId: user._id,
      provider: providerType
    });
    
    if (existingAccount) {
      console.log(`⚠️ User ${email} already has a linked ${providerType} account`);
      
      // Update the existing account with the new provider info
      await db.collection("accounts").updateOne(
        { _id: existingAccount._id },
        { $set: { 
            providerAccountId: providerId,
            updated_at: new Date()
          } 
        }
      );
      
      console.log(`✅ Updated existing OAuth account for ${email}`);
      return true;
    }
    
    // Create a new account link - use the exact structure that NextAuth expects
    const accountData = {
      userId: user._id,
      type: "oauth",
      provider: providerType,
      providerAccountId: providerId,
      refresh_token: null,
      access_token: null,
      expires_at: null,
      token_type: null,
      scope: null,
      id_token: null,
      session_state: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection("accounts").insertOne(accountData);
    
    console.log(`✅ Successfully created new OAuth link for ${email} with ${providerType}`);
    
    // Update user record to mark it as OAuth enabled
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { 
          provider: providerType,
          providerAccountId: providerId,
          oauthLinked: true,
          lastUpdated: new Date()
        } 
      }
    );
    
    return true;
  } catch (error) {
    console.error('❌ Error linking OAuth account:', error);
    return false;
  }
}

// Add a function to check if an email already exists with credentials
export async function hasCredentialsAccount(email: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db("myapp");
    
    const user = await db.collection("users").findOne({ 
      email,
      password: { $exists: true } 
    });
    
    return !!user;
  } catch (error) {
    console.error('Error checking credentials account:', error);
    return false;
  }
}
