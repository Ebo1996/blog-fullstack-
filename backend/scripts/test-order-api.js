/**
 * Test script to check order creation via API
 * Run with: node scripts/test-order-api.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define schemas inline
    const eventSchema = new mongoose.Schema({}, { collection: 'events', strict: false });
    const ticketTypeSchema = new mongoose.Schema({}, { collection: 'tickettypes', strict: false });
    const ticketTypeSchema2 = new mongoose.Schema({}, { collection: 'ticketTypes', strict: false });
    const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });

    const Event = mongoose.model('Event', eventSchema);
    const TicketType = mongoose.model('TicketType', ticketTypeSchema);
    const TicketType2 = mongoose.model('TicketType2', ticketTypeSchema2);
    const User = mongoose.model('User', userSchema);

    // Check for events
    console.log('📅 Checking events...');
    const events = await Event.find({ status: 'published' }).limit(5);
    console.log(`   Found ${events.length} published event(s)\n`);
    
    // Check all events
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\n--- Event ${i + 1} ---`);
      console.log(`Title: ${event.title || 'Untitled'}`);
      console.log(`ID: ${event._id}`);
      console.log(`Slug: ${event.slug || 'N/A'}`);
      console.log(`Status: ${event.status}`);
      console.log(`End date: ${event.endAt}`);
      
      // Check ticket types for this event
      console.log('\n🎟️  Ticket types:');
      let ticketTypes = await TicketType.find({ eventId: event._id });
      console.log(`   Found ${ticketTypes.length} in 'tickettypes' collection`);
      
      const ticketTypes2 = await TicketType2.find({ eventId: event._id });
      console.log(`   Found ${ticketTypes2.length} in 'ticketTypes' collection`);
      
      // Use whichever has data
      if (ticketTypes2.length > 0) ticketTypes = ticketTypes2;
      
      if (ticketTypes.length > 0) {
        ticketTypes.forEach(tt => {
          console.log(`\n   - ${tt.name}`);
          console.log(`     ID: ${tt._id}`);
          console.log(`     Price: ${tt.price} ${tt.currency || 'ETB'}`);
          console.log(`     Status: ${tt.status}`);
          console.log(`     Available: ${tt.availableQuantity} / ${tt.quantity}`);
          console.log(`     Min/Max per order: ${tt.minPerOrder} / ${tt.maxPerOrder}`);
          
          if (tt.salesStartAt) {
            console.log(`     Sales start: ${tt.salesStartAt}`);
          }
          if (tt.salesEndAt) {
            console.log(`     Sales end: ${tt.salesEndAt}`);
          }
        });

        // Check if any ticket type is actually available
        const availableTickets = ticketTypes.filter(tt => 
          tt.status === 'active' && tt.availableQuantity > 0
        );
        
        console.log(`\n   ✅ ${availableTickets.length} available for purchase`);
        
        if (availableTickets.length === 0) {
          console.log('   ⚠️  WARNING: No tickets can be purchased!');
          ticketTypes.forEach(tt => {
            if (tt.status !== 'active') {
              console.log(`     - "${tt.name}" status: "${tt.status}" (needs "active")`);
            }
            if (tt.availableQuantity <= 0) {
              console.log(`     - "${tt.name}" sold out (${tt.availableQuantity} available)`);
            }
          });
        }
      } else {
        console.log('   ⚠️  No ticket types found - orders will fail!');
      }
    }

    // Check users
    console.log('\n👤 Checking users...');
    const userCount = await User.countDocuments();
    console.log(`   Found ${userCount} user(s)`);
    
    if (userCount > 0) {
      const user = await User.findOne();
      console.log(`   Example: ${user.email} (ID: ${user._id})`);
    }

    console.log('\n✅ Data check complete!');

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

checkData();
