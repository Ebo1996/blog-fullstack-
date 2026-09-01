/**
 * Create a sample event for a specific organizer
 * Usage: node scripts/create-event-for-organizer.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function createEvent() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define schemas
    const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
    const eventSchema = new mongoose.Schema({}, { collection: 'events', strict: false });
    const categorySchema = new mongoose.Schema({}, { collection: 'categories', strict: false });
    const ticketTypeSchema = new mongoose.Schema({}, { collection: 'tickettypes', strict: false });

    const User = mongoose.model('User', userSchema);
    const Event = mongoose.model('Event', eventSchema);
    const Category = mongoose.model('Category', categorySchema);
    const TicketType = mongoose.model('TicketType', ticketTypeSchema);

    // Find the organizer
    const organizerEmail = 'birtukantam3@gmail.com';
    console.log(`👤 Looking for organizer: ${organizerEmail}`);
    const organizer = await User.findOne({ email: organizerEmail });

    if (!organizer) {
      console.error(`❌ User not found with email: ${organizerEmail}`);
      console.log('\n💡 Available users:');
      const users = await User.find().limit(10);
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
      process.exit(1);
    }

    console.log(`✅ Found organizer: ${organizer.firstName} ${organizer.lastName}`);
    console.log(`   Role: ${organizer.role}`);
    console.log(`   ID: ${organizer._id}\n`);

    // Get a category
    console.log('📂 Finding a category...');
    let category = await Category.findOne();
    if (!category) {
      console.log('   No category found, creating one...');
      category = await Category.create({
        name: 'Music & Entertainment',
        slug: 'music-entertainment',
        description: 'Concerts, festivals, and entertainment events',
        color: '#FF6B6B',
        icon: 'music'
      });
      console.log(`   ✅ Created category: ${category.name}`);
    } else {
      console.log(`   ✅ Using category: ${category.name}`);
    }

    // Check if organizer already has events
    const existingEvents = await Event.find({ organizerId: organizer._id });
    console.log(`\n📅 Organizer currently has ${existingEvents.length} event(s)\n`);

    // Create event data
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 30); // 30 days from now
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 4); // 4 hour event

    const eventData = {
      organizerId: organizer._id,
      categoryId: category._id,
      title: 'Ethiopian Coffee & Music Festival 2026',
      slug: 'ethiopian-coffee-music-festival-2026',
      description: `Join us for an unforgettable celebration of Ethiopian coffee culture and traditional music! 

This festival brings together the best of Ethiopia's coffee heritage with live performances from renowned artists. Experience:

🎵 Live traditional and contemporary Ethiopian music
☕ Coffee tasting sessions from different regions
🎨 Cultural exhibitions and art displays
🍽️ Traditional Ethiopian cuisine
🎉 Family-friendly activities

Whether you're a coffee enthusiast, music lover, or cultural explorer, this event offers something special for everyone!`,
      type: 'in-person',
      status: 'published',
      startAt: startDate,
      endAt: endDate,
      timezone: 'Africa/Addis_Ababa',
      venue: {
        name: 'Millennium Hall',
        address: 'Ras Abebe Aregay Street',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
        latitude: 9.0320,
        longitude: 38.7469
      },
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=630&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&h=600&fit=crop',
      currency: 'ETB',
      capacity: 500,
      isPublic: true,
      isFeatured: true,
      tags: ['music', 'coffee', 'culture', 'festival', 'ethiopian', 'family-friendly'],
      settings: {
        allowWaitlist: true,
        showAttendeesCount: true,
        requireApproval: false
      },
      socialLinks: {
        facebook: 'https://facebook.com/ethiopiancoffeefest',
        twitter: 'https://twitter.com/ethiocoffeefest',
        instagram: 'https://instagram.com/ethiopiancoffeefestival'
      }
    };

    console.log('📝 Creating event...');
    const event = await Event.create(eventData);
    console.log(`✅ Event created successfully!`);
    console.log(`   Title: ${event.title}`);
    console.log(`   Slug: ${event.slug}`);
    console.log(`   ID: ${event._id}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Date: ${event.startAt.toLocaleDateString()}\n`);

    // Create ticket types
    console.log('🎟️  Creating ticket types...');
    
    const ticketTypes = [
      {
        eventId: event._id,
        name: 'Early Bird',
        description: 'Limited early bird tickets at special price',
        price: 300,
        currency: 'ETB',
        quantity: 100,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 5,
        salesStartAt: now,
        salesEndAt: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before event
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event._id,
        name: 'General Admission',
        description: 'Standard entry to the festival',
        price: 500,
        currency: 'ETB',
        quantity: 300,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 10,
        salesStartAt: now,
        salesEndAt: startDate,
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event._id,
        name: 'VIP Pass',
        description: 'VIP access with premium seating, exclusive coffee tasting, and meet & greet',
        price: 1200,
        currency: 'ETB',
        quantity: 50,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 4,
        salesStartAt: now,
        salesEndAt: startDate,
        isTransferable: true,
        isRefundable: false
      },
      {
        eventId: event._id,
        name: 'Student Discount',
        description: 'Special price for students with valid ID',
        price: 200,
        currency: 'ETB',
        quantity: 50,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 2,
        salesStartAt: now,
        salesEndAt: startDate,
        isTransferable: false,
        isRefundable: true
      }
    ];

    for (const ttData of ticketTypes) {
      const tt = await TicketType.create(ttData);
      console.log(`   ✅ Created: ${tt.name} (${tt.price} ${tt.currency}, ${tt.quantity} available)`);
    }

    console.log('\n🎉 Success! Event created with ticket types.');
    console.log('\n📋 Event Details:');
    console.log(`   URL: http://localhost:3000/events/${event.slug}`);
    console.log(`   Organizer: ${organizer.email}`);
    console.log(`   Tickets: 4 types, ${ticketTypes.reduce((sum, t) => sum + t.quantity, 0)} total capacity`);
    console.log(`   Status: ${event.status}`);
    console.log('\n💡 The organizer can now manage this event from their dashboard!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createEvent();
