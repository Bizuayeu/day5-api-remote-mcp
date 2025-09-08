/**
 * Local test script for Day5 Remote MCP endpoints
 */

// Test health endpoint
async function testHealth() {
  console.log('Testing Health Endpoint...');
  
  // Simulate Vercel request/response for health endpoint  
  const { default: handler } = await import('./dist/api/health.js');
  
  const mockReq = {
    method: 'GET',
    url: '/api/health',
    headers: {},
    body: {}
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { 
      console.log(`Health Check Status: ${this.statusCode}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return this;
    },
    end() { return this; }
  };
  
  try {
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

// Test MCP tools/list endpoint
async function testMCPList() {
  console.log('\nTesting MCP Tools List...');
  
  const { default: handler } = await import('./dist/api/mcp.js');
  
  const mockReq = {
    method: 'POST',
    url: '/api/mcp',
    headers: { 'content-type': 'application/json' },
    body: {
      method: 'tools/list',
      params: {}
    }
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { 
      console.log(`MCP Tools List Status: ${this.statusCode}`);
      console.log('Available tools:', data.tools?.length || 0);
      data.tools?.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
      return this;
    },
    end() { return this; }
  };
  
  try {
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('MCP tools/list failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Day5 Remote MCP - Local Testing');
  console.log('================================');
  
  await testHealth();
  await testMCPList();
  
  console.log('\nLocal tests completed!');
  console.log('Note: Google API tests require GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
}

runTests();