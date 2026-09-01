/**
 * Create two more events for birtukantam3@gmail.com
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
    const organizer = await User.findOne({ email: 'birtukantam3@gmail.com' });
    if (!organizer) {
      console.error('❌ Organizer not found');
      process.exit(1);
    }

    console.log(`✅ Found organizer: ${organizer.email}\n`);

    // Get categories
    const categories = await Category.find();
    const techCategory = categories.find(c => c.name.includes('Tech')) || categories[0];
    const businessCategory = categories.find(c => c.name.includes('Business')) || categories[1] || categories[0];

    const now = new Date();

    // ==================== EVENT 1: Tech Conference ====================
    console.log('📅 Creating Event 1: Addis Ababa Tech Summit 2026...\n');

    const event1StartDate = new Date(now);
    event1StartDate.setDate(event1StartDate.getDate() + 45); // 45 days from now
    const event1EndDate = new Date(event1StartDate);
    event1EndDate.setDate(event1EndDate.getDate() + 2); // 2-day event

    const event1Data = {
      organizerId: organizer._id,
      categoryId: techCategory._id,
      title: 'Addis Ababa Tech Summit 2026',
      slug: 'addis-tech-summit-2026-' + Date.now(),
      description: `The premier technology conference in East Africa returns for 2026!

Join 1000+ tech leaders, entrepreneurs, and innovators for three days of:

🚀 Keynote speeches from global tech leaders
💡 Hands-on workshops on AI, Blockchain, and Cloud Computing
🤝 Networking sessions with investors and founders
🏆 Startup pitch competition with 50,000 ETB prize
🎯 Career fair with top tech companies

Topics Include:
• Artificial Intelligence & Machine Learning
• Fintech Innovation in Africa
• E-commerce & Digital Payments
• Cybersecurity
• Software Development Best Practices
• Startup Ecosystem Building

Whether you're a developer, entrepreneur, investor, or tech enthusiast, this is THE event to attend!`,
      type: 'in-person',
      status: 'published',
      startAt: event1StartDate,
      endAt: event1EndDate,
      timezone: 'Africa/Addis_Ababa',
      venue: {
        name: 'Skylight Hotel',
        address: 'Bole Road',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
        latitude: 9.0092,
        longitude: 38.7628
      },
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&h=600&fit=crop',
      currency: 'ETB',
      capacity: 1000,
      isPublic: true,
      isFeatured: true,
      tags: ['technology', 'conference', 'networking', 'startup', 'innovation', 'AI', 'blockchain'],
      settings: {
        allowWaitlist: true,
        showAttendeesCount: true,
        requireApproval: false
      },
      socialLinks: {
        facebook: 'https://facebook.com/addistechsummit',
        twitter: 'https://twitter.com/addistechsummit',
        instagram: 'https://instagram.com/addistechsummit'
      }
    };

    const event1 = await Event.create(event1Data);
    console.log(`✅ Event created: ${event1.title}`);
    console.log(`   ID: ${event1._id}`);
    console.log(`   Slug: ${event1.slug}\n`);

    // Create tickets for Event 1
    console.log('🎟️  Creating ticket types for Tech Summit...');
    const event1Tickets = [
      {
        eventId: event1._id,
        name: 'Super Early Bird',
        description: 'Limited super early bird offer - save 50%!',
        price: 750,
        currency: 'ETB',
        quantity: 100,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 3,
        salesStartAt: now,
        salesEndAt: new Date(event1StartDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event1._id,
        name: 'Regular Pass',
        description: 'Full access to all sessions, workshops, and networking events',
        price: 1500,
        currency: 'ETB',
        quantity: 700,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 10,
        salesStartAt: now,
        salesEndAt: event1StartDate,
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event1._id,
        name: 'VIP Pass',
        description: 'Premium seating, exclusive workshops, VIP lounge access, and networking dinner',
        price: 3500,
        currency: 'ETB',
        quantity: 150,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 5,
        salesStartAt: now,
        salesEndAt: event1StartDate,
        isTransferable: true,
        isRefundable: false
      },
      {
        eventId: event1._id,
        name: 'Student Pass',
        description: 'Special rate for students - bring valid student ID',
        price: 500,
        currency: 'ETB',
        quantity: 50,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 1,
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

    // ==================== EVENT 2: Business Workshop ====================
    console.log('\n📅 Creating Event 2: Digital Marketing Masterclass...\n');

    const event2StartDate = new Date(now);
    event2StartDate.setDate(event2StartDate.getDate() + 20); // 20 days from now
    event2StartDate.setHours(9, 0, 0, 0);
    const event2EndDate = new Date(event2StartDate);
    event2EndDate.setHours(17, 0, 0, 0); // 8-hour workshop

    const event2Data = {
      organizerId: organizer._id,
      categoryId: businessCategory._id,
      title: 'Digital Marketing Masterclass: Grow Your Business Online',
      slug: 'digital-marketing-masterclass-' + Date.now(),
      description: `Transform your business with cutting-edge digital marketing strategies!

This intensive one-day masterclass is designed for business owners, entrepreneurs, and marketing professionals who want to master the art of online marketing.

🎯 What You'll Learn:

Social Media Marketing
• Instagram & Facebook advertising strategies
• Content creation that converts
• Building engaged communities
• Influencer partnerships

Search Engine Optimization (SEO)
• Keyword research & strategy
• On-page & off-page optimization
• Local SEO for Ethiopian businesses
• Analytics & tracking

Content Marketing
• Storytelling for brands
• Video marketing essentials
• Email marketing campaigns
• Conversion optimization

Paid Advertising
• Google Ads fundamentals
• Facebook & Instagram ads
• Budget optimization
• A/B testing strategies

📚 Includes:
✓ Comprehensive workbook & templates
✓ Lunch & refreshments
✓ Certificate of completion
✓ 30-day email support
✓ Networking with fellow entrepreneurs

Perfect for: Business owners, marketers, entrepreneurs, freelancers, and anyone looking to grow their online presence!`,
      type: 'in-person',
      status: 'published',
      startAt: event2StartDate,
      endAt: event2EndDate,
      timezone: 'Africa/Addis_Ababa',
      venue: {
        name: 'Elilly International Hotel',
        address: 'Cameroon Street',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
        latitude: 9.0054,
        longitude: 38.7636
      },
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=630&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&h=600&fit=crop',
      currency: 'ETB',
      capacity: 80,
      isPublic: true,
      isFeatured: false,
      tags: ['business', 'marketing', 'workshop', 'digital-marketing', 'entrepreneurship', 'social-media', 'SEO'],
      settings: {
        allowWaitlist: true,
        showAttendeesCount: true,
        requireApproval: false
      },
      socialLinks: {
        facebook: 'https://facebook.com/digitalmktclass',
        instagram: 'https://instagram.com/digitalmktclass'
      }
    };

    const event2 = await Event.create(event2Data);
    console.log(`✅ Event created: ${event2.title}`);
    console.log(`   ID: ${event2._id}`);
    console.log(`   Slug: ${event2.slug}\n`);

    // Create tickets for Event 2
    console.log('🎟️  Creating ticket types for Digital Marketing Masterclass...');
    const event2Tickets = [
      {
        eventId: event2._id,
        name: 'Early Bird Ticket',
        description: 'Book early and save 30%! Includes all materials and certificate',
        price: 1400,
        currency: 'ETB',
        quantity: 30,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 3,
        salesStartAt: now,
        salesEndAt: new Date(event2StartDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event2._id,
        name: 'Standard Ticket',
        description: 'Full day workshop with materials, lunch, and certificate',
        price: 2000,
        currency: 'ETB',
        quantity: 40,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 5,
        salesStartAt: now,
        salesEndAt: event2StartDate,
        isTransferable: true,
        isRefundable: true
      },
      {
        eventId: event2._id,
        name: 'Group Package (3 people)',
        description: 'Bring your team! Special rate for 3 attendees',
        price: 5000,
        currency: 'ETB',
        quantity: 10,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 2,
        salesStartAt: now,
        salesEndAt: event2StartDate,
        isTransferable: false,
        isRefundable: false
      }
    ];

    for (const ticket of event2Tickets) {
      const tt = await TicketType.create(ticket);
      console.log(`   ✅ ${tt.name} - ${tt.price} ETB (${tt.quantity} available)`);
    }

    // Summary
    console.log('\n🎉 SUCCESS! Created 2 events for birtukantam3@gmail.com\n');
    console.log('=' .repeat(70));
    console.log('📋 EVENT SUMMARY');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣  Addis Ababa Tech Summit 2026');
    console.log(`   📅 Date: ${event1StartDate.toLocaleDateString()} - ${event1EndDate.toLocaleDateString()}`);
    console.log(`   🎫 Tickets: 4 types, 1000 capacity`);
    console.log(`   🔗 URL: http://localhost:3000/events/${event1.slug}`);
    
    console.log('\n2️⃣  Digital Marketing Masterclass');
    console.log(`   📅 Date: ${event2StartDate.toLocaleDateString()}`);
    console.log(`   🎫 Tickets: 3 types, 80 capacity`);
    console.log(`   🔗 URL: http://localhost:3000/events/${event2.slug}`);
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ All events are PUBLISHED and ready for ticket sales!');
    console.log('💼 Organizer: birtukantam3@gmail.com');
    console.log('🎯 Total capacity: 1,080 attendees across 2 events');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createEvents();
