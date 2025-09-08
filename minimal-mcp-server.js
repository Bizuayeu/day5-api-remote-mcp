/**
 * Minimal MCP Server for Claude Web
 * Simplified implementation focusing on core functionality
 */

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Mcp-Session-Id'],
  exposedHeaders: ['Mcp-Session-Id']
}));

// Session storage
const sessions = {};

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'minimal-mcp',
    timestamp: new Date().toISOString()
  });
});

// GET / - Discovery endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'minimal-mcp-server',
    version: '1.0.0',
    description: 'Minimal MCP server for Claude Web',
    protocol_version: '2025-06-18',
    capabilities: {
      tools: true
    }
  });
});

// POST / - Main MCP endpoint
app.post('/', (req, res) => {
  const { method, params, id } = req.body || {};
  
  console.log(`Processing method: ${method}`);
  
  switch (method) {
    case 'initialize':
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: {
            name: 'minimal-mcp-server',
            version: '1.0.0'
          },
          // Include tools directly in initialize response
          tools: [
            {
              name: 'hello',
              description: 'Say hello',
              inputSchema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name to greet'
                  }
                },
                required: ['name']
              }
            },
            {
              name: 'time',
              description: 'Get current time',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          ]
        }
      });
      break;
      
    case 'tools/list':
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          tools: [
            {
              name: 'hello',
              description: 'Say hello',
              inputSchema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name to greet'
                  }
                },
                required: ['name']
              }
            },
            {
              name: 'time',
              description: 'Get current time',
              inputSchema: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          ]
        }
      });
      break;
      
    case 'tools/call':
      const toolName = params?.name;
      const args = params?.arguments || {};
      
      let result;
      if (toolName === 'hello') {
        result = {
          content: [
            {
              type: 'text',
              text: `Hello, ${args.name || 'World'}!`
            }
          ]
        };
      } else if (toolName === 'time') {
        result = {
          content: [
            {
              type: 'text',
              text: `Current time: ${new Date().toISOString()}`
            }
          ]
        };
      } else {
        res.json({
          jsonrpc: '2.0',
          id: id,
          error: {
            code: -32602,
            message: `Unknown tool: ${toolName}`
          }
        });
        return;
      }
      
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: result
      });
      break;
      
    case 'notifications/initialized':
      // Just acknowledge
      res.json({
        jsonrpc: '2.0',
        result: 'ok'
      });
      break;
      
    default:
      console.log(`Unknown method: ${method}`);
      res.json({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      });
  }
});

// Handle 404
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal MCP Server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 MCP endpoint: http://localhost:${PORT}/`);
  console.log(`✅ Ready for Claude Web!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});