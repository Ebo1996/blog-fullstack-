const mongoose = require('mongoose');
require('dotenv').config();

async function fixTicketAvailability() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const TicketType = mongoose.connection.collection('tickettypes');
  const Event = mongoose.connection.collection('events');
  
  const event = await Event.findOne({ title: /Web Development Bootcamp/i });
  const ticketTypes = await TicketType.find({ eventId: event._id }).toArray();
  
  console.log('Event:', event.title);
  console.log('Updating', ticketTypes.length, 'ticket types...\n');
  
  for (const tt of ticketTypes) {
    await TicketType.updateOne(
      { _id: tt._id },
      { 
        $set: { 
          totalQuantity: 50,
          availableQuantity: 50,
          salesStartAt: new Date(),
          salesEndAt: new Date(event.startAt)
        } 
      }
    );
    console.log('✅ Updated:', tt.name, '- 50 tickets available');
  }
  
  console.log('\n✅ SUCCESS! Tickets are now available for purchase.');
  
  process.exit(0);
}

fixTicketAvailability().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
