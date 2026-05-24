import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tier: Tier;
  created_at: string;
  updated_at: string;
}

export type Tier = 'free' | 'pro' | 'enterprise';

export interface WhatsAppSession {
  id: string;
  user_id: string;
  phone_number: string;
  status: string;
  session_data_path: string;
  created_at: string;
  last_connected: string | null;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key: string;
  created_at: string;
  last_used: string | null;
}

export interface TierLimits {
  tier: Tier;
  max_numbers: number;
  max_requests_per_day: number;
}

export interface AuthRequest extends Request {
  user?: Omit<User, 'password_hash'>;
}
