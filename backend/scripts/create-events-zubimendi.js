/**
 * Create 2 events for zubimendi831@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function createEvents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
    const eventSchema = new mongoose.Schema({}, { collection: 'events', strict: false });
    const categorySchema = new mongoose.Schema({}, { collection: 'categories', strict: false });
    const ticketTypeSchema = new mongoose.Schema({}, { collection: 'tickettypes', strict: false });

    const User = mongoose.model('User', userSchema);
    const Event = mongoose.model('Event', eventSchema);
    const Category = mongoose.model('Category', categorySchema);
    const TicketType = mongoose.model('TicketType', ticketTypeSchema);

    // Find organizer
    const organizerEmail = 'zubimendi831@gmail.com';
    console.log(`👤 Looking for organizer: ${organizerEmail}`);
    const organizer = await User.findOne({ email: organizerEmail });
    
    if (!organizer) {
      console.error(`❌ User not found: ${organizerEmail}`);
      console.log('\n💡 Available users:');
      const users = await User.find().limit(10);
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
      process.exit(1);
    }

    console.log(`✅ Found organizer: ${organizer.firstName || ''} ${organizer.lastName || ''}`);
    console.log(`   Email: ${organizer.email}`);
    console.log(`   Role: ${organizer.role}\n`);

    // Get categories
    const categories = await Category.find();
    const musicCategory = categories.find(c => c.name.toLowerCase().includes('music')) || categories[0];
    const sportsCategory = categories.find(c => c.name.toLowerCase().includes('sport')) || categories[1] || categories[0];

    const now = new Date();

    // ==================== EVENT 1: Music Festival ====================
    console.log('📅 Creating Event 1: Addis Jazz Festival 2026...\n');

    const event1StartDate = new Date(now);
    event1StartDate.setDate(event1StartDate.getDate() + 60); // 60 days from now
    event1StartDate.setHours(18, 0, 0, 0); // 6 PM
    const event1EndDate = new Date(event1StartDate);
    event1EndDate.setHours(23, 0, 0, 0); // 11 PM

    const event1Data = {
      organizerId: organizer._id,
      categoryId: musicCategory._id,
      title: 'Addis Jazz Festival 2026',
      slug: 'addis-jazz-festival-2026-' + Date.now(),
      description: `Experience the magic of jazz under the Addis Ababa sky!

The Addis Jazz Festival returns for its 5th year, bringing together the finest jazz musicians from Ethiopia and around the world.

🎺 Featured Artists:
• Mulatu Astatke - The father of Ethio-jazz
• International jazz ensembles from Europe & USA
• Rising Ethiopian jazz talents
• Special fusion performances

🎵 What to Expect:
✓ 5 hours of non-stop live jazz performances
✓ Multiple stages with different jazz styles
✓ Food & beverage from top restaurants
✓ Art installations & cultural exhibitions
✓ VIP lounge with premium seating
✓ Meet & greet opportunities with artists

🍽️ Food & Drinks:
Ethiopian and international cuisine, premium bar service, coffee ceremonies

Perfect for: Jazz enthusiasts, music lovers, couples, and anyone who appreciates world-class live music!

Don't miss this magical evening celebrating the rich jazz heritage of Ethiopia! 🎶`,
      type: 'in-person',
      status: 'published',
      startAt: event1StartDate,
      endAt: event1EndDate,
      timezone: 'Africa/Addis_Ababa',
      venue: {
        name: 'Unity Park Amphitheater',
        address: 'Unity Park, National Palace',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
        latitude: 9.0320,
        longitude: 38.7469
      },
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=630&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=600&fit=crop',
      currency: 'ETB',
      capacity: 800,
      isPublic: true,
      isFeatured: true,
      tags: ['music', 'jazz', 'festival', 'live-music', 'ethio-jazz', 'concert', 'entertainment'],
      settings: {
        allowWaitlist: true,
        showAttendeesCount: true,
        requireApproval: false
      },
      socialLinks: {
        facebook: 'https://facebook.com/addisjazzfest',
        twitter: 'https://twitter.com/addisjazzfest',
        instagram: 'https://instagram.com/addisjazzfestival'
      }
    };

    const event1 = await Event.create(event1Data);
    console.log(`✅ Event created: ${event1.title}`);
    console.log(`   ID: ${event1._id}`);
    console.log(`   Slug: ${event1.slug}\n`);

    // Create tickets for Event 1
    console.log('🎟️  Creating ticket types for Jazz Festival...');
    const event1Tickets = [
      {
        eventId: event1._id,
        name: 'Early Bird',
        description: 'Limited early bird tickets at special price',
        price: 600,
        currency: 'ETB',
        quantity: 200,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 5,
        salesStartAt: now,
        salesEndAt: new Date(event1StartDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event1._id,
        name: 'General Admission',
        description: 'Standard entry with standing room access',
        price: 900,
        currency: 'ETB',
        quantity: 450,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 8,
        salesStartAt: now,
        salesEndAt: event1StartDate,
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event1._id,
        name: 'VIP Premium',
        description: 'Reserved seating near stage, VIP lounge access, complimentary drinks, artist meet & greet',
        price: 2500,
        currency: 'ETB',
        quantity: 100,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 6,
        salesStartAt: now,
        salesEndAt: event1StartDate,
        isTransferable: true,
        isRefundable: false
      },
      {
        eventId: event1._id,
        name: 'Couple Package',
        description: 'Special romantic package for 2 with premium seating',
        price: 1600,
        currency: 'ETB',
        quantity: 50,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 2,
        salesStartAt: now,
        salesEndAt: event1StartDate,
        isTransferable: false,
        isRefundable: true
      }
    ];

    for (const ticket of event1Tickets) {
      const tt = await TicketType.create(ticket);
      console.log(`   ✅ ${tt.name} - ${tt.price} ETB (${tt.quantity} available)`);
    }

    // ==================== EVENT 2: Sports Event ====================
    console.log('\n📅 Creating Event 2: Addis Marathon 2026...\n');

    const event2StartDate = new Date(now);
    event2StartDate.setDate(event2StartDate.getDate() + 90); // 90 days from now
    event2StartDate.setHours(6, 0, 0, 0); // 6 AM start
    const event2EndDate = new Date(event2StartDate);
    event2EndDate.setHours(13, 0, 0, 0); // 1 PM end

    const event2Data = {
      organizerId: organizer._id,
      categoryId: sportsCategory._id,
      title: 'Addis Marathon 2026 - Run for Unity',
      slug: 'addis-marathon-2026-' + Date.now(),
      description: `Join thousands of runners in Ethiopia's premier running event!

The Addis Marathon is back for 2026, celebrating Ethiopia's legendary running heritage while promoting health, fitness, and community unity.

🏃 Race Categories:

**Full Marathon (42.195 km)**
• IAAF certified course
• Prize money: 100,000 ETB for winners
• Qualify for international marathons
• Chip timing & certificate

**Half Marathon (21.1 km)**
• Perfect challenge for experienced runners
• Prize money: 50,000 ETB for winners
• Chip timing & certificate

**10K Fun Run**
• Great for beginners & families
• Scenic route through Addis Ababa
• Finisher medals for all
• Fun & festive atmosphere

**5K Family Walk/Run**
• Perfect for families with children
• Easy pace, everyone welcome
• Finisher medals
• Kids activities at finish line

🎁 All Participants Receive:
✓ Official race bib & timing chip
✓ Technical race t-shirt
✓ Finisher medal
✓ Post-race refreshments
✓ Certificate of completion
✓ Access to health & fitness expo

🏆 Special Features:
• International elite athletes
• Live entertainment at finish line
• Health & wellness expo
• Massage & recovery stations
• Family fun zone
• Ethiopian coffee ceremony

📍 Route: Starting from Meskel Square, touring scenic Addis Ababa landmarks

Whether you're an elite runner or first-timer, this is YOUR marathon! 🏃‍♀️🏃‍♂️`,
      type: 'in-person',
      status: 'published',
      startAt: event2StartDate,
      endAt: event2EndDate,
      timezone: 'Africa/Addis_Ababa',
      venue: {
        name: 'Meskel Square (Start/Finish)',
        address: 'Meskel Square',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
        latitude: 9.0120,
        longitude: 38.7634
      },
      imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&h=630&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=1920&h=600&fit=crop',
      currency: 'ETB',
      capacity: 5000,
      isPublic: true,
      isFeatured: true,
      tags: ['sports', 'marathon', 'running', 'fitness', 'health', 'competition', 'family-friendly'],
      settings: {
        allowWaitlist: true,
        showAttendeesCount: true,
        requireApproval: false
      },
      socialLinks: {
        facebook: 'https://facebook.com/addismarathon',
        twitter: 'https://twitter.com/addismarathon',
        instagram: 'https://instagram.com/addismarathon'
      }
    };

    const event2 = await Event.create(event2Data);
    console.log(`✅ Event created: ${event2.title}`);
    console.log(`   ID: ${event2._id}`);
    console.log(`   Slug: ${event2.slug}\n`);

    // Create tickets for Event 2
    console.log('🎟️  Creating ticket types for Addis Marathon...');
    const event2Tickets = [
      {
        eventId: event2._id,
        name: 'Full Marathon (42K)',
        description: 'Full marathon entry with chip timing, medal, and certificate',
        price: 800,
        currency: 'ETB',
        quantity: 1000,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 1,
        salesStartAt: now,
        salesEndAt: new Date(event2StartDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        isTransferable: false,
        isRefundable: false
      },
      {
        eventId: event2._id,
        name: 'Half Marathon (21K)',
        description: 'Half marathon entry with chip timing, medal, and certificate',
        price: 600,
        currency: 'ETB',
        quantity: 1500,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 1,
        salesStartAt: now,
        salesEndAt: new Date(event2StartDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        isTransferable: false,
        isRefundable: false
      },
      {
        eventId: event2._id,
        name: '10K Fun Run',
        description: '10K fun run perfect for beginners - includes medal and t-shirt',
        price: 400,
        currency: 'ETB',
        quantity: 2000,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 5,
        salesStartAt: now,
        salesEndAt: new Date(event2StartDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        isTransferable: false,
        isRefundable: false
      },
      {
        eventId: event2._id,
        name: '5K Family Walk/Run',
        description: 'Family-friendly 5K walk or run - great for all ages',
        price: 200,
        currency: 'ETB',
        quantity: 500,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 10,
        salesStartAt: now,
        salesEndAt: new Date(event2StartDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        isTransferable: false,
        isRefundable: false
      }
    ];

    for (const ticket of event2Tickets) {
      const tt = await TicketType.create(ticket);
      console.log(`   ✅ ${tt.name} - ${tt.price} ETB (${tt.quantity} available)`);
    }

    // Summary
    console.log('\n🎉 SUCCESS! Created 2 events for zubimendi831@gmail.com\n');
    console.log('=' .repeat(70));
    console.log('📋 EVENT SUMMARY');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣  Addis Jazz Festival 2026');
    console.log(`   📅 Date: ${event1StartDate.toLocaleDateString()} at 6:00 PM`);
    console.log(`   🎫 Tickets: 4 types, 800 capacity`);
    console.log(`   🔗 URL: http://localhost:3000/events/${event1.slug}`);
    
    console.log('\n2️⃣  Addis Marathon 2026');
    console.log(`   📅 Date: ${event2StartDate.toLocaleDateString()} at 6:00 AM`);
    console.log(`   🎫 Tickets: 4 types, 5000 capacity`);
    console.log(`   🔗 URL: http://localhost:3000/events/${event2.slug}`);
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ All events are PUBLISHED and ready for ticket sales!');
    console.log('💼 Organizer: zubimendi831@gmail.com');
    console.log('🎯 Total capacity: 5,800 attendees across 2 events');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createEvents();
