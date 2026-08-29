#!/usr/bin/env ts-node
/**
 * Bulk Notification Sender
 * Send notifications to multiple users at once
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface NotificationOptions {
  target: 'all' | 'organizers' | 'attendees' | 'event-attendees' | 'custom'
  eventId?: string
  userIds?: string[]
  type: string
  title: string
  message: string
  link?: string
}

async function getTargetUsers(options: NotificationOptions): Promise<string[]> {
  let userIds: string[] = []

  switch (options.target) {
    case 'all':
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
      userIds = allUsers?.map(u => u.id) || []
      break

    case 'organizers':
      const { data: organizers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'organizer')
      userIds = organizers?.map(u => u.id) || []
      break

    case 'attendees':
      const { data: attendees } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'attendee')
      userIds = attendees?.map(u => u.id) || []
      break

    case 'event-attendees':
      if (!options.eventId) {
        throw new Error('eventId required for event-attendees target')
      }
      const { data: tickets } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('event_id', options.eventId)
        .eq('status', 'active')
      userIds = Array.from(new Set(tickets?.map(t => t.user_id) || []))
      break

    case 'custom':
      if (!options.userIds || options.userIds.length === 0) {
        throw new Error('userIds required for custom target')
      }
      userIds = options.userIds
      break
  }

  return userIds
}

async function sendBulkNotifications(options: NotificationOptions) {
  console.log(`📢 Preparing bulk notification...`)
  console.log(`Target: ${options.target}`)
  console.log(`Title: ${options.title}`)

  // Get target users
  const userIds = await getTargetUsers(options)
  console.log(`Found ${userIds.length} users`)

  if (userIds.length === 0) {
    console.log('⚠️  No users to notify')
    return
  }

  // Confirm before sending
  console.log('\nNotification preview:')
  console.log(`Type: ${options.type}`)
  console.log(`Title: ${options.title}`)
  console.log(`Message: ${options.message}`)
  if (options.link) console.log(`Link: ${options.link}`)
  console.log(`\nWill notify ${userIds.length} users`)
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...')

  await new Promise(resolve => setTimeout(resolve, 5000))

  // Create notifications in batches
  const BATCH_SIZE = 100
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)
    const notifications = batch.map(userId => ({
      user_id: userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link || null,
      data: {},
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message)
      errorCount += batch.length
    } else {
      successCount += batch.length
      console.log(`✅ Batch ${i / BATCH_SIZE + 1} sent (${batch.length} notifications)`)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📬 Total: ${userIds.length}`)
}

// CLI handling
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage: ts-node bulk-notify.ts <target> --title <title> --message <message> [options]

Targets:
  all               All users
  organizers        All organizers
  attendees         All attendees
  event-attendees   Attendees of specific event (requires --event-id)
  custom            Custom user list (requires --user-ids)

Required Options:
  --title <text>      Notification title
  --message <text>    Notification message

Optional:
  --type <type>       Notification type (default: system_announcement)
  --link <url>        Link URL
  --event-id <uuid>   Event ID (for event-attendees target)
  --user-ids <csv>    Comma-separated user IDs (for custom target)

Examples:
  # Notify all users
  ts-node bulk-notify.ts all --title "Maintenance" --message "System maintenance tonight"

  # Notify event attendees
  ts-node bulk-notify.ts event-attendees \\
    --event-id abc-123 \\
    --title "Event Update" \\
    --message "Location changed"

  # Custom notification
  ts-node bulk-notify.ts custom \\
    --user-ids "id1,id2,id3" \\
    --title "Special Offer" \\
    --message "50% off tickets"
    `)
    process.exit(0)
  }

  const target = args[0] as NotificationOptions['target']
  const options: Partial<NotificationOptions> = { target }

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]
    const value = args[i + 1]

    if (key === '--title') options.title = value
    else if (key === '--message') options.message = value
    else if (key === '--type') options.type = value
    else if (key === '--link') options.link = value
    else if (key === '--event-id') options.eventId = value
    else if (key === '--user-ids') options.userIds = value.split(',')
  }

  // Validate required options
  if (!options.title || !options.message) {
    console.error('Error: --title and --message are required')
    process.exit(1)
  }

  // Set defaults
  if (!options.type) options.type = 'system_announcement'

  try {
    await sendBulkNotifications(options as NotificationOptions)
  } catch (error) {
    console.error('Failed to send notifications:', error)
    process.exit(1)
  }
}

main()
