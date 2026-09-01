/**
 * Fix ticket types that have undefined soldQuantity
 * Run with: node scripts/fix-ticket-soldquantity.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixTicketTypes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check both possible collection names
    const collections = ['ticketTypes', 'tickettypes'];
    
    for (const collectionName of collections) {
      console.log(`\n📦 Checking collection: ${collectionName}`);
      
      const TicketType = mongoose.model(
        `TicketType_${collectionName}`,
        new mongoose.Schema({}, { collection: collectionName, strict: false })
      );

      // Find tickets with undefined or null soldQuantity
      const brokenTickets = await TicketType.find({
        $or: [
          { soldQuantity: { $exists: false } },
          { soldQuantity: null }
        ]
      });

      console.log(`   Found ${brokenTickets.length} ticket(s) with missing soldQuantity`);

      if (brokenTickets.length > 0) {
        console.log('   Fixing...');
        const result = await TicketType.updateMany(
          {
            $or: [
              { soldQuantity: { $exists: false } },
              { soldQuantity: null }
            ]
          },
          {
            $set: { soldQuantity: 0 }
          }
        );

        console.log(`   ✅ Updated ${result.modifiedCount} ticket type(s)`);
        
        // Verify
        const fixed = await TicketType.find();
        console.log('\n   Verification:');
        fixed.forEach(tt => {
          const available = Math.max(0, (tt.quantity || 0) - (tt.soldQuantity || 0));
          console.log(`     - ${tt.name}: ${tt.soldQuantity} sold, ${available} available`);
        });
      } else {
        console.log('   ✅ All tickets have soldQuantity defined');
      }
    }

    console.log('\n✅ Fix complete!');

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

fixTicketTypes();
