export const SUPERADMIN_API_URL = (
  process.env.NEXT_PUBLIC_SUPERADMIN_API_URL || 'http://localhost:8000/api/v2/superadmin'
).replace(/\/$/, '');
