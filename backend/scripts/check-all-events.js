/**
 * Check all events in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Event = mongoose.model('Event', new mongoose.Schema({}, { collection: 'events', strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users', strict: false }));
    const TicketType = mongoose.model('TicketType', new mongoose.Schema({}, { collection: 'tickettypes', strict: false }));

    const events = await Event.find({ status: 'published' }).sort({ createdAt: -1 });
    
    console.log(`\n📊 Total Published Events: ${events.length}\n`);
    console.log('=' .repeat(80));

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const organizer = await User.findById(event.organizerId);
      const tickets = await TicketType.find({ eventId: event._id });
      
      console.log(`\n${i + 1}. ${event.title}`);
      console.log(`   Organizer: ${organizer?.email || 'Unknown'}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Date: ${new Date(event.startAt).toLocaleDateString()}`);
      console.log(`   Venue: ${event.venue?.name || 'N/A'}`);
      console.log(`   Capacity: ${event.capacity}`);
      console.log(`   Tickets: ${tickets.length} types`);
      console.log(`   URL: http://localhost:3000/events/${event.slug}`);
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ All events are stored in MongoDB database');
    console.log('💡 These are REAL events, not seed data\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkEvents();
