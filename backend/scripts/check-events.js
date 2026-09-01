const mongoose = require('mongoose');
require('dotenv').config();

const EventSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  status: String,
  organizerId: mongoose.Schema.Types.ObjectId,
}, { strict: false, timestamps: true });

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventify');
    console.log('✅ Connected to MongoDB');

    const Event = mongoose.model('Event', EventSchema, 'events');
    
    const events = await Event.find({ status: 'draft' }).limit(10).lean();
    
    console.log(`\nFound ${events.length} draft events:\n`);
    
    events.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   ID: ${event._id}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   imageUrl: ${event.imageUrl || '❌ MISSING'}`);
      console.log(`   Has image field: ${event.image ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
