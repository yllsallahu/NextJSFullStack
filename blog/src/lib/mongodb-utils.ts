import { ObjectId } from 'mongodb';

/**
 * Safely converts a string to MongoDB ObjectId
 * @param id - The string ID to convert
 * @returns ObjectId if valid, null if invalid
 */
export function safeObjectId(id: string | undefined | null): ObjectId | null {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  // Check if it's a valid ObjectId format (24 character hex string)
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return null;
  }
  
  try {
    return new ObjectId(id);
  } catch (error) {
    console.warn(`Invalid ObjectId: ${id}`, error);
    return null;
  }
}

/**
 * Filters and converts an array of string IDs to valid ObjectIds
 * @param ids - Array of string IDs
 * @returns Array of valid ObjectIds
 */
export function safeObjectIds(ids: (string | undefined | null)[]): ObjectId[] {
  return ids
    .map(id => safeObjectId(id))
    .filter((objectId): objectId is ObjectId => objectId !== null);
}

/**
 * Validates if a string is a valid MongoDB ObjectId format
 * @param id - The string to validate
 * @returns true if valid ObjectId format, false otherwise
 */
export function isValidObjectId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
}
