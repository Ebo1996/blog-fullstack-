/**
 * Environment variable validation
 * 
 * Validates required environment variables at application startup.
 * Fails fast with clear error messages if critical config is missing.
 */

// ─── Required Environment Variables ───────────────────────────────────────────

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

const optionalEnvVars = [
  'CHAPA_SECRET_KEY',
  'RESEND_API_KEY',
] as const

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missing.push(varName)
    }
  }

  // Check optional but recommended variables
  for (const varName of optionalEnvVars) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      warnings.push(varName)
    }
  }

  // Fail if required vars are missing
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('\n💡 Copy .env.example to .env.local and fill in the values.')
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate URL formats
  validateURL('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL!)
  validateURL('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL!)

  // Validate Supabase keys
  validateSupabaseKey('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  validateSupabaseKey('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Validate Chapa key format if provided
  if (process.env.CHAPA_SECRET_KEY) {
    validateChapaKey(process.env.CHAPA_SECRET_KEY)
  }

  // Log warnings for optional vars
  if (warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not configured:')
    warnings.forEach(v => {
      const hint = getEnvVarHint(v)
      console.warn(`   - ${v}${hint ? ` (${hint})` : ''}`)
    })
  }

  // Success message
  console.log('✅ Environment variables validated successfully')
  if (process.env.CHAPA_SECRET_KEY) {
    const isTest = process.env.CHAPA_SECRET_KEY.startsWith('CHASECK_TEST-')
    console.log(`   💳 Chapa: ${isTest ? 'TEST mode' : 'LIVE mode'}`)
  }
}

// ─── Validators ───────────────────────────────────────────────────────────────

function validateURL(name: string, value: string): void {
  try {
    new URL(value)
  } catch {
    throw new Error(`${name} must be a valid URL (got: ${value})`)
  }
}

function validateSupabaseKey(name: string, value: string): void {
  // Supabase keys are JWT tokens - should be fairly long
  if (value.length < 100) {
    throw new Error(`${name} appears invalid (too short). Check your Supabase project settings.`)
  }
  
  // Should contain dots (JWT structure: header.payload.signature)
  if (!value.includes('.')) {
    throw new Error(`${name} appears invalid (not a JWT token). Check your Supabase project settings.`)
  }
}

function validateChapaKey(value: string): void {
  // Chapa keys start with CHASECK_TEST- or CHASECK-
  if (!value.startsWith('CHASECK_TEST-') && !value.startsWith('CHASECK-')) {
    throw new Error(
      'CHAPA_SECRET_KEY must start with CHASECK_TEST- (test) or CHASECK- (live). ' +
      'Get your key from https://dashboard.chapa.co'
    )
  }

  // Warn if using live key in development
  if (value.startsWith('CHASECK-') && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  WARNING: Using LIVE Chapa key in development environment!')
  }

  // Warn if using test key in production
  if (value.startsWith('CHASECK_TEST-') && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using TEST Chapa key in production environment!')
  }
}

function getEnvVarHint(varName: string): string | null {
  switch (varName) {
    case 'CHAPA_SECRET_KEY':
      return 'required for payments - get from https://dashboard.chapa.co'
    case 'RESEND_API_KEY':
      return 'required for email notifications - get from https://resend.com'
    default:
      return null
  }
}

// ─── Export validated env for type-safe access ────────────────────────────────

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
    env: process.env.NODE_ENV || 'development',
  },
  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY,
    isConfigured: !!process.env.CHAPA_SECRET_KEY,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    isConfigured: !!process.env.RESEND_API_KEY,
  },
} as const
