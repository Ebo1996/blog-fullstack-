/**
 * Seed demo data to Supabase
 * 
 * Usage:
 *   node seed-demo.js
 * 
 * Requires:
 *   - .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - @supabase/supabase-js package
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedData() {
  console.log('🚀 Starting Northstar Demo Data Seed...\n')

  try {
    // 1. Seed Categories
    console.log('1️⃣  Seeding categories...')
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Developer conferences, hackathons, and tech meetups' },
      { name: 'Music', slug: 'music', description: 'Concerts, festivals, and live music events' },
      { name: 'Business', slug: 'business', description: 'Networking events, summits, and workshops' },
      { name: 'Design', slug: 'design', description: 'UX, product, and creative design events' },
      { name: 'Sports', slug: 'sports', description: 'Athletic competitions and sports meetups' },
      { name: 'Education', slug: 'education', description: 'Workshops, seminars, and learning events' },
      { name: 'Networking', slug: 'networking', description: 'Professional and social networking events' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Film, comedy, theatre, and entertainment' },
      { name: 'Art', slug: 'art', description: 'Exhibitions, galleries, and creative showcases' },
      { name: 'Culture', slug: 'culture', description: 'Cultural festivals and community events' },
    ]

    const { error: catError } = await supabase
      .from('event_categories')
      .upsert(categories, { onConflict: 'slug' })

    if (catError && !catError.message.includes('duplicate')) {
      console.error('Error seeding categories:', catError)
    } else {
      console.log('   ✓ Categories seeded\n')
    }

    // Get the organizer user (we'll use the first organizer we find)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'organizer')
      .limit(1)

    let organizerId = profiles && profiles.length > 0 ? profiles[0].id : null

    if (!organizerId) {
      console.log('⚠️  No organizer found. Please create an organizer account first.')
      console.log('   Visit your app and register with role "organizer"\n')
      return
    }

    console.log(`   Using organizer ID: ${organizerId}\n`)

    // Get category IDs
    const { data: catData } = await supabase
      .from('event_categories')
      .select('id, slug')

    const categoryMap = {}
    catData.forEach(cat => {
      categoryMap[cat.slug] = cat.id
    })

    // 2. Seed Events
    console.log('2️⃣  Seeding events...')
    
    const now = new Date()
    const events = [
      {
        organizer_id: organizerId,
        category_id: categoryMap['music'],
        title: 'Future Sound',
        slug: 'future-sound',
        description: 'An immersive electronic music experience at Brooklyn Mirage. Three stages, world-class sound design, and a lineup of the most forward-thinking artists in dance music. Expect the unexpected — Future Sound pushes the boundaries of what a live event can be.',
        venue_name: 'Brooklyn Mirage',
        venue_address: '140 Stewart Ave',
        city: 'Brooklyn',
        country: 'US',
        start_at: new Date(now.getTime() + 52 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 53 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 1200,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['design'],
        title: 'New York Design Week',
        slug: 'new-york-design-week',
        description: 'Five days of talks, workshops, and exhibitions from the world\'s leading product designers, UX researchers, and creative directors. NYDW brings together 3,000+ designers across 40+ sessions covering the future of human-centered design.',
        venue_name: 'Industry City',
        venue_address: '220 36th St',
        city: 'Brooklyn',
        country: 'US',
        start_at: new Date(now.getTime() + 73 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 77 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 3000,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['culture'],
        title: 'The Long Now',
        slug: 'the-long-now',
        description: 'A one-night gathering at Public Records dedicated to slow listening, long-form conversation, and ambient music. The Long Now is an antidote to the attention economy — a space to think in real time, together.',
        venue_name: 'Public Records',
        venue_address: '233 Butler St',
        city: 'Brooklyn',
        country: 'US',
        start_at: new Date(now.getTime() + 105 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 105 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        capacity: 350,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['technology'],
        title: 'Web Summit NYC',
        slug: 'web-summit-nyc',
        description: 'The premier technology conference comes to New York City. 10,000 attendees, 500 speakers, and three days of talks covering AI, infrastructure, product, and the future of the internet. Workshops, fireside chats, and the world\'s best networking floor.',
        venue_name: 'Jacob K. Javits Convention Center',
        venue_address: '429 11th Ave',
        city: 'New York',
        country: 'US',
        start_at: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 123 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 10000,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['business'],
        title: 'Founder\'s Forum',
        slug: 'founders-forum',
        description: 'An intimate dinner and talk series for early-stage founders and investors. 80 seats. No panels, no PowerPoints — just real conversation about what it takes to build something from nothing.',
        venue_name: 'The Wythe Hotel',
        venue_address: '80 Wythe Ave',
        city: 'Brooklyn',
        country: 'US',
        start_at: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        capacity: 80,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['music'],
        title: 'Summer Solstice Festival',
        slug: 'summer-solstice-festival',
        description: 'An outdoor music and arts festival celebrating the longest day of the year. Multiple stages featuring indie, electronic, and world music artists.',
        venue_name: 'Prospect Park',
        venue_address: 'Prospect Park West',
        city: 'Brooklyn',
        country: 'US',
        start_at: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 181 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 5000,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['technology'],
        title: 'AI Engineering Summit',
        slug: 'ai-engineering-summit',
        description: 'Two days focused on practical AI implementation. Learn from teams shipping AI products at scale. Topics include LLM fine-tuning, RAG systems, prompt engineering, and evaluation frameworks.',
        venue_name: 'Manhattan Conference Center',
        venue_address: '123 West St',
        city: 'New York',
        country: 'US',
        start_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 92 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 800,
        status: 'published'
      },
      {
        organizer_id: organizerId,
        category_id: categoryMap['art'],
        title: 'Digital Art Expo',
        slug: 'digital-art-expo',
        description: 'Explore the intersection of technology and art. NFT galleries, generative art installations, VR experiences, and talks from leading digital artists.',
        venue_name: 'Chelsea Gallery District',
        venue_address: '555 West 25th St',
        city: 'New York',
        country: 'US',
        start_at: new Date(now.getTime() + 65 * 24 * 60 * 60 * 1000).toISOString(),
        end_at: new Date(now.getTime() + 68 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 500,
        status: 'published'
      }
    ]

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .upsert(events, { onConflict: 'slug' })
      .select()

    if (eventError) {
      console.error('Error seeding events:', eventError)
    } else {
      console.log(`   ✓ ${events.length} events seeded\n`)
    }

    // 3. Seed Ticket Types
    console.log('3️⃣  Seeding ticket types...')
    
    // Fetch seeded events
    const { data: seededEvents } = await supabase
      .from('events')
      .select('id, slug')
      .in('slug', events.map(e => e.slug))

    const eventIdMap = {}
    seededEvents.forEach(event => {
      eventIdMap[event.slug] = event.id
    })

    const ticketTypes = [
      // Future Sound
      { event_id: eventIdMap['future-sound'], name: 'General Admission', description: 'Access to all stages', price: 6500, currency: 'USD', capacity: 800, quantity: 800, sold_quantity: 0, status: 'active' },
      { event_id: eventIdMap['future-sound'], name: 'VIP', description: 'VIP lounge, early entry, premium bar', price: 14500, currency: 'USD', capacity: 150, quantity: 150, sold_quantity: 0, status: 'active' },
      
      // New York Design Week
      { event_id: eventIdMap['new-york-design-week'], name: 'Day Pass', description: 'Single day access to all talks', price: 4500, currency: 'USD', capacity: 600, quantity: 600, sold_quantity: 0, status: 'active' },
      { event_id: eventIdMap['new-york-design-week'], name: 'Full Festival Pass', description: '5-day access + workshop access', price: 18000, currency: 'USD', capacity: 300, quantity: 300, sold_quantity: 0, status: 'active' },
      
      // The Long Now
      { event_id: eventIdMap['the-long-now'], name: 'General', description: 'General admission', price: 2500, currency: 'USD', capacity: 300, quantity: 300, sold_quantity: 0, status: 'active' },
      
      // Web Summit NYC
      { event_id: eventIdMap['web-summit-nyc'], name: 'Startup Pass', description: 'For startups < 3 years old', price: 49900, currency: 'USD', capacity: 2000, quantity: 2000, sold_quantity: 0, status: 'active' },
      { event_id: eventIdMap['web-summit-nyc'], name: 'Investor Pass', description: 'VC, angels, and institutional investors', price: 99900, currency: 'USD', capacity: 500, quantity: 500, sold_quantity: 0, status: 'active' },
      
      // Founder's Forum
      { event_id: eventIdMap['founders-forum'], name: 'Founder Seat', description: 'Dinner + talks', price: 35000, currency: 'USD', capacity: 60, quantity: 60, sold_quantity: 0, status: 'active' },
      
      // Summer Solstice Festival
      { event_id: eventIdMap['summer-solstice-festival'], name: 'General Admission', description: 'Full festival access', price: 8500, currency: 'USD', capacity: 4000, quantity: 4000, sold_quantity: 0, status: 'active' },
      { event_id: eventIdMap['summer-solstice-festival'], name: 'VIP', description: 'VIP area, premium facilities', price: 22500, currency: 'USD', capacity: 500, quantity: 500, sold_quantity: 0, status: 'active' },
      
      // AI Engineering Summit
      { event_id: eventIdMap['ai-engineering-summit'], name: 'Individual', description: 'Full conference access', price: 59900, currency: 'USD', capacity: 600, quantity: 600, sold_quantity: 0, status: 'active' },
      { event_id: eventIdMap['ai-engineering-summit'], name: 'Team (5 seats)', description: '5 tickets at discounted rate', price: 249900, currency: 'USD', capacity: 40, quantity: 40, sold_quantity: 0, status: 'active' },
      
      // Digital Art Expo
      { event_id: eventIdMap['digital-art-expo'], name: 'General Admission', description: 'Access to all exhibitions', price: 3500, currency: 'USD', capacity: 450, quantity: 450, sold_quantity: 0, status: 'active' },
    ]

    const { error: ticketError } = await supabase
      .from('ticket_types')
      .insert(ticketTypes)

    if (ticketError) {
      console.error('Error seeding ticket types:', ticketError)
    } else {
      console.log(`   ✓ ${ticketTypes.length} ticket types seeded\n`)
    }

    console.log('✨ Demo data seeded successfully!\n')
    console.log('🎉 You now have:')
    console.log(`   • ${events.length} events`)
    console.log(`   • ${ticketTypes.length} ticket types`)
    console.log(`   • ${categories.length} categories\n`)
    console.log('Visit your app to see the events!')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedData()
