import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from "next-auth/jwt";
import { getUserById } from '../api/services/User';

export async function isSuperUser(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ error: "Jo i autentifikuar" });
    }

    const user = await getUserById(token.id as string);
    if (!user?.isSuperUser) {
      return res.status(403).json({ error: "Nuk keni të drejta për këtë veprim" });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: "Gabim gjatë autorizimit" });
  }
}