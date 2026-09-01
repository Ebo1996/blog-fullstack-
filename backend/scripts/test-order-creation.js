/**
 * Test script to debug order creation endpoint
 * Run with: node scripts/test-order-creation.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testOrderCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get models
    const Event = mongoose.model('Event', require('../dist/events/schemas/event.schema').EventSchema);
    const TicketType = mongoose.model('TicketType', require('../dist/ticket-types/schemas/ticket-type.schema').TicketTypeSchema);
    const User = mongoose.model('User', require('../dist/users/schemas/user.schema').UserSchema);

    // Find a published event with available tickets
    console.log('🔍 Looking for a published event with tickets...');
    const event = await Event.findOne({ status: 'published' }).lean();
    
    if (!event) {
      console.error('❌ No published events found');
      process.exit(1);
    }
    
    console.log(`✅ Found event: ${event.title} (${event._id})\n`);

    // Find active ticket types for this event
    console.log('🎟️  Looking for active ticket types...');
    const ticketTypes = await TicketType.find({
      eventId: event._id,
      status: 'active',
    }).lean();

    if (ticketTypes.length === 0) {
      console.error('❌ No active ticket types found for this event');
      process.exit(1);
    }

    console.log(`✅ Found ${ticketTypes.length} active ticket type(s):`);
    ticketTypes.forEach(tt => {
      console.log(`   - ${tt.name}: ${tt.price} ${tt.currency} (${tt.availableQuantity} available)`);
    });
    console.log();

    // Find a test user
    console.log('👤 Looking for a user...');
    const user = await User.findOne().lean();
    
    if (!user) {
      console.error('❌ No users found');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.email} (${user._id})\n`);

    // Prepare order data
    const orderData = {
      eventId: event._id.toString(),
      items: [
        {
          ticketTypeId: ticketTypes[0]._id.toString(),
          quantity: 1
        }
      ]
    };

    console.log('📦 Order data to test:');
    console.log(JSON.stringify(orderData, null, 2));
    console.log();

    // Test the validation
    console.log('✅ Test data prepared successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Event: ${event.title}`);
    console.log(`   User: ${user.email}`);
    console.log(`   Ticket: ${ticketTypes[0].name} x 1`);
    console.log(`   Price: ${ticketTypes[0].price} ${ticketTypes[0].currency}`);
    console.log('\n💡 To test via API:');
    console.log('   1. Make sure backend is running (npm run start:dev)');
    console.log('   2. Login and get JWT token');
    console.log(`   3. POST to http://localhost:3001/api/orders with above data`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testOrderCreation();
