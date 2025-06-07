import { User } from "../api/models/User";

export function isSuperUser(user: User | null | undefined): boolean {
  return Boolean(user?.isSuperUser);
}

export function canManageBlog(user: User | null | undefined, authorId: string): boolean {
  if (!user) return false;
  return user.isSuperUser || user._id === authorId;
}