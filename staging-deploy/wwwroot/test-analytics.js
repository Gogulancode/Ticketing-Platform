// Test analytics API directly
console.log('🧪 Testing Analytics API...');

fetch('http://localhost:5015/api/analytics/dashboard')
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  })
  .then(data => {
    console.log('✅ Analytics API Success!');
    console.log('Total Tickets:', data.totalTickets);
    console.log('Full data:', data);
    
    if (data.totalTickets === 1103) {
      console.log('✅ Correct live data received!');
    } else {
      console.log('❌ Wrong data - expected 1103 tickets');
    }
  })
  .catch(error => {
    console.error('❌ Analytics API Error:', error);
  });