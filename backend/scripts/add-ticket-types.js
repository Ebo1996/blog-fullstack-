const mongoose = require('mongoose');
require('dotenv').config();

async function addTicketTypes() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Event = mongoose.connection.collection('events');
  const TicketType = mongoose.connection.collection('tickettypes');
  
  // Find the Web Development Bootcamp event
  const event = await Event.findOne({ 
    title: /Web Development Bootcamp/i
  });
  
  if (!event) {
    console.log('Event not found');
    process.exit(1);
  }
  
  console.log('Event Found:', event.title);
  console.log('Event ID:', event._id.toString());
  
  // Check existing ticket types
  const existing = await TicketType.find({ eventId: event._id }).toArray();
  console.log('Existing ticket types:', existing.length);
  
  if (existing.length > 0) {
    console.log('Ticket types already exist:');
    existing.forEach(t => {
      console.log(' -', t.name, ':', t.price, 'ETB, Available:', t.availableQuantity);
    });
    process.exit(0);
  }
  
  // Create ticket types
  const ticketTypes = [
    {
      _id: new mongoose.Types.ObjectId(),
      eventId: event._id,
      name: 'Early Bird',
      description: 'Special discount for early registrations',
      price: 500,
      currency: 'ETB',
      totalQuantity: 30,
      availableQuantity: 30,
      salesStartAt: new Date(),
      salesEndAt: new Date(event.startAt),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      eventId: event._id,
      name: 'Regular',
      description: 'Standard bootcamp ticket',
      price: 800,
      currency: 'ETB',
      totalQuantity: 50,
      availableQuantity: 50,
      salesStartAt: new Date(),
      salesEndAt: new Date(event.startAt),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId(),
      eventId: event._id,
      name: 'VIP',
      description: 'Includes course materials and certificate',
      price: 1200,
      currency: 'ETB',
      totalQuantity: 20,
      availableQuantity: 20,
      salesStartAt: new Date(),
      salesEndAt: new Date(event.startAt),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await TicketType.insertMany(ticketTypes);
  
  // Update event min/max price
  await Event.updateOne(
    { _id: event._id },
    { 
      $set: { 
        minPrice: 500, 
        maxPrice: 1200,
        updatedAt: new Date()
      } 
    }
  );
  
  console.log('\n✅ SUCCESS! Created 3 ticket types:');
  ticketTypes.forEach(t => {
    console.log(' -', t.name, ':', t.price, 'ETB, Qty:', t.availableQuantity);
  });
  
  process.exit(0);
}

addTicketTypes().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
