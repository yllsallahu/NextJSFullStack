import { DefaultUser, DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

interface IUser extends DefaultUser {
  isSuperUser?: boolean;
  provider?: string;
}

export interface CustomUser extends IUser {
  id: string;
  email: string;
  name: string;
}

export interface DbUser extends Omit<CustomUser, 'id'> {
  _id: string;
  password?: string;
}

declare module 'next-auth' {
  interface User extends IUser {}
  interface Session {
    user: CustomUser;
  }
}

declare module 'next-auth/jwt' {
  // Fix: Make sure id has consistent modifiers with other declarations
  interface JWT {
    id: string;  // Remove the optional modifier
    isSuperUser?: boolean;
    provider?: string;
    picture?: string;
  }
}
