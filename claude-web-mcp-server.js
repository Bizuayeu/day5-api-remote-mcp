/**
 * MCP Server for Claude Web Custom Connectors
 * Uses official SDK with SSE transport
 */

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

const PORT = process.env.PORT || 3000;

// Create MCP server instance
const createServer = () => {
  const server = new McpServer({
    name: 'day5-remote-mcp',
    version: '1.0.0'
  }, { 
    capabilities: { 
      tools: {},
      logging: {} 
    } 
  });

  // Register get_time tool
  server.tool(
    'get_time',
    'Get the current date and time',
    {
      timezone: {
        type: 'string',
        description: 'Timezone (e.g., UTC, Asia/Tokyo)',
        default: 'UTC'
      }
    },
    async ({ timezone = 'UTC' }) => {
      const now = new Date();
      let timeString;
      
      try {
        timeString = now.toLocaleString('en-US', { 
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        timeString = now.toISOString();
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `🕐 Current Time\n\nTimezone: ${timezone}\nTime: ${timeString}\nISO: ${now.toISOString()}`
          }
        ]
      };
    }
  );

  // Register echo tool
  server.tool(
    'echo',
    'Echo back a message',
    {
      message: {
        type: 'string',
        description: 'Message to echo back'
      }
    },
    async ({ message }) => {
      return {
        content: [
          {
            type: 'text',
            text: `🔊 Echo: ${message}`
          }
        ]
      };
    }
  );

  // Register calculate tool
  server.tool(
    'calculate',
    'Perform simple mathematical calculations',
    {
      expression: {
        type: 'string',
        description: 'Mathematical expression (e.g., 2 + 2)'
      }
    },
    async ({ expression }) => {
      try {
        // Simple safety check
        if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
          throw new Error('Invalid characters in expression');
        }
        const result = Function('"use strict"; return (' + expression + ')')();
        
        return {
          content: [
            {
              type: 'text',
              text: `🧮 Calculation Result\n\nExpression: ${expression}\nResult: ${result}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Calculation Error\n\nCouldn't evaluate: ${expression}\nError: ${error.message}`
            }
          ]
        };
      }
    }
  );

  return server;
};

const app = express();
app.use(express.json());

// Enable CORS for Claude Web
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Accept']
}));

// Store transports by session ID
const transports = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'claude-web-mcp-server',
    transport: 'SSE'
  });
});

// SSE endpoint for establishing the stream
app.get('/sse', async (req, res) => {
  console.log('📡 GET /sse - Establishing SSE stream');
  
  try {
    // Create a new SSE transport
    const transport = new SSEServerTransport('/messages', res);
    
    // Store the transport by session ID
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;
    
    // Set up cleanup handler
    transport.onclose = () => {
      console.log(`🧹 SSE transport closed for session ${sessionId}`);
      delete transports[sessionId];
    };
    
    // Connect the server to the transport
    const server = createServer();
    await server.connect(transport);
    
    console.log(`✅ Established SSE stream with session ID: ${sessionId}`);
  } catch (error) {
    console.error('💥 Error establishing SSE stream:', error);
    if (!res.headersSent) {
      res.status(500).send('Error establishing SSE stream');
    }
  }
});

// Messages endpoint for receiving client JSON-RPC requests
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  console.log(`📥 POST /messages ${sessionId ? `(session: ${sessionId})` : '(no session)'}`);
  
  if (!sessionId) {
    console.error('❌ No session ID provided');
    res.status(400).send('Missing sessionId parameter');
    return;
  }
  
  const transport = transports[sessionId];
  if (!transport) {
    console.error(`❌ No active transport for session ID: ${sessionId}`);
    res.status(404).send('Session not found');
    return;
  }
  
  try {
    // Handle the POST message with the transport
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('💥 Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling request');
    }
  }
});

// Simple fallback handler for initialize on root
app.post('/', async (req, res) => {
  console.log('📥 POST / - Direct request');
  
  if (req.body && req.body.method === 'initialize') {
    // Return a simple response directing to use SSE
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {
            listChanged: true
          }
        },
        serverInfo: {
          name: 'day5-remote-mcp',
          version: '1.0.0'
        },
        instructions: 'Please use GET /sse for SSE stream and POST /messages for requests'
      }
    });
  } else if (req.body && req.body.method === 'tools/list') {
    // Return tools list directly
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: [
          {
            name: 'get_time',
            description: 'Get the current date and time',
            inputSchema: {
              type: 'object',
              properties: {
                timezone: {
                  type: 'string',
                  description: 'Timezone (e.g., UTC, Asia/Tokyo)',
                  default: 'UTC'
                }
              },
              required: []
            }
          },
          {
            name: 'echo',
            description: 'Echo back a message',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Message to echo back'
                }
              },
              required: ['message']
            }
          },
          {
            name: 'calculate',
            description: 'Perform simple mathematical calculations',
            inputSchema: {
              type: 'object',
              properties: {
                expression: {
                  type: 'string',
                  description: 'Mathematical expression (e.g., 2 + 2)'
                }
              },
              required: ['expression']
            }
          }
        ]
      }
    });
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid request'
      },
      id: null
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Claude Web MCP Server (SSE) running on port ${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`📬 Messages endpoint: http://localhost:${PORT}/messages`);
  console.log(`🌐 Public URL: https://day5-api-remote-mcp-production.up.railway.app/`);
  console.log(`✅ Ready for Claude Web Custom Connector!`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  
  for (const sessionId in transports) {
    try {
      console.log(`🧹 Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`💥 Error closing transport for session ${sessionId}:`, error);
    }
  }
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
});