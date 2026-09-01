const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventify');
    console.log('✅ Connected to MongoDB');

    const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false }), 'events');
    const TicketType = mongoose.model('TicketType', new mongoose.Schema({}, { strict: false }), 'tickettypes');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    // Find organizer user
    const organizer = await User.findOne({ email: 'admin@eventify.et' });
    if (!organizer) {
      console.error('❌ Organizer not found. Please login first.');
      process.exit(1);
    }

    console.log('Found organizer:', organizer.email);

    // Create sample event
    const event = await Event.create({
      organizerId: organizer._id,
      title: 'Addis Tech Conference 2026',
      slug: 'addis-tech-conference-2026',
      description: 'Join us for the biggest technology conference in Addis Ababa! Learn from industry leaders, network with peers, and discover the latest innovations in software development, AI, and cloud computing.',
      shortDescription: 'The premier tech conference in Addis Ababa',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      venue: {
        name: 'Millennium Hall',
        address: 'Bole, Addis Ababa',
        city: 'Addis Ababa',
        country: 'Ethiopia',
      },
      startAt: new Date('2026-10-15T09:00:00Z'),
      endAt: new Date('2026-10-15T18:00:00Z'),
      capacity: 500,
      status: 'published',
      type: 'in_person',
      isFeatured: true,
      tags: ['technology', 'conference', 'networking'],
      currency: 'ETB',
      minPrice: 500,
      maxPrice: 2000,
    });

    console.log('✅ Created event:', event.title, '(', event._id, ')');

    // Create ticket types
    const ticketTypes = [
      {
        eventId: event._id,
        name: 'Early Bird',
        description: 'Limited early bird discount',
        price: 500,
        quantity: 100,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 5,
        currency: 'ETB',
      },
      {
        eventId: event._id,
        name: 'General Admission',
        description: 'Standard conference pass',
        price: 1000,
        quantity: 300,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 10,
        currency: 'ETB',
      },
      {
        eventId: event._id,
        name: 'VIP Pass',
        description: 'VIP access with exclusive networking session',
        price: 2000,
        quantity: 50,
        soldQuantity: 0,
        status: 'active',
        minPerOrder: 1,
        maxPerOrder: 3,
        currency: 'ETB',
      },
    ];

    await TicketType.insertMany(ticketTypes);
    console.log('✅ Created 3 ticket types');

    console.log('\n🎉 Sample event ready!');
    console.log('Visit: http://localhost:3000/events/addis-tech-conference-2026');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
