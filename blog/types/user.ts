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
  interface Session extends DefaultSession {
    user?: CustomUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    isSuperUser?: boolean;
    provider?: string;
  }
}
