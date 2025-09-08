/**
 * Simple Node.js HTTP server for MCP
 * Can be deployed on Railway, Render, etc.
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

const handleMCP = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const message = JSON.parse(body);
      console.log('📨 Received MCP request:', JSON.stringify(message, null, 2));
      let response;

      // Initialize
      if (message.method === 'initialize') {
        response = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { 
              tools: {
                listChanged: true
              }
            },
            serverInfo: {
              name: 'simple-node-mcp',
              version: '1.0.0'
            }
          }
        };
      }
      // List tools
      else if (message.method === 'tools/list') {
        response = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: [
              {
                name: 'get_time',
                description: 'Get current time',
                inputSchema: { type: 'object', properties: {}, required: [] }
              },
              {
                name: 'echo',
                description: 'Echo message',
                inputSchema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', description: 'Message to echo' }
                  },
                  required: ['message']
                }
              }
            ]
          }
        };
      }
      // Call tool
      else if (message.method === 'tools/call') {
        const toolName = message.params?.name;
        const args = message.params?.arguments || {};

        if (toolName === 'get_time') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [{
                type: 'text',
                text: `⏰ Current time: ${new Date().toISOString()}`
              }]
            }
          };
        } else if (toolName === 'echo') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [{
                type: 'text',
                text: `🔊 Echo: ${args.message || 'No message'}`
              }]
            }
          };
        } else {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32602, message: `Unknown tool: ${toolName}` }
          };
        }
      }
      // Unknown method
      else {
        response = {
          jsonrpc: '2.0',
          id: message.id,
          error: { code: -32601, message: `Method not found: ${message.method}` }
        };
      }

      console.log('📤 Sending MCP response:', JSON.stringify(response, null, 2));
      res.writeHead(200);
      res.end(JSON.stringify(response));

    } catch (error) {
      res.writeHead(200);
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      }));
    }
  });
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else if (parsedUrl.pathname === '/mcp' || parsedUrl.pathname === '/') {
    handleMCP(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 HTTP MCP Server running on port ${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`📡 MCP endpoint: http://localhost:${PORT}/mcp or http://localhost:${PORT}/`);
  console.log(`🌐 Public URL: https://day5-api-remote-mcp-production.up.railway.app/`);
  console.log(`✅ Ready for Claude Web Custom Connector!`);
});