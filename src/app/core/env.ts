import { GENERATED_ENV } from './env.generated';

export const ENV = GENERATED_ENV;

/** Without Supabase settings the site runs on built-in content and the admin panel stores edits in this browser only. */
export const DEMO_MODE = !(ENV.supabaseUrl && ENV.supabaseAnonKey);
