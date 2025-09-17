#!/usr/bin/env node

/**
 * Simple API test script
 * Tests the basic functionality of the Teacher AI Academy Backend API
 */

const http = require('http');

const API_BASE = 'http://localhost:8080';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Teacher AI Academy Backend API\n');

  const tests = [
    {
      name: 'Health Check',
      test: async () => {
        const result = await makeRequest('/api/health');
        return result.status === 200 && result.data.ok === true;
      },
    },
    {
      name: 'Get Posts (Public)',
      test: async () => {
        const result = await makeRequest('/api/posts');
        return result.status === 200 && result.data.success === true;
      },
    },
    {
      name: 'RSS Feed',
      test: async () => {
        const result = await makeRequest('/api/rss');
        return result.status === 200 && result.data.includes('<?xml');
      },
    },
    {
      name: 'Admin Posts (Unauthorized)',
      test: async () => {
        const result = await makeRequest('/api/admin/posts');
        return result.status === 401;
      },
    },
    {
      name: 'n8n Webhook (Unauthorized)',
      test: async () => {
        const result = await makeRequest('/api/webhook/n8n', {
          method: 'POST',
          body: { title: 'Test' },
        });
        return result.status === 401;
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const success = await test.test();
      if (success) {
        console.log(`✅ ${test.name} - PASSED\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check your server configuration.');
  }
}

// Check if server is running
makeRequest('/api/health')
  .then(() => {
    runTests();
  })
  .catch((error) => {
    console.log('❌ Cannot connect to API server.');
    console.log('Make sure the server is running on http://localhost:8080');
    console.log('Run: npm run dev');
    process.exit(1);
  });
