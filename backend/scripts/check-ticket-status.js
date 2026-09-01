const mongoose = require('mongoose');
require('dotenv').config();

async function checkTicketStatus() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const TicketType = mongoose.connection.collection('tickettypes');
  const Event = mongoose.connection.collection('events');
  
  const event = await Event.findOne({ title: /Web Development Bootcamp/i });
  const ticketTypes = await TicketType.find({ eventId: event._id }).toArray();
  
  console.log('Event:', event.title);
  console.log('Event ID:', event._id.toString());
  console.log('\nTicket Types:', ticketTypes.length);
  
  ticketTypes.forEach((tt, i) => {
    console.log('\nTicket', i+1, ':', tt.name);
    console.log('  Price:', tt.price, tt.currency || 'ETB');
    console.log('  Status:', tt.status || 'MISSING ❌');
    console.log('  Total Qty:', tt.totalQuantity);
    console.log('  Available:', tt.availableQuantity);
    console.log('  Min/Max per order:', tt.minPerOrder || '?', '/', tt.maxPerOrder || '?');
  });
  
  // Fix missing fields
  let updated = 0;
  for (const tt of ticketTypes) {
    const updates = {};
    
    if (!tt.status) updates.status = 'active';
    if (!tt.minPerOrder) updates.minPerOrder = 1;
    if (!tt.maxPerOrder) updates.maxPerOrder = 10;
    if (!tt.currency) updates.currency = 'ETB';
    
    if (Object.keys(updates).length > 0) {
      await TicketType.updateOne({ _id: tt._id }, { $set: updates });
      console.log('\n✅ Updated', tt.name, 'with:', Object.keys(updates).join(', '));
      updated++;
    }
  }
  
  if (updated > 0) {
    console.log('\n✅ Fixed', updated, 'ticket type(s)');
  } else {
    console.log('\n✅ All ticket types are properly configured');
  }
  
  process.exit(0);
}

checkTicketStatus().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
