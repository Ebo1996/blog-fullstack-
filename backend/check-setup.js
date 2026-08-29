/**
 * Check if Supabase is configured correctly
 * Run this before seeding to verify your setup
 * 
 * Usage: node check-setup.js
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Checking Northstar Setup...\n')

// Check 1: Environment Variables
console.log('1️⃣  Checking environment variables...')
if (!SUPABASE_URL) {
  console.log('   ❌ SUPABASE_URL not found in .env')
  console.log('   → Add: SUPABASE_URL=https://your-project.supabase.co')
  process.exit(1)
}
if (!SUPABASE_KEY) {
  console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY not found in .env')
  console.log('   → Add: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  process.exit(1)
}
console.log('   ✓ Environment variables configured')
console.log(`   → URL: ${SUPABASE_URL}`)
console.log(`   → Key: ${SUPABASE_KEY.substring(0, 20)}...`)
console.log()

// Check 2: Database Connection
console.log('2️⃣  Testing database connection...')
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabase() {
  try {
    // Check if we can query the database
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.log('   ❌ Database connection failed')
      console.log('   → Error:', error.message)
      console.log('   → Make sure migrations have been applied!')
      return false
    }

    console.log('   ✓ Database connected successfully')
    console.log()
    return true
  } catch (err) {
    console.log('   ❌ Connection error:', err.message)
    return false
  }
}

async function checkTables() {
  console.log('3️⃣  Checking required tables...')
  
  const requiredTables = [
    'profiles',
    'event_categories',
    'events',
    'ticket_types',
    'orders',
    'tickets',
    'registrations'
  ]

  let allTablesExist = true

  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1)

    if (error) {
      console.log(`   ❌ Table "${table}" not found`)
      allTablesExist = false
    } else {
      console.log(`   ✓ Table "${table}" exists`)
    }
  }

  if (!allTablesExist) {
    console.log('\n   → Run migrations first!')
    console.log('   → See backend/README.md for instructions')
    return false
  }

  console.log()
  return true
}

async function checkOrganizer() {
  console.log('4️⃣  Checking for organizer account...')
  
  const { data: organizers, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'organizer')

  if (error) {
    console.log('   ❌ Error checking organizers:', error.message)
    return false
  }

  if (!organizers || organizers.length === 0) {
    console.log('   ⚠️  No organizer accounts found')
    console.log('   → Create an organizer account before seeding:')
    console.log('      1. Start your frontend: cd frontend && npm run dev')
    console.log('      2. Go to http://localhost:3000/register')
    console.log('      3. Register with role "Organizer"')
    return false
  }

  console.log(`   ✓ Found ${organizers.length} organizer(s)`)
  organizers.forEach(org => {
    console.log(`      • ${org.full_name} (${org.id})`)
  })
  console.log()
  return true
}

async function checkExistingData() {
  console.log('5️⃣  Checking existing data...')
  
  const { data: categories } = await supabase
    .from('event_categories')
    .select('id')

  const { data: events } = await supabase
    .from('events')
    .select('id')

  console.log(`   • Categories: ${categories?.length || 0}`)
  console.log(`   • Events: ${events?.length || 0}`)

  if ((categories?.length || 0) > 0 || (events?.length || 0) > 0) {
    console.log('   ℹ️  Some data already exists (seed will update/add to it)')
  }
  console.log()
}

async function runChecks() {
  const dbOk = await checkDatabase()
  if (!dbOk) {
    process.exit(1)
  }

  const tablesOk = await checkTables()
  if (!tablesOk) {
    process.exit(1)
  }

  const hasOrganizer = await checkOrganizer()
  await checkExistingData()

  console.log('━'.repeat(60))
  if (hasOrganizer) {
    console.log('✨ Setup looks good! Ready to seed demo data.')
    console.log('\nRun: npm run seed')
  } else {
    console.log('⚠️  Almost ready! Create an organizer account first.')
    console.log('\nSteps:')
    console.log('  1. cd frontend && npm run dev')
    console.log('  2. Go to http://localhost:3000/register')
    console.log('  3. Register with role "Organizer"')
    console.log('  4. Come back and run: npm run seed')
  }
  console.log('━'.repeat(60))
}

runChecks()
