/**
 * Test the actual API endpoint to see what's being returned
 * Run with: node scripts/test-api-call.js
 */

const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function testAPI() {
  try {
    const API_URL = process.env.API_URL || 'http://localhost:3001/api';
    
    console.log('🔍 Testing API endpoints...\n');
    
    // Try to get the specific event we found earlier
    const eventId = '6a971a7afe306e84328ea8ca'; // Addis Tech Conference 2026
    console.log(`1️⃣  GET /events/${eventId}/ticket-types (direct test)\n`);
    
    const ticketsRes = await makeRequest(`${API_URL}/events/${eventId}/ticket-types`);
    
    if (ticketsRes.success && ticketsRes.data) {
      console.log(`   ✅ Found ${ticketsRes.data.length} ticket type(s)\n`);
      
      ticketsRes.data.forEach((tt, i) => {
        console.log(`   Ticket ${i + 1}: ${tt.name}`);
        console.log(`     ID: ${tt._id}`);
        console.log(`     Price: ${tt.price} ${tt.currency || 'ETB'}`);
        console.log(`     Status: ${tt.status}`);
        console.log(`     Quantity: ${tt.quantity}`);
        console.log(`     Sold: ${tt.soldQuantity}`);
        console.log(`     Available: ${tt.availableQuantity} ${tt.availableQuantity === undefined ? '❌ UNDEFINED!' : '✅'}`);
        console.log(`     Min/Max per order: ${tt.minPerOrder} / ${tt.maxPerOrder}`);
        console.log();
      });

      // Check for the issue
      const hasUndefined = ticketsRes.data.some(tt => tt.availableQuantity === undefined);
      if (hasUndefined) {
        console.log('❌ ISSUE FOUND: availableQuantity is undefined!');
        console.log('   This will cause the frontend to show no available tickets.\n');
        console.log('💡 Root cause: Mongoose virtual fields are not being serialized.');
        console.log('   The schema has toJSON/toObject settings, but they may not be applied.');
      } else {
        console.log('✅ All ticket types have availableQuantity defined.');
      }
    } else {
      console.log('   ❌ Failed to fetch ticket types');
      console.log('   Response:', JSON.stringify(ticketsRes, null, 2));
    }
    
    // Also test with slug
    console.log('\n2️⃣  GET /events/addis-tech-conference-2026 (by slug)');
    const eventRes = await makeRequest(`${API_URL}/events/addis-tech-conference-2026`);
    if (eventRes.success && eventRes.data) {
      const event = eventRes.data;
      console.log(`   ✅ Found event: ${event.title}`);
      console.log(`   Event ID: ${event._id}\n`);
    } else {
      console.log('   ❌ Failed to fetch event by slug');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
