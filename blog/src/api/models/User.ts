// src/api/models/User.ts
import { ObjectId } from "mongodb";

export interface User {
    _id?: string | ObjectId;
    name: string;
    email: string;
    password?: string; // Make password optional for OAuth users
    isSuperUser: boolean;
    createdAt?: Date;
    provider?: string; // 'credentials', 'google', etc.
    lastLoginAt?: Date; // Track when user last logged in
    image?: string; // For profile picture URLs from OAuth providers
}
