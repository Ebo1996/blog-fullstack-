const mongoose = require('mongoose');
require('dotenv').config();

const EventSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  status: String,
}, { strict: false, timestamps: true });

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventify');
    console.log('✅ Connected to MongoDB');

    const Event = mongoose.model('Event', EventSchema, 'events');
    
    // Find all draft events without images
    const eventsToDelete = await Event.find({ 
      status: 'draft',
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' }
      ]
    });
    
    console.log(`\nFound ${eventsToDelete.length} draft events without images:\n`);
    
    eventsToDelete.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title} (${event._id})`);
    });

    if (eventsToDelete.length > 0) {
      console.log('\nDeleting...');
      const result = await Event.deleteMany({ 
        _id: { $in: eventsToDelete.map(e => e._id) }
      });
      console.log(`✅ Deleted ${result.deletedCount} events`);
    } else {
      console.log('\n✅ No events to delete');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
