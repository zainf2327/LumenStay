import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from server/.env, root .env, or current directory .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'lumenstay.db'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.12'),
  defaultResortFeePerNight: parseFloat(process.env.DEFAULT_RESORT_FEE || '35.0'),

  // JWT & Cookie Token Configuration
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'lumenstay_access_secret_15min_jwt_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'lumenstay_refresh_secret_7day_http_cookie_2026',
  accessTokenExpiry: '15m', // 15-minute in-memory access token
  refreshTokenExpiryDays: 7, // 7-day secure HTTP cookie

  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseKey:
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '',
  isSupabaseConfigured: Boolean(
    process.env.SUPABASE_URL &&
    !process.env.SUPABASE_URL.includes('your-project') &&
    (
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY
    )
  ),

  // Stripe Sandbox Configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_51MockLumenStayStripeSandboxKey2026',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51MockLumenStayStripePublishableKey2026',
  isStripeConfigured: Boolean(
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('Mock')
  ),

  // Resend Email Configuration
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'LumenStay Sanctuaries <onboarding@resend.dev>',
  isResendConfigured: Boolean(
    process.env.RESEND_API_KEY &&
    !process.env.RESEND_API_KEY.includes('your-key')
  ),
};
