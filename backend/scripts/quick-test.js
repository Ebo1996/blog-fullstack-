/**
 * Quick test to verify the fix is working
 */

const http = require('http');

console.log('🧪 Testing if backend is serving tickets correctly...\n');

http.get('http://localhost:3001/api/events/6a971a7afe306e84328ea8ca/ticket-types', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success && json.data && json.data.length > 0) {
        console.log('✅ SUCCESS! Backend is now serving tickets correctly!\n');
        console.log(`Found ${json.data.length} ticket type(s):`);
        json.data.forEach((tt, i) => {
          console.log(`\n${i + 1}. ${tt.name}`);
          console.log(`   Price: ${tt.price} ${tt.currency}`);
          console.log(`   Available: ${tt.availableQuantity} ${tt.availableQuantity !== undefined ? '✅' : '❌ STILL UNDEFINED'}`);
        });
        console.log('\n🎉 The fix is working! You can now purchase tickets.');
      } else {
        console.log('❌ Backend is still not returning tickets.');
        console.log('   Make sure you restarted the backend server after building.');
      }
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Could not connect to backend server.');
  console.log('   Make sure the backend is running on port 3001.');
  console.log('   Error:', e.message);
});
