import { get, post, put, patch, del, createSimpleAPI } from 'omnirequest';
import omnirequest from 'omnirequest';
import { DeduplicationMiddleware } from 'omnirequest';
import { OfflineSyncMiddleware } from 'omnirequest';
import { AutoAuthPlugin } from 'omnirequest';
import { IntelligentRetryMiddleware } from 'omnirequest';

const BASE_URL = 'http://localhost:3001';

// Test results logging
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

function logTest(name, passed, error = null) {
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    testResults.passed.push(name);
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (error) console.error(`   Error: ${error.message}`);
    testResults.failed.push({ name, error: error?.message || 'Unknown error' });
  }
}

function logSkip(name, reason) {
  console.log(`⏭️  SKIP: ${name} - ${reason}`);
  testResults.skipped.push({ name, reason });
}

// Reset server stats
async function resetStats() {
  try {
    await post(`${BASE_URL}/stats/reset`);
  } catch (error) {
    console.log('Warning: Could not reset stats');
  }
}

// Get server stats
async function getStats() {
  try {
    const stats = await get(`${BASE_URL}/stats`);
    return stats;
  } catch (error) {
    return { requestCount: 0 };
  }
}

// ============================================
// TEST 1: Simple API - GET
// ============================================
async function testSimpleGet() {
  try {
    await resetStats();
    const users = await get(`${BASE_URL}/users`);
    const stats = await getStats();
    
    const passed = Array.isArray(users) && users.length > 0 && stats.requestCount === 1;
    logTest('Simple API - GET', passed, passed ? null : new Error('Expected array of users'));
  } catch (error) {
    logTest('Simple API - GET', false, error);
  }
}

// ============================================
// TEST 2: Simple API - POST
// ============================================
async function testSimplePost() {
  try {
    const newUser = await post(`${BASE_URL}/users`, {
      name: 'Test User',
      email: 'test@example.com'
    });
    
    const passed = newUser && newUser.id && newUser.name === 'Test User';
    logTest('Simple API - POST', passed, passed ? null : new Error('Expected user object with id'));
  } catch (error) {
    logTest('Simple API - POST', false, error);
  }
}

// ============================================
// TEST 3: Simple API - PUT
// ============================================
async function testSimplePut() {
  try {
    const updated = await put(`${BASE_URL}/users/1`, {
      name: 'Updated Name'
    });
    
    const passed = updated && updated.name === 'Updated Name';
    logTest('Simple API - PUT', passed, passed ? null : new Error('Expected updated user'));
  } catch (error) {
    logTest('Simple API - PUT', false, error);
  }
}

// ============================================
// TEST 4: Simple API - PATCH
// ============================================
async function testSimplePatch() {
  try {
    const patched = await patch(`${BASE_URL}/users/2`, {
      email: 'updated@example.com'
    });
    
    const passed = patched && patched.email === 'updated@example.com';
    logTest('Simple API - PATCH', passed, passed ? null : new Error('Expected patched user'));
  } catch (error) {
    logTest('Simple API - PATCH', false, error);
  }
}

// ============================================
// TEST 5: Simple API - DELETE
// ============================================
async function testSimpleDelete() {
  try {
    // First create a user to delete
    const tempUser = await post(`${BASE_URL}/users`, {
      name: 'To Delete',
      email: 'delete@example.com'
    });
    
    // Then delete it
    await del(`${BASE_URL}/users/${tempUser.id}`);
    
    // Verify deletion
    try {
      await get(`${BASE_URL}/users/${tempUser.id}`);
      logTest('Simple API - DELETE', false, new Error('User should not exist after deletion'));
    } catch (error) {
      // Expected 404
      logTest('Simple API - DELETE', true);
    }
  } catch (error) {
    logTest('Simple API - DELETE', false, error);
  }
}

// ============================================
// TEST 6: createSimpleAPI
// ============================================
async function testCreateSimpleAPI() {
  try {
    const api = createSimpleAPI(BASE_URL);
    const users = await api.get('/users');
    
    const passed = Array.isArray(users) && users.length > 0;
    logTest('createSimpleAPI', passed, passed ? null : new Error('Expected array of users'));
  } catch (error) {
    logTest('createSimpleAPI', false, error);
  }
}

// ============================================
// TEST 7: Advanced Client - GET
// ============================================
async function testAdvancedClient() {
  try {
    const api = omnirequest.create({
      baseURL: BASE_URL,
      timeout: 5000
    });
    
    const response = await api.get('/users');
    const passed = response.data && Array.isArray(response.data);
    logTest('Advanced Client - GET', passed, passed ? null : new Error('Expected response with data array'));
  } catch (error) {
    logTest('Advanced Client - GET', false, error);
  }
}

// ============================================
// TEST 8: Request Deduplication
// ============================================
async function testDeduplication() {
  try {
    await resetStats();
    
    const api = omnirequest.create({ baseURL: BASE_URL });
    api.getMiddlewareManager().use(new DeduplicationMiddleware());
    
    // Make 5 simultaneous requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(api.get('/users'));
    }
    
    await Promise.all(promises);
    
    const stats = await getStats();
    const passed = stats.requestCount === 1; // Should only make 1 actual request
    logTest('Request Deduplication', passed, passed ? null : new Error(`Expected 1 request, got ${stats.requestCount}`));
  } catch (error) {
    logTest('Request Deduplication', false, error);
  }
}

// ============================================
// TEST 9: Error Handling
// ============================================
async function testErrorHandling() {
  try {
    try {
      await get(`${BASE_URL}/error`);
      logTest('Error Handling', false, new Error('Expected error to be thrown'));
    } catch (error) {
      const passed = error && (error.status === 500 || error.response?.status === 500);
      logTest('Error Handling', passed, passed ? null : new Error('Expected 500 error'));
    }
  } catch (error) {
    logTest('Error Handling', false, error);
  }
}

// ============================================
// TEST 10: 404 Handling
// ============================================
async function test404Handling() {
  try {
    try {
      await get(`${BASE_URL}/users/99999`);
      logTest('404 Handling', false, new Error('Expected 404 error'));
    } catch (error) {
      const passed = error && (error.status === 404 || error.response?.status === 404);
      logTest('404 Handling', passed, passed ? null : new Error('Expected 404 error'));
    }
  } catch (error) {
    logTest('404 Handling', false, error);
  }
}

// ============================================
// TEST 11: Auto Auth Plugin
// ============================================
async function testAutoAuth() {
  try {
    const api = omnirequest.create({ baseURL: BASE_URL });
    
    api.use(new AutoAuthPlugin({
      type: 'bearer',
      token: 'test-token',
      autoAttach: true
    }));
    
    const response = await api.get('/users');
    const passed = response && response.data;
    logTest('Auto Auth Plugin', passed, passed ? null : new Error('Expected successful response with auth'));
  } catch (error) {
    logTest('Auto Auth Plugin', false, error);
  }
}

// ============================================
// TEST 12: Intelligent Retry
// ============================================
async function testIntelligentRetry() {
  try {
    await resetStats();
    
    const api = omnirequest.create({ baseURL: BASE_URL });
    api.getMiddlewareManager().use(new IntelligentRetryMiddleware({
      maxRetries: 2,
      retryDelay: 100,
      retryCondition: (error) => error.status >= 500
    }));
    
    try {
      await api.get('/error');
      logTest('Intelligent Retry', false, new Error('Expected error after retries'));
    } catch (error) {
      const stats = await getStats();
      // Should have made 3 requests (1 initial + 2 retries)
      const passed = stats.requestCount === 3;
      logTest('Intelligent Retry', passed, passed ? null : new Error(`Expected 3 requests (1+2 retries), got ${stats.requestCount}`));
    }
  } catch (error) {
    logTest('Intelligent Retry', false, error);
  }
}

// ============================================
// TEST 13: Query Parameters
// ============================================
async function testQueryParams() {
  try {
    const api = omnirequest.create({ baseURL: BASE_URL });
    const response = await api.get('/posts', { params: { page: 0 } });
    
    const passed = response.data && response.data.hasMore !== undefined;
    logTest('Query Parameters', passed, passed ? null : new Error('Expected paginated response'));
  } catch (error) {
    logTest('Query Parameters', false, error);
  }
}

// ============================================
// TEST 14: Custom Headers
// ============================================
async function testCustomHeaders() {
  try {
    const api = omnirequest.create({
      baseURL: BASE_URL,
      headers: {
        'X-Custom-Header': 'test-value'
      }
    });
    
    const response = await api.get('/users');
    const passed = response && response.data;
    logTest('Custom Headers', passed, passed ? null : new Error('Expected successful response with custom headers'));
  } catch (error) {
    logTest('Custom Headers', false, error);
  }
}

// ============================================
// TEST 15: Timeout
// ============================================
async function testTimeout() {
  try {
    const api = omnirequest.create({
      baseURL: BASE_URL,
      timeout: 1000 // 1 second timeout
    });
    
    try {
      await api.get('/slow'); // Takes 3 seconds
      logTest('Timeout', false, new Error('Expected timeout error'));
    } catch (error) {
      const passed = error && (error.code === 'ECONNABORTED' || error.message.includes('timeout'));
      logTest('Timeout', passed, passed ? null : new Error('Expected timeout error'));
    }
  } catch (error) {
    logTest('Timeout', false, error);
  }
}

// ============================================
// TEST 16: Offline Sync Middleware (basic test)
// ============================================
async function testOfflineSync() {
  try {
    const api = omnirequest.create({ baseURL: BASE_URL });
    const offlineSync = new OfflineSyncMiddleware({
      enabled: true,
      maxRetries: 2
    });
    
    api.getMiddlewareManager().use(offlineSync);
    
    const response = await api.get('/users');
    const passed = response && response.data;
    logTest('Offline Sync Middleware', passed, passed ? null : new Error('Expected successful response'));
  } catch (error) {
    logTest('Offline Sync Middleware', false, error);
  }
}

// ============================================
// TEST 17: Response Type JSON
// ============================================
async function testResponseTypeJSON() {
  try {
    const api = omnirequest.create({
      baseURL: BASE_URL,
      responseType: 'json'
    });
    
    const response = await api.get('/users');
    const passed = response.data && Array.isArray(response.data);
    logTest('Response Type JSON', passed, passed ? null : new Error('Expected JSON response'));
  } catch (error) {
    logTest('Response Type JSON', false, error);
  }
}

// ============================================
// TEST 18: Multiple Interceptors
// ============================================
async function testMultipleInterceptors() {
  try {
    const api = omnirequest.create({ baseURL: BASE_URL });
    
    let requestIntercepted = false;
    let responseIntercepted = false;
    
    api.interceptors.request.use((config) => {
      requestIntercepted = true;
      return config;
    });
    
    api.interceptors.response.use((response) => {
      responseIntercepted = true;
      return response;
    });
    
    await api.get('/users');
    
    const passed = requestIntercepted && responseIntercepted;
    logTest('Multiple Interceptors', passed, passed ? null : new Error('Expected interceptors to be called'));
  } catch (error) {
    logTest('Multiple Interceptors', false, error);
  }
}

// ============================================
// TEST 19: Pagination with createSimpleAPI
// ============================================
async function testPagination() {
  try {
    const api = createSimpleAPI(BASE_URL);
    const page0 = await api.get('/posts?page=0');
    const page1 = await api.get('/posts?page=1');
    
    const passed = page0.data && page1.data && page0.data !== page1.data;
    logTest('Pagination', passed, passed ? null : new Error('Expected different data for different pages'));
  } catch (error) {
    logTest('Pagination', false, error);
  }
}

// ============================================
// TEST 20: Concurrent Requests
// ============================================
async function testConcurrentRequests() {
  try {
    await resetStats();
    
    const promises = [
      get(`${BASE_URL}/users`),
      get(`${BASE_URL}/posts`),
      get(`${BASE_URL}/stats`)
    ];
    
    await Promise.all(promises);
    
    const stats = await getStats();
    const passed = stats.requestCount === 3;
    logTest('Concurrent Requests', passed, passed ? null : new Error(`Expected 3 requests, got ${stats.requestCount}`));
  } catch (error) {
    logTest('Concurrent Requests', false, error);
  }
}

// ============================================
// Run All Tests
// ============================================
async function runAllTests() {
  console.log('🚀 Starting OmniRequest Test Suite\n');
  console.log('=' .repeat(50));
  
  const tests = [
    testSimpleGet,
    testSimplePost,
    testSimplePut,
    testSimplePatch,
    testSimpleDelete,
    testCreateSimpleAPI,
    testAdvancedClient,
    testDeduplication,
    testErrorHandling,
    test404Handling,
    testAutoAuth,
    testIntelligentRetry,
    testQueryParams,
    testCustomHeaders,
    testTimeout,
    testOfflineSync,
    testResponseTypeJSON,
    testMultipleInterceptors,
    testPagination,
    testConcurrentRequests
  ];
  
  for (const test of tests) {
    await test();
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('=' .repeat(50));
  console.log('\n📊 Test Results Summary:\n');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:\n');
    testResults.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }
  
  if (testResults.skipped.length > 0) {
    console.log('\n⏭️  Skipped Tests:\n');
    testResults.skipped.forEach(({ name, reason }) => {
      console.log(`  - ${name}: ${reason}`);
    });
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (testResults.failed.length === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  return testResults;
}

// Run tests
runAllTests().then((results) => {
  process.exit(results.failed.length > 0 ? 1 : 0);
}).catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
