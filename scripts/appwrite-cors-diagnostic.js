/**
 * Appwrite CORS Diagnostic Tool
 * 
 * This script helps diagnose CORS issues with Appwrite by:
 * 1. Checking environment variables
 * 2. Testing connection to Appwrite server
 * 3. Providing detailed troubleshooting steps
 * 4. Suggesting fixes for common issues
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const https = require('https');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to print colored text
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Helper function to print section headers
function printHeader(text) {
  console.log('\n' + colorize('='.repeat(80), 'bright'));
  console.log(colorize(` ${text} `, 'bright'));
  console.log(colorize('='.repeat(80), 'bright') + '\n');
}

// Check environment variables
function checkEnvironmentVariables() {
  printHeader('CHECKING ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_HOSTNAME'
  ];
  
  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`${colorize('✖', 'red')} ${varName}: ${colorize('Missing', 'red')}`);
      allVarsPresent = false;
    } else {
      console.log(`${colorize('✓', 'green')} ${varName}: ${process.env[varName]}`);
    }
  });
  
  if (!allVarsPresent) {
    console.log('\n' + colorize('Warning: Some required environment variables are missing!', 'yellow'));
  }
  
  return allVarsPresent;
}

// Check client.ts configuration
function checkClientConfiguration() {
  printHeader('CHECKING CLIENT CONFIGURATION');
  
  const clientPath = path.join(__dirname, '../src/lib/appwrite/client.ts');
  
  try {
    const clientContent = fs.readFileSync(clientPath, 'utf8');
    console.log(colorize('✓', 'green') + ' Found client.ts file');
    
    // Check for Origin header configuration
    if (clientContent.includes('Origin') && clientContent.includes('NEXT_PUBLIC_APPWRITE_HOSTNAME')) {
      console.log(colorize('✓', 'green') + ' Origin header is being set in client.ts');
      
      // Extract the actual Origin setting
      const originMatch = clientContent.match(/['"]Origin['"]:\s*([^,}\n]+)/);
      if (originMatch && originMatch[1]) {
        console.log(`  Origin value: ${originMatch[1].trim()}`);
      }
    } else {
      console.log(colorize('✖', 'red') + ' Origin header may not be properly configured in client.ts');
      console.log('  ' + colorize('Suggestion:', 'yellow') + ' Ensure the Origin header is set for CORS requests');
    }
    
    // Check for fetch interceptor
    if (clientContent.includes('fetch') && 
        (clientContent.includes('interceptor') || clientContent.includes('addEventListener'))) {
      console.log(colorize('✓', 'green') + ' Found fetch interceptor or event listener');
    } else {
      console.log(colorize('ℹ', 'blue') + ' No fetch interceptor found. This might be fine depending on your setup.');
    }
    
    return true;
  } catch (error) {
    console.log(colorize('✖', 'red') + ` Error reading client.ts: ${error.message}`);
    return false;
  }
}

// Test connection to Appwrite server
async function testAppwriteConnection() {
  printHeader('TESTING APPWRITE CONNECTION');
  
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const hostname = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || 'http://localhost:3000';
  
  if (!endpoint || !projectId) {
    console.log(colorize('✖', 'red') + ' Cannot test connection: Missing endpoint or project ID');
    return false;
  }
  
  console.log(`Testing connection to: ${endpoint}`);
  console.log(`Using project ID: ${projectId}`);
  console.log(`Using Origin: ${hostname}\n`);
  
  // Test different endpoints
  const endpoints = [
    { path: '/v1', name: 'API Root' },
    { path: '/v1/health', name: 'Health Check' },
    { path: '/v1/account/sessions', name: 'Account Sessions' }
  ];
  
  let successCount = 0;
  
  for (const ep of endpoints) {
    const url = new URL(endpoint);
    // Ensure we're using the correct path
    const testPath = url.pathname === '/v1' ? 
      ep.path.replace('/v1', '') : // If endpoint already includes /v1, don't duplicate it
      ep.path;
    
    console.log(`Testing ${ep.name} endpoint: ${url.origin}${testPath}`);
    
    try {
      await new Promise((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          port: 443,
          path: testPath,
          method: 'GET',
          headers: {
            'Origin': hostname,
            'X-Appwrite-Project': projectId
          }
        };
        
        const req = https.request(options, (res) => {
          console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
          
          // Check for CORS headers
          const corsHeaders = {
            'access-control-allow-origin': res.headers['access-control-allow-origin'],
            'access-control-allow-credentials': res.headers['access-control-allow-credentials'],
            'access-control-allow-methods': res.headers['access-control-allow-methods'],
            'access-control-allow-headers': res.headers['access-control-allow-headers']
          };
          
          console.log('  CORS Headers:');
          Object.entries(corsHeaders).forEach(([header, value]) => {
            if (value) {
              console.log(`    ${header}: ${value}`);
            } else {
              console.log(`    ${header}: ${colorize('Not present', 'yellow')}`);
            }
          });
          
          // Check if CORS is properly configured
          if (corsHeaders['access-control-allow-origin']) {
            const allowedOrigins = corsHeaders['access-control-allow-origin'].split(',').map(o => o.trim());
            
            if (allowedOrigins.includes('*') || allowedOrigins.includes(hostname)) {
              console.log('  ' + colorize('✓ CORS is properly configured for this origin', 'green'));
              successCount++;
            } else {
              console.log('  ' + colorize(`✖ CORS is not configured for ${hostname}`, 'red'));
              console.log('  ' + colorize(`  Allowed origins: ${allowedOrigins.join(', ')}`, 'yellow'));
            }
          } else {
            console.log('  ' + colorize('✖ No CORS headers found in response', 'red'));
          }
          
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (data.length > 0) {
              try {
                const jsonData = JSON.parse(data);
                console.log('  Response data:', JSON.stringify(jsonData).substring(0, 100) + '...');
              } catch (e) {
                console.log('  Response data:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
              }
            }
            resolve();
          });
        });
        
        req.on('error', (error) => {
          console.log('  ' + colorize(`✖ Connection error: ${error.message}`, 'red'));
          resolve(); // Resolve anyway to continue with other tests
        });
        
        req.end();
      });
    } catch (error) {
      console.log('  ' + colorize(`✖ Test failed: ${error.message}`, 'red'));
    }
    
    console.log(); // Add a blank line between endpoint tests
  }
  
  return successCount > 0;
}

// Provide troubleshooting steps
function provideTroubleshootingSteps(envVarsOk, clientConfigOk, connectionOk) {
  printHeader('TROUBLESHOOTING STEPS');
  
  if (!envVarsOk) {
    console.log(colorize('1. Fix Environment Variables:', 'bright'));
    console.log('   - Create or update .env.local file with the required variables');
    console.log('   - Ensure NEXT_PUBLIC_APPWRITE_ENDPOINT points to your Appwrite instance');
    console.log('   - Ensure NEXT_PUBLIC_APPWRITE_PROJECT_ID is correct');
    console.log('   - Set NEXT_PUBLIC_APPWRITE_HOSTNAME to your frontend origin (e.g., http://localhost:3000)');
    console.log();
  }
  
  if (!clientConfigOk) {
    console.log(colorize('2. Update client.ts Configuration:', 'bright'));
    console.log('   - Ensure the Origin header is set for CORS requests');
    console.log('   - Example implementation:');
    console.log(`
     // Add this to your client.ts file
     const originalFetch = window.fetch;
     window.fetch = function (resource, init) {
       if (resource.toString().includes('${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}')) {
         init = init || {};
         init.headers = init.headers || {};
         init.headers['Origin'] = process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || window.location.origin;
       }
       return originalFetch(resource, init);
     };
    `);
    console.log();
  }
  
  console.log(colorize('3. Configure Appwrite Project:', 'bright'));
  console.log('   - Log in to your Appwrite Console');
  console.log('   - Go to your project settings');
  console.log('   - Navigate to the "Platforms" section');
  console.log('   - Add the following platforms:');
  console.log(`     * ${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || 'http://localhost:3000'}`);
  console.log('     * http://localhost:3000');
  console.log('     * http://192.168.1.7:3000');
  console.log();
  
  console.log(colorize('4. Additional Troubleshooting:', 'bright'));
  console.log('   - Clear browser cache and cookies');
  console.log('   - Try using private/incognito browsing mode');
  console.log('   - Restart your Next.js development server');
  console.log('   - Check browser console for detailed error messages');
  console.log('   - Ensure your Appwrite instance is accessible from your network');
  console.log();
}

// Main function
async function main() {
  console.log(colorize('\nAPPWRITE CORS DIAGNOSTIC TOOL', 'bright'));
  console.log(colorize('============================\n', 'bright'));
  
  const envVarsOk = checkEnvironmentVariables();
  const clientConfigOk = checkClientConfiguration();
  const connectionOk = await testAppwriteConnection();
  
  provideTroubleshootingSteps(envVarsOk, clientConfigOk, connectionOk);
  
  printHeader('SUMMARY');
  console.log(`Environment Variables: ${envVarsOk ? colorize('✓ OK', 'green') : colorize('✖ Issues Found', 'red')}`);
  console.log(`Client Configuration: ${clientConfigOk ? colorize('✓ OK', 'green') : colorize('✖ Issues Found', 'red')}`);
  console.log(`Appwrite Connection: ${connectionOk ? colorize('✓ At least one endpoint working', 'green') : colorize('✖ All connection tests failed', 'red')}`);
  
  if (!connectionOk) {
    console.log('\n' + colorize('The most likely issue is that your Appwrite project does not have your frontend origin', 'yellow'));
    console.log(colorize(`(${process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || 'http://localhost:3000'}) added as a platform in the Appwrite Console.`, 'yellow'));
  }
}

// Run the diagnostic tool
main().catch(error => {
  console.error('Error running diagnostic tool:', error);
});

