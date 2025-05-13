// src/api/models/User.ts
import { ObjectId } from "mongodb";

export interface User {
    _id?: string;
    name: string;
    email: string;
    password: string;
    isSuperUser: boolean;
    createdAt?: Date;
}
