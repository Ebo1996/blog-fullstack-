require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function checkImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false }), 'events');
    const events = await Event.find({}).select('title image').limit(20);

    console.log(`\nFound ${events.length} events:\n`);
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Image: ${event.image || 'NO IMAGE'}\n`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkImages();
