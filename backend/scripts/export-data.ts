#!/usr/bin/env ts-node
/**
 * Data Export Utility
 * Exports data for analytics, backups, or GDPR compliance
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// Load from environment
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface ExportOptions {
  type: 'events' | 'users' | 'orders' | 'analytics' | 'user-data'
  userId?: string
  startDate?: string
  endDate?: string
  outputFormat?: 'json' | 'csv'
}

async function exportEvents(options: ExportOptions) {
  console.log('📅 Exporting events...')
  
  let query = supabase
    .from('events')
    .select(`
      *,
      organizer:profiles!organizer_id(full_name, email),
      category:categories(name),
      ticket_types(*)
    `)

  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  const { data, error } = await query

  if (error) throw error

  const filename = `exports/events_${Date.now()}.json`
  writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ Exported ${data?.length} events to ${filename}`)
}

async function exportUsers() {
  console.log('👥 Exporting users...')
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')

  if (error) throw error

  const filename = `exports/users_${Date.now()}.json`
  writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ Exported ${data?.length} users to ${filename}`)
}

async function exportOrders(options: ExportOptions) {
  console.log('💰 Exporting orders...')
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      user:profiles!user_id(full_name, email),
      event:events(title),
      tickets(*)
    `)

  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }

  const { data, error } = await query

  if (error) throw error

  const filename = `exports/orders_${Date.now()}.json`
  writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ Exported ${data?.length} orders to ${filename}`)
}

async function exportAnalytics(options: ExportOptions) {
  console.log('📊 Exporting analytics...')
  
  const [events, orders, tickets, registrations] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount'),
    supabase.from('tickets').select('status'),
    supabase.from('registrations').select('status'),
  ])

  const analytics = {
    timestamp: new Date().toISOString(),
    period: {
      start: options.startDate,
      end: options.endDate,
    },
    summary: {
      total_events: events.count || 0,
      total_revenue: orders.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      total_tickets_sold: tickets.data?.length || 0,
      total_registrations: registrations.data?.length || 0,
    },
    ticket_status_breakdown: {
      active: tickets.data?.filter(t => t.status === 'active').length || 0,
      used: tickets.data?.filter(t => t.status === 'used').length || 0,
      cancelled: tickets.data?.filter(t => t.status === 'cancelled').length || 0,
    },
  }

  const filename = `exports/analytics_${Date.now()}.json`
  writeFileSync(filename, JSON.stringify(analytics, null, 2))
  console.log(`✅ Analytics exported to ${filename}`)
}

async function exportUserData(userId: string) {
  console.log(`📦 Exporting all data for user: ${userId}`)
  
  const [profile, orders, tickets, transfers, notifications, registrations] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('orders').select('*').eq('user_id', userId),
    supabase.from('tickets').select('*').eq('user_id', userId),
    supabase.from('transfers').select('*').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    supabase.from('notifications').select('*').eq('user_id', userId),
    supabase.from('registrations').select('*').eq('user_id', userId),
  ])

  const userData = {
    profile: profile.data,
    orders: orders.data,
    tickets: tickets.data,
    transfers: transfers.data,
    notifications: notifications.data,
    registrations: registrations.data,
    exported_at: new Date().toISOString(),
  }

  const filename = `exports/user_${userId}_${Date.now()}.json`
  writeFileSync(filename, JSON.stringify(userData, null, 2))
  console.log(`✅ User data exported to ${filename}`)
}

// CLI handling
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
Usage: ts-node export-data.ts <type> [options]

Types:
  events      Export all events
  users       Export user list
  orders      Export all orders
  analytics   Export analytics summary
  user-data   Export all data for specific user (requires --user-id)

Options:
  --user-id <uuid>     User ID for user-data export
  --start-date <iso>   Start date (ISO 8601)
  --end-date <iso>     End date (ISO 8601)
  --format <json|csv>  Output format (default: json)

Examples:
  ts-node export-data.ts events --start-date 2024-01-01
  ts-node export-data.ts user-data --user-id abc-123-def
  ts-node export-data.ts analytics --start-date 2024-01-01 --end-date 2024-12-31
    `)
    process.exit(0)
  }

  const type = args[0] as ExportOptions['type']
  const options: ExportOptions = { type }

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]
    const value = args[i + 1]
    
    if (key === '--user-id') options.userId = value
    else if (key === '--start-date') options.startDate = value
    else if (key === '--end-date') options.endDate = value
    else if (key === '--format') options.outputFormat = value as 'json' | 'csv'
  }

  // Create exports directory
  const fs = require('fs')
  if (!fs.existsSync('exports')) {
    fs.mkdirSync('exports')
  }

  try {
    switch (type) {
      case 'events':
        await exportEvents(options)
        break
      case 'users':
        await exportUsers()
        break
      case 'orders':
        await exportOrders(options)
        break
      case 'analytics':
        await exportAnalytics(options)
        break
      case 'user-data':
        if (!options.userId) {
          console.error('Error: --user-id required for user-data export')
          process.exit(1)
        }
        await exportUserData(options.userId)
        break
      default:
        console.error(`Unknown export type: ${type}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('Export failed:', error)
    process.exit(1)
  }
}

main()
