/**
 * Delete event by slug
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function deleteEvent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Event = mongoose.model('Event', new mongoose.Schema({}, { collection: 'events', strict: false }));
    const TicketType = mongoose.model('TicketType', new mongoose.Schema({}, { collection: 'tickettypes', strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { collection: 'orders', strict: false }));

    const slug = 'dbjbuijhbui-580144d3';
    
    console.log(`🔍 Looking for event: ${slug}`);
    const event = await Event.findOne({ slug });
    
    if (!event) {
      console.log('❌ Event not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found event: ${event.title}`);
    console.log(`   ID: ${event._id}`);
    
    // Check for related data
    const tickets = await TicketType.find({ eventId: event._id });
    const orders = await Order.find({ eventId: event._id });
    
    console.log(`\n📋 Related data:`);
    console.log(`   Tickets: ${tickets.length}`);
    console.log(`   Orders: ${orders.length}`);
    
    // Delete
    console.log(`\n🗑️  Deleting...`);
    
    if (tickets.length > 0) {
      await TicketType.deleteMany({ eventId: event._id });
      console.log(`   ✅ Deleted ${tickets.length} ticket type(s)`);
    }
    
    if (orders.length > 0) {
      await Order.deleteMany({ eventId: event._id });
      console.log(`   ✅ Deleted ${orders.length} order(s)`);
    }
    
    await Event.deleteOne({ _id: event._id });
    console.log(`   ✅ Deleted event`);
    
    console.log(`\n✅ Event "${event.title}" deleted successfully!\n`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

deleteEvent();
