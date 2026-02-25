import { API_BASE_URL } from '@/configs/config';

const derived = `${API_BASE_URL.replace(/\/$/, '')}/api/v2/superadmin`;
export const SUPERADMIN_API_URL = (
  process.env.NEXT_PUBLIC_SUPERADMIN_API_URL || derived
).replace(/\/$/, '');
