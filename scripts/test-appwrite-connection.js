// Script to test Appwrite connection and diagnose CORS issues
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { Client, Account, Databases } = require('node-appwrite');

console.log('Testing Appwrite connection...');
console.log('Environment variables:');
console.log('NEXT_PUBLIC_APPWRITE_ENDPOINT:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('NEXT_PUBLIC_APPWRITE_PROJECT_ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log('NEXT_PUBLIC_APPWRITE_HOSTNAME:', process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME);
console.log('APPWRITE_DATABASE_ID:', process.env.APPWRITE_DATABASE_ID ? '✓ Défini' : '✗ Non défini');
console.log('APPWRITE_API_KEY:', process.env.APPWRITE_API_KEY ? '✓ Défini' : '✗ Non défini');

// Initialize Appwrite client
const client = new Client();

try {
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

  console.log('Client initialized with:');
  console.log('- Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('- Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

  // Create account instance
  const account = new Account(client);

  // Test connection by checking if the server is up
  console.log('Testing connection to Appwrite server...');
  
  // Use https module to test the connection
  const https = require('https');
  const url = new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  
  // Add a specific path to test - health check endpoint
  const healthPath = url.pathname === '/v1' ? '/v1/health' : '/health';
  
  console.log('Testing connection to:', url.href);
  console.log('Using health check endpoint:', url.origin + healthPath);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: healthPath,
    method: 'GET',
    headers: {
      'Origin': process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || 'http://localhost:3000',
      'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    }
  };
  
  console.log('Request headers:', JSON.stringify(options.headers, null, 2));
  
  const req = https.request(options, (res) => {
    console.log('Connection response status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Connection successful!');
        console.log('Response data:', data.substring(0, 100) + '...');
      } else {
        console.error(`Connection failed with status: ${res.statusCode}`);
        console.log('\nCORS Troubleshooting:');
        console.log('1. Verify that your Appwrite project has the following domains added in the console:');
        console.log(`   - ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
        console.log('   - http://localhost:3000');
        console.log('   - http://192.168.1.7:3000');
        console.log('2. Check that your .env.local file has the correct values for:');
        console.log('   - NEXT_PUBLIC_APPWRITE_ENDPOINT');
        console.log('   - NEXT_PUBLIC_APPWRITE_PROJECT_ID');
        console.log('   - NEXT_PUBLIC_APPWRITE_HOSTNAME');
        console.log('3. Verify that client.ts is correctly setting the Origin header for CORS requests');
        console.log('4. Try clearing browser cache, using private browsing, or restarting the development server');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Connection failed with error:', error);
    console.log('\nCORS Troubleshooting:');
    console.log('1. Verify that your Appwrite project has the following domains added in the console:');
    console.log(`   - ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME}`);
    console.log('   - http://localhost:3000');
    console.log('   - http://192.168.1.7:3000');
    console.log('2. Check that your .env.local file has the correct values for:');
    console.log('   - NEXT_PUBLIC_APPWRITE_ENDPOINT');
    console.log('   - NEXT_PUBLIC_APPWRITE_PROJECT_ID');
    console.log('   - NEXT_PUBLIC_APPWRITE_HOSTNAME');
    console.log('3. Verify that client.ts is correctly setting the Origin header for CORS requests');
    console.log('4. Try clearing browser cache, using private browsing, or restarting the development server');
  });
  
  req.end();
  
  // Test database access if API key is available
  if (process.env.APPWRITE_API_KEY && process.env.APPWRITE_DATABASE_ID) {
    console.log('\nTesting database access with API key...');
    
    // Create a new client with API key for server-side operations
    const serverClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    
    const databases = new Databases(serverClient);
    
    // Test database access
    databases.get(process.env.APPWRITE_DATABASE_ID)
      .then(response => {
        console.log('✓ Database access successful!');
        console.log('Database name:', response.name);
        
        // List collections
        return databases.listCollections(process.env.APPWRITE_DATABASE_ID);
      })
      .then(collections => {
        console.log(`✓ Found ${collections.total} collections:`);
        collections.collections.forEach(collection => {
          console.log(`  - ${collection.name} (ID: ${collection.$id})`);
        });
      })
      .catch(error => {
        console.error('✗ Database access failed:', error.message);
        if (error.code === 401) {
          console.log('  Suggestion: Vérifiez que votre clé API a les permissions nécessaires.');
        } else if (error.code === 404) {
          console.log('  Suggestion: Vérifiez que l\'ID de la base de données est correct.');
        }
      });
  } else {
    console.log('\nSkipping database test: API key or Database ID not provided in .env.local');
  }
} catch (error) {
  console.error('Error initializing Appwrite client:', error);
}