/**
 * Extensión de tipos NextAuth para Session/User con accessToken y campos custom
 */
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken?: string;
      role?: string | null;
      actorType?: 'internal_user' | 'external_user' | null;
      externalUserType?: 'maquilador' | null;
      allowedStoreIds?: number[];
      assignedStoreId?: number | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      [key: string]: unknown;
    };
  }

  interface User {
    accessToken?: string;
    role?: string | string[] | null;
    actorType?: 'internal_user' | 'external_user' | null;
    externalUserType?: 'maquilador' | null;
    allowedStoreIds?: number[];
    assignedStoreId?: number | null;
    [key: string]: unknown;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    role?: string | null;
    actorType?: 'internal_user' | 'external_user' | null;
    externalUserType?: 'maquilador' | null;
    allowedStoreIds?: number[];
    assignedStoreId?: number | null;
    lastRefresh?: number;
    [key: string]: unknown;
  }
}
