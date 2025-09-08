/**
 * Proper MCP Server using the official TypeScript SDK
 */

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

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

  return server;
};

const app = express();
app.use(express.json());

// Enable CORS with proper headers for MCP
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id']
}));

// Store transports by session ID
const transports = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'proper-mcp-server'
  });
});

// MCP endpoint handler
const handleMcpRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  console.log(`📥 ${req.method} /mcp ${sessionId ? `(session: ${sessionId})` : '(no session)'} from ${req.headers['user-agent']}`);

  if (req.method === 'POST') {
    try {
      let transport;
      
      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
        console.log(`♻️  Reusing existing transport for session: ${sessionId}`);
      } else if (!sessionId && req.body && req.body.method === 'initialize') {
        // New initialization request
        console.log('🆕 Creating new transport for initialization');
        
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            console.log(`🔑 Session initialized: ${newSessionId}`);
            transports[newSessionId] = transport;
          }
        });

        // Set up cleanup handler
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.log(`🧹 Transport closed for session ${sid}`);
            delete transports[sid];
          }
        };

        // Connect the server to the transport
        const server = createServer();
        await server.connect(transport);
        
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        // Invalid request
        console.log('❌ Bad Request: No valid session ID or not initialization request');
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided'
          },
          id: null
        });
        return;
      }

      // Handle request with existing transport
      await transport.handleRequest(req, res, req.body);
      
    } catch (error) {
      console.error('💥 Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  } else if (req.method === 'GET') {
    // Handle SSE connections for existing sessions
    if (!sessionId || !transports[sessionId]) {
      console.log('❌ GET request without valid session ID');
      res.status(400).send('Invalid or missing session ID for SSE connection');
      return;
    }

    console.log(`📡 Establishing SSE stream for session: ${sessionId}`);
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

// Set up MCP endpoint
app.all('/mcp', handleMcpRequest);
app.all('/', handleMcpRequest);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proper MCP Server running on port ${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`📡 MCP endpoint: http://localhost:${PORT}/mcp`);
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